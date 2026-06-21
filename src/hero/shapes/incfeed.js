import * as THREE from 'three';
import { samplePoints } from './sampleGeometry.js';

/**
 * INCFEED — Interview Scheduling Software.
 *
 * A clean calendar: a rounded-rect outline, a solid header bar, two binder
 * rings, and a crisp grid of date dots. Points are budgeted per feature so the
 * header and grid stay dense and readable.
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

const W = 2.6;
const H = 2.4;

export default function incfeed(count) {
  const arr = new Float32Array(count * 3);
  let o = 0;
  const put = (geo, frac) => {
    const n = Math.max(1, Math.floor(count * frac));
    const slice = samplePoints(geo, Math.min(n, count - o / 3));
    arr.set(slice, o);
    o += slice.length;
  };

  // Frame outline (rounded-rect ring).
  const outer = roundedRect(W, H, 0.28);
  const inner = roundedRect(W - 0.3, H - 0.3, 0.18);
  outer.holes.push(new THREE.Path(inner.getPoints(48).reverse()));
  const frame = new THREE.ExtrudeGeometry(outer, { depth: 0.12, bevelEnabled: false });
  frame.center();
  put(frame, 0.3);

  // Solid header bar.
  const header = new THREE.BoxGeometry(W - 0.3, 0.42, 0.14);
  header.translate(0, H / 2 - 0.42, 0);
  put(header, 0.12);

  // Binder rings.
  const ringL = new THREE.TorusGeometry(0.1, 0.035, 10, 18);
  ringL.translate(-W / 4, H / 2 - 0.02, 0);
  const ringR = ringL.clone();
  ringR.translate(W / 2, 0, 0);
  put([ringL, ringR], 0.06);

  // Date grid dots placed directly (the remaining budget).
  const cols = 5;
  const rows = 4;
  const cells = cols * rows;
  const gridPoints = Math.max(0, count - o / 3);
  const gridW = W - 0.9;
  const gridH = H - 1.15;
  const x0 = -gridW / 2;
  const y0 = -gridH / 2 - 0.18;
  const stepX = gridW / (cols - 1);
  const stepY = gridH / (rows - 1);
  const dotR = 0.13;

  for (let i = 0; i < gridPoints; i++) {
    const cell = i % cells;
    const cx = cell % cols;
    const cy = Math.floor(cell / cols);
    const r = Math.pow(Math.random(), 0.6) * dotR;
    const a = Math.random() * Math.PI * 2;
    const idx = o / 3 + i;
    arr[idx * 3] = x0 + cx * stepX + Math.cos(a) * r;
    arr[idx * 3 + 1] = y0 + cy * stepY + Math.sin(a) * r;
    arr[idx * 3 + 2] = (Math.random() - 0.5) * 0.05;
  }

  return arr;
}
