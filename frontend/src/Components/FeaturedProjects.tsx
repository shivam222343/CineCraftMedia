import React, { useState } from 'react';

interface Project {
  id: string;
  title: string;
  stencilTitle: string;
  category: string;
  image: string;
  client: string;
  services: string[];
  description?: string;
}

const PROJECTS: Project[] = [
  {
    id: 'the-valley-run',
    title: 'THE VALLEY RUN',
    stencilTitle: 'VALLEY RUN',
    category: 'High-Speed Drag Racing, FPV Drones & Trackside Cinematography',
    image: '/media/work/Valley.webp',
    client: 'The Valley Run Drag Racing',
    services: ['Automotive', 'Racing', 'Drones'],
    description:
      'High-octane drag racing and automotive festival coverage featuring high-speed FPV drone tracking, precision trackside cinema cameras, and viral cinematic aftermovies.',
  },
  {
    id: 'fast-and-fabulous',
    title: 'FAST AND FABULOUS',
    stencilTitle: 'FAST & FAB',
    category: 'Exotic Supercar Convoy & Lifestyle Festival',
    image: '/media/work/fast_and_fabulous.jpg',
    client: 'Fast & Fabulous',
    services: ['Automotive', 'Drones'],
    description:
      'Ultra-exclusive supercar rally and lifestyle automotive festival captured with car-to-car rolling rigs, high-altitude drone tracking, and cinematic aftermovies showcasing exotic horsepower.',
  },
  {
    id: 'indian-supercross',
    title: 'INDIAN SUPERCROSS RACING LEAGUE',
    stencilTitle: 'ISRL',
    category: 'International Stadium Supercross Championship',
    image: '/media/work/supercross_racing.jpg',
    client: 'Indian Supercross Racing League (ISRL)',
    services: ['Racing', 'Drones', 'Live Events'],
    description:
      "India's premier international stadium supercross dirt bike championship. Massive dirt jumps, floodlit stadium pyrotechnics, and high-speed FPV chasing riders mid-air.",
  },
  {
    id: 'deccan-hill-run',
    title: 'DECCAN HILL RUN',
    stencilTitle: 'DECCAN RUN',
    category: 'Western Ghats Mountain Marathon & Hill Sprint',
    image: '/media/work/deccan_hill_run.jpg',
    client: 'Deccan Hill Run',
    services: ['Racing', 'Drones', 'Live Events'],
    description:
      'Iconic mountain marathon winding through the misty ghats of the Western Ghats. Sweeping high-altitude drone perspectives, athlete tracking, and inspirational cinematic recap films.',
  },
  {
    id: 'automotive-commercials',
    title: 'AUTOMOTIVE COMMERCIALS (BRIXTON & TURTLE WAX)',
    stencilTitle: 'COMMERCIALS',
    category: 'Brixton Motorcycles & Turtle Wax Studio Commercials',
    image: '/media/work/automotive_commercials.jpg',
    client: 'Brixton Motorcycles & Turtle Wax',
    services: ['Commercials', 'Automotive'],
    description:
      'Bespoke brand commercial campaigns for Brixton Motorcycles and Turtle Wax detailing. Precision studio lighting, dynamic rolling shots, macro liquid physics, and theatrical color grading.',
  },
  {
    id: 'concerts',
    title: 'CONCERTS & MUSIC FESTIVALS',
    stencilTitle: 'CONCERTS',
    category: 'Hello Seoul • Lollapalooza • Sunburn Kop • Bryan Adams (Goa & Hyd)',
    image: '/media/work/Sunburn.webp',
    client: 'Global Concert Tours & Festival Promoters',
    services: ['Concerts', 'Live Events', 'Drones'],
    description:
      'Mega-scale live concert coverage across Asia and India: Bryan Adams India Tour (Goa & Hyderabad), Lollapalooza Mumbai, Sunburn Festival, and Hello Seoul K-Pop Festival. Multi-cam broadcast, drone fly-overs, and electrifying aftermovies.',
  },
];

const CATEGORIES = [
  'All',
  'Automotive',
  'Concerts',
  'Racing',
  'Commercials',
  'Drones',
];

