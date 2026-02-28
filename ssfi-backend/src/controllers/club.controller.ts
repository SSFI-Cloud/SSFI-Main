import { Request, Response, NextFunction } from 'express';
import * as clubService from '../services/club.service';
import * as affiliationService from '../services/affiliation.service';
import { clubRegistrationSchema } from '../validators/affiliation.validator';
import { AppError } from '../utils/errors';

export const getClub = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const club = await clubService.getClubById(Number(req.params.id));
        res.status(200).json({ status: 'success', data: { club } });
    } catch (error) {
        next(error);
    }
};

export const getClubs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await clubService.getAllClubs(req.query);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const updateClubStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const result = await clubService.updateClubStatus(Number(id), status, remarks);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const createClub = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await clubService.createClub(req.body);
        res.status(201).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const initiateRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activeWindow = await affiliationService.getActiveRegistrationWindow('CLUB');

        if (!activeWindow) {
            throw new AppError('No active registration window for Clubs', 400);
        }

        if (req.files && !Array.isArray(req.files)) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            if (files.clubLogo?.[0]) {
                req.body.clubLogo = files.clubLogo[0].path;
            }
        }

        console.log('Raw req.body:', JSON.stringify(req.body, null, 2));
        console.log('Raw districtId type:', typeof req.body.districtId);

        if (req.body.districtId) req.body.districtId = Number(req.body.districtId);
        if (req.body.stateId) req.body.stateId = Number(req.body.stateId);
        if (req.body.establishedYear) req.body.establishedYear = Number(req.body.establishedYear);

        const validData = clubRegistrationSchema.parse(req.body);
        console.log('Parsed validData:', JSON.stringify(validData, null, 2));
        console.log('Parsed districtId type:', typeof validData.districtId);

        const result = await affiliationService.initiateClubRegistration(validData, String(activeWindow.id));

        res.status(201).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await affiliationService.verifyClubPayment(req.body);

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};
