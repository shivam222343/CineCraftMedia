import React, { useState, useEffect, useRef } from 'react';
import './admin.css';
import type {
  AdminUser,
  AdminNotification,
  ThemeConfig,
  SectionContent,
  MediaAsset,
} from './types';
import {
  apiGetTheme,
  apiGetContent,
  apiGetAssets,
  clearStoredToken,
  setStoredToken,
  apiGetCurrentUser,
  apiLogout,
  apiSetPassword,
  getSocketUrl,
  apiGetNotifications,
  apiMarkNotificationsRead,
  apiApproveAdminRequest,
  apiRejectAdminRequest,
} from './api';
import {
  INITIAL_THEME,
  INITIAL_SECTIONS,
  INITIAL_ASSETS,
} from './mockData';

import { CmsStudioView } from './CmsStudioView';
import { AdminAuthModal } from './AdminAuthModal';
import { useTheme } from '../context/ThemeContext';
import { CinecraftMediaLogo } from '../Components/Icons';

export type AdminTab = 'dashboard' | 'meetings' | 'ccm-studio' | 'operations';

interface AdminDashboardProps {
  onBackToPublicSite: () => void;
}

const TAB_CONFIG: Record<
  AdminTab,
  { label: string; path: string; title: string }
> = {
  dashboard: { label: 'Dashboard', path: '/admin/dashboard', title: 'Dashboard' },
  meetings: { label: 'Meetings', path: '/admin/meetings', title: 'Meetings' },
  'ccm-studio': { label: 'CCM Studio', path: '/admin/ccm-studio', title: 'CCM Studio' },
  operations: { label: 'Operations', path: '/admin/operations', title: 'Operations' },
};

const parseTabFromPath = (path: string): AdminTab => {
  const clean = path.toLowerCase().replace(/\/+$/, '');
  if (clean.endsWith('/meetings')) return 'meetings';
  if (clean.endsWith('/ccm-studio') || clean.endsWith('/cms') || clean.endsWith('/studio')) return 'ccm-studio';
  if (clean.endsWith('/operations') || clean.endsWith('/client-operations') || clean.endsWith('/leads')) return 'operations';
  return 'dashboard';
};

