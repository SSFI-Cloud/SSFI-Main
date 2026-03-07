import { Router } from 'express';
import { resultController } from '../controllers/result.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { cacheMiddleware } from '../utils/cache.util';

const router = Router();

// ─── PUBLIC ROUTES (no auth) ─────────────────────────────────────────────────
// These MUST be declared before the /:eventId routes to avoid param conflicts.

router.get('/public/recent', cacheMiddleware(600), resultController.getPublicRecentResults); // 10 min
router.get('/public/events', cacheMiddleware(600), resultController.getPublicAllEvents);     // 10 min
router.get('/public/event/:eventId', cacheMiddleware(300), resultController.getPublicEventResults);

// ─── ADMIN / ORGANISER ROUTES ─────────────────────────────────────────────────

router.get(
    '/:eventId/race-categories',
    authenticate,
    requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY', 'CLUB_OWNER'),
    resultController.getEventRaceCategories
);

router.get(
    '/:eventId/participants',
    authenticate,
    requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY', 'CLUB_OWNER'),
    resultController.getParticipantsForRace
);

router.post(
    '/:eventId/results',
    authenticate,
    requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY', 'CLUB_OWNER'),
    resultController.saveRaceResult
);

router.post(
    '/:eventId/publish',
    authenticate,
    requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY', 'CLUB_OWNER'),
    resultController.toggleResultPublication
);

export default router;
