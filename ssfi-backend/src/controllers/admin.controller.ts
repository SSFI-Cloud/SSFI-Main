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
    const result = await prisma.$transaction(async (tx) => {
      // 1. Unlink students from clubs and districts
      await tx.$executeRawUnsafe(`UPDATE students SET clubId = NULL, districtId = NULL WHERE clubId IS NOT NULL OR districtId IS NOT NULL`);

      // 2. Unlink event registrations from clubs and districts
      await tx.$executeRawUnsafe(`UPDATE event_registrations SET clubId = NULL, districtId = NULL WHERE clubId IS NOT NULL OR districtId IS NOT NULL`);

      // 3. Unlink payments from razorpay configs owned by district/club users, then delete those configs
      const dsUsers = await tx.user.findMany({ where: { role: { in: [UserRole.DISTRICT_SECRETARY, UserRole.CLUB_OWNER] } }, select: { id: true } });
      const dsUserIds = dsUsers.map(u => u.id);
      if (dsUserIds.length > 0) {
        // Unlink payments referencing these users' razorpay configs
        const configs = await tx.razorpayConfig.findMany({ where: { userId: { in: dsUserIds } }, select: { id: true } });
        const configIds = configs.map(c => c.id);
        if (configIds.length > 0) {
          await tx.payment.updateMany({ where: { razorpayConfigId: { in: configIds } }, data: { razorpayConfigId: null } });
        }
        // Delete payments by these users
        await tx.payment.deleteMany({ where: { userId: { in: dsUserIds } } });
        // Delete razorpay configs
        await tx.razorpayConfig.deleteMany({ where: { userId: { in: dsUserIds } } });
      }

      // 4. Delete ClubOwner records
      const deletedClubOwners = await tx.clubOwner.deleteMany({});

      // 5. Delete all Club records
      const deletedClubs = await tx.club.deleteMany({});

      // 6. Delete DistrictSecretary records (registration applications)
      const deletedDistrictSecretaries = await tx.districtSecretary.deleteMany({});

      // 7. Delete DistrictPerson records (approved secretary links)
      const deletedDistrictPersons = await tx.districtPerson.deleteMany({});

      // 8. Delete User records with DISTRICT_SECRETARY or CLUB_OWNER roles
      const deletedUsers = await tx.user.deleteMany({
        where: { role: { in: [UserRole.DISTRICT_SECRETARY, UserRole.CLUB_OWNER] } },
      });

      // 9. Delete all District master records
      const deletedDistricts = await tx.district.deleteMany({});

      return {
        deletedClubOwners: deletedClubOwners.count,
        deletedClubs: deletedClubs.count,
        deletedDistrictSecretaries: deletedDistrictSecretaries.count,
        deletedDistrictPersons: deletedDistrictPersons.count,
        deletedUsers: deletedUsers.count,
        deletedDistricts: deletedDistricts.count,
      };
    }, { timeout: 60000 });

    res.status(200).json({
      status: 'success',
      data: { ...result, message: 'District and club data cleared. Students unlinked.' },
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
