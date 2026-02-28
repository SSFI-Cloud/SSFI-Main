import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { AppError } from '../utils/errors';

import prisma from '../config/prisma';
// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        uid: string;
        role: UserRole;
        email?: string;
        phone?: string;
        stateId?: number;
        districtId?: number;
        clubId?: number;
        studentId?: number;
      };
    }
  }
}

interface JWTPayload {
  id: number;
  uid: string;
  role: UserRole;
  email?: string;
  phone: string;
}

/**
 * Authenticate user via JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JWTPayload;

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        statePerson: true,
        districtPerson: { include: { district: true } },
        clubOwner: { include: { club: true } },
        student: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    if (!user.isApproved && user.role !== UserRole.GLOBAL_ADMIN) {
      throw new AppError('Account pending approval', 403);
    }

    // Check if account is suspended (completely blocked)
    if (user.accountStatus === 'SUSPENDED') {
      throw new AppError('Account suspended. Please contact administrator', 403);
    }

    // Note: EXPIRED and LOCKED accounts can still login
    // They will see renewal notifications on their dashboard
    // This allows users to access payment and renewal options

    // Attach user to request
    req.user = {
      id: user.id,
      uid: user.uid,
      role: user.role,
      email: user.email || undefined,
      phone: user.phone || undefined,
      stateId: user.statePerson?.stateId,
      districtId: user.districtPerson?.districtId || user.clubOwner?.club.districtId,
      clubId: user.clubOwner?.clubId,
      studentId: user.student?.id, // Student ID is CUID (String)
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Check if account needs renewal on login
 */
export const checkRenewal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { expiryDate: true, role: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Global admin doesn't expire
    if (user.role === UserRole.GLOBAL_ADMIN) {
      return next();
    }

    // Check if expired
    if (user.expiryDate && new Date() > user.expiryDate) {
      res.status(403).json({
        success: false,
        needsRenewal: true,
        message: 'Your membership has expired. Please renew to continue.',
        expiryDate: user.expiryDate
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require specific role(s)
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to access this resource',
          403
        )
      );
    }

    next();
  };
};

/**
 * Check hierarchical access
 * Higher levels can access data of lower levels
 */
export const checkHierarchicalAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { role, id: userId } = req.user;

    // Global admin has access to everything
    if (role === UserRole.GLOBAL_ADMIN) {
      return next();
    }

    // Get user's associated entity
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        statePerson: { include: { state: true } },
        districtPerson: { include: { district: true } },
        clubOwner: { include: { club: true } },
        student: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Attach hierarchy info to request
    (req as any).hierarchy = {
      role,
      stateId: user.statePerson?.stateId ||
        user.districtPerson?.district.stateId ||
        user.clubOwner?.club.districtId ||
        user.student?.stateId,
      districtId: user.districtPerson?.districtId ||
        user.clubOwner?.club.districtId ||
        user.student?.districtId,
      clubId: user.clubOwner?.clubId || user.student?.clubId
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        statePerson: true,
        districtPerson: { include: { district: true } },
        clubOwner: { include: { club: true } },
        student: true
      }
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        uid: user.uid,
        role: user.role,
        email: user.email || undefined,
        phone: user.phone,
        stateId: user.statePerson?.stateId,
        districtId: user.districtPerson?.districtId || user.clubOwner?.club.districtId,
        clubId: user.clubOwner?.clubId,
        studentId: user.student?.id,
      };
    }

    next();
  } catch (error) {
    // Invalid token - just continue without user
    next();
  }
};

export default {
  authenticate,
  checkRenewal,
  requireRole,
  checkHierarchicalAccess,
  optionalAuth
};
