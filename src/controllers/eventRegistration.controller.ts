import { Request, Response } from 'express';
import eventRegistrationService from '../services/eventRegistration.service';
import {
    studentLookupSchema,
    eventRegistrationSchema,
    adminManualRegistrationSchema,
    SkateCategoryEnum,
} from '../validators/eventRegistration.validator';
import { AppError } from '../utils/errors';
import prisma from '../config/prisma';

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
        const { category, ageGroup, eventId } = req.query;
        if (!category || !ageGroup) throw new AppError('Category and age group required', 400);

        const result = await eventRegistrationService.getAvailableRaces(
            category as string,
            ageGroup as string,
            eventId ? Number(eventId) : undefined
        );
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const getEventCategories = async (req: Request, res: Response, next: any) => {
    try {
        const eventId = Number(req.params.eventId);
        if (!eventId) throw new AppError('Event ID is required', 400);

        const categories = await eventRegistrationService.getEventCategories(eventId);
        res.status(200).json({ status: 'success', data: categories });
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

export const updatePaymentStatus = async (req: Request, res: Response, next: any) => {
    try {
        const registrationId = Number(req.params.registrationId);
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { paymentStatus } = req.body;

        if (!userId || !userRole) {
            return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
        }

        if (!['PAID', 'PENDING'].includes(paymentStatus)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid payment status. Must be PAID or PENDING.' });
        }

        // Find registration with event
        const registration = await prisma.eventRegistration.findUnique({
            where: { id: registrationId },
            include: { event: { select: { creatorId: true, paymentMode: true } } },
        });

        if (!registration) {
            return res.status(404).json({ status: 'fail', message: 'Registration not found' });
        }

        // Only event creator or GLOBAL_ADMIN can update
        if (userRole !== 'GLOBAL_ADMIN' && registration.event.creatorId !== userId) {
            return res.status(403).json({ status: 'fail', message: 'Not authorized to update this registration' });
        }

        // Update payment status
        const updated = await prisma.eventRegistration.update({
            where: { id: registrationId },
            data: {
                paymentStatus,
                amountPaid: paymentStatus === 'PAID' ? registration.totalFee : 0,
            },
        });

        res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        next(error);
    }
};

export default {
    lookupStudent,
    getAvailableRaces,
    getEventCategories,
    createRegistration,
    getRegistrations,
    exportRegistrations,
    createManualRegistration,
    getMyRegistration,
    updatePaymentStatus
};
