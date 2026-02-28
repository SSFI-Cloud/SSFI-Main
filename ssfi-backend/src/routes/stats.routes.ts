import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { cacheMiddleware } from '../utils/cache.util';

const router = Router();
const statsController = new StatsController();

// Public stats endpoint with caching (5 minutes TTL)
router.get('/public', cacheMiddleware(300), statsController.getPublicStats);

export const statsRoutes = router;
