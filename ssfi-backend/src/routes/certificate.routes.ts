import { Router } from 'express';
import { certificateController } from '../controllers/certificate.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// ── Student routes ────────────────────────────────────────────────────────────
router.get('/my', authenticate, certificateController.getMyCertificates);
router.get('/:id/download', authenticate, certificateController.downloadCertificate);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get(
  '/:id/preview',
  authenticate,
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY'),
  certificateController.previewCertificate,
);

router.post(
  '/issue/event/:eventId',
  authenticate,
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY'),
  certificateController.issueCertificates,
);

router.get(
  '/event/:eventId',
  authenticate,
  requireRole('GLOBAL_ADMIN', 'STATE_SECRETARY', 'DISTRICT_SECRETARY'),
  certificateController.getEventCertificates,
);

// ── Public verification ────────────────────────────────────────────────────────
router.get('/verify/:certNumber', certificateController.verifyCertificate);

export default router;
