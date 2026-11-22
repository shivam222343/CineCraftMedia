import React, { useState } from 'react';
import type { ThemeConfig, SectionContent, MediaAsset } from './types';
import { apiSaveTheme, apiSaveContent, apiUploadAsset } from './api';

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
  const [localSections, setLocalSections] = useState<SectionContent>(sections);
  const [activeSectionKey, setActiveSectionKey] = useState<keyof SectionContent>('hero');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Asset Upload Form State
  const [newAssetSection, setNewAssetSection] = useState('hero');
  const [newAssetKey, setNewAssetKey] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetAlt, setNewAssetAlt] = useState('');
  const [newAssetRatio, setNewAssetRatio] = useState('16:9');

  const handleSaveTheme = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    const res = await apiSaveTheme(localTheme);
    setIsSaving(false);
    onThemeUpdated(localTheme);
    setSaveFeedback(res.isLive ? 'Theme saved & Redis cache invalidated!' : 'Theme updated in preview state.');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleSaveSections = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    const res = await apiSaveContent(localSections);
    setIsSaving(false);
    onSectionsUpdated(localSections);
    setSaveFeedback(res.isLive ? 'CMS copy published & Redis cache invalidated!' : 'CMS copy updated in preview state.');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetUrl || !newAssetKey) return;

    const createdAsset: MediaAsset = {
      id: `asset-${Date.now()}`,
      section: newAssetSection,
      key: newAssetKey,
      url: newAssetUrl,
      altText: newAssetAlt,
      aspectRatio: newAssetRatio,
      storageType: 'external',
      uploadedAt: new Date().toISOString(),
    };

    await apiUploadAsset(createdAsset);
    onAssetsUpdated([createdAsset, ...assets]);
    setNewAssetKey('');
    setNewAssetUrl('');
    setNewAssetAlt('');
    setSaveFeedback('Asset successfully linked to Dynamic CMS.');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  return (
    <div className="adm-view-container">
      {/* Header */}
      <div className="adm-view-header">
        <div className="adm-view-title">
          <h1>CCM Studio</h1>
          <p>Control visual themes, typography, dynamic copywriting, and media assets in real-time.</p>
        </div>
        {saveFeedback && (
          <div
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            ✓ {saveFeedback}
          </div>
        )}
      </div>

      {/* CMS Subtabs */}
      <div className="adm-tabs">
        <button
          className={`adm-tab-btn ${subTab === 'theme' ? 'active' : ''}`}
          onClick={() => setSubTab('theme')}
        >
          Typography & Theme Settings
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
          Asset & Media Management
        </button>
      </div>

      {/* Subtab 1: Theme & Typography */}
      {subTab === 'theme' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Typography Card */}
          <div className="adm-card">
            <div className="adm-card-header">
              <h3>Global Typography (Google Fonts Catalog)</h3>
              <span style={{ fontSize: '12px', color: '#8f9099' }}>Dynamically loaded on public page</span>
            </div>
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              <div className="adm-form-group">
                <label className="adm-form-label">Primary Display Font</label>
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
                <label className="adm-form-label">Body Text Font</label>
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
                <label className="adm-form-label">Border Corner Style</label>
                <select
                  className="adm-select"
                  value={localTheme.borderStyle}
                  onChange={(e) => setLocalTheme({ ...localTheme, borderStyle: e.target.value as any })}
                >
                  <option value="rounded-sm">Subtle (rounded-sm)</option>
                  <option value="rounded-md">Modern Medium (rounded-md)</option>
                  <option value="rounded-lg">Prominent Curved (rounded-lg)</option>
                  <option value="sharp">Cinematic Sharp (0px)</option>
                  <option value="rounded-full">Pill / Oval (rounded-full)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Color Pickers Card */}
          <div className="adm-card">
            <div className="adm-card-header">
              <h3>Global Color Palette & CSS Variables</h3>
              <button
                className="adm-btn adm-btn-primary"
                onClick={handleSaveTheme}
                disabled={isSaving}
              >
                {isSaving ? 'Refreshing Cache...' : 'Save & Refresh Theme'}
              </button>
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
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Primary Accent</div>
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
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Secondary Accent</div>
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
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Backdrop Background</div>
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
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Dynamic Text Content */}
      {subTab === 'sections' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
          {/* Section selector sidebar */}
          <div className="adm-card" style={{ height: 'fit-content', padding: '12px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, padding: '8px 12px' }}>
              Public Sections
            </div>
            {(['hero', 'about', 'services', 'studios', 'footer'] as Array<keyof SectionContent>).map((sec) => (
              <button
                key={sec}
                className={`adm-nav-item ${activeSectionKey === sec ? 'active' : ''}`}
                onClick={() => setActiveSectionKey(sec)}
              >
                {sec.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Section Edit Panel */}
          <div className="adm-card">
            <div className="adm-card-header">
              <h3>Editing: {activeSectionKey.toUpperCase()} Section</h3>
              <button
                className="adm-btn adm-btn-primary"
                onClick={handleSaveSections}
                disabled={isSaving}
              >
                {isSaving ? 'Publishing...' : 'Publish Content Updates'}
              </button>
            </div>
            <div style={{ padding: '24px' }}>
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
                    <label className="adm-form-label">Main Display Headline</label>
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
                    <label className="adm-form-label">Subheadline Narrative</label>
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
                </div>
              )}

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
                    <label className="adm-form-label">Section Headline</label>
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
                </div>
              )}

              {activeSectionKey === 'services' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Services Heading</label>
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
                    <label className="adm-form-label">Services Subtitle</label>
                    <input
                      type="text"
                      className="adm-input"
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

              {activeSectionKey === 'studios' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Studios Banner Headline</label>
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
                    <label className="adm-form-label">Subtitle Description</label>
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

              {activeSectionKey === 'footer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Footer Tagline</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={localSections.footer.tagline}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          footer: { ...localSections.footer, tagline: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="adm-form-group">
                      <label className="adm-form-label">Inquiry Email</label>
                      <input
                        type="email"
                        className="adm-input"
                        value={localSections.footer.contactEmail}
                        onChange={(e) =>
                          setLocalSections({
                            ...localSections,
                            footer: { ...localSections.footer, contactEmail: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="adm-form-group">
                      <label className="adm-form-label">Direct Phone</label>
                      <input
                        type="text"
                        className="adm-input"
                        value={localSections.footer.contactPhone}
                        onChange={(e) =>
                          setLocalSections({
                            ...localSections,
                            footer: { ...localSections.footer, contactPhone: e.target.value },
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
                      value={localSections.footer.address}
                      onChange={(e) =>
                        setLocalSections({
                          ...localSections,
                          footer: { ...localSections.footer, address: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Media & Asset Management */}
      {subTab === 'assets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Add Asset Form Card */}
          <div className="adm-card">
            <div className="adm-card-header">
              <h3>Attach New Asset to Section</h3>
            </div>
            <form onSubmit={handleAddAsset} style={{ padding: '24px' }}>
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
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginTop: '12px' }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">Media Source URL or Storage Path</label>
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

              <button type="submit" className="adm-btn adm-btn-primary" style={{ marginTop: '10px' }}>
                + Add Asset to Media Library
              </button>
            </form>
          </div>

          {/* Asset Gallery */}
          <div className="adm-card">
            <div className="adm-card-header">
              <h3>Active CMS Asset Library ({assets.length} items)</h3>
            </div>
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {assets.map((asset) => (
                <div
                  key={asset.id || asset.key}
                  style={{
                    background: 'var(--adm-surface-light)',
                    borderRadius: '10px',
                    border: '1px solid var(--adm-border)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ height: '160px', overflow: 'hidden', background: '#000', position: 'relative' }}>
                    <img
                      src={asset.url}
                      alt={asset.altText}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#ff5121',
                        fontWeight: 700,
                      }}
                    >
                      {asset.section.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--adm-text)' }}>{asset.key}</div>
                    <div style={{ fontSize: '12px', color: '#8f9099', marginTop: '4px' }}>
                      Ratio: {asset.aspectRatio} • {asset.altText || 'No Alt Text'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
