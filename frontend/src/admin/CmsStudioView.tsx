import React, { useState, useEffect } from 'react';
import type { ThemeConfig, SectionContent, MediaAsset } from './types';
import { INITIAL_SECTIONS } from './mockData';
import { applyCmsThemeToDom } from '../context/ThemeContext';
import {
  apiSaveTheme,
  apiSaveContent,
  apiUploadAsset,
  apiUploadAssetFile,
  apiDeleteAsset,
  getAssetDisplayUrl,
} from './api';

const normalizeSections = (raw?: Partial<SectionContent>): SectionContent => {
  return {
    hero: {
      headline: raw?.hero?.headline ?? INITIAL_SECTIONS.hero.headline,
      eyebrow: raw?.hero?.eyebrow ?? INITIAL_SECTIONS.hero.eyebrow,
      subheadline: raw?.hero?.subheadline ?? INITIAL_SECTIONS.hero.subheadline,
      ctaText: raw?.hero?.ctaText ?? INITIAL_SECTIONS.hero.ctaText,
      ctaLink: raw?.hero?.ctaLink ?? INITIAL_SECTIONS.hero.ctaLink,
      secondaryCtaText: raw?.hero?.secondaryCtaText ?? INITIAL_SECTIONS.hero.secondaryCtaText,
      secondaryCtaLink: raw?.hero?.secondaryCtaLink ?? INITIAL_SECTIONS.hero.secondaryCtaLink,
    },
    about: {
      eyebrow: raw?.about?.eyebrow ?? INITIAL_SECTIONS.about.eyebrow,
      title: raw?.about?.title ?? INITIAL_SECTIONS.about.title,
      description: raw?.about?.description ?? INITIAL_SECTIONS.about.description,
      bulletPoints: Array.isArray(raw?.about?.bulletPoints)
        ? raw!.about!.bulletPoints
        : INITIAL_SECTIONS.about.bulletPoints,
    },
    services: {
      title: raw?.services?.title ?? INITIAL_SECTIONS.services.title,
      subtitle: raw?.services?.subtitle ?? INITIAL_SECTIONS.services.subtitle,
    },
    studios: {
      title: raw?.studios?.title ?? INITIAL_SECTIONS.studios.title,
      subtitle: raw?.studios?.subtitle ?? INITIAL_SECTIONS.studios.subtitle,
      ctaText: raw?.studios?.ctaText ?? INITIAL_SECTIONS.studios.ctaText,
    },
    footer: {
      tagline:
        raw?.footer?.tagline ??
        (raw as any)?.contact?.subtitle ??
        INITIAL_SECTIONS.footer.tagline,
      contactEmail:
        raw?.footer?.contactEmail ??
        (raw as any)?.contact?.email ??
        INITIAL_SECTIONS.footer.contactEmail,
      contactPhone:
        raw?.footer?.contactPhone ??
        (raw as any)?.contact?.phone ??
        INITIAL_SECTIONS.footer.contactPhone,
      address:
        raw?.footer?.address ??
        (raw as any)?.contact?.address ??
        INITIAL_SECTIONS.footer.address,
      copyrightText:
        raw?.footer?.copyrightText ??
        (raw as any)?.contact?.copyrightText ??
        INITIAL_SECTIONS.footer.copyrightText,
    },
  };
};

interface CmsStudioViewProps {
  theme: ThemeConfig;
  sections: SectionContent;
  assets: MediaAsset[];
  onThemeUpdated: (updatedTheme: ThemeConfig) => void;
  onSectionsUpdated: (updatedSections: SectionContent) => void;
  onAssetsUpdated: (updatedAssets: MediaAsset[]) => void;
}

const GOOGLE_FONTS_CATALOG = [
  'Syne, sans-serif',
  'Inter, sans-serif',
  'Montserrat, sans-serif',
  'Plus Jakarta Sans, sans-serif',
  'Cinzel, serif',
  'Outfit, sans-serif',
  'Space Grotesk, sans-serif',
  'Playfair Display, serif',
  'Cabinet Grotesk, sans-serif',
  'Clash Display, sans-serif',
];

interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accentBlue: string;
  background: string;
  surface: string;
  text: string;
  borderStyle: ThemeConfig['borderStyle'];
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'signature',
    name: 'LxL Signature Orange',
    primary: '#ff5121',
    secondary: '#670b22',
    accentBlue: '#055dff',
    background: '#0a0a0c',
    surface: '#121216',
    text: '#ffffff',
    borderStyle: 'rounded-md',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    primary: '#00f0ff',
    secondary: '#7928ca',
    accentBlue: '#ff007a',
    background: '#070b19',
    surface: '#0f172a',
    text: '#f8fafc',
    borderStyle: 'rounded-sm',
  },
  {
    id: 'cinema-gold',
    name: 'Cinema Gold & Noir',
    primary: '#e5a93c',
    secondary: '#78350f',
    accentBlue: '#38bdf8',
    background: '#0c0a09',
    surface: '#1c1917',
    text: '#fafaf9',
    borderStyle: 'sharp',
  },
  {
    id: 'emerald',
    name: 'Emerald Matrix',
    primary: '#10b981',
    secondary: '#064e3b',
    accentBlue: '#06b6d4',
    background: '#022c22',
    surface: '#064e3b',
    text: '#ecfdf5',
    borderStyle: 'rounded-lg',
  },
  {
    id: 'crimson',
    name: 'Rose Crimson Cinema',
    primary: '#f43f5e',
    secondary: '#881337',
    accentBlue: '#6366f1',
    background: '#0f0508',
    surface: '#1a0a10',
    text: '#ffffff',
    borderStyle: 'rounded-full',
  },
];

