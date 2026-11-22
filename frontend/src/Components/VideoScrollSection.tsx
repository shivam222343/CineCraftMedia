import React, { useState, useEffect, useRef } from 'react';

export const VideoScrollSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pinState, setPinState] = useState<'before' | 'pinned' | 'after'>('before');
  const [isManualMuted, setIsManualMuted] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);
  const hasUserInteractedRef = useRef(false);

  // Listen for user gestures anywhere on the window to unlock audio playback in restricted browsers
  useEffect(() => {
    const unlockAudio = () => {
      hasUserInteractedRef.current = true;
      const video = videoRef.current;
      if (video) {
        if (video.paused) {
          video.play().catch(() => {});
        }
        // If not manually muted, unmute immediately upon first user interaction
        if (!isManualMuted) {
          video.muted = false;
        }
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    window.addEventListener('scroll', unlockAudio, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('scroll', unlockAudio);
    };
  }, [isManualMuted]);

  // Compute scroll progress & dynamic volume tied to video scale & scroll
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const totalScroll = containerRef.current.offsetHeight - windowHeight;

            if (totalScroll > 0) {
              const currentScroll = -rect.top;
              const p = Math.max(0, Math.min(1, currentScroll / totalScroll));
              setScrollProgress(p);

              // Viewport pinning states:
              // - before: Container has not reached top of viewport yet
              // - pinned: Container is currently active across the viewport (video is 100% fixed)
              // - after: User has fully scrolled past the container (unpins to next section)
              if (rect.top > 0) {
                setPinState('before');
              } else if (rect.bottom <= windowHeight) {
                setPinState('after');
              } else {
                setPinState('pinned');
              }

              // Dynamic Audio Volume calculation:
              // 1. While video scales up to fit screen (0.02 -> 0.32):
              //    Increase video voice gradually when scrolling.
              // 2. Once video fits screen (0.32 -> 0.65):
              //    Keep voice near peak (1.0).
              // 3. After scroll again (0.65 -> 0.95):
              //    Video stays FIXED full-screen while voice decreases gradually down to 0 and turns OFF.
              // 4. Past the section or before:
              //    Completely OFF (volume = 0, muted = true) so user explores without distraction.
              let targetVol = 0;

              if (rect.top > windowHeight || rect.bottom < 0) {
                targetVol = 0;
              } else if (p <= 0.02) {
                targetVol = 0;
              } else if (p <= 0.32) {
                const t = (p - 0.02) / (0.32 - 0.02);
                targetVol = Math.min(1, Math.max(0, Math.pow(t, 1.15)));
              } else if (p <= 0.65) {
                targetVol = 1.0;
              } else if (p <= 0.95) {
                const exitT = (p - 0.65) / (0.95 - 0.65);
                targetVol = Math.max(0, 1.0 - Math.pow(exitT, 0.85));
              } else {
                targetVol = 0;
              }

              // Apply target volume to the HTML5 video
              const video = videoRef.current;
              if (video) {
                if (isManualMuted || targetVol <= 0.01) {
                  video.volume = 0;
                  video.muted = true;
                  setCurrentVolume(0);
                } else {
                  video.volume = targetVol;
                  if (video.muted) {
                    video.muted = false;
                  }
                  if (video.paused) {
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                      playPromise.catch(() => {
                        // In case browser policy enforces mute until explicit click
                        video.muted = true;
                      });
                    }
                  }
                  setCurrentVolume(targetVol);
                }
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isManualMuted]);

  // Ensure autoplay loop starts smoothly muted initially
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, []);

  const toggleSound = () => {
    const nextManualMuted = !isManualMuted;
    setIsManualMuted(nextManualMuted);
    if (videoRef.current) {
      if (nextManualMuted) {
        videoRef.current.muted = true;
        videoRef.current.volume = 0;
        setCurrentVolume(0);
      } else {
        videoRef.current.muted = false;
        const restoredVol = scrollProgress >= 0.30 && scrollProgress <= 0.70 ? 1 : 0.6;
        videoRef.current.volume = restoredVol;
        setCurrentVolume(restoredVol);
        videoRef.current.play().catch(() => {});
      }
    }
  };

  /**
   * Scroll Timeline:
   * 1. 0.00 -> 0.32: Video is LOCKED in the viewport; scales up from center (scale 0.65 -> 1.0, radius 28px -> 0px) to fit full screen.
   *                  Voice increases gradually from 0.0 to 1.0.
   * 2. 0.32 -> 0.65: Video stays FIXED full-screen (scale: 1.0, radius: 0px).
   *                  Voice stays near peak (1.0). Text slides in and sits centered over video.
   * 3. 0.65 -> 0.95: Video stays FIXED full-screen (NO scrolling up within viewport!).
   *                  Text slides up off top (translateY 0 -> -115vh).
   *                  Voice decreases gradually from 1.0 to 0.0 and turns off.
   * 4. 0.95 -> 1.00: Audio is completely off. Section finishes and unpins cleanly to next section.
   */

  // 1. Symmetrical in-place scale (Video stays fixed full-screen once scaled)
  let videoScale = 1;
  let videoRadius = 0;

  if (scrollProgress <= 0.32) {
    const scaleFactor = Math.min(1, Math.max(0, scrollProgress / 0.32));
    const easeScale = Math.sin((scaleFactor * Math.PI) / 2);
    videoScale = 0.65 + 0.35 * easeScale;
    videoRadius = Math.round(28 * (1 - easeScale));
  } else {
    // Video stays completely fixed full-screen!
    videoScale = 1;
    videoRadius = 0;
  }

  // 2. Translucent contrast overlay behind text
  let overlayOpacity = 0;
  if (scrollProgress < 0.28) {
    overlayOpacity = 0;
  } else if (scrollProgress >= 0.28 && scrollProgress <= 0.44) {
    overlayOpacity = ((scrollProgress - 0.28) / 0.16) * 0.72;
  } else if (scrollProgress > 0.44 && scrollProgress <= 0.68) {
    overlayOpacity = 0.72;
  } else {
    const exitT = Math.min(1, (scrollProgress - 0.68) / 0.24);
    overlayOpacity = Math.max(0, 0.72 * (1 - exitT));
  }

  // 3. Text slide-up & slide-off-top (over the fixed video)
  let textTranslateY = 110; // in vh
  let textOpacity = 0;

  if (scrollProgress < 0.30) {
    textTranslateY = 110;
    textOpacity = 0;
  } else if (scrollProgress >= 0.30 && scrollProgress <= 0.48) {
    const t = (scrollProgress - 0.30) / 0.18;
    const ease = 1 - Math.pow(1 - t, 2.5);
    textTranslateY = (1 - ease) * 110;
    textOpacity = Math.min(1, t * 1.5);
  } else if (scrollProgress > 0.48 && scrollProgress <= 0.68) {
    textTranslateY = 0;
    textOpacity = 1;
  } else {
    // Text slides up off the top while video remains fixed
    const exitT = (scrollProgress - 0.68) / 0.28;
    const easeExit = Math.pow(exitT, 1.6);
    textTranslateY = -easeExit * 115;
    textOpacity = Math.max(0, 1 - exitT * 1.3);
  }

  const isAudioActive = !isManualMuted && currentVolume > 0.05;

  return (
    <section
      ref={containerRef}
      id="showreel"
      style={{
        position: 'relative',
        height: '280vh', // Pinned scroll track
        backgroundColor: 'var(--swatch--dark)',
      }}
    >
      {/*
        Active Viewport Container:
        - When 'pinned': Fixed 100vw x 100vh.
        - When 'before': Anchored at top of container.
        - When 'after': Anchored at bottom of container, scrolling away naturally with page.
      */}
      <div
        style={{
          position: pinState === 'pinned' ? 'fixed' : 'absolute',
          top: pinState === 'pinned' ? 0 : pinState === 'after' ? 'auto' : 0,
          bottom: pinState === 'after' ? 0 : 'auto',
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: pinState === 'pinned' ? 40 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: 'var(--swatch--dark)',
          pointerEvents: pinState === 'pinned' ? 'auto' : 'none',
        }}
      >
        {/* Floating Quick Unmute Helper if browser autoplay blocked audio on new device */}
        {pinState === 'pinned' && scrollProgress >= 0.04 && scrollProgress <= 0.90 && (currentVolume <= 0.05 || isManualMuted) && (
          <button
            type="button"
            onClick={toggleSound}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#ff5121',
              color: '#ffffff',
              borderRadius: '9999px',
              border: 'none',
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255, 81, 33, 0.45)',
              pointerEvents: 'auto',
              animation: 'soundPulse 2s infinite ease-in-out',
            }}
          >
            <span>🔊 Tap for Music</span>
          </button>
        )}
        {/*
          Scalable Video Container:
          Positioned dead-center via absolute + translate(-50%, -50%).
          Scales up symmetrically to fit screen, then stays strictly FIXED!
        */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '100vh',
            transform: `translate(-50%, -50%) scale(${videoScale})`,
            transformOrigin: 'center center',
            borderRadius: `${videoRadius}px`,
            overflow: 'hidden',
            boxShadow:
              videoScale < 0.98
                ? '0 30px 80px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(252, 242, 189, 0.12)'
                : 'none',
            willChange: 'transform, border-radius',
          }}
          className="video-scalable-container"
        >
          {/* Showreel Video */}
          <video
            ref={videoRef}
            src="/videos/intro.webm"
            poster="https://cdn.prod.website-files.com/69e88d0efafb70caf79fbd65/6a20614be7191d93e8cfd0cf_Screenshot%202026-06-03%20at%2017.40.47.avif"
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          {/* Translucent Backdrop Blur Overlay for Text Readability */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(30, 24, 21, 0.72)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              opacity: overlayOpacity,
              pointerEvents: 'none',
              transition: 'opacity 0.1s ease-out',
            }}
          />
        </div>

        {/* Statement Text Container (slides up over fixed video, then slides up off top) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 16px',
            transform: `translate3d(0, ${textTranslateY}vh, 0)`,
            opacity: textOpacity,
            pointerEvents: scrollProgress >= 0.45 && scrollProgress <= 0.75 ? 'auto' : 'none',
            willChange: 'transform, opacity',
          }}
          className="video-statement-text-wrap"
        >
          <div
            style={{
              maxWidth: '1080px',
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(20px, 3.8vw, 50px)',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.28,
                textTransform: 'uppercase',
                letterSpacing: '-0.5px',
                textShadow: '0 4px 24px rgba(0, 0, 0, 0.85)',
                margin: 0,
              }}
              className="video-statement-title"
            >
              CINECRAFT MEDIA PRODUCES 360° CREATIVE CAMPAIGNS FOR SOME OF THE{' '}
              <span
                style={{
                  fontFamily: 'var(--font-script)',
                  textTransform: 'none',
                  color: 'var(--swatch--brand)',
                  fontSize: '1.25em',
                  fontWeight: 400,
                  display: 'inline-block',
                  transform: 'rotate(-2deg)',
                  margin: '0 6px',
                  verticalAlign: 'baseline',
                  textShadow: '0 0 35px rgba(255, 81, 33, 0.45)',
                }}
              >
                biggest
              </span>{' '}
              NAMES IN ENTERTAINMENT. FROM KEY ART TO SOCIAL ASSETS, UNIT PHOTOGRAPHY TO EPKS, WE MAKE SURE EVERY
              ASSET IS PERFECTLY ALIGNED, CONSISTENTLY{' '}
              <span
                style={{
                  fontFamily: 'var(--font-script)',
                  textTransform: 'none',
                  color: 'var(--swatch--brand)',
                  fontSize: '1.25em',
                  fontWeight: 400,
                  display: 'inline-block',
                  transform: 'rotate(-1deg)',
                  margin: '0 6px',
                  verticalAlign: 'baseline',
                  textShadow: '0 0 35px rgba(255, 81, 33, 0.45)',
                }}
              >
                brilliant
              </span>{' '}
              AND DELIVERED WITHOUT FUSS.
            </h2>

            {/* Sound Status & Toggle Control */}
            <div style={{ marginTop: '28px' }}>
              <button
                type="button"
                onClick={toggleSound}
                aria-label={isAudioActive ? 'Mute sound' : 'Unmute sound'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 22px',
                  backgroundColor: 'rgba(39, 32, 29, 0.88)',
                  border: isAudioActive
                    ? '1px solid var(--swatch--brand)'
                    : '1px solid rgba(252, 242, 189, 0.28)',
                  borderRadius: '9999px',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.65)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease, transform 0.15s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--swatch--brand)';
                  e.currentTarget.style.transform = 'scale(1.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isAudioActive
                    ? 'var(--swatch--brand)'
                    : 'rgba(252, 242, 189, 0.28)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {/* Audio Waves / Mute Icon */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isAudioActive ? 'var(--swatch--brand)' : 'var(--swatch--light)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  {isAudioActive ? (
                    <>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </>
                  ) : (
                    <>
                      <line x1="23" y1="9" x2="17" y2="15"></line>
                      <line x1="17" y1="9" x2="23" y2="15"></line>
                    </>
                  )}
                </svg>

                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    letterSpacing: '0.6px',
                    color: isAudioActive ? 'var(--swatch--brand)' : 'var(--swatch--light)',
                    textTransform: 'uppercase',
                  }}
                >
                  {isAudioActive ? `Sound On ${Math.round(currentVolume * 100)}%` : 'Sound Off'}
                </span>

                {/* Toggle Pill */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    width: '32px',
                    height: '18px',
                    borderRadius: '10px',
                    backgroundColor: isAudioActive ? 'var(--swatch--brand)' : 'rgba(252, 242, 189, 0.25)',
                    padding: '2px',
                    transition: 'background-color 0.25s ease',
                  }}
                >
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      transform: isAudioActive ? 'translateX(14px)' : 'translateX(0)',
                      transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes soundPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }

        @media (max-width: 768px) {
          .video-statement-text-wrap {
            padding: 30px 14px !important; /* 10-15px padding on mobile */
          }
          .video-statement-title {
            font-size: clamp(16px, 4.2vw, 24px) !important;
            line-height: 1.35 !important;
          }
        }
      `}</style>
    </section>
  );
};
