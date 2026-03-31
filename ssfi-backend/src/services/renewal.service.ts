import { PrismaClient, AccountStatus, UserRole } from '@prisma/client';
import { AppError } from '../utils/errors';
import { emailService } from './email.service';

import prisma from '../config/prisma';
// ==========================================
// RENEWAL CALCULATION & STATUS
// ==========================================

/**
 * Calculate expiry date based on registration or last renewal
 * @param userId User ID
 * @param renewalMonths Number of months to add (defaults to user's renewalPeriodMonths)
 * @returns New expiry date
 */
export const calculateExpiryDate = async (
    userId: number,
    renewalMonths?: number
): Promise<Date> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lastRenewalDate: true, renewalPeriodMonths: true, registrationDate: true }
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    const months = renewalMonths || user.renewalPeriodMonths || 12;
    const baseDate = user.lastRenewalDate || user.registrationDate || new Date();

    const expiryDate = new Date(baseDate);
    expiryDate.setMonth(expiryDate.getMonth() + months);

    return expiryDate;
};

/**
 * Check if account is expired and update status
 * @param userId User ID
 * @returns Updated user status
 */
export const checkAccountExpiry = async (userId: number) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            expiryDate: true,
            accountStatus: true,
            role: true
        }
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Global admin doesn't expire
    if (user.role === UserRole.GLOBAL_ADMIN) {
        return { isExpired: false, accountStatus: user.accountStatus };
    }

    const now = new Date();
    const isExpired = user.expiryDate ? now > user.expiryDate : false;

    // Update status if expired and not already marked
    if (isExpired && user.accountStatus === AccountStatus.ACTIVE) {
        await prisma.user.update({
            where: { id: userId },
            data: { accountStatus: AccountStatus.EXPIRED }
        });
        return { isExpired: true, accountStatus: AccountStatus.EXPIRED };
    }

    return { isExpired, accountStatus: user.accountStatus };
};

/**
 * Get renewal status for a user
 * @param userId User ID
 * @returns Renewal status information
 */
export const getRenewalStatus = async (userId: number) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            uid: true,
            role: true,
            expiryDate: true,
            lastRenewalDate: true,
            registrationDate: true,
            accountStatus: true,
            renewalNotificationSent: true,
            renewalPeriodMonths: true
        }
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Global admin doesn't have expiry
    if (user.role === UserRole.GLOBAL_ADMIN) {
        return {
            expiryDate: null,
            daysUntilExpiry: null,
            needsRenewal: false,
            isExpired: false,
            showNotification: false,
            accountStatus: user.accountStatus
        };
    }

    const now = new Date();
    const expiryDate = user.expiryDate;

    if (!expiryDate) {
        return {
            expiryDate: null,
            daysUntilExpiry: null,
            needsRenewal: true,
            isExpired: false,
            showNotification: false,
            accountStatus: user.accountStatus,
            message: 'No expiry date set. Please contact administrator.'
        };
    }

    const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isExpired = daysUntilExpiry < 0;
    const needsRenewal = daysUntilExpiry <= 30;
    const showNotification = needsRenewal && !isExpired;

    return {
        expiryDate,
        daysUntilExpiry,
        needsRenewal,
        isExpired,
        showNotification,
        accountStatus: user.accountStatus,
        lastRenewalDate: user.lastRenewalDate,
        registrationDate: user.registrationDate
    };
};

/**
 * Get users nearing expiry (within specified days)
 * @param days Days threshold (default: 30)
 * @param role Optional role filter
 * @returns List of users nearing expiry
 */
