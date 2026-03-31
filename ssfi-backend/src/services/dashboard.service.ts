import { PrismaClient, UserRole } from '@prisma/client';
import { AppError } from '../utils/errors';

import prisma from '../config/prisma';
// ==========================================
// GLOBAL ADMIN DASHBOARD
// ==========================================

export const getGlobalAdminDashboard = async () => {
  try {
    const [
      totalStates,
      totalDistricts,
      totalClubs,
      totalStudents,
      totalEvents,
      pendingStateSecretaries,
      pendingDistrictSecretaries,
      pendingClubs,
      pendingUsers,
      recentStudents,
      recentClubs,
      recentEvents,
      genderStats,
      statusStats,
      registrationDates
    ] = await Promise.all([
      prisma.state.count({ where: { stateSecretaries: { some: { status: 'APPROVED' } } } }),
      prisma.district.count({ where: { districtSecretaries: { some: { status: 'APPROVED' } } } }),
      prisma.club.count({ where: { status: 'APPROVED' } }),
      prisma.student.count({ where: { user: { isApproved: true } } }),
      prisma.event.count(),
      prisma.stateSecretary.count({ where: { status: 'PENDING' } }),
      prisma.districtSecretary.count({ where: { status: 'PENDING' } }),
      prisma.club.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: UserRole.STUDENT, isApproved: false } }),
      prisma.student.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          club: { select: { name: true } },
          user: { select: { approvalStatus: true } },
        },
      }),
      prisma.club.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          uid: true,
          name: true,
          status: true,
          createdAt: true,
          district: { select: { name: true } },
        },
      }),
      prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { status: { not: 'DRAFT' } },
        select: {
          id: true,
          code: true,
          name: true,
          eventDate: true,
          status: true,
          _count: { select: { registrations: true } },
        },
      }),
      // Statistics Queries
      prisma.student.groupBy({
        by: ['gender'],
        _count: { gender: true },
      }),
      prisma.user.groupBy({
        by: ['approvalStatus'],
        where: { role: UserRole.STUDENT },
        _count: { approvalStatus: true },
        // Map null/undefined statuses if necessary in processing
      }),
      prisma.student.findMany({
        select: { createdAt: true },
        where: {
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) // Last 6 months
          }
        }
      })
    ]);

    // Process Statistics
    const studentsByGender = genderStats.reduce((acc, curr) => {
      acc[curr.gender] = curr._count.gender;
      return acc;
    }, {} as Record<string, number>);

    const studentsByStatus = statusStats.reduce((acc, curr) => {
      // Map Prisma enum to Frontend expected keys if needed, 
      // assuming frontend expects 'APPROVED', 'PENDING', 'REJECTED' which matches enum
      acc[curr.approvalStatus] = curr._count.approvalStatus;
      return acc;
    }, {} as Record<string, number>);

    // Process Monthly Registrations
    const registrationsByMonthMap = new Map<string, number>();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      registrationsByMonthMap.set(key, 0);
      months.push(key);
    }

    registrationDates.forEach(student => {
      const date = new Date(student.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (registrationsByMonthMap.has(key)) {
        registrationsByMonthMap.set(key, registrationsByMonthMap.get(key)! + 1);
      }
    });

    const registrationsByMonth = Array.from(registrationsByMonthMap.entries()).map(([month, count]) => ({
      month,
      count
    }));

    // Get renewal statistics
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [expiringIn30Days, expiringIn7Days, expiredAccounts] = await Promise.all([
      prisma.user.count({
        where: {
          role: { not: UserRole.GLOBAL_ADMIN },
          expiryDate: {
            lte: thirtyDaysFromNow,
            gte: now
          },
          accountStatus: 'ACTIVE'
        }
      }),
      prisma.user.count({
        where: {
          role: { not: UserRole.GLOBAL_ADMIN },
          expiryDate: {
            lte: sevenDaysFromNow,
            gte: now
          },
          accountStatus: 'ACTIVE'
        }
      }),
      prisma.user.count({
        where: {
          role: { not: UserRole.GLOBAL_ADMIN },
          accountStatus: { in: ['EXPIRED', 'LOCKED'] }
        }
      })
    ]);

    return {
      overview: {
        totalStates,
        totalDistricts,
        totalClubs,
        totalStudents,
        totalEvents,
      },
      pendingApprovals: {
        stateSecretaries: pendingStateSecretaries,
        districtSecretaries: pendingDistrictSecretaries,
        clubs: pendingClubs,
        students: pendingUsers,
        total: pendingStateSecretaries + pendingDistrictSecretaries + pendingClubs + pendingUsers,
      },
      renewalStats: {
        expiringIn30Days,
        expiringIn7Days,
        expiredAccounts
      },
      recentActivity: {
        students: recentStudents,
        clubs: recentClubs,
        events: recentEvents,
      },
      statistics: {
        studentsByGender,
        studentsByStatus,
        registrationsByMonth
      }
    };
  } catch (error) {
    console.error('Error in getGlobalAdminDashboard:', error);
    throw error;
  }
};

