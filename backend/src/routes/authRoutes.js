import { Router } from 'express';
import passport from 'passport';
import { googleCallback, getMe, devAdminLogin, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Google OAuth initiate
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

// Google OAuth callback with custom handler for pending approvals
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    if (err) {
      return res.redirect(`${clientUrl}/admin?error=${encodeURIComponent(err.message)}`);
    }
    if (!user) {
      if (info?.message === 'pending_approval') {
        return res.redirect(`${clientUrl}/admin?status=pending_approval`);
      }
      return res.redirect(`${clientUrl}/admin?error=google_auth_failed`);
    }
    req.user = user;
    googleCallback(req, res);
  })(req, res, next);
});

// Get authenticated admin info
router.get('/me', requireAuth, getMe);

// Dev/Testing Admin Login (Bypass when Google OAuth Client ID isn't live)
router.post('/dev-login', devAdminLogin);

// Logout
router.post('/logout', logout);

export default router;
