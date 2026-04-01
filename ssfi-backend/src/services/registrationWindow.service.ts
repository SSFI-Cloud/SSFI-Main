// Registration Windows Service
// Manages registration windows for Student, Club, State, District registrations
import { PrismaClient, RegistrationWindow } from '@prisma/client';

import prisma from '../config/prisma';
import { emailService } from './email.service';
import logger from '../utils/logger.util';

export type RegistrationType = 'STUDENT' | 'CLUB' | 'STATE_SECRETARY' | 'DISTRICT_SECRETARY';

export interface RegistrationWindowData {
    id: number;
    type: RegistrationType;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    lateFeeStart: Date | null;
    lateFeeAmount: number;
    baseFee: number;
    isActive: boolean;
    isPaused: boolean;
    maxRegistrations: number | null;
    registrationsCount: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateWindowInput {
    type: RegistrationType;
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    lateFeeStart?: Date;
    lateFeeAmount?: number;
    baseFee: number;
    maxRegistrations?: number;
    createdBy: string;
}

export interface UpdateWindowInput {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    lateFeeStart?: Date;
    lateFeeAmount?: number;
    baseFee?: number;
    isPaused?: boolean;
    renewalEnabled?: boolean;
    maxRegistrations?: number;
}

/**
 * Check if a window is currently active based on dates and pause status
 */
function isWindowActive(window: { startDate: Date; endDate: Date; isPaused: boolean }): boolean {
    const now = new Date();
    return window.startDate <= now && window.endDate >= now && !window.isPaused;
}

/**
 * Get all active registration windows
 * A window is active if current date is between start_date and end_date and is_paused is false
 */
export async function getActiveWindows(): Promise<RegistrationWindowData[]> {
    const now = new Date();

    const windows = await prisma.registrationWindow.findMany({
        where: {
            startDate: { lte: now },
            endDate: { gte: now },
            isPaused: false,
        },
        orderBy: { endDate: 'asc' },
    });

    return windows.map((w: any) => ({
        ...w,
        title: w.title || w.name,
        type: w.type as RegistrationType,
        isActive: true,
    }));
}

/**
 * Get all registration windows with filters
 */
export async function getAllWindows(filters: {
    type?: RegistrationType;
    isActive?: boolean;
    page?: number;
    limit?: number;
}): Promise<{ windows: RegistrationWindowData[]; total: number }> {
    const { type, isActive, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {};
    if (type) where.type = type;

    // Build query based on active status
    if (isActive === true) {
        where.startDate = { lte: now };
        where.endDate = { gte: now };
        where.isPaused = false;
    } else if (isActive === false) {
        where.OR = [
            { endDate: { lt: now } },
            { startDate: { gt: now } },
            { isPaused: true },
        ];
    }

    const [windows, total] = await Promise.all([
        prisma.registrationWindow.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.registrationWindow.count({ where }),
    ]);

    return {
        windows: windows.map((w: any) => ({
            ...w,
            title: w.title || w.name,
            type: w.type as RegistrationType,
            isActive: isWindowActive(w),
        })),
        total,
    };
}

/**
 * Get a single registration window by ID
 */
export async function getWindowById(id: number): Promise<RegistrationWindowData | null> {
    const window = await prisma.registrationWindow.findUnique({
        where: { id },
    });

    if (!window) return null;

    return {
        ...window,
        title: (window as any).title || (window as any).name,
        type: window.type as RegistrationType,
        isActive: isWindowActive(window),
    } as RegistrationWindowData;
}

/**
 * Get active window for a specific type
 */
export async function getActiveWindowByType(type: RegistrationType): Promise<RegistrationWindowData | null> {
    const now = new Date();

    const window = await prisma.registrationWindow.findFirst({
        where: {
            type,
            startDate: { lte: now },
            endDate: { gte: now },
            isPaused: false,
        },
    });

    if (!window) return null;

    return {
        ...window,
        title: (window as any).title || (window as any).name,
        type: window.type as RegistrationType,
        isActive: true,
    } as RegistrationWindowData;
}

/**
 * Create a new registration window
 */
export async function createWindow(input: CreateWindowInput): Promise<RegistrationWindowData> {
    // Check for overlapping windows of same type
    const overlapping = await prisma.registrationWindow.findFirst({
        where: {
            type: input.type,
            OR: [
                {
                    startDate: { lte: input.endDate },
                    endDate: { gte: input.startDate },
                },
            ],
        },
    });

    if (overlapping) {
        throw new Error(`A registration window for ${input.type} already exists during this period`);
    }

    const window = await prisma.registrationWindow.create({
        data: {
            title: input.name,
            type: input.type,
            description: input.description || null,
            startDate: input.startDate,
            endDate: input.endDate,
            lateFeeStart: input.lateFeeStart || null,
            lateFeeAmount: input.lateFeeAmount || 0,
            baseFee: input.baseFee,
            maxRegistrations: input.maxRegistrations || null,
            isPaused: false,
            registrationsCount: 0,
            createdBy: input.createdBy,
        },
    });

    const result = {
        ...window,
        title: (window as any).title || (window as any).name,
        type: window.type as RegistrationType,
        isActive: isWindowActive(window),
    } as RegistrationWindowData;

    // Send bulk email notification to relevant users (fire-and-forget)
    notifyUsersOfWindowOpen(input.type, result).catch((err) => {
        logger.error('[reg-window] Failed to send open notifications:', err);
    });

    return result;
}

/**
 * Notify relevant users when a registration window opens
 */
async function notifyUsersOfWindowOpen(type: string, window: RegistrationWindowData) {
    // Map window type to user role
    const roleMap: Record<string, string> = {
        STUDENT: 'STUDENT',
        CLUB: 'CLUB_OWNER',
        STATE_SECRETARY: 'STATE_SECRETARY',
        DISTRICT_SECRETARY: 'DISTRICT_SECRETARY',
    };

    const role = roleMap[type];
    if (!role) return;

    const users = await prisma.user.findMany({
        where: {
            role: role as any,
            email: { not: null },
        },
        select: {
            email: true,
            student: { select: { name: true } },
            clubOwner: { select: { name: true } },
            statePerson: { select: { name: true } },
            districtPerson: { select: { name: true } },
        },
    });

    const recipients = users
        .filter(u => u.email)
        .map(u => ({
            email: u.email!,
            name: u.student?.name || u.clubOwner?.name || u.statePerson?.name || u.districtPerson?.name || 'Member',
        }));

    if (recipients.length === 0) return;

    const formatDate = (d: Date) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    emailService.sendBulkInBackground(
        recipients,
        (email, name) => emailService.sendRegistrationOpenNotification(email, {
            name,
            windowTitle: window.title || type,
            windowType: type,
            startDate: formatDate(window.startDate),
            endDate: formatDate(window.endDate),
            baseFee: window.baseFee || 0,
        }),
        `reg-window-${type}`,
    );

    logger.info(`[reg-window] Queued ${recipients.length} notification emails for ${type} window open`);
}

/**
 * Update a registration window
 */
export async function updateWindow(id: number, input: UpdateWindowInput): Promise<RegistrationWindowData> {
    const existing = await prisma.registrationWindow.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new Error('Registration window not found');
    }

    // Check for overlapping windows if dates are being changed
    if (input.startDate || input.endDate) {
        const startDate = input.startDate || existing.startDate;
        const endDate = input.endDate || existing.endDate;

        const overlapping = await prisma.registrationWindow.findFirst({
            where: {
                type: existing.type,
                id: { not: id },
                OR: [
                    {
                        startDate: { lte: endDate },
                        endDate: { gte: startDate },
                    },
                ],
            },
        });

        if (overlapping) {
            throw new Error(`Another registration window for ${existing.type} exists during this period`);
        }
    }

    const { name, ...rest } = input;

    // Construct update data
    const updateData: any = { ...rest };
    if (name) updateData.title = name;

    const window = await prisma.registrationWindow.update({
        where: { id },
        data: updateData,
    });

    return {
        ...window,
        title: (window as any).title || (window as any).name,
        type: window.type as RegistrationType,
        isActive: isWindowActive(window),
    } as RegistrationWindowData;
}

/**
 * Pause/Resume a registration window
 */
export async function togglePause(id: number): Promise<RegistrationWindowData> {
    const window = await prisma.registrationWindow.findUnique({
        where: { id },
    });

    if (!window) {
        throw new Error('Registration window not found');
    }

    const updated = await prisma.registrationWindow.update({
        where: { id },
        data: {
            isPaused: !window.isPaused,
        },
    });

    return {
        ...updated,
        title: (updated as any).title || (updated as any).name,
        type: updated.type as RegistrationType,
        isActive: isWindowActive(updated),
    } as RegistrationWindowData;
}

/**
 * Increment registration count
 */
export async function incrementCount(id: number): Promise<void> {
    await prisma.registrationWindow.update({
        where: { id },
        data: {
            registrationsCount: { increment: 1 },
        },
    });
}

/**
 * Check if registration is allowed for a window
 */
export async function canRegister(id: number): Promise<{ allowed: boolean; reason?: string; fee: number }> {
    const window = await getWindowById(id);

    if (!window) {
        return { allowed: false, reason: 'Registration window not found', fee: 0 };
    }

    const now = new Date();

    if (window.isPaused) {
        return { allowed: false, reason: 'Registration is temporarily paused', fee: 0 };
    }

    if (now < window.startDate) {
        return { allowed: false, reason: 'Registration has not started yet', fee: 0 };
    }

    if (now > window.endDate) {
        return { allowed: false, reason: 'Registration period has ended', fee: 0 };
    }

    if (window.maxRegistrations && window.registrationsCount >= window.maxRegistrations) {
        return { allowed: false, reason: 'Maximum registrations reached', fee: 0 };
    }

    // Calculate fee (base + late fee if applicable)
    let fee = window.baseFee;
    if (window.lateFeeStart && now >= window.lateFeeStart) {
        fee += window.lateFeeAmount;
    }

    return { allowed: true, fee };
}

/**
 * Check if renewal is currently enabled via any active STUDENT registration window
 */
export async function isRenewalEnabled(): Promise<boolean> {
    const now = new Date();
    const window = await prisma.registrationWindow.findFirst({
        where: {
            type: 'STUDENT',
            startDate: { lte: now },
            endDate: { gte: now },
            isPaused: false,
            renewalEnabled: true,
        },
    });
    return !!window;
}

/**
 * Toggle renewal enabled on a registration window
 */
export async function toggleRenewal(id: number): Promise<RegistrationWindowData> {
    const window = await prisma.registrationWindow.findUnique({ where: { id } });
    if (!window) throw new Error('Registration window not found');

    const updated = await prisma.registrationWindow.update({
        where: { id },
        data: { renewalEnabled: !window.renewalEnabled },
    });

    return {
        ...updated,
        title: (updated as any).title || (updated as any).name,
        type: updated.type as RegistrationType,
        isActive: isWindowActive(updated),
    } as RegistrationWindowData;
}

/**
 * Delete a registration window (only if no registrations)
 */
export async function deleteWindow(id: number): Promise<void> {
    const window = await prisma.registrationWindow.findUnique({
        where: { id },
    });

    if (!window) {
        throw new Error('Registration window not found');
    }

    if (window.registrationsCount > 0) {
        throw new Error('Cannot delete window with existing registrations');
    }

    await prisma.registrationWindow.delete({
        where: { id },
    });
}