// ==========================================
// STATE SECRETARY DASHBOARD
// ==========================================

export const getStateSecretaryDashboard = async (stateId: number) => {
  const stateRecord = await prisma.state.findUnique({
    where: { id: stateId },
    select: { name: true },
  });

  const [
    totalDistricts,
    totalClubs,
    totalStudents,
    totalEvents,
    pendingDistrictSecretaries,
    pendingClubs,
    recentStudents,
    recentClubs,
    recentEvents,
  ] = await Promise.all([
    prisma.district.count({ where: { stateId, districtSecretaries: { some: { status: 'APPROVED' } } } }),
    prisma.club.count({ where: { stateId, status: 'APPROVED' } }),
    prisma.student.count({ where: { stateId, user: { isApproved: true } } }),
    // Count events hierarchically: National (published) + State events (their state) + District events (within their state, published)
    prisma.event.count({
      where: {
        OR: [
          { eventLevel: 'NATIONAL', status: 'PUBLISHED' as const },
          { eventLevel: 'STATE', stateId },
          { eventLevel: 'DISTRICT', stateId, status: 'PUBLISHED' as const }
        ]
      }
    }),
    prisma.districtSecretary.count({ where: { stateId, status: 'PENDING' } }),
    prisma.club.count({ where: { stateId, status: 'PENDING' } }),
    prisma.student.findMany({
      where: { stateId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        club: { select: { name: true } },
        district: { select: { name: true } },
      },
    }),
    prisma.club.findMany({
      where: { stateId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        uid: true,
        name: true,
        status: true,
        createdAt: true,
        district: { select: { name: true } },
      },
    }),
    prisma.event.findMany({
      where: {
        OR: [
          { eventLevel: 'NATIONAL', status: 'PUBLISHED' as const },
          { eventLevel: 'STATE', stateId },
          { eventLevel: 'DISTRICT', stateId, status: 'PUBLISHED' as const }
        ]
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        eventDate: true,
        eventLevel: true,
        status: true,
        _count: { select: { registrations: true } },
      },
    }),
  ]);

  return {
    stateName: stateRecord?.name || null,
    overview: {
      totalDistricts,
      totalClubs,
      totalStudents,
      totalEvents,
    },
    pendingApprovals: {
      districtSecretaries: pendingDistrictSecretaries,
      clubs: pendingClubs,
      students: await prisma.student.count({ where: { stateId, user: { isApproved: false } } }),
      total: pendingDistrictSecretaries + pendingClubs + await prisma.student.count({ where: { stateId, user: { isApproved: false } } }),
    },
    recentActivity: {
      students: recentStudents,
      clubs: recentClubs,
      events: recentEvents,
    },
  };
};

// ==========================================
// DISTRICT SECRETARY DASHBOARD
// ==========================================