const EmptyScreenView: React.FC<{
  title: string;
  icon?: React.ReactNode;
}> = ({ title, icon }) => (
  <div className="adm-empty-screen">
    <div className="adm-empty-icon-wrap">
      {icon || (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#055dff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
      )}
    </div>
    <h2 className="adm-empty-title">{title}</h2>
    <p className="adm-empty-subtitle">
      This section is currently under development. Team Mavericks developers are preparing the metadata modules for this screen.
    </p>
  </div>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToPublicSite }) => {
  const { theme: activeTheme, toggleTheme } = useTheme();

  // Active Admin Profile (starts as null, verified via backend JWT/OAuth session)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window !== 'undefined') {
      return parseTabFromPath(window.location.pathname);
    }
    return 'dashboard';
  });

  const contentBodyRef = useRef<HTMLDivElement>(null);

  // Core CMS Data States
  const [theme, setTheme] = useState<ThemeConfig>(INITIAL_THEME);
  const [sections, setSections] = useState<SectionContent>(INITIAL_SECTIONS);
  const [assets, setAssets] = useState<MediaAsset[]>(INITIAL_ASSETS);

  // Live Notifications & Approval Center
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [approvalFeedback, setApprovalFeedback] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);

  // Set Password Prompt for Google OAuth first-time logins
  const [showSetPasswordModal, setShowSetPasswordModal] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);

  // 1. Initial Authentication & Session Verification
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      setIsAuthChecking(true);
      // Check for token returned in query params from Google OAuth callback: /admin?token=XYZ
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        setStoredToken(urlToken);
        const needsPassword = params.get('needs_password') === 'true';
        window.history.replaceState({}, document.title, window.location.pathname);
        if (needsPassword) {
          setShowSetPasswordModal(true);
        }
      }

      const verifiedUser = await apiGetCurrentUser();
      if (isMounted) {
        if (verifiedUser) {
          setCurrentUser(verifiedUser);
          if (verifiedUser.passwordSet === false) {
            setShowSetPasswordModal(true);
          }
          if (window.location.pathname.startsWith('/admin/login') || window.location.pathname === '/admin') {
            window.history.replaceState({}, '', TAB_CONFIG[activeTab].path);
          }
        } else {
          setCurrentUser(null);
          clearStoredToken();
          if (!window.location.pathname.startsWith('/admin/login')) {
            window.history.replaceState({}, '', `/admin/login${window.location.search}`);
          }
        }
        setIsAuthChecking(false);
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Real-time WebSocket connection for active admin to receive live candidate requests
  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    let ws: WebSocket | null = null;

    try {
      const wsUrl = getSocketUrl();
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws?.send(JSON.stringify({ type: 'subscribe_admin' }));
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_access_request' && data.request) {
            setNotifications((prev) => {
              const exists = prev.some((n) => n.id === data.request.id);
              if (exists) return prev;
              return [data.request, ...prev];
            });
            setHasUnread(true);
          } else if (data.type === 'request_status_update') {
            setNotifications((prev) =>
              prev.map((n) =>
                n.email === data.email ? { ...n, status: data.status } : n
              )
            );
          }
        } catch {
          // Ignore non-json socket messages
        }
      };
    } catch (err) {
      console.warn('[Admin WS] Error initializing admin socket:', err);
    }

    return () => {
      isMounted = false;
      if (ws) ws.close();
    };
  }, [currentUser]);

  // Initial scroll-to-top on entering admin
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    contentBodyRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Polling notifications every 8 seconds
  useEffect(() => {
    let active = true;

    const fetchNotifs = async () => {
      try {
        const res = await apiGetNotifications();
        if (active && res && res.notifications) {
          setNotifications(res.notifications);
          setHasUnread(res.hasUnread);
        }
      } catch (err) {
        console.warn('Notifications poll error:', err);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 8000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // URL synchronization & popstate handling
  useEffect(() => {
    if (!currentUser) return;
    const clean = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    if (clean === '/admin' || clean === '/admin/login' || clean === '') {
      window.history.replaceState({}, '', TAB_CONFIG[activeTab].path);
    }

    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        const tab = parseTabFromPath(window.location.pathname);
        setActiveTab(tab);
        contentBodyRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, activeTab]);

  // Load live CMS data from backend
  useEffect(() => {
    let mounted = true;

    async function loadCmsData() {
      try {
        const [thRes, ctRes, astRes] = await Promise.all([
          apiGetTheme(),
          apiGetContent(),
          apiGetAssets(),
        ]);

        if (mounted) {
          if (thRes.data) setTheme(thRes.data);
          if (ctRes.data) setSections(ctRes.data);
          if (astRes) setAssets(astRes);
        }
      } catch (err) {
        console.warn('[Admin Dashboard] Loading fallback state:', err);
      }
    }

    loadCmsData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleTabClick = (tab: AdminTab) => {
    setActiveTab(tab);
    const targetPath = TAB_CONFIG[tab].path;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    contentBodyRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenNotifications = async () => {
    setIsDrawerOpen(true);
    setHasUnread(false);
    try {
      await apiMarkNotificationsRead();
    } catch {}
  };

  const handleApprove = async (idOrEmail: string) => {
    setActionLoadingId(idOrEmail);
    setApprovalFeedback(null);
    try {
      const res = await apiApproveAdminRequest(idOrEmail);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === idOrEmail || n.email === idOrEmail ? { ...n, status: 'approved' } : n
          )
        );
        setApprovalFeedback({ id: idOrEmail, msg: 'Admin approved! They can now log in.', type: 'success' });
      } else {
        setApprovalFeedback({ id: idOrEmail, msg: res.message || 'Failed to approve', type: 'error' });
      }
    } catch (err: any) {
      setApprovalFeedback({ id: idOrEmail, msg: err.message || 'Failed to approve', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (idOrEmail: string) => {
    setActionLoadingId(idOrEmail);
    setApprovalFeedback(null);
    try {
      const res = await apiRejectAdminRequest(idOrEmail);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === idOrEmail || n.email === idOrEmail ? { ...n, status: 'rejected' } : n
          )
        );
        setApprovalFeedback({ id: idOrEmail, msg: 'Request rejected.', type: 'success' });
      } else {
        setApprovalFeedback({ id: idOrEmail, msg: res.message || 'Failed to reject', type: 'error' });
      }
    } catch (err: any) {
      setApprovalFeedback({ id: idOrEmail, msg: err.message || 'Failed to reject', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ msg: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ msg: 'Passwords do not match.', type: 'error' });
      return;
    }
    setIsSavingPassword(true);
    setPasswordStatus(null);
    try {
      const res = await apiSetPassword(newPassword);
      if (res.success) {
        setPasswordStatus({ msg: 'Password saved! Direct email login enabled.', type: 'success' });
        setCurrentUser((prev) => (prev ? { ...prev, passwordSet: true } : prev));
        setTimeout(() => setShowSetPasswordModal(false), 1400);
      } else {
        setPasswordStatus({ msg: res.message || 'Failed to set password.', type: 'error' });
      }
    } catch (err: any) {
      setPasswordStatus({ msg: err.message || 'Failed to set password.', type: 'error' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {}
    clearStoredToken();
    sessionStorage.removeItem('ccm_pending_request_email');
    setCurrentUser(null);
    window.history.replaceState({}, document.title, '/admin/login');
  };

  if (isAuthChecking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--adm-bg, #090a0f)',
          color: 'var(--adm-text, #f8fafc)',
          fontFamily: 'var(--adm-font-body, "Inter", sans-serif)',
        }}
      >
        <CinecraftMediaLogo height={48} />
        <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--adm-text-muted, #94a3b8)', letterSpacing: '0.4px' }}>
          Verifying Admin Security Clearance...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AdminAuthModal
        isOpen={true}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
        onClose={onBackToPublicSite}
      />
    );
  }

  return (
    <div className="adm-root">
      {/* Sidebar Navigation */}
      <aside className="adm-sidebar">
        {/* Brand Header with Cinecraft Logo (exact matching public navbar) */}
        <div className="adm-sidebar-brand">
          <div className="adm-brand-logo-container">
            <CinecraftMediaLogo height={30} />
          </div>
          <div className="adm-brand-text">
            <h2 style={{ margin: 0, padding: 0, display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '1px' }}>
                <span
                  className="adm-brand-cine"
                  style={{
                    fontFamily: 'var(--font-script, "Scribo", cursive, sans-serif)',
                    fontSize: '22px',
                    fontWeight: 400,
                    color: '#ff5121',
                    lineHeight: 1,
                    letterSpacing: '-0.5px',
                    textTransform: 'none',
                  }}
                >
                  Cine
                </span>
                <span
                  className="adm-brand-craft"
                  style={{
                    fontFamily: 'var(--font-heading, "Owners Wide", -apple-system, BlinkMacSystemFont, sans-serif)',
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                    textTransform: 'lowercase',
                    lineHeight: 1,
                    color: activeTheme === 'light' ? '#1c1815' : '#fcf2bd',
                  }}
                >
                  craft
                </span>
              </span>
            </h2>
            <span className="adm-brand-subtitle">Admin Console</span>
          </div>
        </div>

        {/* Primary Nav Links */}
        <nav className="adm-nav-group">
          <div className="adm-nav-label">Core Engine</div>

          {/* 1. Dashboard */}
          <button
            className={`adm-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabClick('dashboard')}
          >
            <svg
              className="adm-nav-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            <span className="adm-nav-text">Dashboard</span>
          </button>

          {/* 2. Meetings */}
          <button
            className={`adm-nav-item ${activeTab === 'meetings' ? 'active' : ''}`}
            onClick={() => handleTabClick('meetings')}
          >
            <svg
              className="adm-nav-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
            <span className="adm-nav-text">Meetings</span>
          </button>

          {/* 3. CCM Studio */}
          <button
            className={`adm-nav-item ${activeTab === 'ccm-studio' ? 'active' : ''}`}
            onClick={() => handleTabClick('ccm-studio')}
          >
            <svg
              className="adm-nav-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            <span className="adm-nav-text">CCM Studio</span>
            <span className="adm-nav-badge">v1</span>
          </button>

          {/* 4. Operations */}
          <button
            className={`adm-nav-item ${activeTab === 'operations' ? 'active' : ''}`}
            onClick={() => handleTabClick('operations')}
          >
            <svg
              className="adm-nav-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span className="adm-nav-text">Operations</span>
          </button>
        </nav>

        {/* Sidebar Footer with Active Admin Account */}
        <div className="adm-sidebar-footer">
          {currentUser && (
            <div className="adm-user-mini">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="adm-user-avatar"
                />
              ) : (
                <div className="adm-user-avatar-initials" title={currentUser.name}>
                  SM
                </div>
              )}
              <div className="adm-user-meta">
                <div className="adm-user-name">{currentUser.name}</div>
                <div className="adm-user-role">
                  {currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.role}
                </div>
              </div>
            </div>
          )}

          <button
            className="adm-btn adm-btn-secondary"
            style={{ width: '100%' }}
            onClick={onBackToPublicSite}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Public Site
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="adm-main">
        {/* Top Header Bar */}
        <header className="adm-topbar">
          <div className="adm-breadcrumb">
            <span className="adm-breadcrumb-sec">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
              Dashboard
            </span>
            <span>/</span>
            <span className="adm-breadcrumb-cur">{TAB_CONFIG[activeTab].title}</span>
          </div>

          <div className="adm-topbar-actions">
            {/* Notification Bell matching screenshot with live unread indicator */}
            <button
              className="adm-bell-btn"
              title="Notifications"
              aria-label="Notifications"
              onClick={handleOpenNotifications}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {hasUnread && <span className="adm-bell-badge"></span>}
            </button>

            <button
              className="adm-btn adm-btn-outline-danger"
              style={{ padding: '6px 14px', fontSize: '12px' }}
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Tab Body Router */}
        <div className="adm-content-body" ref={contentBodyRef}>
          {activeTab === 'dashboard' && (
            <EmptyScreenView
              title="Dashboard"
              icon={
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#055dff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="9"></rect>
                  <rect x="14" y="3" width="7" height="5"></rect>
                  <rect x="14" y="12" width="7" height="9"></rect>
                  <rect x="3" y="16" width="7" height="5"></rect>
                </svg>
              }
            />
          )}

          {activeTab === 'meetings' && (
            <EmptyScreenView
              title="Meetings"
              icon={
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#055dff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
              }
            />
          )}

          {activeTab === 'ccm-studio' && (
            <CmsStudioView
              theme={theme}
              sections={sections}
              assets={assets}
              onThemeUpdated={setTheme}
              onSectionsUpdated={setSections}
              onAssetsUpdated={setAssets}
            />
          )}

          {activeTab === 'operations' && (
            <EmptyScreenView
              title="Operations"
              icon={
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#055dff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              }
            />
          )}
        </div>

        {/* Floating Theme Toggle (Bottom Right - Matching Screenshot) */}
        <button
          onClick={toggleTheme}
          className="adm-floating-theme-btn"
          title={`Switch to ${activeTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label={`Switch to ${activeTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {activeTheme === 'dark' ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      </main>

      {/* Slide-over Notification Drawer from Right */}
      {isDrawerOpen && (
        <div className="adm-drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <aside
            className="adm-notification-drawer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Notification Center"
          >
            <div className="adm-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="adm-drawer-bell-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="adm-drawer-title">Notifications</h3>
                  <div className="adm-drawer-subtitle">
                    {notifications.length === 0
                      ? 'All caught up'
                      : `${notifications.length} update${notifications.length === 1 ? '' : 's'}`}
                  </div>
                </div>
              </div>
              <button
                className="adm-drawer-close"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Notification Items List */}
            <div className="adm-drawer-content">
              {approvalFeedback && (
                <div
                  className={`adm-drawer-feedback ${approvalFeedback.type}`}
                >
                  {approvalFeedback.type === 'success' ? '✓' : '✕'} {approvalFeedback.msg}
                </div>
              )}

              {/* Pending Access Requests Section */}
              {notifications.filter((n) => n.type === 'access_request' && n.status === 'pending').length > 0 && (
                <>
                  <div className="adm-drawer-section-title">
                    Access Requests ({notifications.filter((n) => n.type === 'access_request' && n.status === 'pending').length})
                  </div>
                  {notifications
                    .filter((n) => n.type === 'access_request' && n.status === 'pending')
                    .map((notif) => (
                      <div
                        key={notif.id}
                        className="adm-notif-card pending"
                      >
                        <div className="adm-notif-header">
                          <div className="adm-notif-avatar">
                            {notif.avatar ? (
                              <img src={notif.avatar} alt={notif.name} />
                            ) : (
                              <span>{(notif.name || notif.email || 'A').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="adm-notif-meta">
                            <div className="adm-notif-name">{notif.name || 'New Admin Candidate'}</div>
                            <div className="adm-notif-email">{notif.email}</div>
                            <div className="adm-notif-time">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {notif.source || 'Login Request'}
                            </div>
                          </div>
                          <span className="adm-notif-badge status-pending">
                            Pending
                          </span>
                        </div>

                        <div className="adm-notif-actions">
                          <button
                            className="adm-btn-approve"
                            disabled={actionLoadingId === notif.id}
                            onClick={() => handleApprove(notif.id || notif.email)}
                          >
                            {actionLoadingId === notif.id ? 'Approving...' : '✓ Approve Access'}
                          </button>
                          <button
                            className="adm-btn-reject"
                            disabled={actionLoadingId === notif.id}
                            onClick={() => handleReject(notif.id || notif.email)}
                          >
                            {actionLoadingId === notif.id ? '...' : '✕ Reject'}
                          </button>
                        </div>
                      </div>
                    ))}
                </>
              )}

              {/* General Activity & Notifications */}
              {notifications.filter((n) => !(n.type === 'access_request' && n.status === 'pending')).length > 0 && (
                <>
                  <div
                    className="adm-drawer-section-title"
                    style={{
                      marginTop: notifications.some((n) => n.type === 'access_request' && n.status === 'pending') ? '20px' : '0',
                    }}
                  >
                    Activity & Updates
                  </div>
                  {notifications
                    .filter((n) => !(n.type === 'access_request' && n.status === 'pending'))
                    .map((notif) => (
                      <div
                        key={notif.id}
                        className={`adm-notif-card ${notif.status || 'info'}`}
                      >
                        <div className="adm-notif-header">
                          <div className="adm-notif-avatar">
                            {notif.avatar ? (
                              <img src={notif.avatar} alt={notif.name} />
                            ) : (
                              <span>{(notif.name || notif.title || 'N').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="adm-notif-meta">
                            <div className="adm-notif-name">{notif.title || notif.name || 'System Notification'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--adm-text-muted)', marginTop: '2px', lineHeight: '1.4' }}>
                              {notif.message}
                            </div>
                            <div className="adm-notif-time">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {notif.status && (
                            <span className={`adm-notif-badge status-${notif.status}`}>
                              {notif.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </>
              )}

              {/* General Empty State */}
              {notifications.length === 0 && (
                <div className="adm-drawer-empty">
                  <div className="adm-drawer-empty-icon">✓</div>
                  <div className="adm-drawer-empty-text">No Notifications</div>
                  <div className="adm-drawer-empty-sub">
                    You're all caught up! System updates, client operations, and portal activity will appear here.
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Set Password Modal for First-time Google OAuth Admins */}
      {showSetPasswordModal && (
        <div className="adm-modal-backdrop" style={{ zIndex: 1300, padding: '20px', overflow: 'hidden' }}>
          <div
            className="adm-modal-panel adm-auth-modal-panel"
            style={{
              maxWidth: '420px',
              width: '100%',
              maxHeight: 'none',
              overflow: 'hidden',
              borderRadius: '16px',
              background: 'var(--adm-surface)',
              border: '1px solid var(--adm-border)',
              padding: '24px 26px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <CinecraftMediaLogo height={34} />
            </div>

            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: 'var(--adm-text)' }}>
              Set Your Admin Password
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: 'var(--adm-text-muted)', lineHeight: '1.4' }}>
              Welcome! Since you logged in with Google, please configure an admin password to enable direct email & password login.
            </p>

            {passwordStatus && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: passwordStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${passwordStatus.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                  color: passwordStatus.type === 'success' ? '#10b981' : '#f87171',
                  fontSize: '13px',
                  marginBottom: '16px',
                  textAlign: 'left',
                }}
              >
                {passwordStatus.type === 'success' ? '✓' : '✕'} {passwordStatus.msg}
              </div>
            )}

            <form onSubmit={handleSavePassword}>
              <div className="adm-form-group" style={{ textAlign: 'left', marginBottom: '14px' }}>
                <label className="adm-form-label">New Password</label>
                <input
                  type="password"
                  className="adm-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <div className="adm-form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
                <label className="adm-form-label">Confirm Password</label>
                <input
                  type="password"
                  className="adm-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </div>

              <button
                type="submit"
                className="adm-btn adm-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                disabled={isSavingPassword}
              >
                {isSavingPassword ? 'Saving Password...' : 'Save Admin Password'}
              </button>

              <button
                type="button"
                onClick={() => setShowSetPasswordModal(false)}
                style={{
                  marginTop: '14px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--adm-text-subtle)',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                Remind Me Later
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
