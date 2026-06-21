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

      // Ellipsoid: wider than tall, with depth.
      let pxMag = ax * 1.02;
      let py = y * 0.82;
      let pz = z * 0.95;

      // Gyri: layered ridged noise -> sharp fold lines.
      const sx = side * pxMag;
      const f = 2.4;
      const r1 = 1 - Math.abs(noise3D(sx * f, py * f, pz * f));
      const r2 = 1 - Math.abs(noise3D(sx * f * 2.2 + 11, py * f * 2.2 - 7, pz * f * 2.2 + 3));
      const gy = r1 * 0.65 + r2 * 0.35;
      const sc = 0.82 + gy * 0.34;
      pxMag *= sc; py *= sc; pz *= sc;

      // Flatten the underside (brains are flat on the bottom).
      if (py < 0) py *= 0.72;

      // Sagittal fissure: a clear gap between the two hemispheres, each with a
      // flattish medial wall.
      arr[i * 3] = side * (0.08 + pxMag);
      arr[i * 3 + 1] = py;
      arr[i * 3 + 2] = pz;
    } else {
      // --- CEREBELLUM: small ridged lobe at the lower back -----------------
      let px = x * 0.55;
      let py = y * 0.3;
      let pz = z * 0.4;

      // Fine horizontal folia.
      const r = 1 - Math.abs(noise3D(px * 3 + 50, py * 10, pz * 3));
      const sc = 0.85 + r * 0.22;
      px *= sc; py *= sc; pz *= sc;

      arr[i * 3] = px;
      arr[i * 3 + 1] = py - 0.74;
      arr[i * 3 + 2] = pz - 0.62;
    }
  }
  return arr;
}
