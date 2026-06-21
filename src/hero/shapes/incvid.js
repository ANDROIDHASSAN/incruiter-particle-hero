import * as THREE from 'three';
import { samplePoints } from './sampleGeometry.js';

/**
 * INCVID — Video Interview Software.
 *
 * A rounded square frame with a play-button triangle cut into it — the
 * universal "video" glyph.
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

export default function incvid(count) {
  // Outer rounded frame (a ring: outer shape with inner hole).
  const outer = roundedRectShape(2.4, 2.4, 0.5);
  const inner = roundedRectShape(1.9, 1.9, 0.38);
  outer.holes.push(new THREE.Path(inner.getPoints(40).reverse()));
  const frame = new THREE.ExtrudeGeometry(outer, {
    depth: 0.16,
    bevelEnabled: false,
  });
  frame.center();

  // Play triangle in the middle.
  const tri = new THREE.Shape();
  tri.moveTo(-0.32, -0.42);
  tri.lineTo(-0.32, 0.42);
  tri.lineTo(0.42, 0);
  tri.lineTo(-0.32, -0.42);
  const triGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.16, bevelEnabled: false });
  triGeo.center();

  // ~55% frame, ~45% triangle so the play glyph stays dense and readable.
  const framePoints = Math.floor(count * 0.55);
  const frameArr = samplePoints(frame, framePoints);
  const triArr = samplePoints(triGeo, count - framePoints);

  const arr = new Float32Array(count * 3);
  arr.set(frameArr, 0);
  arr.set(triArr, framePoints * 3);
  return arr;
}
