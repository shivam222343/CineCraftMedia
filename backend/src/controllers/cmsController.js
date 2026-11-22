import mongoose from 'mongoose';
import { SiteSettings } from '../models/SiteSettings.js';
import { getCached, setCached, invalidateCache, CacheKeys } from '../services/cacheService.js';
import { getIsMongoConnected } from '../config/db.js';

const DEFAULT_THEME_FALLBACK = {
  fontFamilyPrimary: 'Syne, sans-serif',
  fontFamilySecondary: 'Inter, sans-serif',
  fontFamilyDisplay: 'Syne, sans-serif',
  colorPrimary: '#ff5121',
  colorSecondary: '#670b22',
  colorAccentBlue: '#055dff',
  colorBackground: '#0a0a0c',
  colorSurface: '#121216',
  colorText: '#ffffff',
  colorTextMuted: '#8f9099',
  borderStyle: 'rounded-md',
};

const DEFAULT_SECTIONS_FALLBACK = {
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
    description:
      'We believe cinematography is more than just capturing footage—it is an art form engineered through obsessive detail, peerless camera movement, and profound emotional resonance.',
    bulletPoints: [
      { title: 'Cinema Rigging', description: 'Custom vehicles, technocranes, and cable cams.' },
      { title: 'Elite Optics', description: 'Anamorphic, master primes, and cine glass.' },
      { title: 'Color Pipeline', description: 'DaVinci Resolve ACES calibrated workflow.' },
    ],
  },
  services: {
    title: 'FULL-SPECTRUM CINEMA & PRODUCTION SERVICES',
    subtitle:
      'From dynamic automotive chase sequences to stadium concerts and brand keynotes, our crew operates at the highest echelon of visual storytelling.',
  },
  studios: {
    title: 'CINECRAFT STUDIOS COMMERCIAL DIVISION',
    subtitle:
      'High-concept creative development, branded storytelling, and TV commercials powered by world-class directors and cutting-edge visual effects.',
    ctaText: 'Inquire for Studio Production',
  },
  contact: {
    title: 'START YOUR PRODUCTION JOURNEY',
    subtitle: 'Connect with our production managers and equipment rental specialists.',
    phone: '+1 (310) 907-5500',
    email: 'production@cinecraftmedia.com',
    address: '742 Evergreen Studio Complex, Los Angeles, CA 90028',
    copyrightText: '© 2026 CineCraft Media. All rights reserved.',
  },
};

// In-Memory fallback store for seamless dev/offline operation
const memorySettings = {
  theme: { ...DEFAULT_THEME_FALLBACK },
  sections: { ...DEFAULT_SECTIONS_FALLBACK },
  assets: [],
  updatedAt: new Date(),
};

const getSafeUserId = (user) => {
  const id = user?._id || user?.id;
  if (id && mongoose.Types.ObjectId.isValid(String(id))) {
    return id;
  }
  return undefined;
};

// GET /api/v1/theme (Public, Cached in Redis)
export const getPublicTheme = async (req, res) => {
  try {
    const cachedTheme = await getCached(CacheKeys.THEME);
    if (cachedTheme) {
      return res.json({ success: true, source: 'cache', theme: cachedTheme });
    }

    let theme = memorySettings.theme;

    if (getIsMongoConnected()) {
      try {
        const settings = await SiteSettings.findOne().sort({ createdAt: -1 });
        if (settings?.theme) {
          theme = typeof settings.theme.toObject === 'function' ? settings.theme.toObject() : settings.theme;
        }
      } catch (dbErr) {
        console.warn('[CMS Database Warning] DB query failed:', dbErr.message);
      }
    }

    await setCached(CacheKeys.THEME, theme);
    return res.json({ success: true, source: getIsMongoConnected() ? 'db' : 'memory', theme });
  } catch (error) {
    return res.json({ success: true, source: 'fallback', theme: DEFAULT_THEME_FALLBACK });
  }
};

