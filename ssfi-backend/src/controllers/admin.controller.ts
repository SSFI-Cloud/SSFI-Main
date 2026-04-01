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

export const resetDistrictsAndClubs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use raw SQL throughout to bypass Prisma FK validation
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0`);

    // Unlink students from clubs and districts
    await prisma.$executeRawUnsafe(`UPDATE students SET clubId = NULL, districtId = NULL`);

    // Unlink event registrations from clubs and districts
    await prisma.$executeRawUnsafe(`UPDATE event_registrations SET clubId = NULL, districtId = NULL`);

    // Unlink payments from razorpay configs
    await prisma.$executeRawUnsafe(`UPDATE payments SET razorpayConfigId = NULL WHERE razorpayConfigId IS NOT NULL`);

    // Delete payments by district secretary / club owner users
    await prisma.$executeRawUnsafe(`DELETE p FROM payments p INNER JOIN users u ON p.userId = u.id WHERE u.role IN ('DISTRICT_SECRETARY', 'CLUB_OWNER')`);

    // Delete club owners
    await prisma.$executeRawUnsafe(`DELETE FROM club_owners`);

    // Delete clubs
    await prisma.$executeRawUnsafe(`DELETE FROM clubs`);

    // Delete district secretaries (registration applications)
    await prisma.$executeRawUnsafe(`DELETE FROM district_secretaries`);

    // Delete district persons (approved secretary links)
    await prisma.$executeRawUnsafe(`DELETE FROM district_persons`);

    // Delete razorpay configs for district/club users
    await prisma.$executeRawUnsafe(`DELETE rc FROM razorpay_configs rc INNER JOIN users u ON rc.userId = u.id WHERE u.role IN ('DISTRICT_SECRETARY', 'CLUB_OWNER')`);

    // Delete user accounts
    await prisma.$executeRawUnsafe(`DELETE FROM users WHERE role IN ('DISTRICT_SECRETARY', 'CLUB_OWNER')`);

    // Delete all district master records
    await prisma.$executeRawUnsafe(`DELETE FROM districts`);

    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`);

    res.status(200).json({
      status: 'success',
      data: { message: 'All district and club data cleared. Students unlinked.' },
    });
  } catch (error: any) {
    // Re-enable FK checks on error
    try { await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1`); } catch {}
    res.status(500).json({
      status: 'error',
      message: error?.message || 'Unknown error',
      code: error?.code,
      meta: error?.meta,
    });
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