export const getDistrictSecretaryDashboard = async (districtId: number) => {
  const districtRecord = await prisma.district.findUnique({
    where: { id: districtId },
    select: { name: true },
  });

  const [
    totalClubs,
    totalStudents,
    totalEvents,
    pendingClubs,
    recentStudents,
    recentClubs,
    recentEvents,
  ] = await Promise.all([
    prisma.club.count({ where: { districtId, status: 'APPROVED' } }),
    prisma.student.count({ where: { districtId, user: { isApproved: true } } }),
    (async () => {
      const district = await prisma.district.findUnique({
        where: { id: districtId },
        select: { stateId: true }
      });
      return prisma.event.count({
        where: {
          OR: [
            { eventLevel: 'NATIONAL', status: 'PUBLISHED' as const },
            ...(district ? [{ eventLevel: 'STATE', stateId: district.stateId, status: 'PUBLISHED' as const }] : []),
            { eventLevel: 'DISTRICT', districtId }
          ]
        }
      });
    })(),
    prisma.club.count({ where: { districtId, status: 'PENDING' } }),
    prisma.student.findMany({
      where: { districtId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        club: { select: { name: true } },
      },
    }),
    prisma.club.findMany({
      where: { districtId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        uid: true,
        name: true,
        status: true,
        createdAt: true,
        _count: { select: { students: true } },
      },
    }),
    (async () => {
      const district = await prisma.district.findUnique({
        where: { id: districtId },
        select: { stateId: true }
      });
      return prisma.event.findMany({
        where: {
          OR: [
            { eventLevel: 'NATIONAL', status: 'PUBLISHED' as const },
            ...(district ? [{ eventLevel: 'STATE', stateId: district.stateId, status: 'PUBLISHED' as const }] : []),
            { eventLevel: 'DISTRICT', districtId }
          ]
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          eventDate: true,
          eventLevel: true,
          status: true,
          _count: { select: { registrations: true } },
        },
      });
    })(),
  ]);

  return {
    districtName: districtRecord?.name || null,
    overview: {
      totalClubs,
      totalStudents,
      totalEvents,
    },
    pendingApprovals: {
      clubs: pendingClubs,
      students: await prisma.student.count({ where: { districtId, user: { isApproved: false } } }),
      total: pendingClubs + await prisma.student.count({ where: { districtId, user: { isApproved: false } } }),
    },
    recentActivity: {
      students: recentStudents,
      clubs: recentClubs,
      events: recentEvents,
    },
  };
};

// ==========================================
// CLUB OWNER DASHBOARD
// ==========================================

export const getClubOwnerDashboard = async (clubId: number) => {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      state: { select: { name: true } },
      district: { select: { name: true } },
    },
  });

  if (!club) {
    throw new AppError('Club not found', 404);
  }

  const [
    totalStudents,
    allStudents,
    pendingStudents,
    expiredMemberships,
    recentStudents,
    recentRegistrations,
    upcomingEvents,
    totalEventRegistrations,
    studentsByGender,
  ] = await Promise.all([
    prisma.student.count({ where: { clubId } }),
    prisma.student.count({ where: { clubId, user: { isApproved: true } } }),
    prisma.student.count({ where: { clubId, user: { isApproved: false } } }),
    prisma.student.count({ where: { clubId, user: { expiryDate: { lt: new Date() } } } }),
    prisma.student.findMany({
      where: { clubId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        gender: true,
        createdAt: true,
        profilePhoto: true,
      },
    }),
    prisma.eventRegistration.findMany({
      where: { clubId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { name: true, eventDate: true } },
        student: { select: { name: true } },
      },
    }),
    prisma.event.findMany({
      where: {
        eventDate: { gte: new Date() },
        status: 'PUBLISHED',
      },
      take: 5,
      orderBy: { eventDate: 'asc' },
      select: {
        id: true,
        name: true,
        eventDate: true,
        registrationEndDate: true,
        status: true,
        venue: true,
        city: true,
      },
    }),
    prisma.eventRegistration.count({ where: { clubId } }),
    prisma.student.groupBy({
      by: ['gender'],
      where: { clubId },
      _count: true,
    }),
  ]);

  // Build gender map
  const genderMap: Record<string, number> = {};
  studentsByGender.forEach((g) => { genderMap[g.gender] = g._count; });

  return {
    club: {
      id: club.id,
      uid: club.uid,
      name: club.name,
      code: club.code,
      state: club.state?.name,
      district: club.district?.name,
      status: club.isActive ? 'ACTIVE' : 'INACTIVE',
    },
    overview: {
      totalStudents,
      approvedStudents: allStudents,
      pendingStudents,
      expiredMemberships,
    },
    statistics: {
      studentsByGender: genderMap,
      totalEventRegistrations,
    },
    recentActivity: {
      students: recentStudents,
      eventRegistrations: recentRegistrations,
    },
    upcomingEvents,
  };
};

