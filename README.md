# InCruiter — Scroll-Driven Morphing Particle Hero

A reusable React Three Fiber landing experience: a cloud of tens of thousands of
glowing particles that **morphs between 7 shapes as the user scrolls** — an AI
**brain** plus InCruiter's **6 products**. Each product's text appears on the
**opposite side** of the cloud, alternating left/right down the page, so the
visitor "feels" each product as they scroll. Corporate-premium feel, **60fps on
integrated graphics**, no Blender — every shape is generated in code.

```
scroll ↓   Brain → IncServe → IncBot → IncScreen → IncVid → IncFeed → IncProctor
cloud      right    left       right    left        right    left      right
text       left     right      left     right       left     right     left
```

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle
```

The dev build shows an `r3f-perf` FPS monitor (top-left) and a `leva` tuning
panel (top-right) for `uSize`, mouse radius/strength. Both are gated behind
`import.meta.env.DEV` and absent from the production runtime path.

## How the scroll morph works

All 7 shapes are generated as point clouds with the **exact same particle count
`N`** (`shapes/index.js` → `buildAllShapes(N)`). Identical `N` is mandatory:
particle *i* in shape A maps 1:1 to particle *i* in shape B, so they can be
linearly interpolated.

The interpolation happens **on the GPU**. The geometry carries:

| attribute | meaning |
|-----------|---------|
| `position` | current source shape (A) |
| `aTarget`  | next shape (B) |
| `aRandom`  | per-particle 0..1 — staggered timing + noise seed |
| `aScale`   | per-particle size variance |

The page is `N × 100svh` tall. `ParticleHero` tracks scroll progress `0..1` into
`scrollRef`. Each frame `ParticleSystem` (in `useFrame`) maps it to a segment
`seg = progress × (N-1)`:

- `src = floor(seg)`, `frac = seg - src` → `uMorph = frac` (the vertex shader
  applies a staggered ease, so the morph feels organic in both scroll directions).
- When `src` changes, `shapes[src]` is copied into `position` and `shapes[src+1]`
  into `aTarget` (a cheap swap that happens ~6 times across the whole page, never
  per frame).
- The cloud **slides side-to-side** (`points.position.x`): even shapes to the
  right, odd shapes to the left, so each section's text sits on the opposite side.

Scroll input is **damped** (`lerp` toward target each frame) so the morph is
smooth, not jittery. The vertex shader also adds continuous simplex-noise drift
(so the cloud breathes at rest) and world-space **mouse repulsion**.

`ScrollStory.jsx` renders one full-viewport section per product, alternating
text side, and fades/blurs each one in as it reaches the viewport center (a
private rAF loop reads `scrollRef` — no per-frame React state). Vertical nav dots
smooth-scroll to any product.

## Adaptive quality (`useAdaptiveQuality.js`)

Picks a tier once on mount from `hardwareConcurrency`, `deviceMemory`, viewport
width, a WebGL capability check, and `prefers-reduced-motion`:

| Tier | Trigger | `N` | DPR cap | Bloom |
|------|---------|-----|---------|-------|
| High | desktop, ≥8 cores, ≥8GB, ≥1280px | 110,000 | 2 | on |
| Mid  | desktop, modest specs | 60,000 | 1.5 | on (lower) |
| Low  | mobile / small viewport / few cores | 22,000 | 1 | off |
| Static | reduced-motion **or** no WebGL **or** weak device | — | — | static product list |

Other perf rules already wired in:

- One `BufferGeometry`, one draw call (`THREE.Points` — no instancing).
- Point size clamped + DPR-aware so dense areas never blow out fill-rate.
- Additive blending with `depthWrite = false` (no z-fighting / dark halos).
- Render loop **pauses** when the tab is hidden (`visibilitychange`).
- The whole hero is `React.lazy`-loaded behind a CSS-gradient placeholder, so it
  never blocks first paint.
- An error boundary falls back to a static hero if WebGL fails.

## Project structure

```
src/hero/
  ParticleHero.jsx       fixed Canvas + postprocessing + scroll/mouse tracking + fallbacks
  ParticleSystem.jsx     <points> + ShaderMaterial + scroll-driven morph + side-slide
  ScrollStory.jsx         tall scroll container: alternating L/R text sections + nav dots
  useAdaptiveQuality.js   device tier detection
  brand.js                palette + product metadata (order is contractual)
  shaders/                particles.vert.glsl + particles.frag.glsl
  shapes/
    index.js              buildAllShapes(N) -> Float32Array[7]
    sampleGeometry.js     MeshSurfaceSampler + merge + normalize helpers
    brain.js incserve.js incbot.js incscreen.js incvid.js incfeed.js incproctor.js
```

## Next.js (app router) integration

The core is framework-agnostic. Drop it in as a client-only dynamic import:

```jsx
// app/components/Hero.jsx
'use client';
import dynamic from 'next/dynamic';

const ParticleHero = dynamic(() => import('@/hero/ParticleHero'), {
  ssr: false,
  loading: () => <HeroGradientPlaceholder />,
});

export default function Hero() {
  return <ParticleHero />;
}
```

Notes:

- `ssr: false` is required — all `window`/WebGL access is already guarded, and
  `useAdaptiveQuality` returns the `static` tier when `window` is undefined, but
  WebGL must only run in the browser.
- Copy `src/hero/` into your app and adjust the `?raw` GLSL imports (Next.js +
  webpack supports `import x from './a.glsl'` via
  [`raw-loader`](https://webpack.js.org/loaders/raw-loader/) or Turbopack's
  asset imports; with Vite the `?raw` suffix is native).
- For production, remove the `leva` and `r3f-perf` imports in `ParticleHero.jsx`
  and the `useControls` call in `ParticleSystem.jsx` (they're dev-only).
- Serve a real `fallback/hero-static.webp` (a screenshot of the brain shape) and
  swap it into `StaticHero` for the cleanest reduced-motion experience.

## Upgrade paths (optional, zero-asset by default)

- **Brain GLB** — drop `public/models/brain.glb` and load it in `shapes/brain.js`
  (see `public/models/README.md`).
- **Premium SVG route** — drop product SVG logos in `public/icons/`, load with
  `SVGLoader` → `ShapeGeometry`, then `samplePoints(geometry, N)`. The particles
  will form each product's actual logo.

## Accessibility

- The canvas container is `aria-hidden` (decorative). The heading + CTA live in
  accessible DOM and work even if WebGL fails.
- `prefers-reduced-motion` → static image, no animation.
- Cycle dots are real `<button role="tab">` elements (keyboard-focusable); the
  CTA is a standard link.
