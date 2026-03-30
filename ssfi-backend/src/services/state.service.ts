import { PrismaClient, Prisma, UserRole } from '@prisma/client';
import { AppError } from '../utils/errors';

import prisma from '../config/prisma';
export const getAllStates = async (query: any) => {
    const { page = 1, limit = 10, search, sortField = 'name', sortOrder = 'asc', registeredOnly } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.StateWhereInput = {
        ...(search && {
            OR: [
                { name: { contains: search as string } },
                { code: { contains: search as string } },
            ],
        }),
        ...(registeredOnly === 'true' && {
            stateSecretaries: {
                some: {}
            }
        })
    };

    // Dynamic sorting
    const orderBy: any = {};
    if (['districtsCount', 'clubsCount', 'studentsCount'].includes(sortField as string)) {
        orderBy.name = sortOrder;
    } else if (sortField === 'state_name') {
        orderBy.name = sortOrder;
    } else {
        orderBy[sortField] = sortOrder;
    }

    const [states, total] = await Promise.all([
        prisma.state.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                _count: {
                    select: {
                        districts: {
                            where: { districtSecretaries: { some: { status: 'APPROVED' } } }
                        },
                        clubs: {
                            where: { status: 'APPROVED' }
                        },
                        students: {
                            where: { user: { isApproved: true } }
                        },
                        events: {
                            where: { status: { not: 'DRAFT' } }
                        },
                    },
                },
                stateSecretaries: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
        }),
        prisma.state.count({ where }),
    ]);

    // Format data
    const formattedStates = states.map((state) => {
        const latestSecretary = state.stateSecretaries?.[0];
        return {
            id: state.id,
            state_name: state.name,
            code: state.code,
            logo: state.logo,
            website: state.website,
            presidentName: state.presidentName || null,
            presidentPhoto: state.presidentPhoto || null,
            districtsCount: state._count.districts,
            clubsCount: state._count.clubs,
            skatersCount: state._count.students,
            eventsCount: state._count.events,
            created_at: state.createdAt,
            secretaryName: latestSecretary?.name || 'N/A',
            registrationDate: latestSecretary?.createdAt || null
        };
    });

    return {
        states: formattedStates,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

export const getStateById = async (id: number) => {
    const state = await prisma.state.findFirst({
        where: { id },
        include: {
            _count: {
                select: {
                    districts: { where: { districtSecretaries: { some: { status: 'APPROVED' } } } },
                    clubs: { where: { status: 'APPROVED' } },
                    students: { where: { user: { isApproved: true } } },
                    events: { where: { status: { not: 'DRAFT' } } },
                },
            },
        },
    });

    if (!state) throw new AppError('State not found', 404);

    // Get the latest approved state secretary with their user account
    const secretary = await prisma.stateSecretary.findFirst({
        where: { stateId: id, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
    });

    let userAccount = null;
    if (secretary) {
        userAccount = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: secretary.email },
                    { phone: secretary.phone },
                ],
                role: 'STATE_SECRETARY',
            },
            select: {
                uid: true,
                registrationDate: true,
                expiryDate: true,
                accountStatus: true,
                isActive: true,
            },
        });
    }

    // Compute membership status
    let membershipStatus: 'ACTIVE' | 'EXPIRED' | 'PENDING' = 'PENDING';
    if (secretary?.status === 'APPROVED') {
        if (userAccount?.expiryDate && new Date(userAccount.expiryDate) < new Date()) {
            membershipStatus = 'EXPIRED';
        } else {
            membershipStatus = 'ACTIVE';
        }
    }

    return {
        id: state.id,
        state_name: state.name,
        code: state.code,
        logo: state.logo,
        website: state.website,
        presidentName: state.presidentName || null,
        presidentPhoto: state.presidentPhoto || null,
        districtsCount: state._count.districts,
        clubsCount: state._count.clubs,
        skatersCount: state._count.students,
        eventsCount: state._count.events,
        created_at: state.createdAt,
        secretary: secretary ? {
            uid: userAccount?.uid || secretary.uid,
            name: secretary.name,
            gender: secretary.gender,
            email: secretary.email,
            phone: secretary.phone,
            residentialAddress: secretary.residentialAddress,
            profilePhoto: secretary.profilePhoto,
            status: secretary.status,
            registrationDate: userAccount?.registrationDate || secretary.createdAt,
            expiryDate: userAccount?.expiryDate || null,
            accountStatus: userAccount?.accountStatus || null,
            membershipStatus,
        } : null,
    };
};

export const createState = async (data: any) => {
    return await prisma.$transaction(async (tx) => {
        const existing = await tx.state.findFirst({
            where: {
                OR: [
                    { name: data.name },
                    { code: data.code }
                ]
            }
        });

        if (existing) {
            throw new AppError('State with this name or code already exists', 400);
        }

        // Create State
        const state = await tx.state.create({
            data: {
                name: data.name,
                code: data.code,
                logo: data.logo,
                website: data.website,
                presidentName: data.presidentName,
                presidentPhoto: data.presidentPhoto,
            },
        });

        // Create Secretary User and Profile if details provided
        if (data.secretaryName && data.secretaryPhone) {
            const user = await tx.user.create({
                data: {
                    uid: `ST-${data.code}-${Date.now().toString().slice(-4)}`,
                    email: data.secretaryEmail,
                    phone: data.secretaryPhone,
                    password: data.secretaryPhone, // Default password
                    role: 'STATE_SECRETARY' as any,
                    approvalStatus: 'APPROVED',
                    isActive: true
                }
            });

            await tx.statePerson.create({
                data: {
                    userId: user.id,
                    stateId: state.id,
                    name: data.secretaryName,
                    gender: data.secretaryGender || 'MALE',
                    aadhaarNumber: data.secretaryAadhaar || `TEMP-${Date.now()}`,
                    addressLine1: data.secretaryAddress || 'N/A',
                    city: data.secretaryCity || 'N/A',
                    pincode: data.secretaryPincode || '000000',
                    identityProof: 'pending'
                }
            });
        }

        return state;
    });
};

export const updateState = async (id: number, data: { name?: string; code?: string; logo?: string; website?: string; presidentName?: string; presidentPhoto?: string }) => {
    const state = await prisma.state.findUnique({ where: { id } });
    if (!state) throw new AppError('State not found', 404);

    return prisma.state.update({
        where: { id },
        data,
    });
};

export const deleteState = async (id: number) => {
    const state = await prisma.state.findUnique({ where: { id } });
    if (!state) throw new AppError('State not found', 404);

    return prisma.state.update({
        where: { id },
        data: { isActive: false },
    });
};
