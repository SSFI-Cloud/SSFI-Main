import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response.util';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../types';

import prisma from '../config/prisma';
// ── PUBLIC ──────────────────────────────────────────────────────────────────

/** GET /team-members/public  — all active members ordered by displayOrder */
export const getPublicTeamMembers = asyncHandler(async (req: Request, res: Response) => {
  const showOnHome = req.query.showOnHome === 'true';

  const members = await prisma.teamMember.findMany({
    where: {
      isActive: true,
      ...(showOnHome ? { showOnHome: true } : {}),
    },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      name: true,
      role: true,
      bio: true,
      photo: true,
      email: true,
      linkedinUrl: true,
      displayOrder: true,
      showOnHome: true,
    },
  });

  return successResponse(res, { data: members });
});

// ── ADMIN ────────────────────────────────────────────────────────────────────

/** GET /team-members  — all members (admin) */
export const listTeamMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const members = await prisma.teamMember.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  return successResponse(res, { data: members });
});

/** GET /team-members/:id */
export const getTeamMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const member = await prisma.teamMember.findUnique({ where: { id: Number(req.params.id) } });
  if (!member) throw new AppError('Team member not found', 404);
  return successResponse(res, { data: member });
});

/** POST /team-members */
export const createTeamMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, role, bio, photo, email, linkedinUrl, displayOrder, showOnHome, isActive } = req.body;

  if (!name || !role) throw new AppError('Name and role are required', 400);

  const member = await prisma.teamMember.create({
    data: {
      name,
      role,
      bio: bio || null,
      photo: photo || null,
      email: email || null,
      linkedinUrl: linkedinUrl || null,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      showOnHome: showOnHome === true || showOnHome === 'true',
      isActive: isActive !== false && isActive !== 'false',
    },
  });

  return successResponse(res, { statusCode: 201, message: 'Team member created', data: member });
});

/** PUT /team-members/:id */
export const updateTeamMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) throw new AppError('Team member not found', 404);

  const { name, role, bio, photo, email, linkedinUrl, displayOrder, showOnHome, isActive } = req.body;

  const member = await prisma.teamMember.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(bio !== undefined && { bio }),
      ...(photo !== undefined && { photo }),
      ...(email !== undefined && { email }),
      ...(linkedinUrl !== undefined && { linkedinUrl }),
      ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
      ...(showOnHome !== undefined && { showOnHome: showOnHome === true || showOnHome === 'true' }),
      ...(isActive !== undefined && { isActive: isActive === true || isActive === 'true' }),
    },
  });

  return successResponse(res, { message: 'Team member updated', data: member });
});

/** DELETE /team-members/:id */
export const deleteTeamMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) throw new AppError('Team member not found', 404);

  await prisma.teamMember.delete({ where: { id } });
  return successResponse(res, { message: 'Team member deleted' });
});

/** PATCH /team-members/reorder — body: [{ id, displayOrder }] */
export const reorderTeamMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const items: { id: number; displayOrder: number }[] = req.body;
  if (!Array.isArray(items)) throw new AppError('Body must be an array of { id, displayOrder }', 400);

  await prisma.$transaction(
    items.map(item =>
      prisma.teamMember.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      })
    )
  );

  return successResponse(res, { message: 'Order updated' });
});
