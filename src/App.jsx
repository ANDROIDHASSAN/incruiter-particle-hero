import React, { Suspense, lazy } from 'react';

// Lazy-load the whole hero so it never blocks first paint.
const ParticleHero = lazy(() => import('./hero/ParticleHero.jsx'));

/**
 * A lightweight CSS-only placeholder shown while the hero chunk loads.
 * Mirrors the navy radial gradient so there's zero visual pop-in.
 */
function HeroGradientPlaceholder() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        background:
          'radial-gradient(120% 120% at 50% 38%, #133f7d 0%, #0a2342 46%, #050d1a 100%)',
      }}
    />
  );
}

export default function App() {
  return (
    <Suspense fallback={<HeroGradientPlaceholder />}>
      <ParticleHero />
    </Suspense>
  );
}
