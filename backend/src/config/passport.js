import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';
import { getIsMongoConnected } from './db.js';
import { isEmailApproved, createAccessRequest } from '../services/notificationService.js';

export const configurePassport = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  if (!clientID || !clientSecret || clientID.includes('your_google_client_id')) {
    console.warn('[Auth Warning] Google OAuth Client ID or Secret not configured in .env. Admin bypass/dev auth available.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(null, false, { message: 'No email found in Google profile.' });
          }

          // Check if admin is approved
          if (!isEmailApproved(email)) {
            // Register access request for existing admins to review & approve
            createAccessRequest({
              email,
              name: profile.displayName || email.split('@')[0],
              avatar: profile.photos?.[0]?.value || '',
              source: 'google_oauth',
            });

            return done(null, false, {
              message: 'pending_approval',
              email,
              name: profile.displayName || email.split('@')[0],
            });
          }

          let user = null;

          // Attempt DB operation only if MongoDB is connected and ready
          if (getIsMongoConnected()) {
            try {
              user = await User.findOne({ googleId: profile.id });
              if (!user) {
                user = await User.findOne({ email });
              }

              if (user) {
                user.googleId = profile.id;
                user.name = profile.displayName || user.name;
                user.avatar = profile.photos?.[0]?.value || user.avatar;
                user.lastLogin = new Date();
                user.role = 'admin';
                await user.save();
              } else {
                user = await User.create({
                  googleId: profile.id,
                  email,
                  name: profile.displayName || 'Admin User',
                  avatar: profile.photos?.[0]?.value || '',
                  role: 'admin',
                  lastLogin: new Date(),
                });
              }
            } catch (dbErr) {
              console.warn('[Passport] DB write error, using fallback:', dbErr.message);
            }
          }

          // In-memory fallback if MongoDB is offline or query failed
          if (!user) {
            user = {
              _id: `google-${profile.id}`,
              id: `google-${profile.id}`,
              googleId: profile.id,
              email,
              name: profile.displayName || email.split('@')[0],
              avatar: profile.photos?.[0]?.value || '',
              role: 'admin',
              lastLogin: new Date(),
            };
          }

          return done(null, user);
        } catch (err) {
          console.error('[Passport Strategy Error]:', err.message);
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id || user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      if (getIsMongoConnected()) {
        const user = await User.findById(id);
        if (user) return done(null, user);
      }
      return done(null, { id, _id: id, name: 'Admin', role: 'admin' });
    } catch {
      done(null, { id, _id: id, name: 'Admin', role: 'admin' });
    }
  });
};
