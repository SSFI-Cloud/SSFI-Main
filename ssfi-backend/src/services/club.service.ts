import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';

import prisma from '../config/prisma';
export const getAllClubs = async (query: any) => {
    const { page = 1, limit = 10, search, stateId, districtId, status, sortField = 'clubName', sortOrder = 'asc' } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.ClubWhereInput = {
        isActive: true,
        ...(stateId && { stateId: Number(stateId) }),
        ...(districtId && { districtId: Number(districtId) }),
        ...(search && {
            OR: [
                { name: { contains: search as string } },
                { code: { contains: search as string } },
            ],
        }),
    };

    // Filter by status if provided (e.g. PENDING, APPROVED)
    // By default, exclude PAYMENT_PENDING clubs (incomplete registrations)
    if (status) {
        where.status = status;
    } else {
        where.status = { not: 'PAYMENT_PENDING' };
    }

    // Dynamic sorting
    const orderBy: any = {};
    if (sortField === 'state_name') {
        orderBy.state = { name: sortOrder };
    } else if (sortField === 'district_name') {
        orderBy.district = { name: sortOrder };
    } else if (sortField === 'club_name') {
        orderBy.name = sortOrder;
    } else if (sortField === 'clubowner_name') {
        orderBy.clubOwner = { name: sortOrder }; // Assuming clubOwner relation and name field exists/is reachable
    } else if (sortField === 'skatersCount') {
        orderBy.students = { _count: sortOrder };
    } else {
        // Check for valid fields in Club model
        if (['name', 'code', 'createdAt'].includes(sortField as string)) {
            orderBy[sortField] = sortOrder;
        } else {
            orderBy.name = sortOrder; // Fallback
        }
    }

    // Stats filter (ignore search and status for overall stats, but keep scope)
    // Exclude PAYMENT_PENDING from stats — they haven't completed registration
    const statsWhere: Prisma.ClubWhereInput = {
        isActive: true,
        status: { not: 'PAYMENT_PENDING' },
        ...(stateId && { stateId: Number(stateId) }),
        ...(districtId && { districtId: Number(districtId) }),
    };

    const [clubs, total, totalCount, verifiedCount, pendingCount, studentsCount] = await Promise.all([
        prisma.club.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                state: { select: { id: true, name: true, code: true } },
                district: { select: { id: true, name: true, code: true } },
                clubOwner: { select: { id: true, name: true } },
                _count: {
                    select: {
                        students: {
                            where: { user: { isApproved: true } }
                        },
                    },
                },
            },
        }),
        prisma.club.count({ where }),
        prisma.club.count({ where: statsWhere }),
        prisma.club.count({ where: { ...statsWhere, status: 'APPROVED' } }),
        prisma.club.count({ where: { ...statsWhere, status: 'PENDING' } }),
        prisma.student.count({ where: { club: statsWhere, user: { isApproved: true } } })
    ]);

    // Format data
    const formattedClubs = clubs.map((club) => ({
        id: club.id,
        membership_id: club.code || club.registrationNumber || 'N/A', // Prefer code, fallback to regNo
        club_name: club.name,
        contact_person: club.contactPerson || club.clubOwner?.name || 'N/A',
        mobile_number: club.phone || 'N/A',
        email_address: club.email || 'N/A',
        district_name: club.district.name,
        state_name: club.state?.name || 'N/A',
        state_code: club.state?.code || 'N/A',
        established_year: club.establishedYear ? String(club.establishedYear) : 'N/A',
        skatersCount: club._count.students,
        verified: club.status === 'APPROVED' ? 1 : 0,
        status: club.isActive ? 'active' : 'inactive',
        request_status: club.status, // Add request status
        created_at: club.createdAt,
        club_address: club.address,
        logo_path: club.logo,
        registration_number: club.registrationNumber
    }));

    return {
        clubs: formattedClubs,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
        stats: {
            total: totalCount,
            verified: verifiedCount,
            pending: pendingCount,
            totalSkaters: studentsCount
        }
    };
};

