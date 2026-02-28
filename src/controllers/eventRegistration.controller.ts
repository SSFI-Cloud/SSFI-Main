import { Request, Response } from 'express';
import eventRegistrationService from '../services/eventRegistration.service';
import {
    studentLookupSchema,
    eventRegistrationSchema,
    adminManualRegistrationSchema,
    SkateCategoryEnum,
} from '../validators/eventRegistration.validator';
import { AppError } from '../utils/errors';

export const lookupStudent = async (req: Request, res: Response, next: any) => {
    try {
        const data = studentLookupSchema.parse(req.body);
        const result = await eventRegistrationService.lookupStudentForEvent(data.uid, data.eventId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const getAvailableRaces = async (req: Request, res: Response, next: any) => {
    try {
        const { category, ageGroup } = req.query;
        if (!category || !ageGroup) throw new AppError('Category and age group required', 400);

        const result = eventRegistrationService.getAvailableRaces(category as string, ageGroup as string);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const createRegistration = async (req: Request, res: Response, next: any) => {
    try {
        const data = eventRegistrationSchema.parse(req.body);
        const registration = await eventRegistrationService.createEventRegistration(data);
        res.status(201).json({ status: 'success', data: registration });
    } catch (error: any) {
        // Handle Zod Validation Errors
        if (error.name === 'ZodError') {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: error.errors
            });
        }
        next(error);
    }
};

export const getRegistrations = async (req: Request, res: Response, next: any) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId || !userRole) {
            return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        }

        const result = await eventRegistrationService.getEventRegistrations(eventId, req.query, userId, userRole);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const exportRegistrations = async (req: Request, res: Response, next: any) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId || !userRole) {
            return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        }

        const csvData = await eventRegistrationService.exportRegistrations(eventId, userId, userRole);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=registrations-event-${eventId}.csv`);
        res.status(200).send(csvData);
    } catch (error) {
        next(error);
    }
};

export const createManualRegistration = async (req: Request, res: Response, next: any) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId || !userRole) {
            return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        }

        const data = adminManualRegistrationSchema.parse(req.body);
        const registration = await eventRegistrationService.createManualRegistration(data, userId, userRole);
        res.status(201).json({ status: 'success', data: registration });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: error.errors
            });
        }
        next(error);
    }
};

export const getMyRegistration = async (req: Request, res: Response, next: any) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        }

        const registration = await eventRegistrationService.getMyRegistration(Number(eventId), userId);
        res.status(200).json({ status: 'success', data: registration });
    } catch (error) {
        next(error);
    }
};

export default {
    lookupStudent,
    getAvailableRaces,
    createRegistration,
    getRegistrations,
    exportRegistrations,
    createManualRegistration,
    getMyRegistration
};
