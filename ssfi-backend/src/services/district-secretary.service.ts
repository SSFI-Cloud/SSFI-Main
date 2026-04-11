import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/errors';
import logger from '../utils/logger.util';
import { generateUID } from './uid.service';
import { emailService } from './email.service';

import prisma from '../config/prisma';
export const listDistrictSecretaries = async (query: any) => {
    const { page = 1, limit = 10, search, stateId, districtId, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const take = Math.min(Number(limit) || 10, 100);
    const skip = (Number(page) - 1) * take;

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
            limit: take,
            totalPages: Math.ceil(total / take)
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
        const user = await createUserAccount({
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            role: 'DISTRICT_SECRETARY',
            stateId: updated.stateId,
            districtId: updated.districtId,
            referenceId: updated.id
        });

        // Create districtPerson record to link user to district (needed for scope filtering)
        if (user && updated.districtId) {
            const existingPerson = await prisma.districtPerson.findUnique({
                where: { districtId: updated.districtId }
            });
            if (!existingPerson) {
                await prisma.districtPerson.create({
                    data: {
                        userId: user.id,
                        districtId: updated.districtId,
                        name: updated.name,
                        gender: (updated.gender || 'MALE') as any,
                        aadhaarNumber: `APPROVED-${Date.now()}`,
                        addressLine1: updated.residentialAddress || 'N/A',
                        city: 'N/A',
                        pincode: '000000',
                        identityProof: 'approval-created',
                    },
                });
            }
        }

        // Send approval email
        if (updated.email) {
            emailService.sendApprovalNotification(updated.email, {
                type: 'DISTRICT_SECRETARY',
                name: updated.name,
                uid: updated.uid,
                loginPassword: updated.phone,
                stateName: updated.state?.name,
                districtName: updated.district?.name,
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            });
        }
    } else if (status === 'REJECTED' && updated.email) {
        emailService.sendRejectionNotification(updated.email, {
            type: 'DISTRICT_SECRETARY',
            name: updated.name,
            uid: updated.uid,
            reason: remarks,
        });
    }

    return updated;
};

const createUserAccount = async (data: any) => {
    const existingUser = await prisma.user.findFirst({
        where: { phone: data.phone }
    });

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    if (existingUser) {
        logger.warn(`User already exists for Approved Secretary: ${data.email} — updating role and approval status`);
        return prisma.user.update({
            where: { id: existingUser.id },
            data: {
                role: data.role,
                isActive: true,
                isApproved: true,
                otpVerified: true,
                approvalStatus: 'APPROVED',
                password: await bcrypt.hash(data.phone, 12),
                expiryDate: existingUser.expiryDate || expiryDate,
            },
        });
    }

    const uid = data.stateId && data.districtId
        ? await generateUID('DISTRICT_SECRETARY', { stateId: data.stateId, districtId: data.districtId })
        : `USER-${Date.now()}`;

    return prisma.user.create({
        data: {
            email: data.email,
            phone: data.phone,
            password: await bcrypt.hash(data.phone, 12),
            role: data.role,
            uid,
            isActive: true,
            isApproved: true,
            otpVerified: true,
            approvalStatus: 'APPROVED',
            expiryDate,
        }
    });
};
