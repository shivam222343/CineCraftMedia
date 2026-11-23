import { useState, useEffect } from 'react';
import './App.css';
import { Navbar } from './Components/Navbar';
import { HeroSection } from './Components/HeroSection';
import { VideoScrollSection } from './Components/VideoScrollSection';
import { CardStackSection } from './Components/CardStackSection';
import { FeaturedProjects } from './Components/FeaturedProjects';
import { WhyLxL } from './Components/WhyLxL';
import { StudiosBanner } from './Components/StudiosBanner';
import { Footer } from './Components/Footer';
import { PageTransition } from './Components/PageTransition';
import { WhatsAppButton } from './Components/WhatsAppButton';
import { EquipmentsPage } from './Components/EquipmentsPage';
import { AdminDashboard } from './admin/AdminDashboard';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ThemeToggle } from './Components/ThemeToggle';
import { NotFoundPage } from './Components/NotFoundPage';

type AppRoute = 'home' | 'equipments' | 'admin' | 'not-found';

const resolveRoute = (pathname: string): AppRoute => {
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (cleanPath === '/' || cleanPath === '/home') return 'home';
  if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) return 'admin';
  if (cleanPath === '/equipments' || cleanPath.startsWith('/equipments/')) return 'equipments';
  return 'not-found';
};

// Default Color themes for each nav destination's organic stroke transition
const SECTION_TRANSITION_COLORS: Record<string, string> = {
  'services-stack': '#670b22', // Deep Wine / Burgundy Red
  'featured-projects': '#ff5121', // LxL Signature Electric Orange
  'studios': '#055dff', // Electric Royal Blue
  'why-lxl': '#b84c1b', // Terracotta Ochre Amber
  'footer': '#163f2b', // Deep Forest Emerald
  'hero': '#ff5121',
  'home': '#ff5121',
  'equipments': '#0d9488', // Deep Cinema Teal / Cyan transition for Equipments
  'admin': '#ff5121',
};

function AppContent() {
  const { cmsTheme } = useTheme();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined') {
      return resolveRoute(window.location.pathname);
    }
    return 'home';
  });

  const [transitionState, setTransitionState] = useState<{
    active: boolean;
    phase: 'idle' | 'enter' | 'exit';
    color: string;
  }>({
    active: false,
    phase: 'idle',
    color: cmsTheme?.colorPrimary || '#ff5121',
  });

  // Listen to browser forward/back buttons & dev keyboard shortcut (Alt + A) for Admin
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(resolveRoute(window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        if (currentRoute === 'admin') {
          window.history.pushState({}, '', '/');
          setCurrentRoute('home');
        } else {
          window.history.pushState({}, '', '/admin/dashboard');
          setCurrentRoute('admin');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentRoute]);

  const handleNavigate = (sectionId: string) => {
    let transitionColor = SECTION_TRANSITION_COLORS[sectionId] || cmsTheme?.colorPrimary || '#ff5121';
    if (sectionId === 'hero' || sectionId === 'home' || sectionId === 'featured-projects' || sectionId === 'admin') {
      transitionColor = cmsTheme?.colorPrimary || '#ff5121';
    } else if (sectionId === 'studios') {
      transitionColor = cmsTheme?.colorAccentBlue || '#055dff';
    }

    // Phase 1: Slow, cinematic drawing of the organic fluid stroke on screen (0.92s)
    setTransitionState({
      active: true,
      phase: 'enter',
      color: transitionColor,
    });

    // At full coverage (920ms): jump to target section / route behind the color curtain
    setTimeout(() => {
      const isNavigatingToEquipments = sectionId === 'equipments';

      if (isNavigatingToEquipments) {
        setCurrentRoute('equipments');
        if (window.location.pathname !== '/equipments') {
          window.history.pushState({}, '', '/equipments');
        }
      } else {
        // If navigating away from equipments or 404 back to home
        if (currentRoute === 'equipments' || currentRoute === 'not-found') {
          setCurrentRoute('home');
          if (window.location.pathname !== '/') {
            window.history.pushState({}, '', '/');
          }
        }

        if (sectionId === 'home' || sectionId === 'hero') {
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else {
          // Wait for home DOM to mount before scrolling
          const delay = (currentRoute === 'equipments' || currentRoute === 'not-found') ? 60 : 0;
          setTimeout(() => {
            const targetEl = document.getElementById(sectionId);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'instant', block: 'start' });
            }
          }, delay);
        }
      }

      // Phase 2: Fade & wipe away the curtain revealing destination
      setTransitionState((prev) => ({ ...prev, phase: 'exit' }));

      // Phase 3: Teardown transition overlay (0.75s)
      setTimeout(() => {
        setTransitionState({
          active: false,
          phase: 'idle',
          color: transitionColor,
        });
      }, 750);
    }, 920);
  };

  return (
    <div className="lxl-app-root">
      {/* Full-Screen Organic SVG Page Transition with slow hand-drawn brush stroke */}
      <PageTransition
        active={transitionState.active}
        phase={transitionState.phase}
        color={transitionState.color}
      />

      {currentRoute === 'admin' ? (
        <AdminDashboard
          onBackToPublicSite={() => {
            if (window.location.pathname !== '/') {
              window.history.pushState({}, '', '/');
            }
            setCurrentRoute('home');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
        />
      ) : currentRoute === 'equipments' ? (
        <>
          {/* Standalone Equipments Page (/equipments) */}
          <EquipmentsPage onBackToHome={() => handleNavigate('home')} />

          {/* Floating Interactive WhatsApp Inquiry Button */}
          <WhatsAppButton />

          {/* Global Theme Toggle */}
          <ThemeToggle />
        </>
      ) : currentRoute === 'not-found' ? (
        <NotFoundPage
          onBackToHome={() => {
            if (window.location.pathname !== '/') {
              window.history.pushState({}, '', '/');
            }
            setCurrentRoute('home');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onNavigateEquipments={() => {
            if (window.location.pathname !== '/equipments') {
              window.history.pushState({}, '', '/equipments');
            }
            setCurrentRoute('equipments');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onNavigateAdmin={() => {
            if (window.location.pathname !== '/admin/dashboard') {
              window.history.pushState({}, '', '/admin/dashboard');
            }
            setCurrentRoute('admin');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
        />
      ) : (
        <>
          {/* Main Navigation with Mega Dropdowns & Custom Underlines */}
          <Navbar onNavigateSection={handleNavigate} />

          {/* Hero Section */}
          <HeroSection />

          {/* Video Zoom & Display Statement Section */}
          <VideoScrollSection />

          {/* Services Card Stacking Deck */}
          <CardStackSection onNavigateEquipments={() => handleNavigate('equipments')} />

          {/* Featured Entertainment Projects Showcase */}
          <FeaturedProjects />

          {/* About & Ethos Section */}
          <WhyLxL />

          {/* Cinecraft Studios Commercial Extension */}
          <StudiosBanner />

          {/* Agency Footer */}
          <Footer />

          {/* Floating Interactive WhatsApp Inquiry Button */}
          <WhatsAppButton />

          {/* Global Theme Toggle */}
          <ThemeToggle />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
