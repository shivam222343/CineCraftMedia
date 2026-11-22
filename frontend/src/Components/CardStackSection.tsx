import React, { useState, useEffect, useRef } from 'react';
import { SquiggleSvg, ArrowRightIcon } from './Icons';

interface ServiceItem {
  id: string;
  title: string;
  image: string;
  description: string;
  deliverables: string[];
}

const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'photography',
    title: 'PHOTOGRAPHY',
    image: '/media/services/photography.jpg',
    description:
      'Capturing defining moments with precision, creative composition, and vivid color fidelity across high-fashion editorials, live concerts, and brand campaigns.',
    deliverables: [
      'Fashion & Editorial Stills',
      'Live Concert & Festival Coverage',
      'Brand & Commercial Product Shoots',
      'High-Res Retouched Masters',
    ],
  },
  {
    id: 'videography',
    title: 'VIDEOGRAPHY',
    image: '/media/services/videography.jpg',
    description:
      'Dynamic, agile video production for live events, digital campaigns, aftermovies, and brand commercials with seamless handheld and gimbal stabilization.',
    deliverables: [
      'Commercial & Aftermovie Coverage',
      'Multi-Cam Concert Captures',
      'Gimbal & Motion Tracking',
      '4K High Bitrate Broadcast Masters',
    ],
  },
  {
    id: 'cinematography',
    title: 'CINEMATOGRAPHY',
    image: '/media/services/cinematography.jpg',
    description:
      'Full-spectrum cinema direction, master framing, and dramatic camera movement crafted to bring high-impact visual stories, music videos, and commercial narratives to life.',
    deliverables: [
      'High-End Feature & Commercial Shoots',
      'Anamorphic & Prime Lens Mastery',
      'Lighting Design & Mood Realization',
      'Directorial Vision & Storyboards',
    ],
  },
  {
    id: 'commercial-drone',
    title: 'COMMERCIAL DRONE',
    image: '/media/services/commercial_drone.jpg',
    description:
      'Licensed high-altitude aerial cinematography, dual-operator cinema drone packages, and precision aerial survey tailored for high-end commercials, films, and industrial showcases.',
    deliverables: [
      'DGCA Certified Drone Pilots',
      'DJI Inspire 3 & Mavic Cine Fleet',
      'High-Altitude 8K ProRes RAW',
      'Dual Operator Master Wheels Control',
    ],
  },
  {
    id: 'fpv-drone-project',
    title: 'FPV DRONE PROJECT',
    image: '/media/services/fpv_drone.jpg',
    description:
      'Adrenaline-fueled high-speed FPV tracking, cinelifter high-velocity chase sequences, and seamless indoor fly-throughs delivering angles impossible with standard cameras.',
    deliverables: [
      'Custom High-Speed Cinelifter Rigs',
      'Automotive Chase & Action Sports Tracking',
      'Micro-FPV One-Take Indoor Fly-Throughs',
      'Ultra-Smooth GyroFlow Stabilization',
    ],
  },
  {
    id: 'graphics-designing',
    title: 'GRAPHICS DESIGNING',
    image: '/media/services/graphics_designing.jpg',
    description:
      'Bespoke visual identity systems, theater-grade key-art posters, typography, brand collateral, and high-impact digital marketing assets built to command attention.',
    deliverables: [
      'Movie & Show Teaser Key Art',
      'Typography & Brand Identity Design',
      'Social Media Campaign Systems',
      'Large-Format Print & Billboard Assets',
    ],
  },
  {
    id: 'animation',
    title: 'ANIMATION',
    image: '/media/services/animation.jpg',
    description:
      'Imaginative 2D and 3D animation, stylized character design, kinetic typography, and motion graphics that explain complex ideas and craft unforgettable narrative worlds.',
    deliverables: [
      '3D Character Modeling & Rigging',
      'Kinetic Motion Typography',
      '2D/3D Explainer & Product Animations',
      'Broadcast Package Design & Openers',
    ],
  },
  {
    id: 'vfx-post-production',
    title: 'VFX AND POST PRODUCTION',
    image: '/media/services/vfx_post_production.jpg',
    description:
      'Complete post-production finishing including seamless CGI compositing, cleanups, screen replacements, dynamic DaVinci Resolve color grading, and broadcast sound mastering.',
    deliverables: [
      'Advanced CGI & Live-Action Compositing',
      'DaVinci Resolve Color Grading',
      'Green Screen & Wire Removal Cleanups',
      'Cinematic Sound Design & 5.1 Mastering',
    ],
  },
];