export const FeaturedProjects: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const filtered =
    filter === 'All'
      ? PROJECTS
      : PROJECTS.filter((p) => p.services.some((s) => s.toLowerCase() === filter.toLowerCase()));

  return (
    <section
      id="featured-projects"
      className="featured-projects-section"
      style={{
        backgroundColor: 'var(--swatch--dark)',
        padding: '100px 48px 140px',
        position: 'relative',
        borderTop: '1px solid var(--swatch--light-o10)',
      }}
    >
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* Split Layout: Left Sticky Header & Filter + Right Vertical Showcase Stack (Matching Image 1) */}
        <div className="work-split-layout">
          {/* Left Column: Sticky Title & Category Navigation */}
          <div className="work-left-sidebar">
            {/* Brand Title: Cursive 'Our' + Bold 'WORK' */}
            <div style={{ marginBottom: '40px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-script)',
                  fontSize: '56px',
                  color: 'var(--swatch--brand)',
                  lineHeight: '0.8',
                  transform: 'rotate(-4deg)',
                  marginLeft: '4px',
                  display: 'inline-block',
                }}
              >
                Our
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(40px, 4vw, 54px)',
                  fontWeight: 700,
                  color: 'var(--swatch--light)',
                  letterSpacing: '-1.5px',
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                WORK
              </h2>
            </div>

            {/* Vertical Category Filter List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {CATEGORIES.map((cat) => {
                const isSelected = filter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    style={{
                      background: isSelected ? 'var(--swatch--light-o20)' : 'transparent',
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '7px 18px',
                      width: 'fit-content',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14.5px',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'var(--swatch--brand)' : 'var(--swatch--light-o60)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.color = 'var(--swatch--brand)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.color = 'var(--swatch--light-o60)';
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Giant Project Cards Vertical Stack (Matching Image 1) */}
          <div className="work-cards-stack">
            {filtered.map((project) => (
              <div
                key={project.id}
                onClick={() => setActiveProject(project)}
                className="work-project-card"
                style={{
                  position: 'relative',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--swatch--dark-card)',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
                  cursor: 'pointer',
                  border: '1px solid var(--swatch--light-o10)',
                  transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 81, 33, 0.4)';
                  e.currentTarget.style.boxShadow = '0 30px 70px rgba(0, 0, 0, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(252, 242, 189, 0.08)';
                  e.currentTarget.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.55)';
                }}
              >
                {/* Full Bleed Campaign Visual */}
                <div style={{ position: 'relative', width: '100%', height: '540px', overflow: 'hidden' }}>
                  <img
                    src={project.image}
                    alt={project.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />

                  {/* Gradient Dark Overlay on Bottom for Stencil Typography Contrast */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to top, rgba(16, 13, 11, 0.94) 0%, rgba(16, 13, 11, 0.45) 45%, transparent 75%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Typography Content Matching Image 1 */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      padding: '36px 44px',
                      display: 'flex',
                      flexDirection: 'column',
                      pointerEvents: 'none',
                    }}
                  >
                    {/* Giant Gold Stencil Title (e.g. 'STEAL') */}
                    <div
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(54px, 8.5vw, 105px)',
                        fontWeight: 700,
                        color: '#f5b82e',
                        letterSpacing: '-2px',
                        lineHeight: 0.88,
                        textTransform: 'uppercase',
                        textShadow: '0 6px 35px rgba(0, 0, 0, 0.9)',
                      }}
                    >
                      {project.stencilTitle}
                    </div>

                    {/* Secondary Title & Subtitle */}
                    <div
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '19px',
                        fontWeight: 700,
                        color: '#ffffff',
                        marginTop: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      {project.title}
                    </div>

                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13.5px',
                        color: 'rgba(255, 255, 255, 0.85)',
                        marginTop: '4px',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      {project.category}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Details Modal */}
      {activeProject && (
        <div
          onClick={() => setActiveProject(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(20, 16, 14, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--swatch--dark-card)',
              borderRadius: '24px',
              maxWidth: '850px',
              width: '100%',
              overflow: 'hidden',
              border: '1px solid var(--swatch--light-o20)',
              boxShadow: '0 40px 100px rgba(0, 0, 0, 0.6)',
            }}
          >
            <img
              src={activeProject.image}
              alt={activeProject.title}
              style={{
                width: '100%',
                height: '380px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div style={{ padding: '36px 40px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '32px',
                  fontWeight: 700,
                  color: 'var(--swatch--light)',
                  marginBottom: '10px',
                }}
              >
                {activeProject.title}
              </div>
              <div
                style={{
                  color: 'var(--swatch--brand)',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                {activeProject.category} &bull; {activeProject.client}
              </div>
              <p
                style={{
                  color: 'var(--swatch--light-o80)',
                  lineHeight: 1.6,
                  fontSize: '15px',
                  marginBottom: '28px',
                }}
              >
                {activeProject.description}
              </p>
              <button
                onClick={() => setActiveProject(null)}
                style={{
                  padding: '12px 28px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--swatch--brand)',
                  color: '#ffffff',
                  border: 'none',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close Project
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .work-split-layout {
          display: flex;
          gap: 64px;
          align-items: flex-start;
        }

        .work-left-sidebar {
          width: 300px;
          flex-shrink: 0;
          position: sticky;
          top: 120px;
        }

        .work-cards-stack {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 48px;
        }

        @media (max-width: 960px) {
          .featured-projects-section {
            padding: 70px 14px 100px !important; /* 10-15px mobile border side padding */
          }

          .work-split-layout {
            flex-direction: column;
            gap: 24px;
          }

          .work-left-sidebar {
            width: 100%;
            position: relative;
            top: 0;
            padding: 0 !important;
          }

          .work-cards-stack {
            padding: 0 !important;
            gap: 24px !important;
          }

          .work-project-card {
            border-radius: 16px !important;
          }
        }
      `}</style>
    </section>
  );
};
