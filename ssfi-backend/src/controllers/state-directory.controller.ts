import { Request, Response } from 'express';
import prisma from '../config/prisma';

/**
 * GET /api/v1/state-directory/:stateId
 * Public aggregate endpoint — returns state president/secretary info,
 * district breakdown with secretary info, and club/student counts.
 * Only names + photos are exposed (no phone/email/personal details).
 */
export const getStateDirectory = async (req: Request, res: Response) => {
  try {
    const stateId = parseInt(req.params.stateId, 10);
    if (isNaN(stateId)) {
      return res.status(400).json({ success: false, message: 'Invalid state ID' });
    }

    // Run all queries in parallel
    const [state, stateSecretary, districts] = await Promise.all([
      // 1. State details (includes president fields)
      prisma.state.findUnique({
        where: { id: stateId },
        select: {
          id: true,
          name: true,
          code: true,
          logo: true,
          presidentName: true,
          presidentPhoto: true,
        },
      }),

      // 2. Latest approved state secretary (name + photo + association name)
      prisma.stateSecretary.findFirst({
        where: { stateId, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        select: { name: true, profilePhoto: true, associationName: true },
      }),

      // 3. All districts with counts + district secretary info
      prisma.district.findMany({
        where: { stateId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: {
              clubs: { where: { status: 'APPROVED' } },
              students: { where: { user: { isApproved: true } } },
            },
          },
          districtSecretaries: {
            where: { status: 'APPROVED' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { name: true, profilePhoto: true },
          },
        },
      }),
    ]);

    if (!state) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }

    // Filter: only districts that have an approved secretary AND at least one registered skater
    const activeDistricts = districts.filter(
      (d) => d.districtSecretaries.length > 0 && d._count.students > 0
    );

    // Aggregate totals (from filtered districts only)
    const totalClubs = activeDistricts.reduce((sum, d) => sum + d._count.clubs, 0);
    const totalStudents = activeDistricts.reduce((sum, d) => sum + d._count.students, 0);

    res.json({
      success: true,
      data: {
        state: {
          id: state.id,
          name: state.name,
          code: state.code,
          logo: state.logo,
          presidentName: state.presidentName || null,
          presidentPhoto: state.presidentPhoto || null,
          secretaryName: stateSecretary?.name || null,
          secretaryPhoto: stateSecretary?.profilePhoto || null,
          associationName: stateSecretary?.associationName || null,
          totalDistricts: activeDistricts.length,
          totalClubs,
          totalStudents,
        },
        districts: activeDistricts.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          secretaryName: d.districtSecretaries[0]?.name || null,
          secretaryPhoto: d.districtSecretaries[0]?.profilePhoto || null,
          clubsCount: d._count.clubs,
          studentsCount: d._count.students,
        })),
      },
    });
  } catch (error) {
    console.error('State directory fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to load state directory' });
  }
};
