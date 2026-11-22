import type {
  AdminUser,
  AdminNotification,
  ThemeConfig,
  SectionContent,
  MediaAsset,
  LeadItem,
  InvoiceItem,
  DashboardAnalytics,
  LeadStatus,
  InvoiceStatus,
} from './types';
import {
  INITIAL_THEME,
  INITIAL_SECTIONS,
  INITIAL_ASSETS,
  INITIAL_LEADS,
  INITIAL_INVOICES,
  INITIAL_ANALYTICS,
} from './mockData';

const rawApiBase: string = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
const cleanBase = rawApiBase.replace(/\/+$/, '');
export const API_BASE = cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;

// Derive WebSocket endpoint from API_BASE
export const getSocketUrl = (): string => {
  const isSecure = API_BASE.startsWith('https://');
  const host = API_BASE.replace(/^https?:\/\//, '').replace(/\/api$/, '').replace(/\/+$/, '');
  return `${isSecure ? 'wss' : 'ws'}://${host}`;
};

// Local storage key for JWT token
const TOKEN_KEY = 'cinecraft_admin_jwt';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Generic fetch wrapper with graceful fallback to in-memory mock if backend offline
async function apiRequest<T>(endpoint: string, options: RequestInit = {}, fallbackData: T): Promise<{ data: T; isLive: boolean }> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
      credentials: 'include',
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      return { data: (json.data ?? json.settings ?? json.theme ?? json.metrics ?? json) as T, isLive: true };
    }
  } catch {
    // Backend offline / network timeout: fallback to mock store
  }

  return { data: fallbackData, isLive: false };
}

// In-Memory state for offline preview responsiveness
let currentTheme = { ...INITIAL_THEME };
let currentSections = { ...INITIAL_SECTIONS };
let currentAssets = [...INITIAL_ASSETS];
let currentLeads = [...INITIAL_LEADS];
let currentInvoices = [...INITIAL_INVOICES];
let currentAnalytics = { ...INITIAL_ANALYTICS };

// 1. Auth & Session APIs
export const apiGetCurrentUser = async (): Promise<AdminUser | null> => {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        return data.user as AdminUser;
      }
    } else if (res.status === 401 || res.status === 403) {
      clearStoredToken();
      return null;
    }
  } catch (err) {
    console.warn('[Auth API] Could not verify session with backend:', err);
  }

  return null;
};

export const apiAdminLogin = async (
  email: string,
  password?: string
): Promise<{ success: boolean; user?: AdminUser; token?: string; pendingApproval?: boolean; message?: string }> => {
  try {
    const res = await fetch(`${API_BASE}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success !== false) {
      if (data.token) {
        setStoredToken(data.token);
      }
      return { success: true, user: data.user, token: data.token };
    }

    if (data.pendingApproval || res.status === 403) {
      return {
        success: false,
        pendingApproval: true,
        message: data.message || 'Access request sent to existing admins. Awaiting approval in notifications.',
      };
    }

    return {
      success: false,
      message: data.message || 'Authentication failed. Please verify your credentials.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error connecting to authentication server.',
    };
  }
};

export const apiSubmitAccessRequest = async (
  email: string,
  name?: string
): Promise<{ success: boolean; status: string; pendingApproval?: boolean; message?: string; token?: string; user?: AdminUser }> => {
  try {
    const res = await fetch(`${API_BASE}/auth/request-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), name }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      if (data.status === 'approved' && data.token) {
        setStoredToken(data.token);
      }
      return {
        success: true,
        status: data.status || 'pending',
        pendingApproval: data.status === 'pending',
        message: data.message,
        token: data.token,
        user: data.user,
      };
    }

    return {
      success: false,
      status: 'error',
      message: data.message || 'Failed to submit access request.',
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'error',
      message: err.message || 'Network connection failed.',
    };
  }
};

