import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

import { buildAllShapes } from './shapes/index.js';
import { PALETTE, NUM_SHAPES } from './brand.js';
import vertexShader from './shaders/particles.vert.glsl?raw';
import fragmentShader from './shaders/particles.frag.glsl?raw';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smoothstep = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// Multicolor particle palette (weighted): mostly cool/brand with warm + violet
// sparkles, for a jewel-like cloud on black — inspired by the reference.
const COLOR_WEIGHTS = [
  ['#4fd1ff', 28], // cyan
  ['#eaf2ff', 22], // white
  ['#3b82f6', 15], // electric blue
  ['#7c8cff', 12], // periwinkle
  ['#ffd27a', 10], // gold spark
  ['#a07bff', 8], // violet
  ['#3ee0c0', 5], // aqua
];

// Tuned constants (previously the leva panel).
const SIDE_OFFSET = 2.0; // how far the cloud slides to each side
const MOUSE_RADIUS = 1.8;
const MOUSE_STRENGTH = 0.18;
const SCATTER = 4.6; // dispersion spread at mid-transition (fills the screen)

// Sections: 1 hero (scattered particle field) + the product shapes.
const SECTIONS = NUM_SHAPES + 1;

// Sprite-shape weights: soft circle, square, sharp circle, diamond, plus.
const SHAPE_WEIGHTS = [34, 26, 16, 12, 12];

/**
 * Scroll-driven particle cloud: one BufferGeometry, one draw call.
 *
 * Scroll progress (0..1) maps to a segment `seg = progress * (N-1)`. The cloud
 * morphs from shapes[floor(seg)] -> shapes[floor(seg)+1] by the fractional part,
 * and slides side-to-side (even shapes right, odd shapes left) so each product's
 * text can sit on the opposite side.
 *
 * @param {number} count       particles per shape (identical across shapes)
 * @param {number} baseSize    tier-derived global point size
 * @param {object} scrollRef   ref holding scroll progress 0..1
 * @param {object} mouseRef    ref holding {x,y,active} normalized device coords
 * @param {Function} onSegmentChange  called with the nearest shape index
 */
