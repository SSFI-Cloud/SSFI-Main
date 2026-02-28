
// @ts-nocheck
/**
 * Location Routes
 * Public endpoints for fetching states, districts, and clubs for registration forms
 */
import { Router, Request, Response } from 'express';
import { successResponse } from '../utils/response.util';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
import prisma from '../config/prisma';
/**
 * @route   GET /api/v1/locations/states
 * @desc    Get all states
 * @access  Public
 */
router.get('/states', asyncHandler(async (req: Request, res: Response) => {
    const states = await prisma.state.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            code: true,
        },
        orderBy: { name: 'asc' },
    });

    return successResponse(res, {
        message: 'States fetched successfully',
        data: states,
    });
}));

/**
 * @route   GET /api/v1/locations/states/:stateId/districts
 * @desc    Get all districts for a state
 * @access  Public
 */
router.get('/states/:stateId/districts', asyncHandler(async (req: Request, res: Response) => {
    const { stateId } = req.params;

    const districts = await prisma.district.findMany({
        where: { stateId: parseInt(stateId, 10) },
        select: {
            id: true,
            name: true,
            code: true,
            stateId: true,
        },
        orderBy: { name: 'asc' },
    });

    return successResponse(res, {
        message: 'Districts fetched successfully',
        data: districts,
    });
}));

/**
 * @route   GET /api/v1/locations/districts/:districtId/clubs
 * @desc    Get all clubs for a district
 * @access  Public
 */
router.get('/districts/:districtId/clubs', asyncHandler(async (req: Request, res: Response) => {
    const { districtId } = req.params;

    const clubs = await prisma.club.findMany({
        where: {
            districtId: parseInt(districtId, 10),
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            code: true,
            districtId: true,
        },
        orderBy: { name: 'asc' },
    });

    return successResponse(res, {
        message: 'Clubs fetched successfully',
        data: clubs,
    });
}));

/**
 * @route   GET /api/v1/locations/clubs
 * @desc    Search clubs with optional filters
 * @access  Public
 */
router.get('/clubs', asyncHandler(async (req: Request, res: Response) => {
    const { stateId, districtId, search } = req.query;

    const where: any = { isActive: true };

    if (districtId) {
        where.districtId = parseInt(districtId as string, 10);
    }

    if (stateId) {
        where.districts = { stateId: parseInt(stateId as string, 10) };
    }

    if (search) {
        where.name = { contains: search as string };
    }

    const clubs = await prisma.club.findMany({
        where,
        select: {
            id: true,
            name: true,
            code: true,
            districtId: true,
        },
        orderBy: { name: 'asc' },
        take: 50,
    });

    return successResponse(res, {
        message: 'Clubs fetched successfully',
        data: clubs,
    });
}));

export default router;
