import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { getIsMongoConnected } from '../config/db.js';
import {
  isEmailApproved,
  createAccessRequest,
  getAccessRequestStatus,
} from '../services/notificationService.js';

const signToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_cinecraft_2026_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'admin',
    },
    jwtSecret,
    { expiresIn }
  );
};

export const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/admin?error=auth_failed`);
    }

    const token = signToken(user);

    // Set HTTP-Only Cookie
    res.cookie('cinecraft_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect back to Admin Dashboard with token param for cross-origin local dev
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/admin?token=${token}`);
  } catch (error) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/admin?error=${encodeURIComponent(error.message)}`);
  }
};

export const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id || req.user.id,
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.avatar,
        role: req.user.role,
        lastLogin: req.user.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const devAdminLogin = async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = (email || '').toLowerCase().trim();

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an admin email.',
      });
    }

    // Check if email is already approved by existing admins
    if (!isEmailApproved(targetEmail)) {
      // Register pending admin access request for existing admin approval
      createAccessRequest({
        email: targetEmail,
        name: targetEmail.split('@')[0],
        source: 'email_login',
      });

      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: `Access request submitted for ${targetEmail}. An existing admin must approve your request in the notification center before you can sign in.`,
      });
    }

    let user = null;
    if (getIsMongoConnected()) {
      try {
        user = await User.findOne({ email: targetEmail });
        if (!user) {
          user = await User.create({
            email: targetEmail,
            name: targetEmail.split('@')[0].toUpperCase(),
            role: 'admin',
            avatar: '',
            lastLogin: new Date(),
          });
        }
      } catch (dbErr) {
        console.warn('[Dev Login DB error]:', dbErr.message);
      }
    }

    if (!user) {
      // In-memory fallback if MongoDB connection is pending or offline
      user = {
        _id: '67c134000000000000000001',
        email: targetEmail,
        name: targetEmail.split('@')[0].toUpperCase(),
        role: 'admin',
        avatar: '',
      };
    }

    const token = signToken(user);

    res.cookie('cinecraft_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie('cinecraft_token');
  res.json({ success: true, message: 'Logged out successfully.' });
};

export const requestAccess = async (req, res) => {
  try {
    const { email, name, message } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required to submit an access request.',
      });
    }

    if (isEmailApproved(cleanEmail)) {
      let user = {
        id: `user-${cleanEmail}`,
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0].toUpperCase(),
        role: 'admin',
        avatar: '',
      };
      const token = signToken(user);
      return res.json({
        success: true,
        status: 'approved',
        token,
        user,
        message: 'This email is already an authorized administrator.',
      });
    }

    const result = createAccessRequest({
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      source: 'portal_request',
    });

    res.json({
      success: true,
      status: 'pending',
      pendingApproval: true,
      message: 'Access request submitted to existing admins. Please await live approval.',
      request: result.request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkRequestStatus = async (req, res) => {
  try {
    const email = req.query.email;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required.',
      });
    }

    const result = getAccessRequestStatus(cleanEmail);

    let token = null;
    let user = null;

    if (result.status === 'approved' || isEmailApproved(cleanEmail)) {
      user = {
        id: `user-${cleanEmail}`,
        email: cleanEmail,
        name: result.request?.name || cleanEmail.split('@')[0].toUpperCase(),
        role: 'admin',
        avatar: result.request?.avatar || '',
      };
      token = signToken(user);
    }

    res.json({
      success: true,
      status: result.status,
      token,
      user,
      request: result.request || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
