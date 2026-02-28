import express from 'express';
import * as districtController from '../controllers/district.controller';
import { authenticate as protect, requireRole as restrictTo } from '../middleware/auth.middleware';
import { injectScopeFilters } from '../middleware/scope.middleware';
import { cacheMiddleware } from '../utils/cache.util';

const router = express.Router();

// Public routes with caching (1 hour TTL)
router.get('/public', cacheMiddleware(3600), districtController.getDistricts);
router.get('/public/:id', cacheMiddleware(3600), districtController.getDistrict);

// Protected routes with scope filtering
router.use(protect);

// GET all districts - scoped by user's role
router.get('/', injectScopeFilters, districtController.getDistricts);
router.get('/:id', districtController.getDistrict);

router.post('/', restrictTo('GLOBAL_ADMIN', 'STATE_SECRETARY'), districtController.createDistrict);

router
    .route('/:id')
    .put(restrictTo('GLOBAL_ADMIN', 'STATE_SECRETARY'), districtController.updateDistrict)
    .delete(restrictTo('GLOBAL_ADMIN'), districtController.deleteDistrict);

export default router;

