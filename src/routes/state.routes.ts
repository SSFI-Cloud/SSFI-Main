import express from 'express';
import * as stateController from '../controllers/state.controller';
import { authenticate as protect, requireRole as restrictTo } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { cacheMiddleware } from '../utils/cache.util';

const router = express.Router();

// Public routes with caching (1 hour TTL)
router.get('/', cacheMiddleware(3600), stateController.getStates);
router.get('/:id', cacheMiddleware(3600), stateController.getState);

// Protected routes
router.use(protect);
router.post('/', restrictTo(UserRole.GLOBAL_ADMIN), stateController.createState);
router.put('/:id', restrictTo(UserRole.GLOBAL_ADMIN), stateController.updateState);
router.delete('/:id', restrictTo(UserRole.GLOBAL_ADMIN), stateController.deleteState);

export default router;
