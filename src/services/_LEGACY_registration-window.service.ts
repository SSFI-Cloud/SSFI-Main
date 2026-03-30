// @ts-nocheck
import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';

import prisma from '../config/prisma';
export const createRegistrationWindow = async (data: any) => {
    // Validate dates
    if (new Date(data.startDate) > new Date(data.endDate)) {
        throw new AppError('Start date cannot be after end date', 400);
    }

    return prisma.registrationWindow.create({
        data: {
            title: data.title,
            type: data.type,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            fee: parseFloat(data.fee),
            description: data.description,
            instructions: data.instructions,
            createdBy: data.createdBy,
            isActive: true
        }
    });
};

export const getAllRegistrationWindows = async (query: any) => {
    const { page = 1, limit = 10, search, type, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.RegistrationWindowWhereInput = {
        deletedAt: null, // Only active ones (soft delete check)
        ...(search && {
            title: { contains: search as string }
        }),
        ...(type && { type: type as string }),
        ...(status === 'active' ? { isActive: true } : status === 'inactive' ? { isActive: false } : {})
    };

    const [windows, total] = await Promise.all([
        prisma.registrationWindow.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.registrationWindow.count({ where })
    ]);

    return {
        windows,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    };
};

export const getRegistrationWindowById = async (id: string) => {
    const window = await prisma.registrationWindow.findUnique({
        where: { id: Number(id) }
    });

    if (!window || window.deletedAt) {
        throw new AppError('Registration window not found', 404);
    }
    return window;
};

export const updateRegistrationWindow = async (id: string, data: any) => {
    const window = await prisma.registrationWindow.findUnique({ where: { id: Number(id) } });
    if (!window || window.deletedAt) throw new AppError('Registration window not found', 404);

    if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
        throw new AppError('Start date cannot be after end date', 400);
    }

    return prisma.registrationWindow.update({
        where: { id: Number(id) },
        data: {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
            fee: data.fee ? parseFloat(data.fee) : undefined
        }
    });
};

export const deleteRegistrationWindow = async (id: string, deletedBy: string) => {
    const window = await prisma.registrationWindow.findUnique({ where: { id: Number(id) } });
    if (!window) throw new AppError('Registration window not found', 404);

    return prisma.registrationWindow.update({
        where: { id: Number(id) },
        data: {
            isActive: false,
            deletedAt: new Date(),
            deletedBy
        }
    });
};
