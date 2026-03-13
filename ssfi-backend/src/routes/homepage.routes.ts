import { Router } from 'express';
import { getHomepageData } from '../controllers/homepage.controller';
import { cacheMiddleware } from '../utils/cache.util';

const router = Router();

// GET /api/v1/homepage — aggregate endpoint (all homepage data in one call)
router.get('/', cacheMiddleware(300), getHomepageData);

export default router;
