import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '../admin/types';
import { INITIAL_THEME } from '../admin/mockData';
import { apiGetTheme } from '../admin/api';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  cmsTheme: ThemeConfig;
  updateCmsTheme: (newTheme: Partial<ThemeConfig>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'cinecraft_media_theme';
const CMS_THEME_STORAGE_KEY = 'ccm_cms_theme';

export const applyCmsThemeToDom = (themeConfig: ThemeConfig) => {
  if (typeof document === 'undefined' || !themeConfig) return;

  const cleanFont = (f: string) => f.split(',')[0].replace(/['"]/g, '').trim();
  const primaryFont = cleanFont(themeConfig.fontFamilyPrimary || 'Syne');
  const secondaryFont = cleanFont(themeConfig.fontFamilySecondary || 'Inter');

  // 1. Dynamically inject Google Fonts Link into <head>
  const linkId = 'dynamic-cms-google-fonts';
  let linkEl = document.getElementById(linkId) as HTMLLinkElement | null;
  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.id = linkId;
    linkEl.rel = 'stylesheet';
    document.head.appendChild(linkEl);
  }
  linkEl.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    primaryFont
  )}:wght@400;600;700;800;900&family=${encodeURIComponent(
    secondaryFont
  )}:wght@400;500;600;700&display=swap`;

  // 2. Map border geometry
  const radiusMap: Record<string, string> = {
    sharp: '0px',
    'rounded-sm': '4px',
    'rounded-md': '8px',
    'rounded-lg': '14px',
    'rounded-full': '9999px',
  };
  const radius = radiusMap[themeConfig.borderStyle] || '8px';

  const brandColor = themeConfig.colorPrimary || '#ff5121';
  const secondaryColor = themeConfig.colorSecondary || '#670b22';
  const accentBlue = themeConfig.colorAccentBlue || '#055dff';

  // 3. Inject global style tag with !important so it reliably overrides CSS classes
  const styleId = 'dynamic-cms-theme-styles';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    :root, [data-theme="dark"], [data-theme="light"], html, body {
      --swatch--brand: ${brandColor} !important;
      --color-primary: ${brandColor} !important;
      --adm-primary: ${brandColor} !important;
      --swatch--studios: ${accentBlue} !important;
      --swatch--accent-blue: ${accentBlue} !important;
      --color-accent-blue: ${accentBlue} !important;
      --swatch--burgundy: ${secondaryColor} !important;
      --color-secondary: ${secondaryColor} !important;
      --font-heading: "${primaryFont}", sans-serif !important;
      --font-body: "${secondaryFont}", sans-serif !important;
      --adm-radius: ${radius} !important;
    }
  `;

  // 4. Also set properties on documentElement style directly
  const root = document.documentElement;
  root.style.setProperty('--font-heading', `"${primaryFont}", sans-serif`);
  root.style.setProperty('--font-body', `"${secondaryFont}", sans-serif`);
  root.style.setProperty('--swatch--brand', brandColor);
  root.style.setProperty('--adm-primary', brandColor);
  root.style.setProperty('--color-primary', brandColor);
  root.style.setProperty('--swatch--studios', accentBlue);
  root.style.setProperty('--swatch--accent-blue', accentBlue);
  root.style.setProperty('--swatch--burgundy', secondaryColor);
  root.style.setProperty('--adm-radius', radius);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Light / Dark mode state
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark';
  });

  // Dynamic CMS Theme state
  const [cmsTheme, setCmsTheme] = useState<ThemeConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCms = localStorage.getItem(CMS_THEME_STORAGE_KEY);
        if (savedCms) {
          const parsed = JSON.parse(savedCms);
          return { ...INITIAL_THEME, ...parsed };
        }
      } catch {}
    }
    return INITIAL_THEME;
  });

  const applyTheme = (newTheme: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-theme', newTheme);
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);

      const body = document.body;
      if (body) {
        body.setAttribute('data-theme', newTheme);
        body.classList.remove('light', 'dark');
        body.classList.add(newTheme);
      }
    }
  };

  // Sync dark/light theme mode
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Apply CMS theme immediately on mount and on cmsTheme state change
  useEffect(() => {
    applyCmsThemeToDom(cmsTheme);
  }, [cmsTheme]);

  // Load public theme from backend API on initial application load
  useEffect(() => {
    let mounted = true;

    async function fetchPublicTheme() {
      try {
        const res = await apiGetTheme();
        if (mounted && res?.data) {
          setCmsTheme((prev) => {
            const merged = { ...prev, ...res.data };
            applyCmsThemeToDom(merged);
            localStorage.setItem(CMS_THEME_STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.warn('[ThemeContext] Could not fetch remote theme, using cached/default:', err);
      }
    }

    fetchPublicTheme();

    // Listen for live theme updates broadcasted from CCM Studio
    const handleCmsThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeConfig>;
      if (customEvent.detail) {
        setCmsTheme(customEvent.detail);
        applyCmsThemeToDom(customEvent.detail);
      }
    };

    window.addEventListener('ccm_theme_changed', handleCmsThemeChange);
    window.addEventListener('storage', (e) => {
      if (e.key === CMS_THEME_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setCmsTheme(parsed);
          applyCmsThemeToDom(parsed);
        } catch {}
      }
    });

    return () => {
      mounted = false;
      window.removeEventListener('ccm_theme_changed', handleCmsThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const updateCmsTheme = useCallback((newTheme: Partial<ThemeConfig>) => {
    setCmsTheme((prev) => {
      const updated = { ...prev, ...newTheme };
      applyCmsThemeToDom(updated);
      localStorage.setItem(CMS_THEME_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ccm_theme_changed', { detail: updated }));
      return updated;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, cmsTheme, updateCmsTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
