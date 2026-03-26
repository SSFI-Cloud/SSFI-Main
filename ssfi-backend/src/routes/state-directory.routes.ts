import { Router } from 'express';
import { getStateDirectory } from '../controllers/state-directory.controller';
import { cacheMiddleware } from '../utils/cache.util';

const router = Router();

// GET /api/v1/state-directory/:stateId — public aggregate endpoint
router.get('/:stateId', cacheMiddleware(300), getStateDirectory);

export default router;
