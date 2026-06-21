import React, {
  Component,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing';
import Lenis from 'lenis';

import ParticleSystem from './ParticleSystem.jsx';
import ScrollStory from './ScrollStory.jsx';
import Preloader from './Preloader.jsx';
import Cursor from './Cursor.jsx';
import { useAdaptiveQuality } from './useAdaptiveQuality.js';
import { PRODUCTS, PALETTE, NUM_SHAPES } from './brand.js';

const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/* -------------------------------------------------------------------------- */
/* Error boundary -> static fallback, so the page never shows a broken hero.   */
/* -------------------------------------------------------------------------- */
class HeroErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.warn('[ParticleHero] WebGL failure, showing static fallback:', error);
  }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

/* -------------------------------------------------------------------------- */
/* Static fallback: reduced-motion / no-WebGL / weak device / render error.     */
/* -------------------------------------------------------------------------- */
function StaticStory() {
  return (
    <div style={{ background: 'radial-gradient(120% 120% at 50% 30%, #15396e, #0a2342 45%, #040b16)', minHeight: '100svh' }}>
      <header style={staticStyles.header}>
        <span style={staticStyles.logo}>
          In<span style={{ color: PALETTE.cyan }}>Cruiter</span>
        </span>
        <a href="https://www.incruiter.com/book-a-demo" style={staticStyles.cta}>
          Book a demo
        </a>
      </header>
      <div style={staticStyles.list}>
        {PRODUCTS.map((p, i) => (
          <section key={p.key} style={staticStyles.item}>
            <span style={staticStyles.index}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <h2 style={staticStyles.name}>{p.name}</h2>
            <p style={staticStyles.tagline}>{p.tagline}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pause the render loop when the tab is hidden (battery / CPU).                */
/* -------------------------------------------------------------------------- */
function useTabVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  return visible;
}

// Reactive mobile flag (phones + narrow / portrait viewports).
function useIsMobile() {
  const get = () =>
    typeof window !== 'undefined' &&
    (window.innerWidth < 900 || window.innerWidth / window.innerHeight < 0.85);
  const [isMobile, setIsMobile] = useState(get);
  useEffect(() => {
    const on = () => setIsMobile(get());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return isMobile;
}

/* -------------------------------------------------------------------------- */
/* Main scroll-driven hero.                                                     */
/* -------------------------------------------------------------------------- */
export default function ParticleHero() {
  const quality = useAdaptiveQuality();
  const visible = useTabVisible();
  const isMobile = useIsMobile();

  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const lenisRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [dpr, setDpr] = useState(quality.dprCap);
  const onSegmentChange = useCallback((i) => setActiveIndex(i), []);
  const onReady = useCallback(() => setReady(true), []);

  // Smooth scroll (Lenis) — the single biggest "feel" upgrade.
  useEffect(() => {
    if (quality.tier === 'static') return;
    // Always begin the story at the top (the brain hero), not a restored offset.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    const setProgress = ({ scroll, limit }) => {
      scrollRef.current = limit > 0 ? scroll / limit : 0;
    };
    lenis.on('scroll', setProgress);

    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [quality.tier]);

  // Pointer tracking on the window (canvas is pointer-events:none).
  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.active = true;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const jumpToSection = useCallback((i) => {
    // Product i lives in section i+1 (section 0 is the hero). Total gaps = NUM_SHAPES.
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const top = ((i + 1) / NUM_SHAPES) * max;
    if (lenisRef.current) lenisRef.current.scrollTo(top, { duration: 1.4 });
    else window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  if (quality.tier === 'static') {
    return <StaticStory />;
  }

  return (
    <>
      <Preloader ready={ready} />
      <Cursor />

      {/* Fixed canvas + atmospheric background behind the scrolling content. */}
      <div aria-hidden="true" style={styles.bg}>
        <div style={{ ...styles.aurora, ...styles.auroraA }} />
        <div style={{ ...styles.aurora, ...styles.auroraB }} />
        <HeroErrorBoundary fallback={null}>
          <Canvas
            frameloop={visible ? 'always' : 'never'}
            dpr={dpr}
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{
              antialias: false,
              alpha: true,
              powerPreference: 'high-performance',
            }}
            style={{ background: 'transparent' }}
          >
            {/* Auto FPS governor: keep full DPR when smooth, drop it if a
                device struggles — guarantees performance everywhere. */}
            <PerformanceMonitor
              onIncline={() => setDpr(quality.dprCap)}
              onDecline={() => setDpr(1)}
              flipflops={3}
              onFallback={() => setDpr(1)}
            />

            <ParticleSystem
              count={quality.count}
              baseSize={quality.size}
              scrollRef={scrollRef}
              mouseRef={mouseRef}
              onSegmentChange={onSegmentChange}
              onReady={onReady}
              isMobile={isMobile}
            />

            {quality.bloom && (
              <EffectComposer multisampling={0}>
                <Bloom
                  mipmapBlur
                  intensity={quality.bloomIntensity}
                  luminanceThreshold={0.28}
                  luminanceSmoothing={0.35}
                />
                <ChromaticAberration offset={[0.0006, 0.0004]} radialModulation={false} />
                <Vignette eskil={false} offset={0.22} darkness={0.9} />
              </EffectComposer>
            )}
          </Canvas>
        </HeroErrorBoundary>
      </div>

      {/* Film grain for filmic texture. */}
      <div aria-hidden="true" className="grain" style={styles.grain} />

      <ScrollStory
        scrollRef={scrollRef}
        activeIndex={activeIndex}
        jumpToSection={jumpToSection}
        isMobile={isMobile}
      />
    </>
  );
}

const styles = {
  bg: {
    position: 'fixed',
    inset: 0,
    background:
      'radial-gradient(130% 130% at 50% 34%, #0a1422 0%, #05080f 46%, #010205 100%)',
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  aurora: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(100px)',
    opacity: 0.32,
    mixBlendMode: 'screen',
  },
  auroraA: {
    width: '44vw',
    height: '44vw',
    top: '6%',
    right: '2%',
    background:
      'radial-gradient(circle, rgba(47,111,237,0.5) 0%, rgba(47,111,237,0) 70%)',
  },
  auroraB: {
    width: '38vw',
    height: '38vw',
    bottom: '4%',
    left: '0%',
    background:
      'radial-gradient(circle, rgba(124,140,255,0.34) 0%, rgba(124,140,255,0) 70%)',
  },
  grain: {
    position: 'fixed',
    top: '-15%',
    left: '-15%',
    width: '130%',
    height: '130%',
    backgroundImage: GRAIN_URI,
    opacity: 0.045,
    pointerEvents: 'none',
    zIndex: 40,
    animation: 'grainShift 8s steps(5) infinite',
  },
};

const staticStyles = {
  header: {
    position: 'sticky',
    top: 0,
    height: 76,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 clamp(20px, 5vw, 64px)',
  },
  logo: {
    fontFamily: "'Sora', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 22,
    color: '#eaf2ff',
  },
  cta: {
    padding: '11px 22px',
    borderRadius: 999,
    background: '#2f6fed',
    color: '#fff',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
  },
  list: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '40px clamp(24px, 6vw, 64px) 120px',
  },
  item: { padding: '48px 0', borderBottom: '1px solid rgba(234,242,255,0.1)' },
  index: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 13,
    letterSpacing: '0.22em',
    color: 'rgba(79,209,255,0.85)',
  },
  name: {
    margin: '10px 0 0',
    fontFamily: "'Sora', system-ui, sans-serif",
    fontSize: 'clamp(32px, 5vw, 52px)',
    fontWeight: 600,
    color: '#eaf2ff',
  },
  tagline: {
    margin: '12px 0 0',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 18,
    color: 'rgba(234,242,255,0.74)',
  },
};
