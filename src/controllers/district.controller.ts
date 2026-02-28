import { Request, Response, NextFunction } from 'express';
import * as districtService from '../services/district.service';
import { AppError } from '../utils/errors';

export const getDistricts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await districtService.getAllDistricts(req.query);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getDistrict = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const district = await districtService.getDistrictById(Number(req.params.id));
        res.status(200).json({
            status: 'success',
            data: { district },
        });
    } catch (error) {
        next(error);
    }
};

export const createDistrict = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, code, stateId } = req.body;
        if (!name || !code || !stateId) {
            throw new AppError('Missing required fields: name, code, stateId', 400);
        }
        const district = await districtService.createDistrict({ name, code, stateId: Number(stateId) });
        res.status(201).json({
            status: 'success',
            data: { district },
        });
    } catch (error) {
        next(error);
    }
};

export const updateDistrict = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const district = await districtService.updateDistrict(Number(id), req.body);
        res.status(200).json({
            status: 'success',
            data: { district },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteDistrict = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await districtService.deleteDistrict(Number(id));
        res.status(200).json({
            status: 'success',
            message: 'District deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