export const getClubById = async (id: number) => {
    const club = await prisma.club.findFirst({
        where: { id, isActive: true },
        include: {
            state: { select: { id: true, name: true, code: true } },
            district: { select: { id: true, name: true, code: true } },
            clubOwner: {
                select: {
                    id: true, name: true, gender: true,
                    profilePhoto: true, userId: true,
                    user: { select: { uid: true, phone: true, email: true, registrationDate: true, expiryDate: true, accountStatus: true } }
                }
            },
            _count: {
                select: { students: { where: { user: { isApproved: true } } } }
            }
        }
    });

    if (!club) throw new AppError('Club not found', 404);

    const owner = club.clubOwner;
    let membershipStatus: 'ACTIVE' | 'EXPIRED' | 'PENDING' = 'PENDING';
    if (owner) {
        if (owner.user?.expiryDate && new Date(owner.user.expiryDate) < new Date()) {
            membershipStatus = 'EXPIRED';
        } else {
            membershipStatus = 'ACTIVE';
        }
    }

    return {
        id: club.id,
        club_name: club.name,
        code: club.code,
        uid: club.uid,
        registration_number: club.registrationNumber,
        established_year: club.establishedYear ? String(club.establishedYear) : 'N/A',
        address: club.address || club.addressLine1,
        website: club.website,
        logo: club.logo,
        status: club.status,
        district_name: club.district.name,
        district_code: club.district.code,
        state_name: club.state?.name || 'N/A',
        state_code: club.state?.code || 'N/A',
        skatersCount: club._count.students,
        created_at: club.createdAt,
        owner: owner ? {
            uid: owner.user?.uid || null,
            name: owner.name,
            gender: owner.gender,
            phone: owner.user?.phone || 'N/A',
            email: owner.user?.email || 'N/A',
            profilePhoto: owner.profilePhoto,
            registrationDate: owner.user?.registrationDate || null,
            expiryDate: owner.user?.expiryDate || null,
            accountStatus: owner.user?.accountStatus || null,
            membershipStatus,
        } : null,
    };
};

export const createClub = async (data: any) => {
    // Admin offline club creation — extract only valid Club model fields
    const clubData: any = {
        name: data.name || data.clubName,
        code: data.code || (data.registrationNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) || `CLB${Date.now().toString().slice(-6)}`,
        districtId: Number(data.districtId),
        stateId: data.stateId ? Number(data.stateId) : undefined,
        registrationNumber: data.registrationNumber || undefined,
        establishedYear: data.establishedYear ? Number(data.establishedYear) : undefined,
        contactPerson: data.contactPerson || data.contactPersonName,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address,
        logo: data.logo || data.clubLogo,
        uid: `CLB-${Date.now().toString().slice(-6)}`,
        status: 'APPROVED',
    };

    return prisma.club.create({
        data: clubData,
    });
};

export const updateClub = async (id: number, data: {
    name?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    pincode?: string;
    establishedYear?: number;
    website?: string;
    logo?: string;
    registrationNumber?: string;
}) => {
    const club = await prisma.club.findFirst({ where: { id, isActive: true } });
    if (!club) throw new AppError('Club not found', 404);

    // Build update payload — only include fields that were sent
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.pincode !== undefined) updateData.pincode = data.pincode;
    if (data.establishedYear !== undefined) updateData.establishedYear = Number(data.establishedYear) || null;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.registrationNumber !== undefined) updateData.registrationNumber = data.registrationNumber;

    return prisma.club.update({
        where: { id },
        data: updateData,
        include: {
            state: { select: { id: true, name: true, code: true } },
            district: { select: { id: true, name: true, code: true } },
        },
    });
};

export const updateClubStatus = async (id: number, status: string, remarks?: string) => {
    const club = await prisma.club.update({
        where: { id },
        data: { status: status as any },
    });
    return club;
};

export const deleteClub = async (id: number) => {
    const club = await prisma.club.findUnique({
        where: { id },
        include: { clubOwner: true },
    });
    if (!club) throw new AppError('Club not found', 404);

    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`);
    try {
        // Unlink students from this club
        await prisma.$executeRawUnsafe(`UPDATE students SET clubId = NULL WHERE clubId = ?`, id);
        // Unlink event registrations
        await prisma.$executeRawUnsafe(`UPDATE event_registrations SET clubId = NULL WHERE clubId = ?`, id);

        // Delete club owner + user if exists
        if (club.clubOwner) {
            const userId = club.clubOwner.userId;
            await prisma.$executeRawUnsafe(`DELETE FROM payments WHERE userId = ?`, userId);
            await prisma.$executeRawUnsafe(`DELETE FROM razorpay_configs WHERE userId = ?`, userId);
            await prisma.$executeRawUnsafe(`DELETE FROM club_owners WHERE userId = ?`, userId);
            await prisma.$executeRawUnsafe(`DELETE FROM users WHERE id = ?`, userId);
        }

        // Delete the club
        await prisma.$executeRawUnsafe(`DELETE FROM clubs WHERE id = ?`, id);

        await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);
    } catch (err) {
        await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);
        throw err;
    }

    return { deleted: true, clubName: club.name };
};