// GET /api/v1/content (Public, Cached in Redis)
export const getPublicContent = async (req, res) => {
  try {
    const cachedContent = await getCached(CacheKeys.CONTENT);
    if (cachedContent) {
      return res.json({ success: true, source: 'cache', data: cachedContent });
    }

    let payload = {
      sections: memorySettings.sections,
      assets: memorySettings.assets,
      updatedAt: memorySettings.updatedAt,
    };

    if (getIsMongoConnected()) {
      try {
        const settings = await SiteSettings.findOne().sort({ createdAt: -1 });
        if (settings) {
          payload = {
            sections: settings.sections || memorySettings.sections,
            assets: settings.assets || memorySettings.assets,
            updatedAt: settings.updatedAt || memorySettings.updatedAt,
          };
        }
      } catch (dbErr) {
        console.warn('[CMS Database Warning] DB query failed:', dbErr.message);
      }
    }

    await setCached(CacheKeys.CONTENT, payload);
    return res.json({ success: true, source: getIsMongoConnected() ? 'db' : 'memory', data: payload });
  } catch (error) {
    return res.json({
      success: true,
      source: 'fallback',
      data: {
        sections: DEFAULT_SECTIONS_FALLBACK,
        assets: [],
        updatedAt: new Date(),
      },
    });
  }
};

