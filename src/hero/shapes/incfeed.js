import * as THREE from 'three';
import { samplePoints } from './sampleGeometry.js';

/**
 * INCFEED — Interview Scheduling Software.
 *
 * A calendar: a rounded square frame, a header bar, two binder rings, and a
 * grid of date dots arranged directly for crispness.
 */
function roundedRectShape(w, h, r) {
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

  // --- Frame (rounded-rect ring) + header bar via surface sampling. -------
  const outer = roundedRectShape(W, H, 0.28);
  const inner = roundedRectShape(W - 0.28, H - 0.28, 0.18);
  outer.holes.push(new THREE.Path(inner.getPoints(48).reverse()));
  const frame = new THREE.ExtrudeGeometry(outer, { depth: 0.12, bevelEnabled: false });
  frame.center();

  const header = new THREE.BoxGeometry(W - 0.28, 0.42, 0.13);
  header.translate(0, H / 2 - 0.42, 0);

  const ringL = new THREE.TorusGeometry(0.09, 0.03, 8, 16);
  ringL.translate(-W / 4, H / 2 - 0.02, 0);
  const ringR = ringL.clone();
  ringR.translate(W / 2, 0, 0);

  const framePoints = Math.floor(count * 0.45);
  arr.set(samplePoints([frame, header, ringL, ringR], framePoints), 0);

  // --- Date grid dots placed directly. ------------------------------------
  const cols = 5;
  const rows = 4;
  const cells = cols * rows;
  const gridPoints = count - framePoints;
  const gridW = W - 0.9;
  const gridH = H - 1.1;
  const x0 = -gridW / 2;
  const y0 = -gridH / 2 - 0.15;
  const stepX = gridW / (cols - 1);
  const stepY = gridH / (rows - 1);
  const dotR = 0.12;

  for (let i = 0; i < gridPoints; i++) {
    const idx = framePoints + i;
    const cell = i % cells;
    const cx = cell % cols;
    const cy = Math.floor(cell / cols);
    const r = Math.pow(Math.random(), 0.5) * dotR;
    const a = Math.random() * Math.PI * 2;
    arr[idx * 3] = x0 + cx * stepX + Math.cos(a) * r;
    arr[idx * 3 + 1] = y0 + cy * stepY + Math.sin(a) * r;
    arr[idx * 3 + 2] = (Math.random() - 0.5) * 0.06;
  }

  return arr;
}
