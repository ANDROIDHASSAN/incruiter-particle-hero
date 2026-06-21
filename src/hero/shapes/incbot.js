import * as THREE from 'three';
import { samplePoints } from './sampleGeometry.js';

/**
 * INCBOT — AI Interview Software.
 *
 * A clean, front-facing robot-face icon: an outlined rounded head, two dense
 * eyes, a mouth bar, side ears and an antenna. Points are allocated per feature
 * (not area-weighted) so the eyes/mouth stay dense and clearly readable instead
 * of dissolving into a filled blob.
 */
function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export default function incbot(count) {
  // Head outline (rounded-square ring).
  const outer = roundedRect(2.2, 1.95, 0.45);
  const inner = roundedRect(1.66, 1.42, 0.34);
  outer.holes.push(new THREE.Path(inner.getPoints(44).reverse()));
  const frame = new THREE.ExtrudeGeometry(outer, { depth: 0.16, bevelEnabled: false });
  frame.center();

  // Eyes — dense filled discs with a ring rim for an expressive robot look.
  const eyeL = new THREE.CircleGeometry(0.26, 32);
  eyeL.translate(-0.44, 0.18, 0.1);
  const eyeR = new THREE.CircleGeometry(0.26, 32);
  eyeR.translate(0.44, 0.18, 0.1);

  // Mouth — rounded bar.
  const mouthShape = roundedRect(0.86, 0.2, 0.1);
  const mouth = new THREE.ExtrudeGeometry(mouthShape, { depth: 0.1, bevelEnabled: false });
  mouth.center();
  mouth.translate(0, -0.46, 0.1);

  // Antenna — stalk + bulb.
  const stalk = new THREE.CylinderGeometry(0.045, 0.045, 0.45, 8);
  stalk.translate(0, 1.2, 0);
  const bulb = new THREE.SphereGeometry(0.16, 18, 18);
  bulb.translate(0, 1.46, 0);

  // Side "ears".
  const earL = new THREE.CylinderGeometry(0.11, 0.11, 0.32, 14);
  earL.rotateZ(Math.PI / 2);
  earL.translate(-1.2, 0, 0);
  const earR = earL.clone();
  earR.translate(2.4, 0, 0);

  // Explicit per-feature point budget so small features stay legible.
  const arr = new Float32Array(count * 3);
  let o = 0;
  const put = (geo, frac) => {
    const n = Math.max(1, Math.floor(count * frac));
    const slice = samplePoints(geo, Math.min(n, count - o / 3));
    arr.set(slice, o);
    o += slice.length;
  };

  put(frame, 0.4);
  put(eyeL, 0.12);
  put(eyeR, 0.12);
  put(mouth, 0.12);
  put([stalk, bulb], 0.12);
  put([earL, earR], 0.1);
  // Fill any remainder on the frame so the count stays exact.
  if (o < count * 3) {
    const rest = samplePoints(frame, (count * 3 - o) / 3);
    arr.set(rest, o);
  }

  return arr;
}
