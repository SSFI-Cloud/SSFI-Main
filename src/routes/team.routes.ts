import { Router } from 'express';
import {
  getPublicTeamMembers,
  listTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeamMembers,
} from '../controllers/team.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { cacheMiddleware } from '../utils/cache.util';

const router = Router();

// ── Public ──────────────────────────────────────────────────────────────────
// GET /api/v1/team-members/public?showOnHome=true
router.get('/public', cacheMiddleware(600), getPublicTeamMembers); // 10 min cache

// ── Admin (GLOBAL_ADMIN only) ────────────────────────────────────────────────
router.use(authenticate, requireRole(UserRole.GLOBAL_ADMIN));

router.get('/', listTeamMembers);
router.post('/', createTeamMember);
router.patch('/reorder', reorderTeamMembers);
router.get('/:id', getTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

export default router;
