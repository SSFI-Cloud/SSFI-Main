import { PrismaClient, Prisma, UserRole } from '@prisma/client';
import { AppError } from '../utils/errors';

import prisma from '../config/prisma';
export const getAllDistricts = async (query: any) => {
    const { page = 1, limit = 10, search, stateId, sortField = 'name', sortOrder = 'asc', registeredOnly } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Determine if this is a public request (controller passes publicOnly flag)
    const isPublic = query.publicOnly === 'true';

    // Build AND conditions array so public filter + search can coexist
    const andConditions: Prisma.DistrictWhereInput[] = [];

    // Public endpoint: Only show districts that have actual clubs OR students
    if (isPublic) {
        andConditions.push({
            OR: [
                { clubs: { some: { status: 'APPROVED' } } },
                { students: { some: { user: { isApproved: true } } } },
            ],
        });
    }

    // Search filter
    if (search) {
        andConditions.push({
            OR: [
                { name: { contains: search as string } },
                { code: { contains: search as string } },
                { districtPerson: { name: { contains: search as string } } },
            ],
        });
    }

    // Dashboard: only show districts with at least 1 skater (unless explicitly showing all)
    if (!isPublic && query.showAll !== 'true') {
        andConditions.push({
            students: { some: {} },
        });
    }

    const where: Prisma.DistrictWhereInput = {
        isActive: true,
        ...(stateId && { stateId: Number(stateId) }),
        ...(registeredOnly === 'true' && { districtPerson: { isNot: null } }),
        ...(andConditions.length > 0 && { AND: andConditions }),
    };

    // Dynamic sorting
    const orderBy: any = {};
    if (sortField === 'state_name') {
        orderBy.state = { name: sortOrder };
    } else if (sortField === 'district_name') {
        orderBy.name = sortOrder;
    } else if (sortField === 'secretaryName') {
        orderBy.districtPerson = { name: sortOrder };
    } else if (['clubsCount', 'skatersCount', 'eventsCount'].includes(sortField as string)) {
        orderBy.name = sortOrder;
    } else {
        orderBy[sortField] = sortOrder;
    }

    const [districts, total, totalClubs, totalSkaters, totalEvents] = await Promise.all([
        prisma.district.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                state: {
                    select: { id: true, name: true, code: true },
                },
                districtSecretaries: {
                    where: { status: 'APPROVED' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        name: true,
                        phone: true,
                        createdAt: true,
                    }
                },
                _count: {
                    select: {
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
            },
        }),
        prisma.district.count({ where }),
        prisma.club.count({ where: { district: where, status: 'APPROVED' } }),
        prisma.student.count({ where: { district: where, user: { isApproved: true } } }),
        prisma.event.count({ where: { district: where, status: { not: 'DRAFT' } } }),
    ]);

    // Format data for frontend
    const formattedDistricts = districts.map((district) => {
        const approvedSecretary = (district as any).districtSecretaries?.[0] || null;
        return {
            id: district.id,
            district_name: district.name,
            code: district.code,
            state_id: district.state.id,
            state_name: district.state.name,
            state_code: district.state.code,
            secretaryName: approvedSecretary?.name || 'N/A',
            secretaryPhone: approvedSecretary?.phone || 'N/A',
            secretaryRegisteredAt: approvedSecretary?.createdAt || null,
            clubsCount: district._count.clubs,
            skatersCount: district._count.students,
            eventsCount: district._count.events,
            created_at: district.createdAt,
        };
    });

    return {
        districts: formattedDistricts,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
        stats: {
            totalDistricts: total,
            totalClubs,
            totalSkaters,
            totalEvents
        }
    };
};

