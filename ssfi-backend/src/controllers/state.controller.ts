import { Request, Response, NextFunction } from 'express';
import * as stateService from '../services/state.service';
import { AppError } from '../utils/errors';

export const getStates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await stateService.getAllStates(req.query);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getState = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const state = await stateService.getStateById(Number(req.params.id));
        res.status(200).json({
            status: 'success',
            data: { state },
        });
    } catch (error) {
        next(error);
    }
};

export const createState = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // If stateId is provided, register secretary for existing state (admin offline mode)
        if (req.body.stateId && req.body.secretaryName) {
            const result = await stateService.registerSecretaryForState(req.body);
            return res.status(201).json({
                status: 'success',
                data: result,
            });
        }

        // Standard: create new state
        const state = await stateService.createState(req.body);
        res.status(201).json({
            status: 'success',
            data: { state },
        });
    } catch (error) {
        next(error);
    }
};

export const updateState = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const state = await stateService.updateState(Number(req.params.id), req.body);
        res.status(200).json({
            status: 'success',
            data: { state },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteState = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await stateService.deleteState(Number(req.params.id));
        res.status(200).json({
            status: 'success',
            message: 'State deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
