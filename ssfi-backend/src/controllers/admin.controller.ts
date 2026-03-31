import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AccountStatus, UserRole } from '@prisma/client';

export const resetAllDonations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Delete payments linked to donations first
    await prisma.payment.deleteMany({ where: { donationId: { not: null } } });
    const result = await prisma.donation.deleteMany({});

    res.status(200).json({
      status: 'success',
      data: { deletedCount: result.count, message: `${result.count} donation records deleted` },
    });
  } catch (error) {
    next(error);
  }
};

export const resetAllPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.payment.deleteMany({});

    res.status(200).json({
      status: 'success',
      data: { deletedCount: result.count, message: `${result.count} payment records deleted` },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkExpireStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.user.updateMany({
      where: {
        role: UserRole.STUDENT,
        accountStatus: AccountStatus.ACTIVE,
      },
      data: {
        accountStatus: AccountStatus.EXPIRED,
        expiryDate: new Date(),
      },
    });

    res.status(200).json({
      status: 'success',
      data: { updatedCount: result.count, message: `${result.count} student accounts marked as expired` },
    });
  } catch (error) {
    next(error);
  }
};
