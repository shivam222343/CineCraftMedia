import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { getIsMongoConnected } from '../config/db.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.cinecraft_token) {
      token = req.cookies.cinecraft_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please sign in via Google OAuth.',
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_cinecraft_2026_change_in_production';
    const decoded = jwt.verify(token, jwtSecret);

    // Verify user still exists and is an authorized admin
    let user = null;
    if (getIsMongoConnected()) {
      try {
        user = await User.findById(decoded.id);
      } catch {
        user = decoded;
      }
    } else {
      user = decoded;
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    // Role-based access control (RBAC) check against ALLOWED_ADMIN_EMAILS
    const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowedEmails.length > 0 && !allowedEmails.includes(user.email.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Email ${user.email} is not authorized in ALLOWED_ADMIN_EMAILS.`,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.',
      error: error.message,
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Requires Admin privileges.',
    });
  }
  next();
};
