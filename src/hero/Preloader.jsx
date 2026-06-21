import React, { useEffect, useRef, useState } from 'react';
import { PALETTE } from './brand.js';

/**
 * Cinematic preloader: a counter ramps to ~92% while shapes build, completes to
 * 100% on the first rendered frame (`ready`), then the panel slides away to
 * reveal the scene. Sets the tone before a single particle is seen.
 */
export default function Preloader({ ready, onDone }) {
  const [pct, setPct] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const cur = useRef(0);

  useEffect(() => {
    let raf;
    const tick = () => {
      const target = ready ? 100 : 92;
      cur.current += (target - cur.current) * 0.07;
      if (ready && target - cur.current < 0.4) cur.current = 100;
      setPct(Math.round(cur.current));
      if (cur.current >= 99.9 && ready) {
        setTimeout(() => setExiting(true), 450);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  if (hidden) return null;

  return (
    <div
      style={{
        ...styles.root,
        transform: exiting ? 'translateY(-100%)' : 'translateY(0)',
        opacity: exiting ? 0 : 1,
      }}
      onTransitionEnd={() => {
        if (exiting) {
          setHidden(true);
          onDone && onDone();
        }
      }}
      aria-hidden="true"
    >
      <div style={styles.inner}>
        <span style={styles.label}>Crafting your experience</span>
        <div style={styles.wordmark}>
          In<span style={{ color: PALETTE.cyan }}>Cruiter</span>
        </div>
        <div style={styles.barTrack}>
          <div style={{ ...styles.barFill, width: `${pct}%` }} />
        </div>
        <div style={styles.pctRow}>
          <span style={styles.tag}>AI Interview Platform</span>
          <span style={styles.pct}>{String(pct).padStart(3, '0')}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    background: 'linear-gradient(180deg, #07182e 0%, #050d1a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 1s cubic-bezier(0.76,0,0.24,1), opacity 1s ease',
    willChange: 'transform, opacity',
  },
  inner: { width: 'min(440px, 80vw)' },
  label: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 12,
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: 'rgba(234,242,255,0.5)',
  },
  wordmark: {
    margin: '14px 0 28px',
    fontFamily: "'Sora', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 'clamp(38px, 6vw, 56px)',
    letterSpacing: '-0.02em',
    color: '#eaf2ff',
  },
  barTrack: {
    height: 2,
    width: '100%',
    background: 'rgba(234,242,255,0.12)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #2f6fed, #4fd1ff)',
    boxShadow: '0 0 12px rgba(79,209,255,0.7)',
    transition: 'width 0.12s linear',
  },
  pctRow: {
    marginTop: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  tag: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 12,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'rgba(234,242,255,0.45)',
  },
  pct: {
    fontFamily: "'Sora', system-ui, sans-serif",
    fontSize: 14,
    color: PALETTE.cyan,
    fontVariantNumeric: 'tabular-nums',
  },
};
