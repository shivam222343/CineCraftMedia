export type AdminRole = 'admin' | 'superadmin' | 'editor';

export interface AdminNotification {
  id: string;
  type: 'access_request' | 'system';
  title: string;
  message: string;
  email: string;
  name: string;
  avatar?: string;
  source?: string;
  status: 'pending' | 'approved' | 'rejected' | 'info';
  createdAt: string;
  read: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: AdminRole;
  lastLogin?: string;
}

export interface ThemeConfig {
  fontFamilyPrimary: string;
  fontFamilySecondary: string;
  fontFamilyDisplay: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccentBlue: string;
  colorBackground: string;
  colorSurface: string;
  colorText: string;
  colorTextMuted: string;
  borderStyle: 'rounded-sm' | 'rounded-md' | 'rounded-lg' | 'rounded-full' | 'sharp';
}

export interface SectionContent {
  hero: {
    headline: string;
    eyebrow: string;
    subheadline: string;
    ctaText: string;
    ctaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
  };
  about: {
    eyebrow: string;
    title: string;
    description: string;
    bulletPoints: Array<{ title: string; description: string }>;
  };
  services: {
    title: string;
    subtitle: string;
  };
  studios: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
  footer: {
    tagline: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    copyrightText: string;
  };
}

export interface MediaAsset {
  id?: string;
  section: string;
  key: string;
  url: string;
  altText: string;
  aspectRatio: string;
  storageType?: 'local' | 'cloudinary' | 's3' | 'external';
  uploadedAt?: string;
}

export type LeadStatus = 'New' | 'In Contact' | 'Proposal Sent' | 'Converted' | 'Closed';

export interface LeadNote {
  author: string;
  text: string;
  createdAt: string;
}

export interface LeadAttachment {
  name: string;
  url: string;
  size?: number;
  uploadedAt: string;
}

export interface LeadItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  projectType: string;
  budget?: string;
  message: string;
  source: string;
  status: LeadStatus;
  notes?: LeadNote[];
  attachments?: LeadAttachment[];
  invoices?: Array<{
    _id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceItem {
  _id: string;
  invoiceNumber: string;
  leadId?: string | { _id: string; name: string; email: string; company?: string };
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress?: string;
  currency: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  discountPercentage: number;
  discountAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOutstanding: number;
  totalLeads: number;
  activeInvoicesCount: number;
  conversionRate: number;
}

export interface DashboardAnalytics {
  metrics: DashboardMetrics;
  charts: {
    monthlyRevenue: Array<{ month: string; revenue: number; leads: number }>;
    leadsByStatus: Record<string, number>;
  };
  recentActivities: Array<{
    id: string;
    type: 'lead' | 'invoice' | 'cms';
    title: string;
    subtitle: string;
    timestamp: string;
    badge: string;
  }>;
}
