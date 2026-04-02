import { PrismaClient, Prisma, UserRole, AccountStatus, Gender } from '@prisma/client';
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
            associationName: (secretary as any).associationName || null,
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
                    gender: (data.secretaryGender || 'MALE') as Gender,
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

export const registerSecretaryForState = async (data: any) => {
    const state = await prisma.state.findUnique({ where: { id: Number(data.stateId) } });
    if (!state) throw new AppError('State not found', 404);

    // Check if state already has a secretary
    const existingPerson = await prisma.statePerson.findUnique({ where: { stateId: state.id } });
    if (existingPerson) throw new AppError('This state already has a secretary assigned', 400);

    const uid = `ST-${state.code}-${Date.now().toString().slice(-4)}`;

    // Check if user already exists with this email/phone — reuse if so
    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: data.secretaryEmail }, { phone: data.secretaryPhone }] },
    });

    return prisma.$transaction(async (tx) => {
        // Update president info if provided
        if (data.presidentName) {
            await tx.state.update({
                where: { id: state.id },
                data: {
                    presidentName: data.presidentName,
                    presidentPhoto: data.presidentPhoto || undefined,
                },
            });
        }

        // Reuse existing user or create new one
        const user = existingUser
            ? await tx.user.update({
                where: { id: existingUser.id },
                data: {
                    role: UserRole.STATE_SECRETARY,
                    isActive: true,
                    isApproved: true,
                    otpVerified: true,
                    approvalStatus: 'APPROVED',
                },
            })
            : await tx.user.create({
                data: {
                    uid,
                    email: data.secretaryEmail,
                    phone: data.secretaryPhone,
                    password: data.secretaryPhone,
                    role: UserRole.STATE_SECRETARY,
                    isActive: true,
                    isApproved: true,
                    otpVerified: true,
                    approvalStatus: 'APPROVED',
                },
            });

        // Create state person
        await tx.statePerson.create({
            data: {
                userId: user.id,
                stateId: state.id,
                name: data.secretaryName,
                gender: (data.secretaryGender || 'MALE') as Gender,
                aadhaarNumber: `ADMIN-${Date.now()}`,
                addressLine1: data.secretaryAddress || 'N/A',
                city: 'N/A',
                pincode: '000000',
                identityProof: 'admin-created',
            },
        });

        // Create state secretary record (approved)
        await tx.stateSecretary.create({
            data: {
                uid,
                name: data.secretaryName,
                gender: (data.secretaryGender || 'MALE') as Gender,
                email: data.secretaryEmail,
                phone: data.secretaryPhone,
                stateId: state.id,
                residentialAddress: data.secretaryAddress || 'N/A',
                associationName: data.associationName || null,
                profilePhoto: data.profilePhoto || null,
                registrationWindowId: 'admin-created',
                status: 'APPROVED',
                approvedAt: new Date(),
                approvedBy: 'ADMIN',
            },
        });

        return {
            state: { id: state.id, name: state.name },
            secretary: { uid, name: data.secretaryName, email: data.secretaryEmail, phone: data.secretaryPhone },
            message: `State secretary created. Login: UID=${uid}, Password=${data.secretaryPhone}`,
        };
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
    const state = await prisma.state.findUnique({
        where: { id },
        include: { statePerson: true },
    });
    if (!state) throw new AppError('State not found', 404);

    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`);
    try {
        // Unlink students from this state's clubs and districts
        await prisma.$executeRawUnsafe(`UPDATE students SET clubId = NULL WHERE clubId IN (SELECT id FROM clubs WHERE stateId = ?)`, id);
        await prisma.$executeRawUnsafe(`UPDATE students SET districtId = NULL WHERE districtId IN (SELECT id FROM districts WHERE stateId = ?)`, id);
        await prisma.$executeRawUnsafe(`UPDATE students SET stateId = NULL WHERE stateId = ?`, id);

        // Unlink event registrations
        await prisma.$executeRawUnsafe(`UPDATE event_registrations SET clubId = NULL WHERE clubId IN (SELECT id FROM clubs WHERE stateId = ?)`, id);
        await prisma.$executeRawUnsafe(`UPDATE event_registrations SET districtId = NULL WHERE districtId IN (SELECT id FROM districts WHERE stateId = ?)`, id);

        // Delete club owners + their users
        await prisma.$executeRawUnsafe(`DELETE p FROM payments p INNER JOIN users u ON p.userId = u.id INNER JOIN club_owners co ON co.userId = u.id INNER JOIN clubs c ON c.id = co.clubId WHERE c.stateId = ?`, id);
        await prisma.$executeRawUnsafe(`DELETE rc FROM razorpay_configs rc INNER JOIN users u ON rc.userId = u.id INNER JOIN club_owners co ON co.userId = u.id INNER JOIN clubs c ON c.id = co.clubId WHERE c.stateId = ?`, id);
        await prisma.$executeRawUnsafe(`DELETE u FROM users u INNER JOIN club_owners co ON co.userId = u.id INNER JOIN clubs c ON c.id = co.clubId WHERE c.stateId = ?`, id);
        await prisma.$executeRawUnsafe(`DELETE co FROM club_owners co INNER JOIN clubs c ON c.id = co.clubId WHERE c.stateId = ?`, id);

        // Delete clubs
        await prisma.$executeRawUnsafe(`DELETE FROM clubs WHERE stateId = ?`, id);

        // Delete district secretaries + their users
        await prisma.$executeRawUnsafe(`DELETE FROM district_secretaries WHERE districtId IN (SELECT id FROM districts WHERE stateId = ?)`, id);
        await prisma.$executeRawUnsafe(`DELETE p FROM payments p INNER JOIN users u ON p.userId = u.id INNER JOIN district_persons dp ON dp.userId = u.id INNER JOIN districts d ON d.id = dp.districtId WHERE d.stateId = ?`, id);
        await prisma.$executeRawUnsafe(`DELETE rc FROM razorpay_configs rc INNER JOIN users u ON rc.userId = u.id INNER JOIN district_persons dp ON dp.userId = u.id INNER JOIN districts d ON d.id = dp.districtId WHERE d.stateId = ?`, id);
        await prisma.$executeRawUnsafe(`DELETE u FROM users u INNER JOIN district_persons dp ON dp.userId = u.id INNER JOIN districts d ON d.id = dp.districtId WHERE d.stateId = ?`, id);
        await prisma.$executeRawUnsafe(`DELETE dp FROM district_persons dp INNER JOIN districts d ON d.id = dp.districtId WHERE d.stateId = ?`, id);

        // Delete districts
        await prisma.$executeRawUnsafe(`DELETE FROM districts WHERE stateId = ?`, id);

        // Delete events for this state
        await prisma.$executeRawUnsafe(`DELETE FROM events WHERE stateId = ?`, id);

        // Delete state secretary applications
        await prisma.$executeRawUnsafe(`DELETE FROM state_secretaries WHERE stateId = ?`, id);

        // Delete state person + user if exists
        if (state.statePerson) {
            const userId = state.statePerson.userId;
            await prisma.$executeRawUnsafe(`DELETE FROM payments WHERE userId = ?`, userId);
            await prisma.$executeRawUnsafe(`DELETE FROM razorpay_configs WHERE userId = ?`, userId);
            await prisma.$executeRawUnsafe(`DELETE FROM state_persons WHERE userId = ?`, userId);
            await prisma.$executeRawUnsafe(`DELETE FROM users WHERE id = ?`, userId);
        }

        // Delete the state record itself
        await prisma.$executeRawUnsafe(`DELETE FROM states WHERE id = ?`, id);

        await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);
    } catch (err) {
        await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);
        throw err;
    }

    return { deleted: true, stateName: state.name };
};