const RECOMMENDED_ASSETS: MediaAsset[] = [
  {
    id: 'seed-1',
    section: 'hero',
    key: 'hero_cinematic_shoot',
    url: '/media/VHP07150.webp',
    altText: 'Behind The Scenes Film Production Stills',
    aspectRatio: '16:9',
    storageType: 'local',
  },
  {
    id: 'seed-2',
    section: 'hero',
    key: 'hero_aerial_drone',
    url: '/media/DJI_20241130130924_0004_D.webp',
    altText: 'Aerial Drone 4K Film Stills',
    aspectRatio: '16:9',
    storageType: 'local',
  },
  {
    id: 'seed-3',
    section: 'studios',
    key: 'studio_stage_lighting',
    url: '/media/DSC02230.webp',
    altText: 'Studio Soundstage & Kinoflo Rigging',
    aspectRatio: '2.39:1',
    storageType: 'local',
  },
  {
    id: 'seed-4',
    section: 'about',
    key: 'optics_cinema_package',
    url: '/media/VHP07326.webp',
    altText: 'ARRI Master Prime Optical Package',
    aspectRatio: '4:3',
    storageType: 'local',
  },
];

export const CmsStudioView: React.FC<CmsStudioViewProps> = ({
  theme,
  sections,
  assets,
  onThemeUpdated,
  onSectionsUpdated,
  onAssetsUpdated,
}) => {
  const [subTab, setSubTab] = useState<'theme' | 'sections' | 'assets'>('theme');
  const [localTheme, setLocalTheme] = useState<ThemeConfig>(theme);
  const [localSections, setLocalSections] = useState<SectionContent>(() => normalizeSections(sections));
  const [activeSectionKey, setActiveSectionKey] = useState<keyof SectionContent>('hero');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Sync sections when prop updates from backend
  useEffect(() => {
    if (sections) {
      setLocalSections(normalizeSections(sections));
    }
  }, [sections]);

  // Asset Management State
  const [assetSourceType, setAssetSourceType] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [newAssetSection, setNewAssetSection] = useState('hero');
  const [newAssetKey, setNewAssetKey] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetAlt, setNewAssetAlt] = useState('');
  const [newAssetRatio, setNewAssetRatio] = useState('16:9');
  const [assetFilterSection, setAssetFilterSection] = useState<string>('all');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Live Real-Time Application of Theme across BOTH Admin and Public DOM
  useEffect(() => {
    // Apply dynamic theme styles, CSS variables, and Google Fonts
    applyCmsThemeToDom(localTheme);

    // Persist to local storage for immediate public site rendering without flash
    localStorage.setItem('ccm_cms_theme', JSON.stringify(localTheme));

    // Broadcast event across all components & public site listeners
    window.dispatchEvent(new CustomEvent('ccm_theme_changed', { detail: localTheme }));

    // Notify parent for instant responsive dashboard sync
    onThemeUpdated(localTheme);
  }, [localTheme]);

  // Handle Preset Selection
  const handleApplyPreset = (preset: ThemePreset) => {
    setLocalTheme((prev) => ({
      ...prev,
      colorPrimary: preset.primary,
      colorSecondary: preset.secondary,
      colorAccentBlue: preset.accentBlue,
      colorBackground: preset.background,
      colorSurface: preset.surface,
      colorText: preset.text,
      borderStyle: preset.borderStyle,
    }));
    setSaveFeedback(`Applied preset "${preset.name}" in real time!`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // 2. Persist Theme to Backend & Redis
  const handleSaveTheme = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    const res = await apiSaveTheme(localTheme);
    setIsSaving(false);
    setSaveFeedback(
      res.isLive
        ? 'Theme published to Cloud & Redis cache refreshed!'
        : 'Theme updated in local live preview.'
    );
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // 3. Persist Content to Backend & Redis
  const handleSaveSections = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    const res = await apiSaveContent(localSections);
    setIsSaving(false);
    onSectionsUpdated(localSections);
    setSaveFeedback(
      res.isLive
        ? 'Section copy published & Redis cache refreshed!'
        : 'Section copy updated in live preview state.'
    );
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // 4. File Upload & Asset Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
      if (!newAssetKey) {
        const cleanName = file.name.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
        setNewAssetKey(`${newAssetSection}_${cleanName}`);
      }
    }
  };

  const handleUploadOrAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setSaveFeedback(null);

    try {
      if (assetSourceType === 'upload' && selectedFile) {
        const res = await apiUploadAssetFile(
          selectedFile,
          newAssetSection,
          newAssetKey || `asset_${Date.now()}`,
          newAssetAlt,
          newAssetRatio
        );
        if (res.asset) {
          onAssetsUpdated([res.asset, ...assets]);
          setSaveFeedback('✓ File successfully uploaded and linked to CMS!');
        }
      } else if (newAssetUrl && newAssetKey) {
        const manualAsset: MediaAsset = {
          id: `asset-${Date.now()}`,
          section: newAssetSection,
          key: newAssetKey,
          url: newAssetUrl,
          altText: newAssetAlt,
          aspectRatio: newAssetRatio,
          storageType: 'external',
          uploadedAt: new Date().toISOString(),
        };
        await apiUploadAsset(manualAsset);
        onAssetsUpdated([manualAsset, ...assets]);
        setSaveFeedback('✓ External CDN asset linked to Media Library!');
      }

      // Reset form
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setNewAssetKey('');
      setNewAssetUrl('');
      setNewAssetAlt('');
    } catch (err: any) {
      setSaveFeedback(`Upload warning: ${err.message || 'Operation completed with preview fallback'}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setSaveFeedback(null), 3500);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!window.confirm('Are you sure you want to delete this asset from the CMS library?')) return;
    await apiDeleteAsset(assetId);
    onAssetsUpdated(assets.filter((a) => (a.id || a.key) !== assetId && (a as any)._id !== assetId));
    setSaveFeedback('Asset deleted from CMS library.');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleCopyAssetUrl = (assetUrl: string, assetId: string) => {
    const fullUrl = getAssetDisplayUrl(assetUrl);
    navigator.clipboard.writeText(fullUrl);
    setCopiedAssetId(assetId);
    setTimeout(() => setCopiedAssetId(null), 2500);
  };

  const handleSeedAssets = () => {
    onAssetsUpdated([...RECOMMENDED_ASSETS, ...assets]);
    setSaveFeedback('Loaded CineCraft recommended production media assets!');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Filtered Assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSection = assetFilterSection === 'all' || asset.section.toLowerCase() === assetFilterSection.toLowerCase();
    const query = assetSearchQuery.toLowerCase();
    const matchesQuery = !query || asset.key.toLowerCase().includes(query) || (asset.altText || '').toLowerCase().includes(query);
    return matchesSection && matchesQuery;
  });

  return (
    <div className="adm-view-container">
      {/* Header */}
      <div className="adm-view-header">
        <div className="adm-view-title">
          <h1>CCM Studio</h1>
          <p>Real-time visual theme customization, live copywriting editor, and cinema media asset manager.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '12px',
              color: '#10b981',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            Live Synchronized
          </div>

          {saveFeedback && (
            <div
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {saveFeedback}
            </div>
          )}
        </div>
      </div>

      {/* CCM Subtabs */}
      <div className="adm-tabs">
        <button
          className={`adm-tab-btn ${subTab === 'theme' ? 'active' : ''}`}
          onClick={() => setSubTab('theme')}
        >
          The Typography & Theme Settings
        </button>
        <button
          className={`adm-tab-btn ${subTab === 'sections' ? 'active' : ''}`}
          onClick={() => setSubTab('sections')}
        >
          Section Content & Copywriting
        </button>
        <button
          className={`adm-tab-btn ${subTab === 'assets' ? 'active' : ''}`}
          onClick={() => setSubTab('assets')}
        >
          Asset & Media Management {assets.length > 0 && `(${assets.length})`}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: TYPOGRAPHY & THEME SETTINGS (REAL-TIME REACTIVE)               */}
      {/* ========================================================================= */}
      {subTab === 'theme' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Presets Bar */}
          <div className="adm-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--adm-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Curated Cinecraft Color Presets
                </div>
                <div style={{ fontSize: '12px', color: 'var(--adm-text-muted)' }}>
                  Click any preset to instantly re-theme typography, buttons, and swatches in real time.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: 'var(--adm-surface-light, rgba(255,255,255,0.05))',
                      border:
                        localTheme.colorPrimary === preset.primary
                          ? `2px solid ${preset.primary}`
                          : '1px solid var(--adm-border)',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--adm-text)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: preset.primary,
                        boxShadow: `0 0 6px ${preset.primary}66`,
                      }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Grid + Live Preview Side-by-Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            {/* Left Column: Form Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Typography Card */}
              <div className="adm-card">
                <div className="adm-card-header">
                  <h3>Google Fonts & Geometry</h3>
                  <span style={{ fontSize: '12px', color: '#8f9099' }}>Live-injected into &lt;head&gt;</span>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">
                      Primary Display Font (Headlines & Hero Title)
                    </label>
                    <select
                      className="adm-select"
                      value={localTheme.fontFamilyPrimary}
                      onChange={(e) => setLocalTheme({ ...localTheme, fontFamilyPrimary: e.target.value })}
                    >
                      {GOOGLE_FONTS_CATALOG.map((f) => (
                        <option key={f} value={f}>
                          {f.split(',')[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">Body Narrative Font (Subtitles & Descriptions)</label>
                    <select
                      className="adm-select"
                      value={localTheme.fontFamilySecondary}
                      onChange={(e) => setLocalTheme({ ...localTheme, fontFamilySecondary: e.target.value })}
                    >
                      {GOOGLE_FONTS_CATALOG.map((f) => (
                        <option key={f} value={f}>
                          {f.split(',')[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">Interactive Button & Card Corner Geometry</label>
                    <select
                      className="adm-select"
                      value={localTheme.borderStyle}
                      onChange={(e) => setLocalTheme({ ...localTheme, borderStyle: e.target.value as any })}
                    >
                      <option value="sharp">Cinematic Sharp (0px) - Brutalist & Editorial</option>
                      <option value="rounded-sm">Subtle Precision (4px)</option>
                      <option value="rounded-md">Modern Medium (8px) - Default</option>
                      <option value="rounded-lg">Prominent Curved (14px) - Fluid</option>
                      <option value="rounded-full">Pill / Stadium (rounded-full) - Modern Luxury</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Color Swatches Card */}
              <div className="adm-card">
                <div className="adm-card-header">
                  <h3>Global Palette & CSS Variables</h3>
                  <div style={{ fontSize: '12px', color: '#8f9099' }}>Click swatch to adjust color</div>
                </div>
                <div style={{ padding: '24px' }}>
                  <div className="adm-color-grid">
                    <div className="adm-color-item">
                      <input
                        type="color"
                        className="adm-color-swatch-input"
                        value={localTheme.colorPrimary}
                        onChange={(e) => setLocalTheme({ ...localTheme, colorPrimary: e.target.value })}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>Primary Brand</div>
                        <div style={{ fontSize: '12px', color: '#8f9099' }}>{localTheme.colorPrimary}</div>
                      </div>
                    </div>

                    <div className="adm-color-item">
                      <input
                        type="color"
                        className="adm-color-swatch-input"
                        value={localTheme.colorSecondary}
                        onChange={(e) => setLocalTheme({ ...localTheme, colorSecondary: e.target.value })}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>Burgundy Accent</div>
                        <div style={{ fontSize: '12px', color: '#8f9099' }}>{localTheme.colorSecondary}</div>
                      </div>
                    </div>

                    <div className="adm-color-item">
                      <input
                        type="color"
                        className="adm-color-swatch-input"
                        value={localTheme.colorAccentBlue}
                        onChange={(e) => setLocalTheme({ ...localTheme, colorAccentBlue: e.target.value })}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>Royal Blue Accent</div>
                        <div style={{ fontSize: '12px', color: '#8f9099' }}>{localTheme.colorAccentBlue}</div>
                      </div>
                    </div>

                    <div className="adm-color-item">
                      <input
                        type="color"
                        className="adm-color-swatch-input"
                        value={localTheme.colorBackground}
                        onChange={(e) => setLocalTheme({ ...localTheme, colorBackground: e.target.value })}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>Dark Cinema Backdrop</div>
                        <div style={{ fontSize: '12px', color: '#8f9099' }}>{localTheme.colorBackground}</div>
                      </div>
                    </div>

                    <div className="adm-color-item">
                      <input
                        type="color"
                        className="adm-color-swatch-input"
                        value={localTheme.colorSurface}
                        onChange={(e) => setLocalTheme({ ...localTheme, colorSurface: e.target.value })}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>Card Surface</div>
                        <div style={{ fontSize: '12px', color: '#8f9099' }}>{localTheme.colorSurface}</div>
                      </div>
                    </div>

                    <div className="adm-color-item">
                      <input
                        type="color"
                        className="adm-color-swatch-input"
                        value={localTheme.colorText}
                        onChange={(e) => setLocalTheme({ ...localTheme, colorText: e.target.value })}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>High-Contrast Text</div>
                        <div style={{ fontSize: '12px', color: '#8f9099' }}>{localTheme.colorText}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button
                      className="adm-btn adm-btn-primary"
                      onClick={handleSaveTheme}
                      disabled={isSaving}
                      style={{ flex: 1 }}
                    >
                      {isSaving ? 'Publishing to Cloud...' : '💾 Save & Publish Theme'}
                    </button>
                    <button
                      className="adm-btn adm-btn-secondary"
                      onClick={() => handleApplyPreset(THEME_PRESETS[0])}
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Preview Stage */}
            <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
              <div className="adm-card" style={{ overflow: 'hidden' }}>
                <div
                  className="adm-card-header"
                  style={{
                    background: 'linear-gradient(90deg, rgba(255,81,33,0.1), transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: localTheme.colorPrimary,
                        boxShadow: `0 0 10px ${localTheme.colorPrimary}`,
                      }}
                    />
                    <h3 style={{ margin: 0, fontSize: '14px' }}>Real-Time Stage Preview</h3>
                  </div>
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
                    REACTING LIVE
                  </span>
                </div>

                <div
                  style={{
                    padding: '28px',
                    backgroundColor: localTheme.colorBackground,
                    color: localTheme.colorText,
                    minHeight: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '20px',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {/* Badges Bar */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius:
                          localTheme.borderStyle === 'rounded-full'
                            ? '9999px'
                            : localTheme.borderStyle === 'sharp'
                            ? '0px'
                            : '4px',
                        background: `${localTheme.colorPrimary}22`,
                        border: `1px solid ${localTheme.colorPrimary}55`,
                        color: localTheme.colorPrimary,
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Brand Color: {localTheme.colorPrimary}
                    </span>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius:
                          localTheme.borderStyle === 'rounded-full'
                            ? '9999px'
                            : localTheme.borderStyle === 'sharp'
                            ? '0px'
                            : '4px',
                        background: `${localTheme.colorAccentBlue}22`,
                        border: `1px solid ${localTheme.colorAccentBlue}55`,
                        color: localTheme.colorAccentBlue,
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Royal Blue: {localTheme.colorAccentBlue}
                    </span>
                  </div>

                  {/* Headline in Primary Font */}
                  <div>
                    <div
                      style={{
                        fontFamily: localTheme.fontFamilyPrimary,
                        fontSize: '28px',
                        fontWeight: 900,
                        lineHeight: 1.15,
                        letterSpacing: '-0.02em',
                        background: `linear-gradient(135deg, ${localTheme.colorText} 40%, ${localTheme.colorPrimary} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textTransform: 'uppercase',
                        marginBottom: '12px',
                      }}
                    >
                      WE CRAFT VISIONARY CINEMATIC EXPERIENCES
                    </div>

                    {/* Subheadline in Body Font */}
                    <p
                      style={{
                        fontFamily: localTheme.fontFamilySecondary,
                        fontSize: '14px',
                        lineHeight: 1.6,
                        color: localTheme.colorText,
                        opacity: 0.8,
                        margin: 0,
                      }}
                    >
                      Real-time interactive preview of your dynamic typography pipeline, corner
                      geometry, and color grading palette.
                    </p>
                  </div>

                  {/* Surface Card Inside Preview */}
                  <div
                    style={{
                      padding: '16px 20px',
                      backgroundColor: localTheme.colorSurface,
                      border: `1px solid ${localTheme.colorPrimary}33`,
                      borderRadius:
                        localTheme.borderStyle === 'rounded-full'
                          ? '16px'
                          : localTheme.borderStyle === 'sharp'
                          ? '0px'
                          : localTheme.borderStyle === 'rounded-lg'
                          ? '14px'
                          : localTheme.borderStyle === 'rounded-sm'
                          ? '4px'
                          : '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: localTheme.colorText }}>
                        Card Surface ({localTheme.colorSurface})
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.7, color: localTheme.colorText }}>
                        Geometry: {localTheme.borderStyle}
                      </div>
                    </div>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: localTheme.colorSecondary,
                        border: '2px solid rgba(255,255,255,0.2)',
                      }}
                      title="Secondary Accent"
                    />
                  </div>

                  {/* Interactive Button CTA Styled in Real Time */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      style={{
                        padding: '12px 24px',
                        background: localTheme.colorPrimary,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius:
                          localTheme.borderStyle === 'rounded-full'
                            ? '9999px'
                            : localTheme.borderStyle === 'sharp'
                            ? '0px'
                            : localTheme.borderStyle === 'rounded-lg'
                            ? '12px'
                            : localTheme.borderStyle === 'rounded-sm'
                            ? '4px'
                            : '8px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: `0 8px 20px -4px ${localTheme.colorPrimary}88`,
                        fontFamily: localTheme.fontFamilyPrimary,
                        transition: 'transform 0.15s ease',
                      }}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      Explore Projects →
                    </button>

                    <button
                      style={{
                        padding: '12px 20px',
                        background: 'transparent',
                        color: localTheme.colorText,
                        border: `1px solid ${localTheme.colorText}44`,
                        borderRadius:
                          localTheme.borderStyle === 'rounded-full'
                            ? '9999px'
                            : localTheme.borderStyle === 'sharp'
                            ? '0px'
                            : localTheme.borderStyle === 'rounded-lg'
                            ? '12px'
                            : localTheme.borderStyle === 'rounded-sm'
                            ? '4px'
                            : '8px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontFamily: localTheme.fontFamilySecondary,
                      }}
                    >
                      Book Equipments
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: SECTION CONTENT & COPYWRITING (LIVE PREVIEW)                   */}
      {/* ========================================================================= */}
      {subTab === 'sections' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1.2fr 1fr', gap: '20px' }}>
          {/* Section Selector Sidebar */}
          <div className="adm-card" style={{ height: 'fit-content', padding: '12px' }}>
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                color: '#64748b',
                fontWeight: 700,
                padding: '8px 12px',
              }}
            >
              Public Sections
            </div>
            {[
              { key: 'hero', label: '1. Hero Intro' },
              { key: 'about', label: '2. Why Cinecraft' },
              { key: 'services', label: '3. Production Verticals' },
              { key: 'studios', label: '4. Studios Division' },
              { key: 'footer', label: '5. Contact & Footer' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`adm-nav-item ${activeSectionKey === key ? 'active' : ''}`}
                onClick={() => setActiveSectionKey(key as keyof SectionContent)}
                style={{ textAlign: 'left', width: '100%' }}
              >
                {label}
              </button>
            ))}

            <div style={{ marginTop: '20px', padding: '10px 12px', borderTop: '1px solid var(--adm-border)' }}>
              <button
                className="adm-btn adm-btn-primary"
                onClick={handleSaveSections}
                disabled={isSaving}
                style={{ width: '100%', fontSize: '12.5px' }}
              >
                {isSaving ? 'Publishing...' : '💾 Publish All Copy'}
              </button>
            </div>
          </div>

          {/* Center Column: Section Edit Forms */}
          <div className="adm-card">
            <div className="adm-card-header">
              <div>
                <h3 style={{ margin: 0 }}>
                  Editing: {activeSectionKey.toUpperCase()} Content
                </h3>
                <span style={{ fontSize: '12px', color: '#8f9099' }}>
                  Edits immediately render in the live preview on the right
                </span>
              </div>
              <button
                className="adm-btn adm-btn-primary"
                onClick={handleSaveSections}
                disabled={isSaving}
              >
                {isSaving ? 'Publishing...' : 'Publish Updates'}
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* HERO SECTION FORM */}
              {activeSectionKey === 'hero' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Hero Eyebrow Tagline</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={localSections.hero.eyebrow}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          hero: { ...localSections.hero, eyebrow: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Main Display Headline (Uppercase)</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={localSections.hero.headline}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          hero: { ...localSections.hero, headline: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Subheadline Narrative Narrative</label>
                    <textarea
                      rows={3}
                      className="adm-textarea"
                      value={localSections.hero.subheadline}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          hero: { ...localSections.hero, subheadline: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="adm-form-group">
                      <label className="adm-form-label">Primary CTA Label</label>
                      <input
                        type="text"
                        className="adm-input"
                        value={localSections.hero.ctaText}
                        onChange={(e) =>
                          setLocalSections({
                            ...localSections,
                            hero: { ...localSections.hero, ctaText: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-form-label">Primary CTA Link</label>
                      <input
                        type="text"
                        className="adm-input"
                        value={localSections.hero.ctaLink}
                        onChange={(e) =>
                          setLocalSections({
                            ...localSections,
                            hero: { ...localSections.hero, ctaLink: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="adm-form-group">
                      <label className="adm-form-label">Secondary CTA Label</label>
                      <input
                        type="text"
                        className="adm-input"
                        value={localSections.hero.secondaryCtaText}
                        onChange={(e) =>
                          setLocalSections({
                            ...localSections,
                            hero: { ...localSections.hero, secondaryCtaText: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-form-label">Secondary CTA Link</label>
                      <input
                        type="text"
                        className="adm-input"
                        value={localSections.hero.secondaryCtaLink}
                        onChange={(e) =>
                          setLocalSections({
                            ...localSections,
                            hero: { ...localSections.hero, secondaryCtaLink: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABOUT SECTION FORM */}
              {activeSectionKey === 'about' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Section Eyebrow</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={localSections.about.eyebrow}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          about: { ...localSections.about, eyebrow: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Section Title</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={localSections.about.title}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          about: { ...localSections.about, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Rich Body Narrative</label>
                    <textarea
                      rows={4}
                      className="adm-textarea"
                      value={localSections.about.description}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          about: { ...localSections.about, description: e.target.value },
                        })
                      }
                    />
                  </div>

                  {/* Bullet Points Editor */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label className="adm-form-label" style={{ margin: 0 }}>
                        Key Pillars / Bullet Points ({localSections.about.bulletPoints?.length || 0})
                      </label>
                      <button
                        type="button"
                        className="adm-btn adm-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        onClick={() => {
                          const updated = [...(localSections.about.bulletPoints || [])];
                          updated.push({ title: 'New Cinema Pillar', description: 'Description of the capability' });
                          setLocalSections({
                            ...localSections,
                            about: { ...localSections.about, bulletPoints: updated },
                          });
                        }}
                      >
                        + Add Pillar
                      </button>
                    </div>

                    {(localSections.about.bulletPoints || []).map((bp, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid var(--adm-border)',
                          marginBottom: '8px',
                          background: 'var(--adm-surface-light, rgba(255,255,255,0.02))',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            className="adm-input"
                            placeholder="Pillar Title"
                            value={bp.title}
                            onChange={(e) => {
                              const updated = [...localSections.about.bulletPoints];
                              updated[idx].title = e.target.value;
                              setLocalSections({
                                ...localSections,
                                about: { ...localSections.about, bulletPoints: updated },
                              });
                            }}
                          />
                          <button
                            type="button"
                            className="adm-btn adm-btn-danger"
                            style={{ padding: '6px 12px' }}
                            onClick={() => {
                              const updated = localSections.about.bulletPoints.filter((_, i) => i !== idx);
                              setLocalSections({
                                ...localSections,
                                about: { ...localSections.about, bulletPoints: updated },
                              });
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="text"
                          className="adm-input"
                          placeholder="Pillar Description"
                          value={bp.description}
                          onChange={(e) => {
                            const updated = [...localSections.about.bulletPoints];
                            updated[idx].description = e.target.value;
                            setLocalSections({
                              ...localSections,
                              about: { ...localSections.about, bulletPoints: updated },
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SERVICES SECTION FORM */}
              {activeSectionKey === 'services' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Services Section Heading</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={localSections.services.title}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          services: { ...localSections.services, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Services Narrative Subtitle</label>
                    <textarea
                      rows={3}
                      className="adm-textarea"
                      value={localSections.services.subtitle}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          services: { ...localSections.services, subtitle: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* STUDIOS SECTION FORM */}
              {activeSectionKey === 'studios' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Studios Division Title</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={localSections.studios.title}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          studios: { ...localSections.studios, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Studios Subtitle Description</label>
                    <textarea
                      rows={3}
                      className="adm-textarea"
                      value={localSections.studios.subtitle}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          studios: { ...localSections.studios, subtitle: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">CTA Button Label</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={localSections.studios.ctaText}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          studios: { ...localSections.studios, ctaText: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* FOOTER & CONTACT SECTION FORM */}
              {activeSectionKey === 'footer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Footer Tagline</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={localSections.footer?.tagline || ''}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          footer: { ...(localSections.footer || INITIAL_SECTIONS.footer), tagline: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="adm-form-group">
                      <label className="adm-form-label">Direct Contact Email</label>
                      <input
                        type="email"
                        className="adm-input"
                        value={localSections.footer?.contactEmail || ''}
                        onChange={(e) =>
                          setLocalSections({
                            ...localSections,
                            footer: { ...(localSections.footer || INITIAL_SECTIONS.footer), contactEmail: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-form-label">Direct Contact Phone</label>
                      <input
                        type="text"
                        className="adm-input"
                        value={localSections.footer?.contactPhone || ''}
                        onChange={(e) =>
                          setLocalSections({
                            ...localSections,
                            footer: { ...(localSections.footer || INITIAL_SECTIONS.footer), contactPhone: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Studio Physical Address</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={localSections.footer?.address || ''}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          footer: { ...(localSections.footer || INITIAL_SECTIONS.footer), address: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Copyright Legal Notice</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={localSections.footer?.copyrightText || ''}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          footer: { ...(localSections.footer || INITIAL_SECTIONS.footer), copyrightText: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Public Component Preview Pane */}
          <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
            <div className="adm-card" style={{ overflow: 'hidden' }}>
              <div
                className="adm-card-header"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,81,33,0.1), transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 10px #10b981',
                    }}
                  />
                  <h3 style={{ margin: 0, fontSize: '13.5px' }}>
                    Live Public Component Preview
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: '#8f9099' }}>
                  {activeSectionKey.toUpperCase()}
                </span>
              </div>

              {/* RENDER ACTIVE SECTION LIVE PREVIEW */}
              <div
                style={{
                  padding: '24px',
                  backgroundColor: '#0a0a0c',
                  color: '#ffffff',
                  minHeight: '340px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '16px',
                }}
              >
                {activeSectionKey === 'hero' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: localTheme.colorPrimary,
                          letterSpacing: '0.1em',
                          background: `${localTheme.colorPrimary}22`,
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {localSections.hero.eyebrow || 'CINECRAFT MEDIA'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontFamily: localTheme.fontFamilyPrimary,
                        fontSize: '22px',
                        fontWeight: 900,
                        lineHeight: 1.15,
                        textTransform: 'uppercase',
                      }}
                    >
                      {localSections.hero.headline || 'WE CRAFT VISIONARY CINEMATIC EXPERIENCES'}
                    </div>

                    <p
                      style={{
                        fontFamily: localTheme.fontFamilySecondary,
                        fontSize: '13px',
                        lineHeight: 1.6,
                        opacity: 0.75,
                        margin: 0,
                      }}
                    >
                      {localSections.hero.subheadline || 'Next-generation film production.'}
                    </p>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button
                        style={{
                          padding: '9px 18px',
                          background: localTheme.colorPrimary,
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '12px',
                          fontFamily: localTheme.fontFamilyPrimary,
                          cursor: 'pointer',
                        }}
                      >
                        {localSections.hero.ctaText || 'Explore Projects'} →
                      </button>
                      <button
                        style={{
                          padding: '9px 16px',
                          background: 'transparent',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '12px',
                          fontFamily: localTheme.fontFamilySecondary,
                        }}
                      >
                        {localSections.hero.secondaryCtaText || 'Rent Equipments'}
                      </button>
                    </div>
                  </div>
                )}

                {activeSectionKey === 'about' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: localTheme.colorPrimary,
                        letterSpacing: '0.1em',
                      }}
                    >
                      {localSections.about.eyebrow || 'WHY CINECRAFT'}
                    </span>
                    <div
                      style={{
                        fontFamily: localTheme.fontFamilyPrimary,
                        fontSize: '20px',
                        fontWeight: 800,
                        lineHeight: 1.25,
                      }}
                    >
                      {localSections.about.title || 'Where Visionary Stories Meet Relentless Craftsmanship'}
                    </div>
                    <p
                      style={{
                        fontFamily: localTheme.fontFamilySecondary,
                        fontSize: '12.5px',
                        lineHeight: 1.6,
                        opacity: 0.8,
                        margin: 0,
                      }}
                    >
                      {localSections.about.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      {(localSections.about.bulletPoints || []).map((bp, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '6px',
                            borderLeft: `3px solid ${localTheme.colorPrimary}`,
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{bp.title}</div>
                          <div style={{ fontSize: '11px', opacity: 0.7 }}>{bp.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSectionKey === 'services' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div
                      style={{
                        fontFamily: localTheme.fontFamilyPrimary,
                        fontSize: '20px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                      }}
                    >
                      {localSections.services.title || 'PRODUCTION VERTICALS'}
                    </div>
                    <p style={{ fontSize: '12.5px', opacity: 0.75, margin: 0, lineHeight: 1.5 }}>
                      {localSections.services.subtitle}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                      {['Cinema Camera Rental', 'Automotive Chase Rigging', 'Virtual Soundstages', 'ACES Color Grading'].map(
                        (srv, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '10px',
                              background: 'rgba(255,255,255,0.04)',
                              borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.08)',
                              fontSize: '11.5px',
                              fontWeight: 600,
                            }}
                          >
                            ✓ {srv}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {activeSectionKey === 'studios' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div
                      style={{
                        fontFamily: localTheme.fontFamilyPrimary,
                        fontSize: '20px',
                        fontWeight: 800,
                      }}
                    >
                      {localSections.studios.title || 'CINECRAFT STUDIOS'}
                    </div>
                    <p style={{ fontSize: '12.5px', opacity: 0.8, lineHeight: 1.6, margin: 0 }}>
                      {localSections.studios.subtitle}
                    </p>
                    <button
                      style={{
                        alignSelf: 'flex-start',
                        padding: '10px 20px',
                        background: localTheme.colorPrimary,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginTop: '6px',
                      }}
                    >
                      {localSections.studios.ctaText || 'Inquire for Studio'}
                    </button>
                  </div>
                )}

                {activeSectionKey === 'footer' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: localTheme.colorPrimary }}>
                      CINECRAFT MEDIA
                    </div>
                    <div style={{ fontSize: '12.5px', opacity: 0.8 }}>
                      {localSections.footer?.tagline || INITIAL_SECTIONS.footer.tagline}
                    </div>
                    <div style={{ fontSize: '11.5px', opacity: 0.7 }}>
                      📧 {localSections.footer?.contactEmail || INITIAL_SECTIONS.footer.contactEmail} • 📞{' '}
                      {localSections.footer?.contactPhone || INITIAL_SECTIONS.footer.contactPhone}
                    </div>
                    <div style={{ fontSize: '11.5px', opacity: 0.6 }}>
                      📍 {localSections.footer?.address || INITIAL_SECTIONS.footer.address}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.4, marginTop: '8px' }}>
                      {localSections.footer?.copyrightText || INITIAL_SECTIONS.footer.copyrightText}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: ASSET & MEDIA MANAGEMENT (REAL UPLOADS & FILE PICKER)           */}
      {/* ========================================================================= */}
      {subTab === 'assets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* File Upload & Link Form Card */}
          <div className="adm-card">
            <div className="adm-card-header">
              <div>
                <h3 style={{ margin: 0 }}>Attach Media Asset to Dynamic CMS</h3>
                <span style={{ fontSize: '12px', color: '#8f9099' }}>
                  Upload high-res images, behind-the-scenes clips, or link external CDN URLs
                </span>
              </div>

              {/* Source Switcher */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`adm-btn ${assetSourceType === 'upload' ? 'adm-btn-primary' : 'adm-btn-secondary'}`}
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                  onClick={() => setAssetSourceType('upload')}
                >
                  📁 Upload File from Device
                </button>
                <button
                  type="button"
                  className={`adm-btn ${assetSourceType === 'url' ? 'adm-btn-primary' : 'adm-btn-secondary'}`}
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                  onClick={() => setAssetSourceType('url')}
                >
                  🔗 External CDN URL
                </button>
              </div>
            </div>

            <form onSubmit={handleUploadOrAddAsset} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">Target Section</label>
                  <select
                    className="adm-select"
                    value={newAssetSection}
                    onChange={(e) => setNewAssetSection(e.target.value)}
                  >
                    <option value="hero">Hero Background / Logo</option>
                    <option value="about">About / Studios Feature</option>
                    <option value="services">Services Stacking Deck</option>
                    <option value="studios">Studios Banner</option>
                    <option value="footer">Footer Brand mark</option>
                  </select>
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">Asset Identifier Key</label>
                  <input
                    type="text"
                    className="adm-input"
                    placeholder="e.g. hero_cinematic_bg"
                    value={newAssetKey}
                    onChange={(e) => setNewAssetKey(e.target.value)}
                    required
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">Aspect Ratio</label>
                  <select
                    className="adm-select"
                    value={newAssetRatio}
                    onChange={(e) => setNewAssetRatio(e.target.value)}
                  >
                    <option value="16:9">16:9 Cinema Widescreen</option>
                    <option value="2.39:1">2.39:1 Anamorphic Scope</option>
                    <option value="4:3">4:3 Academy Ratio</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="9:16">9:16 Vertical Reel</option>
                  </select>
                </div>
              </div>

              {/* Upload Dropzone OR URL Input */}
              {assetSourceType === 'upload' ? (
                <div style={{ marginTop: '16px' }}>
                  <label className="adm-form-label">Media File (Images, WEBP, PNG, MP4 up to 25MB)</label>
                  <div
                    style={{
                      border: '2px dashed var(--adm-border)',
                      borderRadius: '10px',
                      padding: '24px',
                      textAlign: 'center',
                      background: 'var(--adm-surface-light, rgba(255,255,255,0.02))',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onClick={() => document.getElementById('adm-file-input')?.click()}
                  >
                    <input
                      id="adm-file-input"
                      type="file"
                      accept="image/*,video/mp4"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />

                    {filePreviewUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                        <img
                          src={filePreviewUrl}
                          alt="Preview"
                          style={{
                            maxHeight: '90px',
                            borderRadius: '6px',
                            border: '1px solid var(--adm-border)',
                            objectFit: 'cover',
                          }}
                        />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, color: 'var(--adm-text)', fontSize: '13px' }}>
                            {selectedFile?.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#8f9099' }}>
                            {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB • Ready to Upload
                          </div>
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px', marginTop: '6px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              setFilePreviewUrl(null);
                            }}
                          >
                            Change File
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📸</div>
                        <div style={{ fontWeight: 600, color: 'var(--adm-text)', fontSize: '13.5px' }}>
                          Drag & drop cinema media or click to browse
                        </div>
                        <div style={{ fontSize: '12px', color: '#8f9099', marginTop: '4px' }}>
                          Supports JPG, PNG, WEBP, SVG, MP4 (Max 25MB)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">External Image or Video URL</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="https://images.unsplash.com/... or /uploads/..."
                      value={newAssetUrl}
                      onChange={(e) => setNewAssetUrl(e.target.value)}
                      required
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">Alt Text (Accessibility & SEO)</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="ARRI Alexa 35 Camera Package"
                      value={newAssetAlt}
                      onChange={(e) => setNewAssetAlt(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '18px' }}>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  disabled={isUploading || (assetSourceType === 'upload' && !selectedFile)}
                >
                  {isUploading ? 'Uploading & Processing...' : '+ Add Asset to Media Library'}
                </button>

                {assets.length === 0 && (
                  <button
                    type="button"
                    className="adm-btn adm-btn-secondary"
                    onClick={handleSeedAssets}
                  >
                    ⚡ Seed Recommended Production Assets
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Active Asset Library Gallery */}
          <div className="adm-card">
            <div className="adm-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0 }}>Active Media Library ({filteredAssets.length} items)</h3>
                {assets.length === 0 && (
                  <span style={{ fontSize: '12px', color: '#f59e0b' }}>
                    Library empty — upload media or click Seed above
                  </span>
                )}
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="adm-input"
                  placeholder="Search assets by key or alt..."
                  style={{ width: '220px', padding: '6px 12px', fontSize: '12.5px' }}
                  value={assetSearchQuery}
                  onChange={(e) => setAssetSearchQuery(e.target.value)}
                />

                <div style={{ display: 'flex', gap: '4px' }}>
                  {['all', 'hero', 'about', 'services', 'studios', 'footer'].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setAssetFilterSection(sec)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        border: '1px solid var(--adm-border)',
                        background:
                          assetFilterSection === sec
                            ? 'var(--adm-primary)'
                            : 'var(--adm-surface-light, rgba(255,255,255,0.04))',
                        color: assetFilterSection === sec ? '#fff' : 'var(--adm-text)',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid */}
            <div style={{ padding: '24px' }}>
              {filteredAssets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8f9099' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                  <div style={{ fontWeight: 600, color: 'var(--adm-text)' }}>No assets found</div>
                  <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
                    Try adjusting the search query or section filter, or upload a new media file.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px',
                  }}
                >
                  {filteredAssets.map((asset) => {
                    const displayUrl = getAssetDisplayUrl(asset.url);
                    const assetId = asset.id || asset.key;
                    const isCopied = copiedAssetId === assetId;

                    return (
                      <div
                        key={assetId}
                        style={{
                          background: 'var(--adm-surface-light, rgba(255,255,255,0.03))',
                          borderRadius: '10px',
                          border: '1px solid var(--adm-border)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'transform 0.15s ease, border-color 0.15s ease',
                        }}
                      >
                        {/* Media Thumbnail Container */}
                        <div
                          style={{
                            height: '160px',
                            overflow: 'hidden',
                            background: '#050507',
                            position: 'relative',
                          }}
                        >
                          <img
                            src={displayUrl}
                            alt={asset.altText || asset.key}
                            onError={(e) => {
                              // Fallback placeholder if missing
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80';
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          />

                          {/* Section Tag Badge */}
                          <span
                            style={{
                              position: 'absolute',
                              top: '10px',
                              left: '10px',
                              background: 'rgba(0,0,0,0.75)',
                              backdropFilter: 'blur(4px)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#ff5121',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {asset.section}
                          </span>

                          {/* Aspect Ratio Badge */}
                          <span
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              background: 'rgba(0,0,0,0.75)',
                              backdropFilter: 'blur(4px)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              color: '#ffffff',
                              fontWeight: 600,
                            }}
                          >
                            {asset.aspectRatio || '16:9'}
                          </span>
                        </div>

                        {/* Details & Actions */}
                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div>
                            <div
                              style={{
                                fontSize: '13.5px',
                                fontWeight: 700,
                                color: 'var(--adm-text)',
                                wordBreak: 'break-all',
                              }}
                            >
                              {asset.key}
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#8f9099',
                                marginTop: '2px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {asset.altText || 'No Alt Text'}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                            <button
                              type="button"
                              className="adm-btn adm-btn-secondary"
                              style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                              onClick={() => handleCopyAssetUrl(asset.url, assetId)}
                            >
                              {isCopied ? '✓ Copied URL' : '📋 Copy URL'}
                            </button>
                            <button
                              type="button"
                              className="adm-btn adm-btn-danger"
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                              onClick={() => handleDeleteAsset(assetId)}
                              title="Delete from Media Library"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