interface CardStackSectionProps {
  onNavigateEquipments?: () => void;
}

export const CardStackSection: React.FC<CardStackSectionProps> = ({ onNavigateEquipments }) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [pinState, setPinState] = useState<'before' | 'pinned' | 'after'>('before');
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll position through the section to advance card index and maintain bulletproof viewport pinning
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const totalScrollable = containerRef.current.offsetHeight - windowHeight;

            if (totalScrollable > 0) {
              const progress = Math.min(Math.max(-rect.top / totalScrollable, 0), 1);
              const newIdx = Math.min(Math.floor(progress * SERVICES_DATA.length), SERVICES_DATA.length - 1);
              setActiveCardIndex(newIdx);

              // Fixed viewport pinning states (identical to VideoScrollSection for 100% mobile reliability):
              // - before: Section is below current viewport
              // - pinned: Section is actively in view (position: fixed, never scrolls off or leaves blank space)
              // - after: User has scrolled past all cards, smoothly unpins to next section
              if (rect.top > 0) {
                setPinState('before');
              } else if (rect.bottom <= windowHeight) {
                setPinState('after');
              } else {
                setPinState('pinned');
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
  }, []);

  const handleNextCard = () => {
    setActiveCardIndex((prev) => (prev + 1) % SERVICES_DATA.length);
  };

  return (
    <section
      ref={containerRef}
      id="services-stack"
      style={{
        position: 'relative',
        height: '260vh',
        backgroundColor: 'var(--swatch--dark)',
      }}
    >
      {/*
        Rock-solid Viewport Container:
        - When 'pinned': Fixed 100vw x 100vh (completely immune to iOS/Android sticky bugs).
        - When 'before': Anchored at top of container.
        - When 'after': Anchored at bottom of container, scrolling away naturally to next section.
      */}
      <div
        className="card-stack-inner"
        style={{
          position: pinState === 'pinned' ? 'fixed' : 'absolute',
          top: pinState === 'pinned' ? 0 : pinState === 'after' ? 'auto' : 0,
          bottom: pinState === 'after' ? 0 : 'auto',
          left: 0,
          height: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '0 48px',
          zIndex: pinState === 'pinned' ? 35 : 2,
          pointerEvents: pinState === 'pinned' ? 'auto' : 'none',
        }}
      >
        {/* Floating Orange Squiggle Path (Matching Screenshot 4) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '-40px',
            transform: 'translateY(-50%)',
            width: '460px',
            height: 'auto',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <SquiggleSvg />
        </div>

        {/* 2-Column Grid */}
        <div
          style={{
            maxWidth: '1440px',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 400px) 1fr',
            gap: '60px',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2,
          }}
          className="card-stack-grid"
        >
          {/* Left Column (Matching Screenshot 4) */}
          <div className="card-stack-left-col">
            <div className="card-stack-header" style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-script)',
                  fontSize: 'clamp(56px, 6.5vw, 84px)',
                  color: 'var(--swatch--brand)',
                  fontWeight: 400,
                  lineHeight: 0.9,
                  transform: 'rotate(-4deg)',
                  display: 'inline-block',
                  textShadow: '0 0 35px rgba(255, 81, 33, 0.4)',
                }}
              >
                Our
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(38px, 5vw, 64px)',
                  fontWeight: 700,
                  color: 'var(--swatch--light)',
                  lineHeight: 1,
                  letterSpacing: '-1px',
                  textTransform: 'uppercase',
                  margin: '4px 0 0 0',
                }}
              >
                SERVICES
              </h2>
            </div>

            <p
              className="card-stack-desc"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                lineHeight: 1.65,
                color: 'var(--swatch--light-o80)',
                maxWidth: '400px',
                marginBottom: '36px',
              }}
            >
              From concept through to delivery, we create and produce campaigns that are thoughtful, collaborative, and
              built to land across every touchpoint.
            </p>

            <div className="card-stack-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedService(SERVICES_DATA[activeCardIndex])}
                className="btn-pill"
                data-cursor-label="VIEW"
              >
                <span>All services</span>
                <ArrowRightIcon size={18} />
              </button>

              {onNavigateEquipments && (
                <button
                  onClick={onNavigateEquipments}
                  className="btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderColor: 'rgba(45, 212, 191, 0.4)',
                    color: '#2dd4bf',
                  }}
                >
                  <span>Equipments</span>
                  <span style={{ fontSize: '15px' }}>↗</span>
                </button>
              )}
            </div>

            {/* Pagination Line Indicators */}
            <div
              className="card-stack-pagination"
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '40px',
              }}
            >
              {SERVICES_DATA.map((srv, idx) => (
                <button
                  key={srv.id}
                  onClick={() => setActiveCardIndex(idx)}
                  style={{
                    height: '4px',
                    width: activeCardIndex === idx ? '36px' : '16px',
                    borderRadius: '2px',
                    backgroundColor:
                      activeCardIndex === idx ? 'var(--swatch--brand)' : 'rgba(252, 242, 189, 0.25)',
                    transition: 'all 0.3s ease',
                  }}
                  aria-label={`Select ${srv.title}`}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Card Deck Stack (Wide aspect to cover full images) */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '740px',
              height: '460px',
              margin: '0 auto',
            }}
            className="cards-deck-container"
          >
            {SERVICES_DATA.map((service, index) => {
              const isPassed = index < activeCardIndex;
              const isCurrent = index === activeCardIndex;
              const offsetFromActive = index - activeCardIndex;

              // Tilt top card ~3.5deg like Screenshot 4
              const baseRotation = (index % 2 === 0 ? 3 : -2) + offsetFromActive * 2;
              const translateY = offsetFromActive * 24;
              const scale = 1 - Math.max(offsetFromActive * 0.05, 0);

              return (
                <div
                  key={service.id}
                  data-cursor-label="DRAG"
                  onClick={handleNextCard}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    right: '16px',
                    bottom: '16px',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    backgroundColor: '#1f1917',
                    boxShadow: isCurrent
                      ? '0 30px 70px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(252, 242, 189, 0.12)'
                      : '0 15px 35px rgba(0, 0, 0, 0.4)',
                    cursor: 'pointer',
                    transform: isCurrent
                      ? `translateY(0px) rotate(${baseRotation}deg) scale(1)`
                      : isPassed
                      ? `translateY(-90px) rotate(${baseRotation - 6}deg) scale(0.92)`
                      : `translateY(${translateY}px) rotate(${baseRotation}deg) scale(${scale})`,
                    opacity: isPassed ? 0 : 1,
                    pointerEvents: isCurrent ? 'auto' : 'none',
                    zIndex: SERVICES_DATA.length - index + (isCurrent ? 10 : 0),
                    transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease',
                  }}
                  className="service-card-item"
                >
                  <img
                    src={service.image}
                    alt={service.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      filter: isCurrent ? 'none' : 'brightness(0.75)',
                      transition: 'transform 0.4s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (isCurrent) e.currentTarget.style.transform = 'scale(1.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (isCurrent) e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />

                  {/* Dark bottom gradient */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to top, rgba(20, 16, 14, 0.9) 0%, rgba(20, 16, 14, 0.25) 45%, transparent 100%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Bottom Text and Arrow (Screenshot 4) */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '24px',
                      left: '24px',
                      right: '24px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      zIndex: 3,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: 'clamp(20px, 2.5vw, 28px)',
                          fontWeight: 700,
                          color: '#ffffff',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
                          margin: 0,
                        }}
                      >
                        {service.title}
                      </h3>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--swatch--light-o80)',
                          marginTop: '4px',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        Click to advance &bull; View details
                      </div>
                    </div>

                    {/* Orange Arrow Icon (Screenshot 4) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedService(service);
                      }}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 81, 33, 0.18)',
                        border: '1px solid rgba(255, 81, 33, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--swatch--brand)',
                        cursor: 'pointer',
                        transition: 'transform 0.25s ease, background-color 0.25s ease',
                      }}
                      className="card-arrow-circle"
                      aria-label="View service details"
                    >
                      <ArrowRightIcon size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <div
          onClick={() => setSelectedService(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(20, 16, 14, 0.88)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--swatch--dark-card)',
              border: '1px solid var(--swatch--light-o20)',
              borderRadius: '24px',
              maxWidth: '680px',
              width: '100%',
              padding: '36px',
              position: 'relative',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
              color: 'var(--swatch--light)',
            }}
          >
            <button
              onClick={() => setSelectedService(null)}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: '20px',
                right: '24px',
                fontSize: '26px',
                color: 'var(--swatch--light)',
                cursor: 'pointer',
              }}
            >
              &times;
            </button>

            <div
              style={{
                fontFamily: 'var(--font-script)',
                color: 'var(--swatch--brand)',
                fontSize: '28px',
                marginBottom: '4px',
              }}
            >
              Cinecraft Media Service
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--swatch--light)',
                marginBottom: '16px',
                textTransform: 'uppercase',
              }}
            >
              {selectedService.title}
            </h2>

            <img
              src={selectedService.image}
              alt={selectedService.title}
              style={{
                width: '100%',
                height: '240px',
                objectFit: 'cover',
                borderRadius: '12px',
                marginBottom: '20px',
              }}
            />

            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: 'var(--swatch--light-o80)',
                marginBottom: '24px',
              }}
            >
              {selectedService.description}
            </p>

            <div style={{ marginBottom: '28px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--swatch--brand)',
                  letterSpacing: '0.8px',
                  marginBottom: '12px',
                }}
              >
                Key Deliverables:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {selectedService.deliverables.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--swatch--light)',
                      backgroundColor: 'rgba(252, 242, 189, 0.04)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(252, 242, 189, 0.08)',
                    }}
                  >
                    <span style={{ color: 'var(--swatch--brand)' }}>&bull;</span>
                    {d}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setSelectedService(null)} className="btn-outline">
                Back to overview
              </button>
              <a
                href={`https://wa.me/919370466245?text=${encodeURIComponent(
                  `Hello Cinecraft Media! I would like to start a project regarding ${selectedService.title}. Let's discuss details!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSelectedService(null)}
                className="btn-pill"
              >
                <span>Start a project</span>
                <ArrowRightIcon size={16} />
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .card-stack-inner {
            padding: 76px 14px 22px !important; /* Top clearance for navbar, 14px side, 22px bottom */
            height: 100vh !important;
            height: 100dvh !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-end !important; /* Anchor cards firmly to the lower side */
            box-sizing: border-box !important;
          }
          .card-stack-grid {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            height: 100% !important;
            max-height: calc(100dvh - 98px) !important;
            gap: 10px !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .card-stack-left-col {
            flex-shrink: 0 !important;
          }
          .card-stack-header {
            margin-bottom: 4px !important;
          }
          .card-stack-header h2 {
            font-size: 26px !important;
          }
          .card-stack-desc {
            display: none !important; /* Hide long paragraph on mobile so cards stay cleanly on lower side */
          }
          .card-stack-actions {
            gap: 10px !important;
            margin-bottom: 4px !important;
          }
          .card-stack-pagination {
            margin-top: 6px !important;
            margin-bottom: 4px !important;
          }
          .cards-deck-container {
            flex: 1 1 auto !important;
            height: 52vh !important;
            max-height: 500px !important;
            min-height: 330px !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 auto !important;
            position: relative !important;
          }
          .service-card-item {
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            border-radius: 18px !important;
          }
        }
      `}</style>
    </section>
  );
};