export const getDistrictById = async (id: number) => {
    const district = await prisma.district.findFirst({
        where: { id, isActive: true },
        include: {
            state: {
                select: { id: true, name: true, code: true }
            },
            _count: {
                select: {
                    clubs: { where: { status: 'APPROVED' } },
                    students: { where: { user: { isApproved: true } } },
                    events: { where: { status: { not: 'DRAFT' } } }
                }
            }
        }
    });

    if (!district) throw new AppError('District not found', 404);

    // Get the latest approved district secretary
    const secretary = await prisma.districtSecretary.findFirst({
        where: { districtId: id, status: 'APPROVED' },
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
                role: 'DISTRICT_SECRETARY',
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
        id: district.id,
        district_name: district.name,
        code: district.code,
        state_id: district.state.id,
        state_name: district.state.name,
        state_code: district.state.code,
        clubsCount: district._count.clubs,
        skatersCount: district._count.students,
        eventsCount: district._count.events,
        created_at: district.createdAt,
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

export const createDistrict = async (data: { name: string; code: string; stateId: number }) => {
    const existingdev = await prisma.district.findUnique({
        where: {
            stateId_code: {
                stateId: data.stateId,
                code: data.code,
            },
        },
    });

    if (existingdev) {
        throw new AppError('District with this code already exists in the state', 400);
    }

    return prisma.district.create({
        data: {
            name: data.name,
            code: data.code,
            stateId: data.stateId,
        },
        include: {
            state: true,
        },
    });
};

export const updateDistrict = async (id: number, data: { name?: string; code?: string; stateId?: number; logo?: string }) => {
    const district = await prisma.district.findUnique({ where: { id } });
    if (!district) throw new AppError('District not found', 404);

    return prisma.district.update({
        where: { id },
        data,
        include: { state: true },
    });
};

export const deleteDistrict = async (id: number) => {
    const district = await prisma.district.findUnique({
        where: { id },
        include: { districtPerson: true, districtSecretaries: { select: { id: true } } },
    });
    if (!district) throw new AppError('District not found', 404);

    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`);
    try {
        // Delete district secretary applications
        await prisma.$executeRawUnsafe(`DELETE FROM district_secretaries WHERE districtId = ?`, id);

        // Delete district person + user if exists
        if (district.districtPerson) {
            const userId = district.districtPerson.userId;
            await prisma.$executeRawUnsafe(`DELETE FROM payments WHERE userId = ?`, userId);
            await prisma.$executeRawUnsafe(`DELETE FROM razorpay_configs WHERE userId = ?`, userId);
            await prisma.$executeRawUnsafe(`DELETE FROM district_persons WHERE userId = ?`, userId);
            await prisma.$executeRawUnsafe(`DELETE FROM users WHERE id = ?`, userId);
        }

        // Unlink students/clubs/event registrations from this district
        await prisma.$executeRawUnsafe(`UPDATE students SET districtId = NULL WHERE districtId = ?`, id);
        await prisma.$executeRawUnsafe(`UPDATE clubs SET districtId = NULL WHERE districtId = ?`, id);
        await prisma.$executeRawUnsafe(`UPDATE event_registrations SET districtId = NULL WHERE districtId = ?`, id);

        // Delete the district record
        await prisma.$executeRawUnsafe(`DELETE FROM districts WHERE id = ?`, id);

        await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);
    } catch (err) {
        await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);
        throw err;
    }

    return { deleted: true, districtName: district.name };
};

export const createDistrictWithSecretary = async (data: {
    stateId: number;
    districtId: number;
    secretaryName: string;
    secretaryGender: string;
    secretaryEmail: string;
    secretaryPhone: string;
    secretaryAddress: string;
    associationName?: string;
    profilePhoto?: string;
    logo?: string;
    associationRegistrationCopy?: string;
}) => {
    const district = await prisma.district.findUnique({ where: { id: data.districtId }, include: { state: true } });
    if (!district) throw new AppError('District not found', 404);

    // Check if district already has a secretary
    const existing = await prisma.districtPerson.findUnique({ where: { districtId: data.districtId } });
    if (existing) throw new AppError('This district already has a secretary assigned', 400);

    // Check duplicate phone/email
    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: data.secretaryEmail }, { phone: data.secretaryPhone }] },
    });
    if (existingUser) throw new AppError('A user with this email or phone already exists', 400);

    const stateCode = district.state?.code || 'XX';
    const uid = `DS-${stateCode}-${district.code}-${Date.now().toString().slice(-4)}`;

    return prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
            data: {
                uid,
                email: data.secretaryEmail,
                phone: data.secretaryPhone,
                password: data.secretaryPhone,
                role: UserRole.DISTRICT_SECRETARY,
                isActive: true,
                isApproved: true,
                approvalStatus: 'APPROVED',
            },
        });

        // Create district person
        await tx.districtPerson.create({
            data: {
                userId: user.id,
                districtId: data.districtId,
                name: data.secretaryName,
                gender: data.secretaryGender,
                aadhaarNumber: `ADMIN-${Date.now()}`,
                addressLine1: data.secretaryAddress,
                city: 'N/A',
                pincode: '000000',
                identityProof: 'admin-created',
            },
        });

        // Create district secretary record (approved)
        await tx.districtSecretary.create({
            data: {
                uid,
                name: data.secretaryName,
                gender: data.secretaryGender,
                email: data.secretaryEmail,
                phone: data.secretaryPhone,
                stateId: district.stateId,
                districtId: data.districtId,
                residentialAddress: data.secretaryAddress,
                associationName: data.associationName || null,
                profilePhoto: data.profilePhoto || null,
                logo: data.logo || null,
                associationRegistrationCopy: data.associationRegistrationCopy || null,
                registrationWindowId: 'admin-created',
                status: 'APPROVED',
                approvedAt: new Date(),
                approvedBy: 'ADMIN',
            },
        });

        return {
            district: { id: district.id, name: district.name },
            secretary: { uid, name: data.secretaryName, email: data.secretaryEmail, phone: data.secretaryPhone },
            message: `District secretary created. Login: UID=${uid}, Password=${data.secretaryPhone}`,
        };
    });
};
