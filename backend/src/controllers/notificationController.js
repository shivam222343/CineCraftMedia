import {
  getNotificationsList,
  markNotificationsAsRead,
  approveAdminRequest,
  rejectAdminRequest,
} from '../services/notificationService.js';

export const getNotifications = (req, res) => {
  try {
    const data = getNotificationsList();
    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markRead = (req, res) => {
  try {
    const data = markNotificationsAsRead();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveRequest = async (req, res) => {
  try {
    const { id, email, idOrEmail } = req.body;
    const target = id || email || idOrEmail;
    if (!target) {
      return res.status(400).json({ success: false, message: 'Request id or email is required.' });
    }
    const result = await approveAdminRequest(target);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectRequest = (req, res) => {
  try {
    const { id, email, idOrEmail } = req.body;
    const target = id || email || idOrEmail;
    if (!target) {
      return res.status(400).json({ success: false, message: 'Request id or email is required.' });
    }
    const result = rejectAdminRequest(target);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
