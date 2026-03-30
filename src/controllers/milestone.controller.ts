import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response.util';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../types';
import { deleteCachePattern } from '../utils/cache.util';

import prisma from '../config/prisma';
// Fixed icon set — 10 skating-relevant icons (Lucide icon names)
export const VALID_MILESTONE_ICONS = [
  'Flag',
  'Trophy',
  'MapPin',
  'Calendar',
  'Globe',
  'Star',
  'Rocket',
  'GraduationCap',
  'Flame',
  'Award',
] as const;

// ── PUBLIC ────────────────────────────────────────────────────────────────────

/** GET /milestones/public — all active milestones ordered by displayOrder */
export const getPublicMilestones = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const milestones = await prisma.milestone.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        year: true,
        title: true,
        description: true,
        icon: true,
        displayOrder: true,
      },
    });
    return successResponse(res, { data: milestones });
  } catch (error: any) {
    // Table may not exist yet — return empty array so frontend uses fallback
    console.error('milestones table error, returning empty:', error?.message);
    return successResponse(res, { data: [] });
  }
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

/** GET /milestones */
export const listMilestones = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const milestones = await prisma.milestone.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  return successResponse(res, { data: milestones });
});

/** GET /milestones/:id */
export const getMilestone = asyncHandler(async (req: AuthRequest, res: Response) => {
  const milestone = await prisma.milestone.findUnique({ where: { id: Number(req.params.id) } });
  if (!milestone) throw new AppError('Milestone not found', 404);
  return successResponse(res, { data: milestone });
});

/** POST /milestones */
export const createMilestone = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { year, title, description, icon, displayOrder, isActive } = req.body;

  if (!year || !title || !description) throw new AppError('year, title, and description are required', 400);
  if (icon && !VALID_MILESTONE_ICONS.includes(icon)) {
    throw new AppError(`Invalid icon. Must be one of: ${VALID_MILESTONE_ICONS.join(', ')}`, 400);
  }

  const milestone = await prisma.milestone.create({
    data: {
      year,
      title,
      description,
      icon: icon || 'Trophy',
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      isActive: isActive !== false && isActive !== 'false',
    },
  });

  deleteCachePattern('/milestones');
  return successResponse(res, { statusCode: 201, message: 'Milestone created', data: milestone });
});

/** PUT /milestones/:id */
export const updateMilestone = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.milestone.findUnique({ where: { id } });
  if (!existing) throw new AppError('Milestone not found', 404);

  const { year, title, description, icon, displayOrder, isActive } = req.body;

  if (icon && !VALID_MILESTONE_ICONS.includes(icon)) {
    throw new AppError(`Invalid icon. Must be one of: ${VALID_MILESTONE_ICONS.join(', ')}`, 400);
  }

  const milestone = await prisma.milestone.update({
    where: { id },
    data: {
      ...(year !== undefined && { year }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(icon !== undefined && { icon }),
      ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
      ...(isActive !== undefined && { isActive: isActive === true || isActive === 'true' }),
    },
  });

  deleteCachePattern('/milestones');
  return successResponse(res, { message: 'Milestone updated', data: milestone });
});

/** DELETE /milestones/:id */
export const deleteMilestone = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.milestone.findUnique({ where: { id } });
  if (!existing) throw new AppError('Milestone not found', 404);

  await prisma.milestone.delete({ where: { id } });
  deleteCachePattern('/milestones');
  return successResponse(res, { message: 'Milestone deleted' });
});

/** PATCH /milestones/reorder — body: [{ id, displayOrder }] */
export const reorderMilestones = asyncHandler(async (req: AuthRequest, res: Response) => {
  const items: { id: number; displayOrder: number }[] = req.body;
  if (!Array.isArray(items)) throw new AppError('Body must be an array of { id, displayOrder }', 400);

  await prisma.$transaction(
    items.map(item =>
      prisma.milestone.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      })
    )
  );

  deleteCachePattern('/milestones');
  return successResponse(res, { message: 'Order updated' });
});

/** GET /milestones/icons — return the fixed icon list */
export const getMilestoneIcons = asyncHandler(async (_req: Request, res: Response) => {
  return successResponse(res, { data: VALID_MILESTONE_ICONS });
});