export default function ParticleSystem({
  count,
  baseSize,
  scrollRef,
  mouseRef,
  onSegmentChange,
  onReady,
  isMobile,
}) {
  const pointsRef = useRef();
  const geomRef = useRef();
  const { size } = useThree();

  // Camera distance so shapes always fit: pull back on portrait / narrow.
  const baseZ = useMemo(() => {
    const aspect = size.width / Math.max(size.height, 1);
    if (aspect >= 1.1) return 5;
    return clamp(5 / (aspect * 0.92), 5, 9);
  }, [size]);

  // Build all 7 equal-count shapes once.
  const shapes = useMemo(() => buildAllShapes(count), [count]);

  // Stable, mutable attribute buffers (mutated in place on segment change).
  const positionArr = useMemo(() => shapes[0].slice(), [shapes]);
  const targetArr = useMemo(() => shapes[1].slice(), [shapes]);

  const { aRandom, aScale, aColor, aShape, aScatter } = useMemo(() => {
    const r = new Float32Array(count);
    const s = new Float32Array(count);
    const c = new Float32Array(count * 3);
    const sh = new Float32Array(count);
    const sc = new Float32Array(count * 3); // baked scatter/field direction

    const palette = COLOR_WEIGHTS.map(([hex, w]) => ({
      col: new THREE.Color(hex),
      w,
    }));
    const total = palette.reduce((sum, p) => sum + p.w, 0);

    // Sprite-shape mix: 0 soft circle, 1 square pixel, 2 sharp circle,
    // 3 diamond, 4 plus/cross. Weighted so it reads varied, not noisy.
    const shapeTotal = SHAPE_WEIGHTS.reduce((sum, w) => sum + w, 0);

    for (let i = 0; i < count; i++) {
      r[i] = Math.random();
      s[i] = 0.6 + Math.random() * 0.9;

      let pick = Math.random() * total;
      let chosen = palette[0].col;
      for (const p of palette) {
        pick -= p.w;
        if (pick <= 0) {
          chosen = p.col;
          break;
        }
      }
      c[i * 3] = chosen.r;
      c[i * 3 + 1] = chosen.g;
      c[i * 3 + 2] = chosen.b;

      let sp = Math.random() * shapeTotal;
      let shapeIdx = 0;
      for (let k = 0; k < SHAPE_WEIGHTS.length; k++) {
        sp -= SHAPE_WEIGHTS[k];
        if (sp <= 0) {
          shapeIdx = k;
          break;
        }
      }
      sh[i] = shapeIdx;

      // Baked scatter direction: a box distribution so the dispersed/hero state
      // fills a rectangle (the screen) rather than a sphere. Bias toward the
      // edges a touch so the field reads dense.
      sc[i * 3] = Math.random() * 2 - 1;
      sc[i * 3 + 1] = Math.random() * 2 - 1;
      sc[i * 3 + 2] = (Math.random() * 2 - 1) * 0.7;
    }
    return { aRandom: r, aScale: s, aColor: c, aShape: sh, aScatter: sc };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uSize: { value: baseSize },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uMouse: { value: new THREE.Vector3(9999, 9999, 9999) },
      uMouseRadius: { value: MOUSE_RADIUS },
      uMouseStrength: { value: MOUSE_STRENGTH },
      uScatter: { value: SCATTER },
      uHero: { value: 1 },
      uField: { value: new THREE.Vector3(4.3, 2.8, 2.2) },
      uColorHot: { value: new THREE.Color(PALETTE.white) },
    }),
    [baseSize]
  );

  // Responsive hero-field extent: narrower + taller on portrait/mobile.
  useEffect(() => {
    if (isMobile) uniforms.uField.value.set(2.9, 5.0, 2.2);
    else uniforms.uField.value.set(4.3, 2.8, 2.2);
  }, [isMobile, uniforms]);

  const smooth = useRef(0);
  const lastSrc = useRef(-1);
  const lastActive = useRef(-1);
  const ready = useRef(false);
  const mouseVec = useRef(new THREE.Vector3());

  useFrame(({ camera, clock }, delta) => {
    const dt = clamp(delta, 0, 0.05);
    uniforms.uTime.value = clock.elapsedTime;

    // Damp the scroll value so morphing feels smooth, not jittery.
    const raw = clamp(scrollRef.current || 0, 0, 1);
    smooth.current = lerp(smooth.current, raw, clamp(dt * 6, 0, 1));

    // seg 0..NUM_SHAPES across all sections. [0,1] = hero field -> first shape.
    const seg = smooth.current * (SECTIONS - 1);
    const heroT = smoothstep(clamp(1 - seg, 0, 1)); // 1 at top, 0 by first shape

    // Product morph uses (seg - 1): 0 = brain ... NUM_SHAPES-1 = last product.
    const pseg = clamp(seg - 1, 0, NUM_SHAPES - 1);
    const src = clamp(Math.floor(pseg), 0, NUM_SHAPES - 2);
    const frac = clamp(pseg - src, 0, 1);
    const eased = smoothstep(frac);

    // Swap source/target attributes only when the segment changes.
    if (src !== lastSrc.current) {
      const g = geomRef.current;
      if (g) {
        g.attributes.position.array.set(shapes[src]);
        g.attributes.aTarget.array.set(shapes[src + 1]);
        g.attributes.position.needsUpdate = true;
        g.attributes.aTarget.needsUpdate = true;
      }
      lastSrc.current = src;
    }
    uniforms.uMorph.value = frac;
    uniforms.uHero.value = heroT;

    // Desktop: slide side-to-side (even right, odd left), centered at hero.
    // Mobile: keep centered and lift the shape into the upper area so the
    // stacked text below has room.
    const sideOf = (i) => (i % 2 === 0 ? 1 : -1) * SIDE_OFFSET;
    if (pointsRef.current) {
      if (isMobile) {
        pointsRef.current.position.x = 0;
        pointsRef.current.position.y = lerp(1.05, 0, heroT); // up for products
      } else {
        const baseOffset = lerp(sideOf(src), sideOf(src + 1), eased);
        pointsRef.current.position.x = lerp(baseOffset, 0, heroT);
        pointsRef.current.position.y = 0;
      }
      // Gentle oscillating tilt for life — never a full spin (keeps flat shapes
      // like the calendar/shield readable).
      pointsRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.22) * 0.1;
      pointsRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.17) * 0.04;
    }

    // Cinematic camera parallax: drift toward the cursor + a slow idle sway,
    // always looking at the origin. Gives the scene real depth.
    const active = mouseRef.current && mouseRef.current.active;
    const mx = active ? mouseRef.current.x : 0;
    const my = active ? mouseRef.current.y : 0;
    const idle = clock.elapsedTime;
    const tx = mx * 0.55 + Math.sin(idle * 0.18) * 0.12;
    const ty = my * 0.4 + Math.cos(idle * 0.15) * 0.08;
    camera.position.x += (tx - camera.position.x) * clamp(dt * 1.8, 0, 1);
    camera.position.y += (ty - camera.position.y) * clamp(dt * 1.8, 0, 1);
    camera.position.z = baseZ; // responsive distance (pulls back on portrait)
    camera.lookAt(0, 0, 0);

    // Report the nearest shape index for the text/nav highlight.
    const activeIdx = Math.round(seg);
    if (activeIdx !== lastActive.current) {
      lastActive.current = activeIdx;
      onSegmentChange && onSegmentChange(activeIdx);
    }

    // Mouse repulsion in world space (pointer tracked on window).
    if (active) {
      mouseVec.current
        .set(mouseRef.current.x, mouseRef.current.y, 0.5)
        .unproject(camera);
      const dir = mouseVec.current.sub(camera.position).normalize();
      const dist = -camera.position.z / dir.z;
      uniforms.uMouse.value.copy(camera.position).add(dir.multiplyScalar(dist));
    }

    // Signal first rendered frame (lets the preloader reveal the scene).
    if (!ready.current) {
      ready.current = true;
      onReady && onReady();
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          array={positionArr}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTarget"
          array={targetArr}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          array={aRandom}
          count={count}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aScale"
          array={aScale}
          count={count}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aColor"
          array={aColor}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aShape"
          array={aShape}
          count={count}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aScatter"
          array={aScatter}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
