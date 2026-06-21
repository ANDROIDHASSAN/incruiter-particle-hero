import React, { useEffect, useRef, useState } from 'react';
import { PRODUCTS, PALETTE, NUM_SHAPES } from './brand.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smoothstep = (t) => t * t * (3 - 2 * t);

// 1 hero (scattered particle field) + the product shapes.
const SECTIONS = NUM_SHAPES + 1;

/* -------------------------------------------------------------------------- */
/* Magnetic button — gently pulls toward the cursor when near. Premium feel.    */
/* -------------------------------------------------------------------------- */
function MagneticLink({ href, onClick, children, style, strength = 0.4, radius = 120 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const el = ref.current;
    const cur = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let raf;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      if (Math.hypot(dx, dy) < radius) {
        target.x = dx * strength;
        target.y = dy * strength;
      } else {
        target.x = 0;
        target.y = 0;
      }
    };
    const loop = () => {
      cur.x += (target.x - cur.x) * 0.15;
      cur.y += (target.y - cur.y) * 0.15;
      el.style.transform = `translate(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [strength, radius]);

  return (
    <a ref={ref} href={href} onClick={onClick} style={style}>
      {children}
    </a>
  );
}

/**
 * The scrolling story (DOM, overlaid on the fixed canvas).
 *
 * Section 0 = the InCruiter hero (centered) over a screen-filling particle
 * field. Sections 1..N = the products, alternating text side, with the cloud
 * gathering from the field into each shape as you scroll.
 */
export default function ScrollStory({ scrollRef, activeIndex, jumpToSection, isMobile }) {
  const heroRef = useRef(null);
  const blockRefs = useRef([]);
  const lineRefs = useRef([]);
  const progressRef = useRef(null);
  const [hovered, setHovered] = useState(-1);

  useEffect(() => {
    let raf;
    const tick = () => {
      const progress = scrollRef.current || 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
      }
      const t = progress * (SECTIONS - 1); // 0 (hero) .. NUM_SHAPES

      // Hero fades out as you scroll toward the first product.
      if (heroRef.current) {
        const op = smoothstep(clamp(1 - t / 0.85, 0, 1));
        heroRef.current.style.opacity = op.toFixed(3);
        heroRef.current.style.filter = `blur(${((1 - op) * 6).toFixed(2)}px)`;
        heroRef.current.style.transform = `translateY(${(-(1 - op) * 30).toFixed(1)}px)`;
      }

      // Products centered at t = i+1.
      for (let i = 0; i < NUM_SHAPES; i++) {
        const center = i + 1;
        const op = smoothstep(clamp(1 - Math.abs(t - center) / 0.72, 0, 1));
        const el = blockRefs.current[i];
        if (el) {
          el.style.opacity = op.toFixed(3);
          el.style.filter = `blur(${((1 - op) * 7).toFixed(2)}px)`;
          el.style.transform = `translateY(${((1 - op) * 42).toFixed(1)}px)`;
          el.style.clipPath = `inset(0 0 ${((1 - op) * 100).toFixed(1)}% 0)`;
        }
        const line = lineRefs.current[i];
        if (line) line.style.transform = `scaleX(${op.toFixed(3)})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrollRef]);

  return (
    <div style={{ ...styles.scrollRoot, height: `${SECTIONS * 100}svh` }}>
      {/* Top scroll progress bar. */}
      <div style={styles.progressTrack} aria-hidden="true">
        <div ref={progressRef} style={styles.progressFill} />
      </div>

      {/* Fixed brand bar + persistent magnetic CTA. */}
      <header style={styles.header}>
        <span style={styles.logo}>
          In<span style={{ color: PALETTE.cyan }}>Cruiter</span>
        </span>
        <MagneticLink href="https://www.incruiter.com/book-a-demo" style={styles.cta}>
          Book a demo
        </MagneticLink>
      </header>

      {/* Vertical nav (products only) — hidden on mobile to reduce clutter. */}
      <nav
        style={{ ...styles.dots, display: isMobile ? 'none' : 'flex' }}
        aria-label="Jump to product"
      >
        {PRODUCTS.map((p, i) => {
          const isActive = activeIndex - 1 === i;
          return (
            <div
              key={p.key}
              style={styles.dotRow}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(-1)}
            >
              <span
                style={{
                  ...styles.dotLabel,
                  opacity: hovered === i ? 1 : 0,
                  transform: hovered === i ? 'translateX(0)' : 'translateX(8px)',
                }}
              >
                {p.name}
              </span>
              <button
                aria-label={p.name}
                aria-current={isActive}
                onClick={() => jumpToSection(i)}
                style={{
                  ...styles.dot,
                  background: isActive ? PALETTE.cyan : 'rgba(234,242,255,0.28)',
                  transform: isActive ? 'scale(1.7)' : 'scale(1)',
                  boxShadow: isActive ? `0 0 14px ${PALETTE.cyan}` : 'none',
                }}
              />
            </div>
          );
        })}
      </nav>

      {/* SECTION 0 — InCruiter hero over the particle field. */}
      <section style={styles.heroSection}>
        <div aria-hidden="true" style={styles.heroScrim} />
        <div ref={heroRef} style={styles.heroBlock}>
          <span style={styles.heroEyebrow}>
            <span style={{ ...styles.eyebrowDot, background: PALETTE.cyan }} />
            InCruiter · AI Interview Platform
          </span>
          <h1 style={styles.heroName}>
            Hiring,
            <br />
            <span style={styles.heroAccentWord}>perfected</span> by AI
          </h1>
          <p style={styles.heroSub}>
            One platform for every interview — AI screening, live interviews,
            scheduling, and proctoring, all in one place.
          </p>
          <div style={styles.ctaRow}>
            <MagneticLink href="https://www.incruiter.com/book-a-demo" style={styles.heroCta}>
              Book a demo
            </MagneticLink>
            <MagneticLink
              href="#products"
              onClick={(e) => {
                e.preventDefault();
                jumpToSection(0);
              }}
              style={styles.heroGhost}
              strength={0.25}
            >
              Explore products
            </MagneticLink>
          </div>
        </div>
        <div style={styles.scrollHint} aria-hidden="true">
          <span>Scroll to explore</span>
          <span style={styles.scrollHintLine} />
        </div>
      </section>

      {/* SECTIONS 1..N — products. Desktop: alternating sides. Mobile: the
          cloud sits up top (handled in 3D) and the text stacks centered below. */}
      {PRODUCTS.map((product, i) => {
        const textOnLeft = i % 2 === 0; // desktop: cloud right -> text left
        const sectionStyle = isMobile
          ? {
              ...styles.section,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '0 22px clamp(48px, 12vh, 120px)',
            }
          : {
              ...styles.section,
              justifyContent: textOnLeft ? 'flex-start' : 'flex-end',
            };
        const blockStyle = isMobile
          ? { ...styles.textBlock, maxWidth: '100%', alignItems: 'center', textAlign: 'center' }
          : {
              ...styles.textBlock,
              textAlign: textOnLeft ? 'left' : 'right',
              alignItems: textOnLeft ? 'flex-start' : 'flex-end',
            };
        return (
          <section key={product.key} style={sectionStyle}>
            {!isMobile && (
              <span
                aria-hidden="true"
                style={{
                  ...styles.ghost,
                  [textOnLeft ? 'left' : 'right']: 'clamp(8px, 4vw, 80px)',
                  color: 'rgba(234,242,255,0.035)',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
            )}

            <div ref={(el) => (blockRefs.current[i] = el)} style={blockStyle}>
              <span style={styles.eyebrow}>
                <span style={{ ...styles.eyebrowDot, background: product.accent }} />
                {String(i + 1).padStart(2, '0')} — {product.name}
              </span>

              <h2 style={styles.name}>{product.name}</h2>

              <div
                ref={(el) => (lineRefs.current[i] = el)}
                style={{
                  ...styles.accentLine,
                  background: `linear-gradient(90deg, ${product.accent}, transparent)`,
                  transformOrigin: isMobile ? 'center' : textOnLeft ? 'left' : 'right',
                  marginLeft: isMobile ? 'auto' : textOnLeft ? 0 : 'auto',
                  marginRight: isMobile ? 'auto' : 0,
                }}
              />

              <p style={styles.tagline}>{product.tagline}</p>

              <a
                href="https://www.incruiter.com/products"
                style={{
                  ...styles.learn,
                  flexDirection: isMobile ? 'row' : textOnLeft ? 'row' : 'row-reverse',
                }}
              >
                <span>Explore {product.name}</span>
                <span style={styles.learnArrow}>→</span>
              </a>
            </div>
          </section>
        );
      })}
    </div>
  );
}