export const getUsersNearingExpiry = async (
    days: number = 30,
    role?: UserRole
) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const where: any = {
        role: role ? role : { not: UserRole.GLOBAL_ADMIN },
        expiryDate: {
            lte: targetDate,
            gte: new Date() // Not yet expired
        },
        accountStatus: AccountStatus.ACTIVE
    };

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            uid: true,
            email: true,
            phone: true,
            role: true,
            expiryDate: true,
            lastRenewalDate: true,
            renewalNotificationSent: true,
            statePerson: { select: { name: true, stateId: true } },
            districtPerson: { select: { name: true, districtId: true } },
            clubOwner: { select: { name: true, clubId: true } },
            student: { select: { name: true, clubId: true } }
        },
        orderBy: { expiryDate: 'asc' }
    });

    return users.map(user => {
        const name =
            user.statePerson?.name ||
            user.districtPerson?.name ||
            user.clubOwner?.name ||
            user.student?.name ||
            'Unknown';

        const daysUntilExpiry = user.expiryDate
            ? Math.ceil((user.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;

        return {
            id: user.id,
            uid: user.uid,
            name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            expiryDate: user.expiryDate,
            daysUntilExpiry,
            lastRenewalDate: user.lastRenewalDate,
            renewalNotificationSent: user.renewalNotificationSent
        };
    });
};

// ==========================================
// ACCOUNT LOCKING & STATUS MANAGEMENT
// ==========================================

/**
 * Lock expired accounts (scheduled job function)
 * This should be run daily
 */
export const lockExpiredAccounts = async () => {
    const now = new Date();

    const result = await prisma.user.updateMany({
        where: {
            role: { not: UserRole.GLOBAL_ADMIN },
            expiryDate: { lt: now },
            accountStatus: AccountStatus.ACTIVE
        },
        data: {
            accountStatus: AccountStatus.EXPIRED
        }
    });

    console.log(`Locked ${result.count} expired accounts`);
    return result.count;
};

/**
 * Send renewal notifications to users expiring soon
 * Sends emails at 30-day, 7-day, and on-expiry milestones.
 * This should be run daily.
 */
export const sendRenewalNotifications = async () => {
    // Fetch users expiring within 30 days (active accounts)
    const usersNearExpiry = await getUsersNearingExpiry(30);

    // Also fetch recently expired users (expired in the last 7 days) to send "expired" emails
    const recentlyExpired = await prisma.user.findMany({
        where: {
            role: { not: UserRole.GLOBAL_ADMIN },
            expiryDate: {
                lt: new Date(),
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
            },
            accountStatus: { in: [AccountStatus.ACTIVE, AccountStatus.EXPIRED] },
        },
        select: {
            id: true, uid: true, email: true, role: true, expiryDate: true,
            renewalNotificationSent: true,
            statePerson: { select: { name: true } },
            districtPerson: { select: { name: true } },
            clubOwner: { select: { name: true } },
            student: { select: { name: true } },
        },
    });

    const expiredUsers = recentlyExpired.map(u => ({
        id: u.id,
        uid: u.uid,
        name: u.statePerson?.name || u.districtPerson?.name || u.clubOwner?.name || u.student?.name || 'Member',
        email: u.email,
        role: u.role,
        expiryDate: u.expiryDate,
        daysUntilExpiry: u.expiryDate
            ? Math.ceil((u.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 0,
        renewalNotificationSent: u.renewalNotificationSent,
    }));

    // Combine near-expiry + expired users
    const allUsers = [...usersNearExpiry, ...expiredUsers];

    // Filter: only send to users with email who haven't been notified yet
    const usersToNotify = allUsers.filter(u => u.email && !u.renewalNotificationSent);

    let sentCount = 0;

    for (const user of usersToNotify) {
        try {
            // Send the renewal reminder email
            await emailService.sendRenewalReminder(user.email!, {
                name: user.name,
                uid: user.uid || 'N/A',
                role: user.role,
                daysUntilExpiry: user.daysUntilExpiry || 0,
                expiryDate: user.expiryDate || new Date(),
            });

            // Mark as notified
            await prisma.user.update({
                where: { id: user.id },
                data: { renewalNotificationSent: true },
            });

            sentCount++;
        } catch (err) {
            console.error(`Failed to send renewal reminder to ${user.email}:`, err);
            // Continue with other users even if one fails
        }
    }

    console.log(`Sent renewal notifications to ${sentCount} users`);

    return {
        notified: sentCount,
        users: usersToNotify,
    };
};

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

/**
 * Set expiry date manually (Admin only)
 * @param userId User ID
 * @param expiryDate New expiry date
 * @param adminId Admin user ID performing the action
 * @returns Updated user
 */
export const setExpiryDate = async (
    userId: number,
    expiryDate: Date,
    adminId: number
) => {
    // Verify admin permissions (should be done in middleware, but double-check)
    const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { role: true }
    });

    if (admin?.role !== UserRole.GLOBAL_ADMIN) {
        throw new AppError('Unauthorized. Admin access required.', 403);
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            expiryDate,
            accountStatus: AccountStatus.ACTIVE,
            renewalNotificationSent: false
        }
    });

    return user;
};

/**
 * Renew account with payment confirmation
 * @param userId User ID to renew
 * @param renewalMonths Number of months to renew (defaults to user's renewalPeriodMonths)
 * @param paymentConfirmed Whether payment is confirmed
 * @param adminId Admin user ID performing the action
 * @returns Updated user
 */
export const renewAccount = async (
    userId: number,
    renewalMonths: number | undefined,
    paymentConfirmed: boolean,
    adminId: number
) => {
    if (!paymentConfirmed) {
        throw new AppError('Payment must be confirmed to renew account', 400);
    }

    const newExpiryDate = await calculateExpiryDate(userId, renewalMonths);

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            expiryDate: newExpiryDate,
            lastRenewalDate: new Date(),
            accountStatus: AccountStatus.ACTIVE,
            renewalNotificationSent: false
        }
    });

    console.log(`Account renewed for user ${user.uid} by admin ${adminId}. New expiry: ${newExpiryDate}`);

    return user;
};

