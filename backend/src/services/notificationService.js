import { User } from '../models/User.js';
import { getIsMongoConnected } from '../config/db.js';

// Load initial whitelist from .env
const initialAllowed = (process.env.ALLOWED_ADMIN_EMAILS || 'shivamdombe1@gmail.com,admin@cinecraftmedia.com,director@cinecraftmedia.com,shiva@cinecraftmedia.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const approvedEmailsSet = new Set(initialAllowed);

// In-Memory store for notifications & access requests
let notificationsStore = [
  {
    id: 'system-init-1',
    type: 'system',
    title: 'CineCraft Engine Online',
    message: 'High-performance API server and Redis store are operational.',
    email: 'system',
    name: 'System',
    avatar: '',
    status: 'info',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    read: true,
  },
];

export const isEmailApproved = (email) => {
  if (!email) return false;
  return approvedEmailsSet.has(email.toLowerCase().trim());
};

export const createAccessRequest = ({ email, name, avatar, source = 'login' }) => {
  const cleanEmail = email.toLowerCase().trim();

  // If already approved, return true
  if (approvedEmailsSet.has(cleanEmail)) {
    return { alreadyApproved: true };
  }

  // Check if a pending request already exists
  const existingIndex = notificationsStore.findIndex(
    (n) => n.type === 'access_request' && n.email === cleanEmail && n.status === 'pending'
  );

  if (existingIndex !== -1) {
    // Bump existing request to top with unread status
    notificationsStore[existingIndex].createdAt = new Date().toISOString();
    notificationsStore[existingIndex].read = false;
    return {
      alreadyApproved: false,
      pending: true,
      request: notificationsStore[existingIndex],
    };
  }

  const newRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'access_request',
    title: 'New Admin Access Request',
    message: `${name || cleanEmail} is requesting admin dashboard access.`,
    email: cleanEmail,
    name: name || cleanEmail.split('@')[0],
    avatar: avatar || '',
    source,
    status: 'pending',
    createdAt: new Date().toISOString(),
    read: false,
  };

  notificationsStore.unshift(newRequest);

  return {
    alreadyApproved: false,
    pending: true,
    request: newRequest,
  };
};

export const approveAdminRequest = async (idOrEmail) => {
  const reqItem = notificationsStore.find(
    (n) => n.id === idOrEmail || n.email === idOrEmail.toLowerCase().trim()
  );

  const targetEmail = reqItem ? reqItem.email : idOrEmail.toLowerCase().trim();
  approvedEmailsSet.add(targetEmail);

  if (reqItem) {
    reqItem.status = 'approved';
    reqItem.read = true;
    reqItem.approvedAt = new Date().toISOString();
  }

  // Also sync with MongoDB if connected
  if (getIsMongoConnected()) {
    try {
      await User.findOneAndUpdate(
        { email: targetEmail },
        {
          email: targetEmail,
          name: reqItem?.name || targetEmail.split('@')[0].toUpperCase(),
          role: 'admin',
          isActive: true,
          lastLogin: new Date(),
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.warn('[Notification Service] DB user update error:', err.message);
    }
  }

  return {
    success: true,
    email: targetEmail,
    message: `Access approved for ${targetEmail}. User can now sign in.`,
  };
};

export const rejectAdminRequest = (idOrEmail) => {
  const reqItem = notificationsStore.find(
    (n) => n.id === idOrEmail || n.email === idOrEmail.toLowerCase().trim()
  );

  const targetEmail = reqItem ? reqItem.email : idOrEmail.toLowerCase().trim();
  approvedEmailsSet.delete(targetEmail);

  if (reqItem) {
    reqItem.status = 'rejected';
    reqItem.read = true;
    reqItem.rejectedAt = new Date().toISOString();
  }

  return {
    success: true,
    email: targetEmail,
    message: `Access rejected for ${targetEmail}.`,
  };
};

export const getNotificationsList = () => {
  const unreadCount = notificationsStore.filter((n) => !n.read).length;
  return {
    notifications: notificationsStore,
    hasUnread: unreadCount > 0,
    unreadCount,
  };
};

export const markNotificationsAsRead = () => {
  notificationsStore.forEach((n) => {
    n.read = true;
  });
  return { success: true, hasUnread: false, unreadCount: 0 };
};
