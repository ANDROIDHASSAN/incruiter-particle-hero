import { useMemo } from 'react';

/**
 * Detect device capability once on mount and pick a quality tier.
 *
 * Tiers:
 *   high   — desktop, >=8 cores, no reduced-motion        : 80k particles, dpr<=2, bloom
 *   mid    — desktop, modest cores / integrated GPU       : 35k particles, dpr<=1.5, bloom (lower)
 *   low    — mobile / small viewport / few cores          : 12k particles, dpr 1, no bloom
 *   static — reduced-motion OR no WebGL OR very weak       : render static fallback
 *
 * SSR-safe: returns the `static` tier when `window` is unavailable.
 */
export function useAdaptiveQuality() {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return STATIC_TIER;
    }

    const reducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || !hasWebGL()) {
      return STATIC_TIER;
    }

    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4; // GB, when available
    const width = window.innerWidth;
    const isMobile =
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || width < 760;

    if (isMobile || cores <= 3 || memory <= 2) {
      // Mobile: fewer particles, DPR capped at 1.5 (sharp but cheap), no bloom.
      return {
        tier: 'low',
        count: 14000,
        dprCap: Math.min(devicePixelRatioSafe(), 1.5),
        bloom: false,
        bloomIntensity: 0,
        size: 10,
        reducedMotion: false,
      };
    }

    if (cores >= 8 && memory >= 8 && width >= 1280) {
      return {
        tier: 'high',
        count: 65000,
        dprCap: Math.min(devicePixelRatioSafe(), 1.5),
        bloom: true,
        bloomIntensity: 0.5,
        size: 10,
        reducedMotion: false,
      };
    }

    return {
      tier: 'mid',
      count: 40000,
      dprCap: Math.min(devicePixelRatioSafe(), 1.25),
      bloom: true,
      bloomIntensity: 0.45,
      size: 10,
      reducedMotion: false,
    };
  }, []);
}

const STATIC_TIER = {
  tier: 'static',
  count: 0,
  dprCap: 1,
  bloom: false,
  bloomIntensity: 0,
  size: 0,
  reducedMotion: true,
};

function devicePixelRatioSafe() {
  return (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch (e) {
    return false;
  }
}