const styles = {
  scrollRoot: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    pointerEvents: 'none',
  },
  progressTrack: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: 'rgba(234,242,255,0.08)',
    zIndex: 5,
  },
  progressFill: {
    height: '100%',
    width: '100%',
    transformOrigin: 'left',
    transform: 'scaleX(0)',
    background: 'linear-gradient(90deg, #2f6fed, #4fd1ff)',
    boxShadow: '0 0 10px rgba(79,209,255,0.6)',
  },
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 clamp(20px, 5vw, 64px)',
    zIndex: 4,
    pointerEvents: 'auto',
  },
  logo: {
    fontFamily: "'Sora', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 23,
    letterSpacing: '-0.01em',
    color: '#eaf2ff',
  },
  cta: {
    display: 'inline-block',
    padding: '12px 24px',
    borderRadius: 999,
    background: 'rgba(47,111,237,0.95)',
    color: '#fff',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
    boxShadow: '0 10px 34px rgba(47,111,237,0.5)',
    backdropFilter: 'blur(4px)',
    willChange: 'transform',
  },
  dots: {
    position: 'fixed',
    right: 'clamp(14px, 2.5vw, 36px)',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    zIndex: 4,
    pointerEvents: 'auto',
  },
  dotRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    height: 12,
  },
  dotLabel: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 12,
    letterSpacing: '0.05em',
    color: '#eaf2ff',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.25s ease, transform 0.25s ease',
    textShadow: '0 1px 8px rgba(0,0,0,0.6)',
  },
  dot: {
    width: 9,
    height: 9,
    padding: 0,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
  },

  /* Hero (section 0) */
  heroSection: {
    position: 'relative',
    height: '100svh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '0 clamp(24px, 6vw, 80px)',
  },
  heroScrim: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 'min(1100px, 96vw)',
    height: 'min(700px, 80vh)',
    transform: 'translate(-50%, -50%)',
    background:
      'radial-gradient(ellipse at center, rgba(2,5,12,0.62) 0%, rgba(2,5,12,0.34) 42%, rgba(2,5,12,0) 72%)',
    pointerEvents: 'none',
  },
  heroBlock: {
    position: 'relative',
    maxWidth: 820,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    willChange: 'opacity, filter, transform',
  },
  heroEyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'rgba(180,205,255,0.92)',
    marginBottom: 28,
  },
  heroName: {
    margin: 0,
    fontFamily: "'Sora', system-ui, sans-serif",
    fontSize: 'clamp(44px, 9vw, 132px)',
    fontWeight: 700,
    lineHeight: 0.96,
    letterSpacing: '-0.04em',
    color: '#ffffff',
    textShadow: '0 2px 26px rgba(0,0,0,0.55), 0 2px 60px rgba(120,160,255,0.3)',
  },
  heroAccentWord: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontStyle: 'italic',
    fontWeight: 400,
    letterSpacing: '-0.01em',
    color: '#8fdcff',
    paddingRight: '0.06em',
    textShadow: '0 2px 26px rgba(0,0,0,0.55), 0 0 40px rgba(79,209,255,0.5)',
  },
  heroSub: {
    margin: '30px 0 0',
    maxWidth: 560,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 400,
    fontSize: 'clamp(17px, 2vw, 21px)',
    lineHeight: 1.6,
    letterSpacing: '0.002em',
    color: 'rgba(220,230,250,0.94)',
    textShadow: '0 1px 16px rgba(0,0,0,0.6)',
  },
  ctaRow: {
    display: 'flex',
    gap: 16,
    marginTop: 40,
    flexWrap: 'wrap',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  heroCta: {
    display: 'inline-block',
    padding: '15px 32px',
    borderRadius: 999,
    background: '#2f6fed',
    color: '#fff',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 600,
    fontSize: 15,
    textDecoration: 'none',
    boxShadow: '0 12px 40px rgba(47,111,237,0.5)',
    willChange: 'transform',
  },
  heroGhost: {
    display: 'inline-block',
    padding: '15px 30px',
    borderRadius: 999,
    background: 'transparent',
    color: '#eaf2ff',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 500,
    fontSize: 15,
    textDecoration: 'none',
    border: '1px solid rgba(234,242,255,0.22)',
    willChange: 'transform',
  },

  /* Product sections */
  section: {
    position: 'relative',
    height: '100svh',
    display: 'flex',
    alignItems: 'center',
    padding: '0 clamp(24px, 9vw, 160px)',
  },
  ghost: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-54%)',
    fontFamily: "'Sora', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 'clamp(180px, 34vw, 460px)',
    lineHeight: 1,
    userSelect: 'none',
    zIndex: -1,
  },
  textBlock: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 500,
    willChange: 'opacity, filter, transform, clip-path',
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'rgba(196,214,250,0.85)',
    marginBottom: 24,
  },
  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    display: 'inline-block',
    boxShadow: '0 0 12px currentColor',
  },
  name: {
    margin: 0,
    fontFamily: "'Sora', system-ui, sans-serif",
    fontSize: 'clamp(40px, 7vw, 100px)',
    fontWeight: 700,
    lineHeight: 0.95,
    letterSpacing: '-0.04em',
    color: '#ffffff',
    textShadow: '0 2px 44px rgba(120,160,255,0.25)',
  },
  accentLine: {
    height: 3,
    width: 'clamp(72px, 14vw, 150px)',
    borderRadius: 3,
    marginTop: 26,
    marginBottom: 26,
    transformOrigin: 'left',
    transform: 'scaleX(0)',
    transition: 'transform 0.1s linear',
  },
  tagline: {
    margin: 0,
    maxWidth: 460,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 400,
    fontSize: 'clamp(17px, 2vw, 23px)',
    lineHeight: 1.5,
    letterSpacing: '0.002em',
    color: 'rgba(210,223,245,0.9)',
  },
  learn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 34,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#eaf2ff',
    textDecoration: 'none',
    pointerEvents: 'auto',
  },
  learnArrow: { color: PALETTE.cyan, fontSize: 18 },
  scrollHint: {
    position: 'absolute',
    bottom: 42,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 11,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'rgba(234,242,255,0.5)',
  },
  scrollHintLine: {
    width: 1,
    height: 44,
    background: 'linear-gradient(180deg, rgba(79,209,255,0.9), rgba(79,209,255,0))',
  },
};
