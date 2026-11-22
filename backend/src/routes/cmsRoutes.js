import { Router } from 'express';
import {
  getPublicTheme,
  getPublicContent,
  getAdminSettings,
  updateTheme,
  updateContent,
  uploadAsset,
  deleteAsset,
} from '../controllers/cmsController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Public cached endpoints
router.get('/v1/theme', getPublicTheme);
router.get('/v1/content', getPublicContent);

// Protected Admin CMS endpoints
router.get('/admin/cms', requireAuth, requireAdmin, getAdminSettings);
router.put('/admin/cms/theme', requireAuth, requireAdmin, updateTheme);
router.put('/admin/cms/content', requireAuth, requireAdmin, updateContent);
router.post('/admin/cms/upload', requireAuth, requireAdmin, upload.single('asset'), uploadAsset);
router.delete('/admin/cms/assets/:id', requireAuth, requireAdmin, deleteAsset);

export default router;
