import { Router } from 'express';
import {
  createPublicLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  addLeadNote,
} from '../controllers/leadController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public Contact Form ingestion
router.post('/v1/contact', createPublicLead);

// Protected Admin Lead Management
router.get('/admin/leads', requireAuth, requireAdmin, getLeads);
router.get('/admin/leads/:id', requireAuth, requireAdmin, getLeadById);
router.patch('/admin/leads/:id/status', requireAuth, requireAdmin, updateLeadStatus);
router.post('/admin/leads/:id/notes', requireAuth, requireAdmin, addLeadNote);

export default router;
