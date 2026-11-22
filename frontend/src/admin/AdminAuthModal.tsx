import React, { useState } from 'react';
import type { AdminUser } from './types';
import { apiAdminLogin } from './api';
import { CinecraftMediaLogo } from '../Components/Icons';

interface AdminAuthModalProps {
  isOpen: boolean;
  onSuccess: (user: AdminUser) => void;
  onClose?: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingApprovalNotice, setPendingApprovalNotice] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'pending_approval' || params.get('pending') === 'true') {
        return 'Your sign-in request has been sent to existing admins for live review. Once approved, you will be able to log in.';
      }
    }
    return null;
  });

  if (!isOpen) return null;

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setPendingApprovalNotice(null);

    try {
      const res = await apiAdminLogin(emailInput.trim());
      if (res.success && res.user) {
        onSuccess(res.user);
      } else if (res.pendingApproval) {
        setPendingApprovalNotice(res.message || 'Access request sent to existing admins. Please await approval in the notification panel.');
      } else {
        setErrorMessage(res.message || 'Access denied: Email is not authorized.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleOAuthRedirect = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="adm-modal-backdrop">
      <div className="adm-modal-panel" style={{ maxWidth: '440px', textAlign: 'center' }}>
        <div style={{ padding: '36px 28px' }}>
          {/* Brand Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <CinecraftMediaLogo height={44} />
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontFamily: 'var(--adm-font-display)', color: '#fff' }}>
            CineCraft Media
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#94a3b8' }}>
            Enterprise Management Console • Google OAuth 2.0 Protected
          </p>

          {pendingApprovalNotice && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#fbbf24',
                fontSize: '13px',
                lineHeight: 1.5,
                marginBottom: '18px',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⏳</span> Access Request Awaiting Approval
              </div>
              <div>{pendingApprovalNotice}</div>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '12.5px',
                marginBottom: '18px',
                textAlign: 'left',
              }}
            >
              ✕ {errorMessage}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            style={{
              width: '100%',
              padding: '12px 18px',
              justifyContent: 'center',
              background: '#ffffff',
              color: '#1f2937',
              borderColor: '#e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '20px',
              fontWeight: 600,
            }}
            onClick={handleGoogleOAuthRedirect}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google OAuth
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: '18px 0',
              color: '#64748b',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--adm-border)' }} />
            <span>OR AUTHORIZED DEV LOGIN</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--adm-border)' }} />
          </div>

          {/* Dev bypass login */}
          <form onSubmit={handleDevLogin}>
            <div className="adm-form-group" style={{ textAlign: 'left' }}>
              <label className="adm-form-label">Authorized Admin Email</label>
              <input
                type="email"
                className="adm-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@cinecraftmedia.com"
                required
              />
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                Must match ALLOWED_ADMIN_EMAILS in .env
              </div>
            </div>

            <button
              type="submit"
              className="adm-btn adm-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying RBAC...' : 'Authorize Admin Access'}
            </button>
          </form>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: '16px',
                background: 'none',
                border: 'none',
                color: '#8f9099',
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              Return to Public Website
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
