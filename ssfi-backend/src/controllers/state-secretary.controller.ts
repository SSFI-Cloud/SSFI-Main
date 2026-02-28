import { Request, Response, NextFunction } from 'express';
import * as service from '../services/state-secretary.service';
import * as affiliationService from '../services/affiliation.service';
import { stateSecretaryRegistrationSchema } from '../validators/affiliation.validator';
import { AppError } from '../utils/errors';

export const getStateSecretaries = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await service.listStateSecretaries(req.query);
        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const initiateRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activeWindow = await affiliationService.getActiveRegistrationWindow('STATE_SECRETARY');

        if (!activeWindow) {
            throw new AppError('No active registration window for State Secretary', 400);
        }

        if (req.files && !Array.isArray(req.files)) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            if (files.identityProof?.[0]) req.body.identityProof = files.identityProof[0].path;
            if (files.profilePhoto?.[0]) req.body.profilePhoto = files.profilePhoto[0].path;
        }

        // Manual casting
        if (req.body.stateId) req.body.stateId = Number(req.body.stateId);
        if (req.body.districtId) req.body.districtId = Number(req.body.districtId); // If applicable

        const validData = stateSecretaryRegistrationSchema.parse(req.body);
        const result = await affiliationService.initiateStateSecretaryRegistration(validData, String(activeWindow.id));

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
        const result = await affiliationService.verifyStateSecretaryPayment(req.body);

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const userId = req.user?.id.toString() || 'admin';

        const result = await service.updateStateSecretaryStatus(id, status, userId, remarks);
        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};
