import type { DashboardAnalytics, LeadItem, InvoiceItem, ThemeConfig, SectionContent, MediaAsset } from './types';

export const INITIAL_THEME: ThemeConfig = {
  fontFamilyPrimary: 'Syne, sans-serif',
  fontFamilySecondary: 'Inter, sans-serif',
  fontFamilyDisplay: 'Syne, sans-serif',
  colorPrimary: '#ff5121', // LxL Electric Orange
  colorSecondary: '#670b22', // Burgundy
  colorAccentBlue: '#055dff', // Electric Royal Blue
  colorBackground: '#0a0a0c', // Deep Cinema Dark
  colorSurface: '#121216',
  colorText: '#ffffff',
  colorTextMuted: '#8f9099',
  borderStyle: 'rounded-md',
};

export const INITIAL_SECTIONS: SectionContent = {
  hero: {
    headline: 'WE CRAFT VISIONARY CINEMATIC EXPERIENCES',
    eyebrow: 'CineCraft Media & Studios',
    subheadline: 'Next-generation film production, cutting-edge equipment rental, and post-production mastery.',
    ctaText: 'Explore Projects',
    ctaLink: '#featured-projects',
    secondaryCtaText: 'Rent Equipment',
    secondaryCtaLink: '/equipments',
  },
  about: {
    eyebrow: 'Why CineCraft',
    title: 'Where Visionary Stories Meet Relentless Craftsmanship',
    description: 'From high-octane commercial productions to award-winning cinematic features, we empower creators with state-of-the-art camera systems, precision optics, and bespoke soundstages.',
    bulletPoints: [
      { title: 'Global Cinema Cameras', description: 'ARRI Alexa 35, Sony Venice 2, RED V-Raptor XL packages.' },
      { title: 'Bespoke Optics', description: 'Cooke Anamorphic, Master Primes, and vintage rehoused lenses.' },
      { title: 'Virtual Production Stages', description: 'State-of-the-art LED volumes and acoustically isolated stages.' },
    ],
  },
  services: {
    title: 'Production Verticals',
    subtitle: 'End-to-end cinematic solutions tailored for high-profile productions.',
  },
  studios: {
    title: 'Cinecraft Studios',
    subtitle: 'Acoustically treated soundstages, virtual production volume, and full grip packages.',
    ctaText: 'Book Studio Space',
  },
  footer: {
    tagline: 'Pioneering Cinematic Excellence Worldwide.',
    contactEmail: 'contact@cinecraftmedia.com',
    contactPhone: '+91 93704 66245',
    address: 'CineCraft Media Complex, India',
    copyrightText: '© 2026 CineCraft Media. All rights reserved.',
  },
};

export const INITIAL_ASSETS: MediaAsset[] = [];

// Empty initial leads (No dummy mock data)
export const INITIAL_LEADS: LeadItem[] = [];

// Empty initial invoices (No dummy mock data)
export const INITIAL_INVOICES: InvoiceItem[] = [];

// Clean zero-state analytics
export const INITIAL_ANALYTICS: DashboardAnalytics = {
  metrics: {
    totalRevenue: 0,
    totalOutstanding: 0,
    totalLeads: 0,
    activeInvoicesCount: 0,
    conversionRate: 0,
  },
  charts: {
    monthlyRevenue: [],
    leadsByStatus: {
      New: 0,
      'In Contact': 0,
      'Proposal Sent': 0,
      Converted: 0,
      Closed: 0,
    },
  },
  recentActivities: [],
};
