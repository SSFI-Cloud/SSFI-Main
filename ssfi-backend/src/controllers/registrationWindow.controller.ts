// Registration Windows Controller
import { Request, Response } from 'express';
import * as registrationWindowService from '../services/registrationWindow.service';
import { RegistrationType } from '../services/registrationWindow.service';
import { AuthRequest } from '../types';

/**
 * Map frontend lowercase types to DB uppercase types
 */
const typeMap: Record<string, RegistrationType> = {
    student: 'STUDENT',
    club: 'CLUB',
    state: 'STATE_SECRETARY',
    district: 'DISTRICT_SECRETARY',
};

/** Reverse map: DB uppercase type → frontend lowercase key */
const reverseTypeMap: Record<string, string> = {
    STUDENT: 'student',
    CLUB: 'club',
    STATE_SECRETARY: 'state',
    DISTRICT_SECRETARY: 'district',
};

/**
 * Get all active registration windows (public)
 * GET /api/registration-windows/active
 */
export async function getActiveWindows(req: Request, res: Response) {
    try {
        const windows = await registrationWindowService.getActiveWindows();

        const mappedWindows = windows.map((w) => ({
            id: w.id,
            type: w.type,
            name: w.title,
            description: w.description,
            startDate: w.startDate,
            endDate: w.endDate,
            lateFeeStart: w.lateFeeStart,
            lateFeeAmount: w.lateFeeAmount,
            baseFee: w.baseFee,
            isActive: w.isActive,
            registrationsCount: w.registrationsCount,
            maxRegistrations: w.maxRegistrations,
        }));

        // Also include active coach certification programs
        try {
            const coachCertService = (await import('../services/coach-cert.service')).default;
            const coachWindows = await coachCertService.getActiveProgramsForWindows();
            mappedWindows.push(...coachWindows as any);
        } catch (e) {
            // Coach cert table may not exist yet during migration — silently skip
        }

        // Also include active beginner certification programs
        try {
            const beginnerCertService = (await import('../services/beginner-cert.service')).default;
            const beginnerWindows = await beginnerCertService.getActiveProgramsForWindows();
            mappedWindows.push(...beginnerWindows as any);
        } catch (e) {
            // Beginner cert table may not exist yet during migration — silently skip
        }

        return res.status(200).json({
            success: true,
            data: mappedWindows,
        });
    } catch (error: any) {
        console.error('Get active windows error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch active registration windows',
        });
    }
}

/**
 * Get active window for specific type (public)
 * GET /api/registration-windows/active/:type
 */
export async function getActiveWindowByType(req: Request, res: Response) {
    try {
        const { type } = req.params;

        if (!typeMap[type]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid registration type',
            });
        }

        const dbType = typeMap[type];

        const window = await registrationWindowService.getActiveWindowByType(dbType);

        if (!window) {
            return res.status(404).json({
                success: false,
                message: `No active registration window found for ${type}`,
            });
        }

        return res.status(200).json({
            success: true,
            data: window,
        });
    } catch (error: any) {
        console.error('Get active window by type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch registration window',
        });
    }
}

/**
 * Check if registration is allowed
 * GET /api/registration-windows/:id/can-register
 */
export async function canRegister(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const result = await registrationWindowService.canRegister(parseInt(id));

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error('Can register check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check registration status',
        });
    }
}

/**
 * Get all registration windows (admin)
 * GET /api/registration-windows
 */
export async function getAllWindows(req: AuthRequest, res: Response) {
    try {
        const { type, isActive, page, limit } = req.query;

        // Map frontend lowercase type to DB uppercase type
        const mappedType = type ? (typeMap[type as string] || type) as RegistrationType : undefined;

        const filters = {
            type: mappedType,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 20,
        };

        const result = await registrationWindowService.getAllWindows(filters);

        return res.status(200).json({
            status: 'success',
            success: true,
            data: {
                windows: result.windows,
                meta: {
                    total: result.total,
                    page: filters.page,
                    limit: filters.limit,
                    totalPages: Math.ceil(result.total / filters.limit),
                },
            },
        });
    } catch (error: any) {
        console.error('Get all windows error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch registration windows',
        });
    }
}

/**
 * Get single registration window (admin)
 * GET /api/registration-windows/:id
 */
export async function getWindowById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const window = await registrationWindowService.getWindowById(parseInt(id));

        if (!window) {
            return res.status(404).json({
                success: false,
                message: 'Registration window not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: window,
        });
    } catch (error: any) {
        console.error('Get window by id error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch registration window',
        });
    }
}

