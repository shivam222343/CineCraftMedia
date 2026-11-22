import React, { useState, useEffect } from 'react';
import type { AdminUser } from './types';
import { apiAdminLogin, apiSubmitAccessRequest, API_BASE } from './api';
import { CinecraftMediaLogo } from '../Components/Icons';
import { AdminRequestStatusView } from './AdminRequestStatusView';

interface AdminAuthModalProps {
  isOpen: boolean;
  onSuccess: (user: AdminUser) => void;
  onClose?: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'request'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track pending request email for live status tracking via WebSocket
  const [pendingEmail, setPendingEmail] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('ccm_pending_request_email');
      if (stored) return stored;
      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'pending_approval' || params.get('pending') === 'true') {
        return params.get('email') || 'candidate-pending';
      }
    }
    return null;
  });

  // Ensure browser URL displays /admin/login when viewing the auth screen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.location.pathname.startsWith('/admin/login')) {
        const search = window.location.search;
        window.history.replaceState({}, '', `/admin/login${search}`);
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get('error')) {
        setErrorMessage('Authentication declined or Google session expired. Please try again.');
      }
      if (params.get('status') === 'pending_approval' && params.get('email')) {
        const email = params.get('email')!;
        sessionStorage.setItem('ccm_pending_request_email', email);
        setPendingEmail(email);
      }
    }
  }, []);

  if (!isOpen) return null;

  // If a request is actively pending review, show the live socket status page
  if (pendingEmail) {
    return (
      <AdminRequestStatusView
        email={pendingEmail}
        onApproved={(user) => {
          sessionStorage.removeItem('ccm_pending_request_email');
          setPendingEmail(null);
          onSuccess(user);
        }}
        onCancel={() => {
          sessionStorage.removeItem('ccm_pending_request_email');
          setPendingEmail(null);
          setErrorMessage(null);
        }}
        onBackToPublicSite={onClose || (() => { window.location.href = '/'; })}
      />
    );
  }

  // Handle Admin Sign In (Email + Password)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) return;

    if (!passwordInput) {
      setErrorMessage('Please enter your admin password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiAdminLogin(cleanEmail, passwordInput);
      if (res.success && res.user) {
        sessionStorage.removeItem('ccm_pending_request_email');
        onSuccess(res.user);
      } else if (res.pendingApproval) {
        // User is not yet approved -> switch to live socket status view!
        sessionStorage.setItem('ccm_pending_request_email', cleanEmail);
        setPendingEmail(cleanEmail);
      } else {
        setErrorMessage(res.message || 'Access denied: Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle New Admin Access Request
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiSubmitAccessRequest(cleanEmail, nameInput.trim());
      if (res.success && res.status === 'approved' && res.user) {
        sessionStorage.removeItem('ccm_pending_request_email');
        onSuccess(res.user);
      } else if (res.success && (res.status === 'pending' || res.pendingApproval)) {
        // Switch to live socket status view!
        sessionStorage.setItem('ccm_pending_request_email', cleanEmail);
        setPendingEmail(cleanEmail);
      } else {
        setErrorMessage(res.message || 'Failed to submit request.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Request submission failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleOAuthRedirect = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="adm-modal-backdrop" style={{ zIndex: 1100, overflow: 'hidden' }}>
      <div
        className="adm-modal-panel adm-auth-modal-panel"
        style={{
          maxWidth: '430px',
          width: '100%',
          maxHeight: 'none',
          overflow: 'hidden',
          textAlign: 'center',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
          background: 'var(--adm-surface)',
          border: '1px solid var(--adm-border)',
        }}
      >
        <div style={{ padding: '22px 26px' }}>
          {/* Brand Logo & Public-Matched Typography */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <CinecraftMediaLogo height={34} />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px', marginBottom: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-script, "Scribo", cursive, sans-serif)',
                fontSize: '22px',
                color: '#ff5121',
                fontWeight: 400,
              }}
            >
              Cine
            </span>
            <span
              style={{
                fontFamily: 'var(--font-heading, "Owners Wide", sans-serif)',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--swatch--light, #fcf2bd)',
                textTransform: 'lowercase',
              }}
            >
              craft
            </span>
          </div>

          <h2
            style={{
              margin: '0 0 2px',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.4px',
              color: 'var(--adm-text)',
            }}
          >
            {authMode === 'signin' ? 'Admin Portal Authorization' : 'Request Portal Access'}
          </h2>

          <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'var(--adm-text-muted)', lineHeight: '1.35' }}>
            {authMode === 'signin'
              ? 'Authorized Personnel Only • Google OAuth & Password Protected'
              : 'Submit your credentials to active admins for live approval.'}
          </p>

          {errorMessage && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: '12px',
                marginBottom: '12px',
                textAlign: 'left',
                lineHeight: '1.35',
              }}
            >
              ✕ {errorMessage}
            </div>
          )}

          {authMode === 'signin' ? (
            <>
              {/* Google OAuth Button */}
              <button
                type="button"
                className="adm-btn adm-btn-secondary"
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  justifyContent: 'center',
                  background: '#ffffff',
                  color: '#1f2937',
                  borderColor: '#e5e7eb',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  marginBottom: '10px',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
                onClick={handleGoogleOAuthRedirect}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: '8px', flexShrink: 0 }}>
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
                  gap: '8px',
                  margin: '10px 0',
                  color: 'var(--adm-text-subtle)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                <div style={{ flex: 1, height: '1px', background: 'var(--adm-border)' }} />
                <span>OR EMAIL & PASSWORD</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--adm-border)' }} />
              </div>

              {/* Email + Password Login Form */}
              <form onSubmit={handleSignIn}>
                <div className="adm-form-group" style={{ textAlign: 'left', marginBottom: '9px' }}>
                  <label className="adm-form-label" style={{ fontSize: '11.5px', marginBottom: '4px' }}>Authorized Admin Email</label>
                  <input
                    type="email"
                    className="adm-input"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="admin@cinecraftmedia.com"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    required
                  />
                </div>

                <div className="adm-form-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="adm-form-label" style={{ margin: 0, fontSize: '11.5px' }}>Admin Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--adm-primary)',
                        fontSize: '10.5px',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="adm-input"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter admin password"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    required
                  />
                  <div style={{ fontSize: '10px', color: 'var(--adm-text-subtle)', marginTop: '3px' }}>
                    Default initial password: <code>Admin@12345</code>
                  </div>
                </div>

                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '9.5px', fontSize: '13px' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Verifying RBAC...' : 'Sign In to Admin Portal'}
                </button>
              </form>

              {/* Option to request access */}
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--adm-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--adm-text-muted)' }}>
                  New administrator candidate?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('request');
                    setErrorMessage(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--adm-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Request Portal Access →
                </button>
              </div>
            </>
          ) : (
            /* Access Request Form with Direct Google Option */
            <>
              {/* Direct Google Access Request */}
              <button
                type="button"
                className="adm-btn adm-btn-secondary"
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  justifyContent: 'center',
                  background: '#ffffff',
                  color: '#1f2937',
                  borderColor: '#e5e7eb',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  marginBottom: '10px',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
                onClick={handleGoogleOAuthRedirect}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: '8px', flexShrink: 0 }}>
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
                Request Access with Google Account
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '10px 0',
                  color: 'var(--adm-text-subtle)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                <div style={{ flex: 1, height: '1px', background: 'var(--adm-border)' }} />
                <span>OR SUBMIT DETAILS FOR APPROVAL</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--adm-border)' }} />
              </div>

              <form onSubmit={handleRequestAccess}>
                <div className="adm-form-group" style={{ textAlign: 'left', marginBottom: '9px' }}>
                  <label className="adm-form-label" style={{ fontSize: '11.5px', marginBottom: '4px' }}>Your Full Name</label>
                  <input
                    type="text"
                    className="adm-input"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. John Doe"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    required
                  />
                </div>

                <div className="adm-form-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
                  <label className="adm-form-label" style={{ fontSize: '11.5px', marginBottom: '4px' }}>Work / Google Email</label>
                  <input
                    type="email"
                    className="adm-input"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="candidate@company.com"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    required
                  />
                  <div style={{ fontSize: '10px', color: 'var(--adm-text-subtle)', marginTop: '3px' }}>
                    Existing admins will receive a live notification to accept or reject your request in real time.
                  </div>
                </div>

                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '9.5px', fontSize: '13px' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending Request...' : 'Send Access Request to Admins'}
                </button>

                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--adm-text-muted)',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ← Already an Authorized Admin? Sign In
                  </button>
                </div>
              </form>
            </>
          )}

          {onClose && (
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--adm-text-subtle)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                }}
              >
                Return to Public Website
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
