import React, { useEffect, useRef } from 'react';
import { PALETTE } from './brand.js';

/**
 * Custom cursor: an instant dot + a lagging ring that grows over interactive
 * elements. Fine-pointer devices only (the native cursor is hidden via the
 * `.has-custom-cursor` class set by ParticleHero). No-ops on touch.
 */
export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    document.documentElement.classList.add('has-custom-cursor');

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { x: mouse.x, y: mouse.y };
    let hovering = false;
    let visible = false;
    let raf;

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }
      if (dot) {
        dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
      }
    };
    const onOver = (e) => {
      hovering = !!(e.target.closest && e.target.closest('a, button'));
      ring.style.width = hovering ? '11px' : '9px';
      ring.style.height = hovering ? '11px' : '9px';
      ring.style.borderColor = hovering
        ? 'rgba(79,209,255,0.95)'
        : 'rgba(234,242,255,0.4)';
      ring.style.background = hovering ? 'rgba(79,209,255,0.08)' : 'transparent';
    };
    const onLeave = () => {
      visible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const loop = () => {
      ringPos.x += (mouse.x - ringPos.x) * 0.18;
      ringPos.y += (mouse.y - ringPos.y) * 0.18;
      if (ring) {
        ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <>
      <div ref={ringRef} style={styles.ring} />
      <div ref={dotRef} style={styles.dot} />
    </>
  );
}

const styles = {
  dot: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 3,
    height: 3,
    borderRadius: '50%',
    background: PALETTE.cyan,
    boxShadow: '0 0 6px rgba(79,209,255,0.9)',
    pointerEvents: 'none',
    zIndex: 90,
    opacity: 0,
    mixBlendMode: 'screen',
  },
  ring: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 9,
    height: 9,
    borderRadius: '50%',
    border: '1px solid rgba(234,242,255,0.4)',
    pointerEvents: 'none',
    zIndex: 90,
    opacity: 0,
    transition:
      'width 0.25s ease, height 0.25s ease, border-color 0.25s ease, background 0.25s ease',
  },
};