// GET /api/admin/cms (Admin View)
export const getAdminSettings = async (req, res) => {
  try {
    if (getIsMongoConnected()) {
      try {
        let settings = await SiteSettings.findOne().sort({ createdAt: -1 });
        if (!settings) {
          const userId = getSafeUserId(req.user);
          settings = await SiteSettings.create({
            theme: DEFAULT_THEME_FALLBACK,
            sections: DEFAULT_SECTIONS_FALLBACK,
            ...(userId ? { updatedBy: userId } : {}),
          });
        }
        return res.json({ success: true, settings });
      } catch (dbErr) {
        console.warn('[CMS DB Warning] getAdminSettings fallback to memory:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      settings: {
        _id: 'memory-cms-settings',
        theme: memorySettings.theme,
        sections: memorySettings.sections,
        assets: memorySettings.assets,
        updatedAt: memorySettings.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/cms/theme (Admin Update Theme & Invalidate Redis)
export const updateTheme = async (req, res) => {
  try {
    const themeUpdate = req.body.theme || req.body;
    if (!themeUpdate || typeof themeUpdate !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid theme configuration provided.' });
    }

    let updatedTheme = null;

    if (getIsMongoConnected()) {
      try {
        let settings = await SiteSettings.findOne().sort({ createdAt: -1 });
        const userId = getSafeUserId(req.user);

        if (!settings) {
          settings = new SiteSettings({
            theme: { ...DEFAULT_THEME_FALLBACK, ...themeUpdate },
            ...(userId ? { updatedBy: userId } : {}),
          });
        } else {
          const currentTheme =
            settings.theme && typeof settings.theme.toObject === 'function'
              ? settings.theme.toObject()
              : settings.theme || {};
          settings.theme = { ...currentTheme, ...themeUpdate };
          if (userId) {
            settings.updatedBy = userId;
          }
        }

        await settings.save();
        updatedTheme = settings.theme;
        memorySettings.theme =
          typeof updatedTheme.toObject === 'function' ? updatedTheme.toObject() : { ...updatedTheme };
      } catch (dbErr) {
        console.warn('[CMS DB Warning] Theme persist failed, updating memory:', dbErr.message);
        memorySettings.theme = { ...memorySettings.theme, ...themeUpdate };
        updatedTheme = memorySettings.theme;
      }
    } else {
      memorySettings.theme = { ...memorySettings.theme, ...themeUpdate };
      updatedTheme = memorySettings.theme;
    }

    memorySettings.updatedAt = new Date();

    // Invalidate Redis Cache instantly
    await invalidateCache(CacheKeys.THEME);

    return res.json({
      success: true,
      message: 'Theme configuration updated and cache refreshed.',
      theme: updatedTheme,
    });
  } catch (error) {
    console.error('[CMS Update Theme Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/cms/content (Admin Update Section Copy & Invalidate Redis)
export const updateContent = async (req, res) => {
  try {
    const sectionsUpdate = req.body.sections || req.body;
    if (!sectionsUpdate || typeof sectionsUpdate !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid sections configuration provided.' });
    }

    let updatedSections = null;

    if (getIsMongoConnected()) {
      try {
        let settings = await SiteSettings.findOne().sort({ createdAt: -1 });
        const userId = getSafeUserId(req.user);

        if (!settings) {
          settings = new SiteSettings({
            sections: { ...DEFAULT_SECTIONS_FALLBACK, ...sectionsUpdate },
            ...(userId ? { updatedBy: userId } : {}),
          });
        } else {
          const currentSections =
            settings.sections && typeof settings.sections.toObject === 'function'
              ? settings.sections.toObject()
              : settings.sections || {};
          settings.sections = { ...currentSections, ...sectionsUpdate };
          if (userId) {
            settings.updatedBy = userId;
          }
        }

        await settings.save();
        updatedSections = settings.sections;
        memorySettings.sections =
          typeof updatedSections.toObject === 'function' ? updatedSections.toObject() : { ...updatedSections };
      } catch (dbErr) {
        console.warn('[CMS DB Warning] Content persist failed, updating memory:', dbErr.message);
        memorySettings.sections = { ...memorySettings.sections, ...sectionsUpdate };
        updatedSections = memorySettings.sections;
      }
    } else {
      memorySettings.sections = { ...memorySettings.sections, ...sectionsUpdate };
      updatedSections = memorySettings.sections;
    }

    memorySettings.updatedAt = new Date();

    // Invalidate Redis Cache instantly
    await invalidateCache(CacheKeys.CONTENT);

    return res.json({
      success: true,
      message: 'Dynamic CMS content updated and cache refreshed.',
      sections: updatedSections,
    });
  } catch (error) {
    console.error('[CMS Update Content Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/cms/upload (Admin Upload Section Asset & Invalidate Redis)
export const uploadAsset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { section = 'hero', key = 'background', altText = '', aspectRatio = '16:9' } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    const assetId = `asset-${Date.now()}`;
    const newAsset = {
      _id: assetId,
      id: assetId,
      section,
      key,
      url: fileUrl,
      altText,
      aspectRatio,
      storageType: 'local',
      uploadedAt: new Date(),
    };

    if (getIsMongoConnected()) {
      try {
        let settings = await SiteSettings.findOne().sort({ createdAt: -1 });
        const userId = getSafeUserId(req.user);

        if (!settings) {
          settings = new SiteSettings({
            theme: DEFAULT_THEME_FALLBACK,
            sections: DEFAULT_SECTIONS_FALLBACK,
            assets: [newAsset],
            ...(userId ? { updatedBy: userId } : {}),
          });
        } else {
          settings.assets.push(newAsset);
          if (userId) {
            settings.updatedBy = userId;
          }
        }

        await settings.save();
      } catch (dbErr) {
        console.warn('[CMS DB Warning] Asset upload persist failed, saving in memory:', dbErr.message);
        memorySettings.assets.push(newAsset);
      }
    } else {
      memorySettings.assets.push(newAsset);
    }

    // Invalidate Content Cache
    await invalidateCache(CacheKeys.CONTENT);

    return res.status(201).json({
      success: true,
      message: 'Asset uploaded and attached to CMS.',
      asset: newAsset,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/cms/assets/:id (Admin Delete Section Asset & Invalidate Redis)
export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Asset ID is required.' });
    }

    if (getIsMongoConnected()) {
      try {
        let settings = await SiteSettings.findOne().sort({ createdAt: -1 });
        if (settings && Array.isArray(settings.assets)) {
          settings.assets = settings.assets.filter(
            (a) => a._id?.toString() !== id && a.id !== id && a.key !== id
          );
          await settings.save();
        }
      } catch (dbErr) {
        console.warn('[CMS DB Warning] Asset deletion failed in DB, updating memory:', dbErr.message);
      }
    }

    memorySettings.assets = memorySettings.assets.filter(
      (a) => a._id?.toString() !== id && a.id !== id && a.key !== id
    );

    await invalidateCache(CacheKeys.CONTENT);

    return res.json({
      success: true,
      message: 'Asset deleted from library and cache invalidated.',
      deletedId: id,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
