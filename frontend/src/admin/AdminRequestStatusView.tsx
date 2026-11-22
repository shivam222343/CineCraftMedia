import React, { useState, useEffect, useRef } from 'react';
import type { AdminUser } from './types';
import { getSocketUrl, apiCheckRequestStatus, setStoredToken } from './api';
import { CinecraftMediaLogo } from '../Components/Icons';

interface AdminRequestStatusViewProps {
  email: string;
  onApproved: (user: AdminUser, token?: string) => void;
  onCancel: () => void;
  onBackToPublicSite: () => void;
}

export const AdminRequestStatusView: React.FC<AdminRequestStatusViewProps> = ({
  email,
  onApproved,
  onCancel,
  onBackToPublicSite,
}) => {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [lastPingTime, setLastPingTime] = useState<string>('Connecting...');
  const wsRef = useRef<WebSocket | null>(null);
  const isApprovedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const cleanEmail = email.trim().toLowerCase();

    // 1. Establish Real-time WebSocket connection
    const connectSocket = () => {
      try {
        const wsUrl = getSocketUrl();
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setSocketConnected(true);
          setLastPingTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          ws.send(
            JSON.stringify({
              type: 'subscribe_request',
              email: cleanEmail,
            })
          );
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (
              data.type === 'request_status_update' &&
              data.email &&
              data.email.toLowerCase() === cleanEmail
            ) {
              if (data.status === 'approved') {
                isApprovedRef.current = true;
                setStatus('approved');
                if (data.token) {
                  setStoredToken(data.token);
                }
                setTimeout(() => {
                  if (isMounted) {
                    onApproved(
                      data.user || {
                        id: `user-${cleanEmail}`,
                        email: cleanEmail,
                        name: cleanEmail.split('@')[0].toUpperCase(),
                        role: 'admin',
                      },
                      data.token
                    );
                  }
                }, 1200);
              } else if (data.status === 'rejected') {
                setStatus('rejected');
              }
            }
          } catch {
            // Ignore malformed socket message
          }
        };

        ws.onclose = () => {
          if (isMounted) setSocketConnected(false);
        };

        ws.onerror = () => {
          if (isMounted) setSocketConnected(false);
        };
      } catch (err) {
        console.warn('[Socket Status] WebSocket init error:', err);
      }
    };

    connectSocket();

    // 2. High-reliability Polling Fallback (every 3.5 seconds)
    const pollInterval = setInterval(async () => {
      if (isApprovedRef.current) return;
      try {
        const res = await apiCheckRequestStatus(cleanEmail);
        if (!isMounted) return;
        setLastPingTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        if (res.status === 'approved') {
          isApprovedRef.current = true;
          setStatus('approved');
          if (res.token) {
            setStoredToken(res.token);
          }
          setTimeout(() => {
            if (isMounted) {
              onApproved(
                res.user || {
                  id: `user-${cleanEmail}`,
                  email: cleanEmail,
                  name: cleanEmail.split('@')[0].toUpperCase(),
                  role: 'admin',
                },
                res.token
              );
            }
          }, 1200);
        } else if (res.status === 'rejected') {
          setStatus('rejected');
        }
      } catch {
        // Fallback polling network error ignore
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [email, onApproved]);

  return (
    <div className="adm-modal-backdrop" style={{ zIndex: 1200, padding: '20px' }}>
      <div
        className="adm-modal-panel"
        style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid var(--adm-border)',
          borderRadius: '16px',
          background: 'var(--adm-surface)',
          padding: '36px 30px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
          animation: 'admFadeIn 0.3s ease forwards',
        }}
      >
        {/* Top CineCraft Brand Branding */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <CinecraftMediaLogo height={42} />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px', marginBottom: '6px' }}>
          <span
            style={{
              fontFamily: 'var(--font-script, "Scribo", cursive, sans-serif)',
              fontSize: '24px',
              color: '#ff5121',
              fontWeight: 400,
            }}
          >
            Cine
          </span>
          <span
            style={{
              fontFamily: 'var(--font-heading, "Owners Wide", sans-serif)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--swatch--light, #fcf2bd)',
              textTransform: 'lowercase',
            }}
          >
            craft
          </span>
        </div>

        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: 'var(--adm-primary)',
            fontWeight: 700,
            marginBottom: '22px',
          }}
        >
          Admin Portal Access Gate
        </div>

        {/* Live Socket Connection Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '20px',
            background: socketConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${socketConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            marginBottom: '24px',
            fontSize: '12px',
            fontWeight: 600,
            color: socketConnected ? '#10b981' : '#f59e0b',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: socketConnected ? '#10b981' : '#f59e0b',
              display: 'inline-block',
              animation: 'admPulse 1.6s infinite ease-in-out',
            }}
          />
          {socketConnected ? 'Live Socket Connected' : 'Connecting Realtime Socket...'}
        </div>

        {/* Dynamic Status Card */}
        {status === 'pending' && (
          <div
            style={{
              padding: '24px 20px',
              borderRadius: '12px',
              background: 'var(--adm-surface-light)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            {/* Pulsing Radar Ring */}
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'rgba(255, 81, 33, 0.12)',
                border: '2px solid var(--adm-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff5121" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span
                style={{
                  position: 'absolute',
                  inset: '-6px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 81, 33, 0.4)',
                  animation: 'admPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, color: 'var(--adm-text)' }}>
              Awaiting Administrator Approval
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--adm-text-muted)', lineHeight: '1.5' }}>
              Your access request has been delivered to active administrators. As soon as an admin approves your request from their notifications panel, this page will unlock in real time.
            </p>

            <div
              style={{
                display: 'inline-block',
                background: 'var(--adm-surface)',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--adm-border)',
                fontSize: '12.5px',
                color: 'var(--adm-text)',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              {email}
            </div>

            <div style={{ marginTop: '14px', fontSize: '11px', color: 'var(--adm-text-subtle)' }}>
              Last synchronized: {lastPingTime}
            </div>
          </div>
        )}

        {status === 'approved' && (
          <div
            style={{
              padding: '24px 20px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              marginBottom: '24px',
              textAlign: 'center',
              animation: 'admFadeIn 0.3s ease',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '32px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
              Access Granted by Administrator!
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--adm-text)', lineHeight: '1.5' }}>
              Security handshake verified. Unlocking your CineCraft Admin Workspace...
            </p>
          </div>
        )}

        {status === 'rejected' && (
          <div
            style={{
              padding: '24px 20px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              marginBottom: '24px',
              textAlign: 'center',
              animation: 'admFadeIn 0.3s ease',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '28px',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.35)',
              }}
            >
              ✕
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>
              Access Request Declined
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--adm-text-muted)', lineHeight: '1.5' }}>
              An existing administrator has declined access for <strong>{email}</strong>. If you believe this is in error, please contact the CineCraft Media Super Admin team.
            </p>

            <button
              className="adm-btn adm-btn-primary"
              style={{ width: '100%', padding: '12px' }}
              onClick={onCancel}
            >
              Try Another Account
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {status === 'pending' && (
            <button
              className="adm-btn adm-btn-secondary"
              style={{ width: '100%', padding: '11px' }}
              onClick={onCancel}
            >
              Use a Different Account
            </button>
          )}

          <button
            className="adm-btn adm-btn-ghost"
            style={{ width: '100%', padding: '10px', fontSize: '13px' }}
            onClick={onBackToPublicSite}
          >
            ← Return to Public Website
          </button>
        </div>
      </div>
    </div>
  );
};
