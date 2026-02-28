import { Request, Response } from 'express';
import { StatsService } from '../services/stats.service';
import { sendSuccess, sendError } from '../utils/response.util';

const statsService = new StatsService();

export class StatsController {
    async getPublicStats(req: Request, res: Response) {
        try {
            const stats = await statsService.getPublicStats();
            return sendSuccess(res, 200, 'Public stats fetched successfully', stats);
        } catch (error) {
            console.error('Stats controller error:', error);
            return sendError(res, 500, 'Failed to fetch statistics');
        }
    }
}