export const apiCheckRequestStatus = async (
  email: string
): Promise<{ success: boolean; status: 'pending' | 'approved' | 'rejected' | 'none'; token?: string; user?: AdminUser }> => {
  try {
    const res = await fetch(`${API_BASE}/auth/request-status?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'approved' && data.token) {
        setStoredToken(data.token);
      }
      return {
        success: true,
        status: data.status || 'none',
        token: data.token,
        user: data.user,
      };
    }
  } catch {
    // Ignore network blips during polling
  }
  return { success: false, status: 'none' };
};

export const apiLogout = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Silent catch
  } finally {
    clearStoredToken();
  }
};

export const apiSetPassword = async (
  password: string
): Promise<{ success: boolean; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE}/auth/set-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true, message: data.message || 'Password updated.' };
    }
    return { success: false, message: data.message || 'Failed to update password.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error.' };
  }
};

// 1.1 Notification & Access Approval APIs
export const apiGetNotifications = async (): Promise<{
  notifications: AdminNotification[];
  hasUnread: boolean;
  unreadCount: number;
}> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE}/admin/notifications`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return { notifications: [], hasUnread: false, unreadCount: 0 };
};

export const apiMarkNotificationsRead = async (): Promise<{ success: boolean }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE}/admin/notifications/mark-read`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    if (res.ok) return await res.json();
  } catch {}
  return { success: true };
};

export const apiApproveAdminRequest = async (idOrEmail: string): Promise<{ success: boolean; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE}/admin/notifications/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ idOrEmail }),
      credentials: 'include',
    });
    if (res.ok) return await res.json();
  } catch {}
  return { success: false, message: 'Failed to approve admin request' };
};

export const apiRejectAdminRequest = async (idOrEmail: string): Promise<{ success: boolean; message: string }> => {
  const token = getStoredToken();
  try {
    const res = await fetch(`${API_BASE}/admin/notifications/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ idOrEmail }),
      credentials: 'include',
    });
    if (res.ok) return await res.json();
  } catch {}
  return { success: false, message: 'Failed to reject admin request' };
};

// 2. Analytics APIs
export const apiGetAnalytics = async (): Promise<{ data: DashboardAnalytics; isLive: boolean }> => {
  const result = await apiRequest<DashboardAnalytics>('/admin/analytics/overview', { method: 'GET' }, currentAnalytics);
  return result;
};

// 3. Dynamic CMS APIs
export const apiGetTheme = async (): Promise<{ data: ThemeConfig; isLive: boolean }> => {
  const result = await apiRequest<{ theme: ThemeConfig }>('/v1/theme', { method: 'GET' }, { theme: currentTheme });
  return { data: result.data.theme || currentTheme, isLive: result.isLive };
};

export const apiSaveTheme = async (theme: ThemeConfig): Promise<{ success: boolean; isLive: boolean }> => {
  currentTheme = { ...theme };
  try {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE}/admin/cms/theme`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ theme }),
    });
    if (res.ok) {
      return { success: true, isLive: true };
    }
  } catch {}
  return { success: true, isLive: false };
};

export const apiGetContent = async (): Promise<{ data: SectionContent; isLive: boolean }> => {
  const result = await apiRequest<any>('/v1/content', { method: 'GET' }, { sections: currentSections });
  return { data: result.data.sections || currentSections, isLive: result.isLive };
};

export const apiSaveContent = async (sections: SectionContent): Promise<{ success: boolean; isLive: boolean }> => {
  currentSections = { ...sections };
  try {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE}/admin/cms/content`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sections }),
    });
    if (res.ok) {
      return { success: true, isLive: true };
    }
  } catch {}
  return { success: true, isLive: false };
};

export const apiGetAssets = async (): Promise<MediaAsset[]> => {
  return currentAssets;
};

export const apiUploadAsset = async (asset: MediaAsset): Promise<{ success: boolean; asset: MediaAsset }> => {
  currentAssets.unshift(asset);
  return { success: true, asset };
};

