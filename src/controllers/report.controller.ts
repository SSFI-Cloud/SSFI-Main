import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await reportService.getDashboardStats();
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
};

export const getPaymentStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await reportService.getPaymentStats();
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
};