// ==========================================
// STUDENT DASHBOARD
// ==========================================

export const getStudentDashboard = async (studentId: number) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { uid: true, email: true, phone: true, expiryDate: true, isApproved: true } },
      club: { select: { id: true, name: true, phone: true } },
      state: { select: { name: true } },
      district: { select: { name: true } },
    },
  });

  if (!student) {
    throw new AppError('Student not found', 404);
  }

  const [
    eventRegistrations,
    upcomingEvents,
  ] = await Promise.all([
    prisma.eventRegistration.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            code: true,
            eventDate: true,
            venue: true,
            city: true,
            status: true,
          },
        },
      },
    }),
    prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        registrationEndDate: { gte: new Date() },
      },
      take: 5,
      orderBy: { eventDate: 'asc' },
      select: {
        id: true,
        name: true,
        eventDate: true,
        registrationEndDate: true,
        venue: true,
        city: true,
        entryFee: true,
      },
    }),
  ]);

  const expiryDate = student.user?.expiryDate;
  const isActive = expiryDate ? new Date(expiryDate) >= new Date() : false;
  const daysUntilExpiry = expiryDate
    ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Split "Firstname Lastname" into parts for frontend
  const nameParts = (student.name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Compute age category from date of birth
  const dob = student.dateOfBirth ? new Date(student.dateOfBirth) : null;
  let ageCategory = '';
  if (dob) {
    const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    if (age < 10) ageCategory = 'U-10';
    else if (age < 14) ageCategory = 'U-14';
    else if (age < 17) ageCategory = 'U-17';
    else if (age < 20) ageCategory = 'U-20';
    else ageCategory = 'Senior';
  }

  return {
    role: 'STUDENT',
    profile: {
      id: student.id,
      uid: student.user?.uid || '',
      firstName,
      lastName,
      name: student.name,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      ageCategory,
      phone: student.user?.phone,
      email: student.user?.email,
      profilePhoto: student.profilePhoto,
      club: student.club,
      state: student.state?.name,
      district: student.district?.name,
      status: student.user?.isApproved ? 'APPROVED' : 'PENDING',
    },
    membership: {
      isApproved: student.user?.isApproved,
      isActive,
      expiryDate,
      daysUntilExpiry: isActive ? daysUntilExpiry : 0,
      needsRenewal: daysUntilExpiry <= 30 && daysUntilExpiry > 0,
    },
    eventRegistrations: eventRegistrations.map(reg => ({
      id: reg.id,
      event: reg.event,
      status: reg.status,
      paymentStatus: reg.paymentStatus,
      categories: (reg as any).categories || null,
      registeredAt: reg.createdAt,
    })),
    upcomingEvents,
    stats: {
      totalEventsRegistered: eventRegistrations.length,
      upcomingEventsCount: eventRegistrations.filter(
        r => new Date(r.event.eventDate) >= new Date()
      ).length,
      completedEventsCount: eventRegistrations.filter(
        r => new Date(r.event.eventDate) < new Date()
      ).length,
    },
  };
};

export default {
  getGlobalAdminDashboard,
  getStateSecretaryDashboard,
  getDistrictSecretaryDashboard,
  getClubOwnerDashboard,
  getStudentDashboard,
};
