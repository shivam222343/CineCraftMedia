import { Router } from 'express';
import { getDashboardOverview } from '../controllers/analyticsController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/admin/analytics/overview', requireAuth, requireAdmin, getDashboardOverview);

export default router;
