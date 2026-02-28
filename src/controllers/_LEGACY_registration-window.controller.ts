import { Request, Response, NextFunction } from 'express';
import * as windowService from '../services/registration-window.service';
import { AppError } from '../utils/errors';

export const createRegistrationWindow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, type, startDate, endDate } = req.body;
        if (!title || !type || !startDate || !endDate) {
            throw new AppError('Missing required fields', 400);
        }

        // Add creator ID from validated user
        const data = { ...req.body, createdBy: req.user?.id.toString() || 'admin' };

        const window = await windowService.createRegistrationWindow(data);
        res.status(201).json({
            status: 'success',
            data: { window }
        });
    } catch (error) {
        next(error);
    }
};

export const getAllRegistrationWindows = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await windowService.getAllRegistrationWindows(req.query);
        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getRegistrationWindow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const window = await windowService.getRegistrationWindowById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: { window }
        });
    } catch (error) {
        next(error);
    }
};

export const updateRegistrationWindow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const window = await windowService.updateRegistrationWindow(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: { window }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteRegistrationWindow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await windowService.deleteRegistrationWindow(req.params.id, req.user?.id.toString() || 'admin');
        res.status(200).json({
            status: 'success',
            message: 'Registration window deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
