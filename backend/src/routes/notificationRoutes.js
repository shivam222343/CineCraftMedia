import { Router } from 'express';
import {
  getNotifications,
  markRead,
  approveRequest,
  rejectRequest,
} from '../controllers/notificationController.js';

const router = Router();

router.get('/notifications', getNotifications);
router.post('/notifications/mark-read', markRead);
router.post('/notifications/approve', approveRequest);
router.post('/notifications/reject', rejectRequest);

export default router;
