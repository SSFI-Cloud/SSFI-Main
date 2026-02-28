import { Router } from 'express';
import {
  getPublicMilestones,
  listMilestones,
  getMilestone,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  reorderMilestones,
  getMilestoneIcons,
} from '../controllers/milestone.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// ── Public ──────────────────────────────────────────────────────────────────
router.get('/public', getPublicMilestones);
router.get('/icons', getMilestoneIcons);

// ── Admin ────────────────────────────────────────────────────────────────────
router.use(authenticate, requireRole(UserRole.GLOBAL_ADMIN));

router.get('/', listMilestones);
router.post('/', createMilestone);
router.patch('/reorder', reorderMilestones);
router.get('/:id', getMilestone);
router.put('/:id', updateMilestone);
router.delete('/:id', deleteMilestone);

export default router;
