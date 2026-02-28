import { Router } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import renewalService from '../services/renewal.service';
import { AppError } from '../utils/errors';

const router = Router();
import prisma from '../config/prisma';
// ==========================================
// USER ENDPOINTS (Authenticated users)
// ==========================================

/**
 * GET /api/renewal/status
 * Get current user's renewal status
 */
router.get('/status', authenticate, async (req, res, next) => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const status = await renewalService.getRenewalStatus(req.user.id);

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/renewal/history
 * Get renewal history for current user
 */
router.get('/history', authenticate, async (req, res, next) => {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                registrationDate: true,
                lastRenewalDate: true,
                expiryDate: true,
                renewalPeriodMonths: true,
                accountStatus: true
            }
        });

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// ==========================================
// ADMIN ENDPOINTS (Global Admin only)
// ==========================================

/**
 * GET /api/renewal/expiring
 * Get list of accounts expiring soon
 * Query params: role (optional), days (optional, default: 30)
 */
router.get(
    '/expiring',
    authenticate,
    requireRole(UserRole.GLOBAL_ADMIN),
    async (req, res, next) => {
        try {
            const { role, days } = req.query;

            const accounts = await renewalService.getExpiringAccounts(
                role as UserRole | undefined,
                days ? parseInt(days as string) : 30
            );

            res.json({
                success: true,
                count: accounts.length,
                data: accounts
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/renewal/expired
 * Get list of expired/locked accounts
 * Query params: role (optional)
 */
router.get(
    '/expired',
    authenticate,
    requireRole(UserRole.GLOBAL_ADMIN),
    async (req, res, next) => {
        try {
            const { role } = req.query;

            const accounts = await renewalService.getExpiredAccounts(
                role as UserRole | undefined
            );

            res.json({
                success: true,
                count: accounts.length,
                data: accounts
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/renewal/:userId/renew
 * Renew a specific user account
 * Body: { renewalMonths?: number, paymentConfirmed: boolean }
 */
router.post(
    '/:userId/renew',
    authenticate,
    requireRole(UserRole.GLOBAL_ADMIN),
    async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { renewalMonths, paymentConfirmed } = req.body;

            if (!paymentConfirmed) {
                throw new AppError('Payment confirmation is required', 400);
            }

            const updatedUser = await renewalService.renewAccount(
                parseInt(userId),
                renewalMonths,
                paymentConfirmed,
                req.user!.id
            );

            res.json({
                success: true,
                message: 'Account renewed successfully',
                data: {
                    uid: updatedUser.uid,
                    expiryDate: updatedUser.expiryDate,
                    accountStatus: updatedUser.accountStatus
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/renewal/:userId/unlock
 * Unlock/reactivate a locked account
 * Body: { reason: string }
 */
router.post(
    '/:userId/unlock',
    authenticate,
    requireRole(UserRole.GLOBAL_ADMIN),
    async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { reason } = req.body;

            if (!reason) {
                throw new AppError('Reason is required to unlock account', 400);
            }

            const updatedUser = await renewalService.unlockAccount(
                parseInt(userId),
                reason,
                req.user!.id
            );

            res.json({
                success: true,
                message: 'Account unlocked successfully',
                data: {
                    uid: updatedUser.uid,
                    accountStatus: updatedUser.accountStatus
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/renewal/:userId/set-expiry
 * Manually set expiry date for a user
 * Body: { expiryDate: string (ISO date) }
 */
router.post(
    '/:userId/set-expiry',
    authenticate,
    requireRole(UserRole.GLOBAL_ADMIN),
    async (req, res, next) => {
        try {
            const { userId } = req.params;
            const { expiryDate } = req.body;

            if (!expiryDate) {
                throw new AppError('Expiry date is required', 400);
            }

            const newExpiryDate = new Date(expiryDate);
            if (isNaN(newExpiryDate.getTime())) {
                throw new AppError('Invalid date format', 400);
            }

            const updatedUser = await renewalService.setExpiryDate(
                parseInt(userId),
                newExpiryDate,
                req.user!.id
            );

            res.json({
                success: true,
                message: 'Expiry date updated successfully',
                data: {
                    uid: updatedUser.uid,
                    expiryDate: updatedUser.expiryDate,
                    accountStatus: updatedUser.accountStatus
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/renewal/lock-expired
 * Manually trigger locking of all expired accounts
 * (This is also run by scheduled job)
 */
router.post(
    '/lock-expired',
    authenticate,
    requireRole(UserRole.GLOBAL_ADMIN),
    async (req, res, next) => {
        try {
            const count = await renewalService.lockExpiredAccounts();

            res.json({
                success: true,
                message: `Locked ${count} expired accounts`,
                count
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