// 4. Client Leads APIs
export const apiGetLeads = async (): Promise<{ data: LeadItem[]; isLive: boolean }> => {
  const result = await apiRequest<any>('/admin/leads', { method: 'GET' }, { data: currentLeads });
  const list = Array.isArray(result.data?.data) ? result.data.data : currentLeads;
  return { data: list, isLive: result.isLive };
};

export const apiUpdateLeadStatus = async (leadId: string, status: LeadStatus): Promise<boolean> => {
  const lead = currentLeads.find((l) => l._id === leadId);
  if (lead) {
    lead.status = status;
  }
  try {
    const token = getStoredToken();
    await fetch(`${API_BASE}/admin/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
  } catch {}
  return true;
};

export const apiAddLeadNote = async (leadId: string, text: string, author = 'Admin'): Promise<boolean> => {
  const lead = currentLeads.find((l) => l._id === leadId);
  if (lead) {
    if (!lead.notes) lead.notes = [];
    lead.notes.push({
      author,
      text,
      createdAt: new Date().toISOString(),
    });
  }
  try {
    const token = getStoredToken();
    await fetch(`${API_BASE}/admin/leads/${leadId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
  } catch {}
  return true;
};

// 5. Invoicing APIs
export const apiGetInvoices = async (): Promise<{ data: InvoiceItem[]; isLive: boolean }> => {
  const result = await apiRequest<any>('/admin/invoices', { method: 'GET' }, { data: currentInvoices });
  const list = Array.isArray(result.data?.data) ? result.data.data : currentInvoices;
  return { data: list, isLive: result.isLive };
};

export const apiCreateInvoice = async (invoiceData: Partial<InvoiceItem>): Promise<{ success: boolean; invoice: InvoiceItem }> => {
  const count = currentInvoices.length + 101;
  const subtotal = (invoiceData.items || []).reduce((acc, it) => acc + it.amount, 0);
  const discountAmount = Number(((subtotal * (invoiceData.discountPercentage || 0)) / 100).toFixed(2));
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number(((taxable * (invoiceData.taxPercentage || 0)) / 100).toFixed(2));
  const totalAmount = Number((taxable + taxAmount).toFixed(2));

  const newInvoice: InvoiceItem = {
    _id: `inv-${Date.now()}`,
    invoiceNumber: `CCM-2026-${String(count).padStart(4, '0')}`,
    clientName: invoiceData.clientName || 'Valued Client',
    clientEmail: invoiceData.clientEmail || 'client@example.com',
    clientCompany: invoiceData.clientCompany || '',
    clientAddress: invoiceData.clientAddress || '',
    currency: invoiceData.currency || 'USD',
    items: invoiceData.items || [],
    subtotal,
    discountPercentage: invoiceData.discountPercentage || 0,
    discountAmount,
    taxPercentage: invoiceData.taxPercentage || 0,
    taxAmount,
    totalAmount,
    status: invoiceData.status || 'Draft',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: invoiceData.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: invoiceData.notes || 'Payment terms: net 14 days.',
    createdAt: new Date().toISOString(),
  };

  currentInvoices.unshift(newInvoice);

  // If tied to lead, link it
  if (invoiceData.leadId) {
    const lead = currentLeads.find((l) => l._id === invoiceData.leadId);
    if (lead) {
      if (!lead.invoices) lead.invoices = [];
      lead.invoices.push({
        _id: newInvoice._id,
        invoiceNumber: newInvoice.invoiceNumber,
        totalAmount: newInvoice.totalAmount,
        status: newInvoice.status,
      });
      lead.status = 'Proposal Sent';
    }
  }

  try {
    const token = getStoredToken();
    await fetch(`${API_BASE}/admin/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(invoiceData),
    });
  } catch {}

  return { success: true, invoice: newInvoice };
};

export const apiUpdateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus): Promise<boolean> => {
  const inv = currentInvoices.find((i) => i._id === invoiceId);
  if (inv) {
    inv.status = status;
  }
  try {
    const token = getStoredToken();
    await fetch(`${API_BASE}/admin/invoices/${invoiceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
  } catch {}
  return true;
};
