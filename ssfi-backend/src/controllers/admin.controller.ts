import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AccountStatus, UserRole } from '@prisma/client';

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
