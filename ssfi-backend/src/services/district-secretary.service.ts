import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import logger from '../utils/logger.util';

import prisma from '../config/prisma';
export const listDistrictSecretaries = async (query: any) => {
    const { page = 1, limit = 10, search, stateId, districtId, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.DistrictSecretaryWhereInput = {
        ...(stateId && { stateId: Number(stateId) }),
        ...(districtId && { districtId: Number(districtId) }),
        ...(status && { status: status as string }),
        ...(search && {
            OR: [
                { name: { contains: search as string } },
                { email: { contains: search as string } },
                { uid: { contains: search as string } }
            ]
        })
    };

    const [secretaries, total] = await Promise.all([
        prisma.districtSecretary.findMany({
            where,
            skip,
            take,
            orderBy: { [sortBy as string]: sortOrder },
            include: {
                state: { select: { id: true, name: true, code: true } },
                district: { select: { id: true, name: true, code: true } }
            }
        }),
        prisma.districtSecretary.count({ where })
    ]);

    return {
        data: secretaries,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
};

export const updateDistrictSecretaryStatus = async (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    approvedBy: string,
    remarks?: string
) => {
    const secretary = await prisma.districtSecretary.findUnique({ where: { id } });
    if (!secretary) throw new AppError('District Secretary not found', 404);

    const updated = await prisma.districtSecretary.update({
        where: { id },
        data: {
            status,
            approvedAt: status === 'APPROVED' ? new Date() : null,
            approvedBy: status === 'APPROVED' ? approvedBy : null,
            rejectionRemarks: status === 'REJECTED' ? remarks : null,
        },
        include: {
            state: true,
            district: true
        }
    });

    if (status === 'APPROVED') {
        await createUserAccount({
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            role: 'DISTRICT_SECRETARY',
            stateId: updated.stateId,
            districtId: updated.districtId,
            referenceId: updated.id
        });
    }

    return updated;
};

const createUserAccount = async (data: any) => {
    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: data.email }, { phone: data.phone }] }
    });

    if (existingUser) {
        logger.warn(`User already exists for Approved Secretary: ${data.email}`);
        return existingUser;
    }

    return prisma.user.create({
        data: {
            email: data.email,
            phone: data.phone,
            password: Math.random().toString(36).slice(-8),
            role: data.role,
            uid: `USER-${Date.now()}`,
            isActive: true,
            isApproved: true,
            approvalStatus: 'APPROVED'
        }
    });
};