/**
 * Create a new registration window (admin only)
 * POST /api/registration-windows
 */
export async function createWindow(req: AuthRequest, res: Response) {
    try {
        const {
            type,
            name,
            description,
            startDate,
            endDate,
            lateFeeStart,
            lateFeeAmount,
            baseFee,
            maxRegistrations,
        } = req.body;

        // Validate required fields
        if (!type || !name || !startDate || !endDate || baseFee === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: type, name, startDate, endDate, baseFee',
            });
        }

        // Validate and map type (frontend sends lowercase, DB stores uppercase)
        const dbType = typeMap[type];
        if (!dbType) {
            return res.status(400).json({
                success: false,
                message: 'Invalid registration type. Must be: student, club, state, or district',
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const lateStart = lateFeeStart ? new Date(lateFeeStart) : undefined;

        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date',
            });
        }

        if (lateStart && (lateStart <= start || lateStart >= end)) {
            return res.status(400).json({
                success: false,
                message: 'Late fee start date must be between start and end dates',
            });
        }

        const window = await registrationWindowService.createWindow({
            type: dbType,
            name,
            description,
            startDate: start,
            endDate: end,
            lateFeeStart: lateStart,
            lateFeeAmount: lateFeeAmount || 0,
            baseFee,
            maxRegistrations,
            createdBy: req.user?.id ? req.user.id.toString() : '1',
        });

        return res.status(201).json({
            success: true,
            message: 'Registration window created successfully',
            data: window,
        });
    } catch (error: any) {
        console.error('Create window error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to create registration window',
        });
    }
}

/**
 * Update a registration window (admin only)
 * PUT /api/registration-windows/:id
 */
export async function updateWindow(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            startDate,
            endDate,
            lateFeeStart,
            lateFeeAmount,
            baseFee,
            maxRegistrations,
        } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);
        if (lateFeeStart) updateData.lateFeeStart = new Date(lateFeeStart);
        if (lateFeeAmount !== undefined) updateData.lateFeeAmount = lateFeeAmount;
        if (baseFee !== undefined) updateData.baseFee = baseFee;
        if (maxRegistrations !== undefined) updateData.maxRegistrations = maxRegistrations;

        const window = await registrationWindowService.updateWindow(parseInt(id), updateData);

        return res.status(200).json({
            success: true,
            message: 'Registration window updated successfully',
            data: window,
        });
    } catch (error: any) {
        console.error('Update window error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to update registration window',
        });
    }
}

/**
 * Toggle pause/resume a registration window (admin only)
 * POST /api/registration-windows/:id/toggle-pause
 */
export async function togglePause(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        const window = await registrationWindowService.togglePause(parseInt(id));

        return res.status(200).json({
            success: true,
            message: `Registration window ${window.isPaused ? 'paused' : 'resumed'} successfully`,
            data: window,
        });
    } catch (error: any) {
        console.error('Toggle pause error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to toggle registration window status',
        });
    }
}

/**
 * Toggle renewal enabled/disabled on a registration window (admin only)
 * POST /api/registration-windows/:id/toggle-renewal
 */
export async function toggleRenewal(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const window = await registrationWindowService.toggleRenewal(parseInt(id));
        return res.status(200).json({
            success: true,
            message: `Renewal ${(window as any).renewalEnabled ? 'enabled' : 'disabled'} successfully`,
            data: window,
        });
    } catch (error: any) {
        console.error('Toggle renewal error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to toggle renewal status',
        });
    }
}

/**
 * Check if renewal is currently enabled (public, authenticated)
 * GET /api/registration-windows/renewal-status
 */
export async function getRenewalStatus(req: Request, res: Response) {
    try {
        const { type } = req.query;
        // Map frontend lowercase type to DB uppercase type if provided
        const dbType = type ? (typeMap[type as string] || type) as RegistrationType : undefined;
        const enabled = await registrationWindowService.isRenewalEnabled(dbType);
        return res.status(200).json({
            success: true,
            data: { renewalEnabled: enabled },
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Failed to check renewal status',
        });
    }
}

/**
 * Delete a registration window (admin only)
 * DELETE /api/registration-windows/:id
 */
export async function deleteWindow(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        await registrationWindowService.deleteWindow(parseInt(id));

        return res.status(200).json({
            success: true,
            message: 'Registration window deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete window error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to delete registration window',
        });
    }
}
