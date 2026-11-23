import React from 'react';
import { CinecraftMediaLogo } from './Icons';
import { ThemeToggle } from './ThemeToggle';

interface NotFoundPageProps {
  onBackToHome: () => void;
  onNavigateEquipments: () => void;
  onNavigateAdmin: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onBackToHome,
  onNavigateEquipments,
  onNavigateAdmin,
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--swatch--dark)',
        color: 'var(--swatch--light, #fcf2bd)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-body)',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Background 2D Film Grid Lines & Camera Crosshairs */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top Bar with Brand Logo & Theme Toggle */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <button
          onClick={onBackToHome}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Cinecraft Media Home"
        >
          <CinecraftMediaLogo height={38} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 81, 33, 0.3)',
              background: 'rgba(255, 81, 33, 0.08)',
              fontSize: '12px',
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
              color: 'var(--swatch--brand)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--swatch--brand)',
                boxShadow: '0 0 10px var(--swatch--brand)',
                animation: 'ccmBlink 1.4s ease-in-out infinite',
              }}
            />
            <span>REC 00:04:04:24</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main 2D Animated Stage */}
      <main
        style={{
          maxWidth: '820px',
          margin: 'auto',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 5,
          padding: '40px 0',
        }}
      >
        {/* Minimal 2D Kinetic Cinema Vector Animation */}
        <div
          style={{
            width: '280px',
            height: '180px',
            margin: '0 auto 32px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            viewBox="0 0 280 180"
            fill="none"
            style={{
              width: '100%',
              height: '100%',
              filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.3))',
            }}
          >
            {/* Camera Viewfinder Outer Frame */}
            <rect
              x="20"
              y="15"
              width="240"
              height="150"
              rx="12"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.25"
              strokeDasharray="8 6"
            />

            {/* Corner Framing Marks */}
            <path d="M 32 35 L 32 25 L 42 25" stroke="var(--swatch--brand)" strokeWidth="3" strokeLinecap="round" />
            <path d="M 248 35 L 248 25 L 238 25" stroke="var(--swatch--brand)" strokeWidth="3" strokeLinecap="round" />
            <path d="M 32 145 L 32 155 L 42 155" stroke="var(--swatch--brand)" strokeWidth="3" strokeLinecap="round" />
            <path d="M 248 145 L 248 155 L 238 155" stroke="var(--swatch--brand)" strokeWidth="3" strokeLinecap="round" />

            {/* Center Crosshair */}
            <circle cx="140" cy="90" r="14" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="140" y1="70" x2="140" y2="78" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="140" y1="102" x2="140" y2="110" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="120" y1="90" x2="128" y2="90" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="152" y1="90" x2="160" y2="90" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />

            {/* Left 35mm Film Reel (Spinning clockwise) */}
            <g
              style={{
                transformOrigin: '78px 90px',
                animation: 'ccmSpinReel 8s linear infinite',
              }}
            >
              <circle cx="78" cy="90" r="32" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="78" cy="90" r="10" stroke="var(--swatch--brand)" strokeWidth="2" />
              <circle cx="78" cy="70" r="4.5" fill="var(--swatch--brand)" />
              <circle cx="98" cy="90" r="4.5" fill="var(--swatch--brand)" />
              <circle cx="78" cy="110" r="4.5" fill="var(--swatch--brand)" />
              <circle cx="58" cy="90" r="4.5" fill="var(--swatch--brand)" />
            </g>

            {/* Connecting Film Ribbon Wave */}
            <path
              d="M 98 68 Q 140 115 182 68"
              stroke="var(--swatch--brand)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="6 4"
              style={{ animation: 'ccmDashWave 2s linear infinite' }}
            />

            {/* Right 35mm Film Reel (Spinning counter-clockwise) */}
            <g
              style={{
                transformOrigin: '202px 90px',
                animation: 'ccmSpinReelReverse 8s linear infinite',
              }}
            >
              <circle cx="202" cy="90" r="32" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="202" cy="90" r="10" stroke="var(--swatch--brand)" strokeWidth="2" />
              <circle cx="202" cy="70" r="4.5" fill="var(--swatch--brand)" />
              <circle cx="222" cy="90" r="4.5" fill="var(--swatch--brand)" />
              <circle cx="202" cy="110" r="4.5" fill="var(--swatch--brand)" />
              <circle cx="182" cy="90" r="4.5" fill="var(--swatch--brand)" />
            </g>

            {/* Minimal Clapper Board Stick Floating at Top */}
            <g style={{ animation: 'ccmFloatClap 4s ease-in-out infinite' }}>
              <rect x="106" y="24" width="68" height="16" rx="3" fill="#1b1614" stroke="currentColor" strokeWidth="1.5" />
              <path d="M 116 25 L 126 39 M 132 25 L 142 39 M 148 25 L 158 39" stroke="var(--swatch--brand)" strokeWidth="3" />
            </g>
          </svg>
        </div>

        {/* Scene Tagline Badge */}
        <div style={{ display: 'inline-block', marginBottom: '16px' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 81, 33, 0.12)',
              border: '1px solid rgba(255, 81, 33, 0.35)',
              color: 'var(--swatch--brand)',
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Scene 404 • Missing Footage
          </span>
        </div>

        {/* 404 Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(54px, 10vw, 110px)',
            fontWeight: 900,
            lineHeight: 1,
            margin: '0 0 16px',
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, currentColor 40%, var(--swatch--brand) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textTransform: 'uppercase',
          }}
        >
          Lost in the Edit
        </h1>

        {/* Unique Creative Sentence */}
        <p
          style={{
            fontSize: 'clamp(16px, 2.2vw, 21px)',
            fontWeight: 500,
            lineHeight: 1.6,
            maxWidth: '640px',
            margin: '0 auto 12px',
            color: 'var(--swatch--light)',
            opacity: 0.9,
          }}
        >
          The scene you&apos;re looking for was left on the cutting room floor—or perhaps it was only a dream in the director&apos;s cut.
        </p>

        {/* Cinematic Sub-Quote */}
        <p
          style={{
            fontSize: '13.5px',
            lineHeight: 1.6,
            maxWidth: '480px',
            margin: '0 auto 36px',
            color: 'var(--swatch--light)',
            opacity: 0.6,
          }}
        >
          Even the greatest cinematic masterpieces have missing reels. Let&apos;s get you back on set.
        </p>

        {/* Action Button Navigation Group */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={onBackToHome}
            style={{
              padding: '14px 28px',
              backgroundColor: 'var(--swatch--brand)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--adm-radius, 8px)',
              fontWeight: 700,
              fontSize: '14px',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              boxShadow: '0 8px 24px -4px rgba(255, 81, 33, 0.5)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(255, 81, 33, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(255, 81, 33, 0.5)';
            }}
          >
            🎬 Return to Set (Home)
          </button>

          <button
            onClick={onNavigateEquipments}
            style={{
              padding: '14px 24px',
              backgroundColor: 'transparent',
              color: 'currentColor',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 'var(--adm-radius, 8px)',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'var(--swatch--brand)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
          >
            🎥 Explore Equipments
          </button>

          <button
            onClick={onNavigateAdmin}
            style={{
              padding: '14px 20px',
              backgroundColor: 'transparent',
              color: 'var(--swatch--brand)',
              border: '1px solid rgba(255, 81, 33, 0.35)',
              borderRadius: 'var(--adm-radius, 8px)',
              fontWeight: 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 81, 33, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            🔑 Studio Control
          </button>
        </div>
      </main>

      {/* Footer Meta Details */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          fontSize: '12px',
          opacity: 0.5,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '18px',
          position: 'relative',
          zIndex: 10,
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <span>© 2026 CineCraft Media & Production. All rights reserved.</span>
        <span>ERROR_CODE: CINECRAFT_CUT_FRAME_404</span>
      </footer>

      {/* Embedded Keyframe Animations */}
      <style>{`
        @keyframes ccmSpinReel {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ccmSpinReelReverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes ccmDashWave {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 20; }
        }
        @keyframes ccmBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @keyframes ccmFloatClap {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};
