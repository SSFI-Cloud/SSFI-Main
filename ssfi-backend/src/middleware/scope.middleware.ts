import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { AppError } from '../utils/errors';

import prisma from '../config/prisma';
/**
 * Scope Middleware - Auto-injects scope filters based on user role
 * 
 * Hierarchy:
 * - GLOBAL_ADMIN: No restrictions
 * - STATE_SECRETARY: Filters by stateId
 * - DISTRICT_SECRETARY: Filters by districtId (and stateId)
 * - CLUB_OWNER: Filters by clubId (and districtId, stateId)
 * - STUDENT: Only sees own data
 */

/**
 * Inject scope filters into req.query based on authenticated user's role
 * Use this middleware AFTER authenticate middleware
 */
export const injectScopeFilters = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        if (!req.user) {
            return next(new AppError('User not authenticated', 401));
        }

        const { role, stateId, districtId, clubId } = req.user;

        // Global Admin has no restrictions
        if (role === UserRole.GLOBAL_ADMIN) {
            return next();
        }

        // State Secretary - only see their state's data
        if (role === UserRole.STATE_SECRETARY) {
            if (!stateId) {
                return next(new AppError('State Secretary not associated with a state', 403));
            }
            // Only inject if not already set (allow Global Admin override via query)
            if (!req.query.stateId) {
                req.query.stateId = String(stateId);
            }
        }

        // District Secretary - only see their district's data
        if (role === UserRole.DISTRICT_SECRETARY) {
            if (!districtId) {
                return next(new AppError('District Secretary not associated with a district', 403));
            }
            if (!req.query.districtId) {
                req.query.districtId = String(districtId);
            }
        }

        // Club Owner - only see their club's data
        if (role === UserRole.CLUB_OWNER) {
            if (!clubId) {
                return next(new AppError('Club Owner not associated with a club', 403));
            }
            if (!req.query.clubId) {
                req.query.clubId = String(clubId);
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Verify that an entity being approved belongs to the user's jurisdiction
 * Prevents cross-scope approvals
 */
export const verifyApprovalScope = (entityType: 'district_secretary' | 'club' | 'student') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                return next(new AppError('User not authenticated', 401));
            }

            const { role, stateId, districtId, clubId } = req.user;
            const entityId = req.params.id;

            // Global Admin has full access
            if (role === UserRole.GLOBAL_ADMIN) {
                return next();
            }

            // Verify scope based on entity type
            if (entityType === 'district_secretary') {
                // State Secretary can only approve District Secretaries in their state
                if (role === UserRole.STATE_SECRETARY) {
                    const secretary = await prisma.districtSecretary.findUnique({
                        where: { id: entityId },
                        select: { stateId: true }
                    });
                    if (!secretary || secretary.stateId !== stateId) {
                        return next(new AppError('You can only approve district secretaries in your state', 403));
                    }
                } else {
                    return next(new AppError('You do not have permission to approve district secretaries', 403));
                }
            }

            if (entityType === 'club') {
                const club = await prisma.club.findUnique({
                    where: { id: Number(entityId) },
                    select: { stateId: true, districtId: true }
                });

                if (!club) {
                    return next(new AppError('Club not found', 404));
                }

                // State Secretary can approve clubs in their state
                if (role === UserRole.STATE_SECRETARY) {
                    if (club.stateId !== stateId) {
                        return next(new AppError('You can only approve clubs in your state', 403));
                    }
                }
                // District Secretary can only approve clubs in their district
                else if (role === UserRole.DISTRICT_SECRETARY) {
                    if (club.districtId !== districtId) {
                        return next(new AppError('You can only approve clubs in your district', 403));
                    }
                }
            }

            if (entityType === 'student') {
                const student = await prisma.student.findUnique({
                    where: { id: Number(entityId) },
                    select: { stateId: true, districtId: true, clubId: true }
                });

                if (!student) {
                    return next(new AppError('Student not found', 404));
                }

                // State Secretary can approve students in their state
                if (role === UserRole.STATE_SECRETARY) {
                    if (student.stateId !== stateId) {
                        return next(new AppError('You can only approve students in your state', 403));
                    }
                }
                // District Secretary can approve students in their district
                else if (role === UserRole.DISTRICT_SECRETARY) {
                    if (student.districtId !== districtId) {
                        return next(new AppError('You can only approve students in your district', 403));
                    }
                }
                // Club Owner can only approve students in their club
                else if (role === UserRole.CLUB_OWNER) {
                    if (student.clubId !== clubId) {
                        return next(new AppError('You can only approve students in your club', 403));
                    }
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

export default {
    injectScopeFilters,
    verifyApprovalScope,
};