/**
 * Unlock/reactivate a locked account
 * @param userId User ID to unlock
 * @param reason Reason for unlocking
 * @param adminId Admin user ID performing the action
 * @returns Updated user
 */
export const unlockAccount = async (
    userId: number,
    reason: string,
    adminId: number
) => {
    const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { role: true }
    });

    if (admin?.role !== UserRole.GLOBAL_ADMIN) {
        throw new AppError('Unauthorized. Admin access required.', 403);
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            accountStatus: AccountStatus.ACTIVE
        }
    });

    console.log(`Account unlocked for user ${user.uid} by admin ${adminId}. Reason: ${reason}`);

    return user;
};

/**
 * Get expiring accounts with filters
 * @param role Optional role filter
 * @param days Days until expiry filter (default: 30)
 * @returns List of expiring accounts
 */
export const getExpiringAccounts = async (
    role?: UserRole,
    days?: number
) => {
    return getUsersNearingExpiry(days || 30, role);
};

/**
 * Get expired and locked accounts
 * @param role Optional role filter
 * @returns List of expired/locked accounts
 */
export const getExpiredAccounts = async (role?: UserRole) => {
    const where: any = {
        role: role ? role : { not: UserRole.GLOBAL_ADMIN },
        accountStatus: {
            in: [AccountStatus.EXPIRED, AccountStatus.LOCKED]
        }
    };

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            uid: true,
            email: true,
            phone: true,
            role: true,
            expiryDate: true,
            lastRenewalDate: true,
            accountStatus: true,
            statePerson: { select: { name: true } },
            districtPerson: { select: { name: true } },
            clubOwner: { select: { name: true } },
            student: { select: { name: true } }
        },
        orderBy: { expiryDate: 'desc' }
    });

    return users.map(user => ({
        id: user.id,
        uid: user.uid,
        name:
            user.statePerson?.name ||
            user.districtPerson?.name ||
            user.clubOwner?.name ||
            user.student?.name ||
            'Unknown',
        email: user.email,
        phone: user.phone,
        role: user.role,
        expiryDate: user.expiryDate,
        lastRenewalDate: user.lastRenewalDate,
        accountStatus: user.accountStatus
    }));
};

/**
 * Verify KYC for renewal — compare Digilocker Aadhaar with stored Aadhaar
 * @param userId User ID
 * @param kycData KYC verification result from Digilocker
 * @returns Whether verification passed
 */
export const verifyKycForRenewal = async (
    userId: number,
    kycData: { maskedAadhaar: string; fullName: string; dob: string }
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { student: { select: { aadhaarNumber: true, name: true } } },
    });

    if (!user || !user.student) {
        throw new AppError('Student not found', 404);
    }

    // Compare last 4 digits of Aadhaar
    const storedAadhaar = user.student.aadhaarNumber;
    const kycLast4 = kycData.maskedAadhaar.replace(/\s/g, '').slice(-4);
    const storedLast4 = storedAadhaar.replace(/\s/g, '').slice(-4);

    if (kycLast4 !== storedLast4) {
        throw new AppError(
            'Aadhaar number from Digilocker does not match our records. Please contact SSFI support.',
            400
        );
    }

    // Mark student as KYC verified for this renewal cycle
    await prisma.student.update({
        where: { userId },
        data: { kycVerified: true, kycVerifiedAt: new Date() },
    });

    return { verified: true, name: kycData.fullName };
};

/**
 * Self-service renewal: student renews their own account after KYC + payment
 */
export const selfRenew = async (
    userId: number,
    paymentId: string,
    renewalMonths?: number,
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, accountStatus: true, student: { select: { kycVerifiedAt: true } } },
    });

    if (!user) throw new AppError('User not found', 404);
    if (user.role !== UserRole.STUDENT) throw new AppError('Only students can self-renew', 403);

    // Check KYC was completed recently (within last 24 hours)
    const kycVerifiedAt = user.student?.kycVerifiedAt;
    if (!kycVerifiedAt || (Date.now() - kycVerifiedAt.getTime()) > 24 * 60 * 60 * 1000) {
        throw new AppError('Please complete Digilocker verification before renewing', 400);
    }

    const newExpiryDate = await calculateExpiryDate(userId, renewalMonths);

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            expiryDate: newExpiryDate,
            lastRenewalDate: new Date(),
            accountStatus: AccountStatus.ACTIVE,
            renewalNotificationSent: false,
        },
    });

    console.log(`Student self-renewed: ${updatedUser.uid}. New expiry: ${newExpiryDate}`);

    return updatedUser;
};

export default {
    calculateExpiryDate,
    checkAccountExpiry,
    getRenewalStatus,
    getUsersNearingExpiry,
    lockExpiredAccounts,
    sendRenewalNotifications,
    setExpiryDate,
    renewAccount,
    unlockAccount,
    getExpiringAccounts,
    getExpiredAccounts,
    verifyKycForRenewal,
    selfRenew,
};
