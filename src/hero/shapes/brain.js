import { createNoise3D } from 'simplex-noise';

const noise3D = createNoise3D();

// Fraction of points used for the cerebellum (lower-back lobe).
const CEREBELLUM_FRAC = 0.14;

/**
 * Procedural BRAIN point cloud (zero-asset fallback).
 *
 * Two wrinkled cerebral hemispheres (wider than tall) split by a clear central
 * fissure, with a flattened underside and a small ridged cerebellum at the
 * lower back. Gyri are carved with *ridged* simplex noise (1 - |noise|), which
 * produces the sharp fold-lines a brain actually has — far more recognizable
 * than smooth bumps.
 *
 * Optional upgrade path (see README): load a low-poly brain `.glb` with
 * GLTFLoader and `samplePoints(meshes, count)` instead.
 */
export default function brain(count) {
  const arr = new Float32Array(count * 3);
  const cerebellumStart = Math.floor(count * (1 - CEREBELLUM_FRAC));

  for (let i = 0; i < count; i++) {
    // Random direction on a unit sphere.
    let x = Math.random() * 2 - 1;
    let y = Math.random() * 2 - 1;
    let z = Math.random() * 2 - 1;
    const len = Math.hypot(x, y, z) || 1;
    x /= len; y /= len; z /= len;

    if (i < cerebellumStart) {
      // --- CEREBRUM: two wrinkled hemispheres -----------------------------
      const side = i % 2 === 0 ? -1 : 1;
      const ax = Math.abs(x);

      // Ellipsoid: wider than tall, and FLATTER (less depth) so the front-on
      // silhouette + folds read clearly instead of a deep blob.
      let pxMag = ax * 1.05;
      let py = y * 0.82;
      let pz = z * 0.66;

      // Gyri: layered ridged noise -> deep, high-contrast fold lines.
      const sx = side * pxMag;
      const f = 3.0;
      const r1 = 1 - Math.abs(noise3D(sx * f, py * f, pz * f));
      const r2 = 1 - Math.abs(noise3D(sx * f * 2.3 + 11, py * f * 2.3 - 7, pz * f * 2.3 + 3));
      const gy = r1 * 0.6 + r2 * 0.4;
      const sc = 0.74 + gy * 0.5;
      pxMag *= sc; py *= sc; pz *= sc;

      // Flatten the underside (brains are flat on the bottom).
      if (py < 0) py *= 0.7;

      // Sagittal fissure: a clear, wide gap between the two hemispheres, each
      // with a flattish medial wall.
      arr[i * 3] = side * (0.14 + pxMag);
      arr[i * 3 + 1] = py;
      arr[i * 3 + 2] = pz;
    } else {
      // --- CEREBELLUM: small ridged lobe at the lower back -----------------
      let px = x * 0.58;
      let py = y * 0.28;
      let pz = z * 0.3;

      // Fine horizontal folia.
      const r = 1 - Math.abs(noise3D(px * 3 + 50, py * 11, pz * 3));
      const sc = 0.82 + r * 0.26;
      px *= sc; py *= sc; pz *= sc;

      arr[i * 3] = px;
      arr[i * 3 + 1] = py - 0.72;
      arr[i * 3 + 2] = pz - 0.4;
    }
  }
  return arr;
}
