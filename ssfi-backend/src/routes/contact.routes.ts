import { Router } from 'express';
import {
  submitContactForm,
  listContactMessages,
  getContactMessage,
  markAsRead,
  deleteContactMessage,
} from '../controllers/contact.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// ── Public ──────────────────────────────────────────────────────────────────
// POST /api/v1/contact/submit
router.post('/submit', submitContactForm);

// ── Admin ────────────────────────────────────────────────────────────────────
router.use(authenticate, requireRole(UserRole.GLOBAL_ADMIN));

router.get('/messages', listContactMessages);
router.get('/messages/:id', getContactMessage);
router.patch('/messages/:id/read', markAsRead);
router.delete('/messages/:id', deleteContactMessage);

export default router;
