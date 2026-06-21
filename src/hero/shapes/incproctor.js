import * as THREE from 'three';
import { samplePoints } from './sampleGeometry.js';

/**
 * INCPROCTOR — Online Proctoring Software.
 *
 * A clean shield OUTLINE with a bold check mark inside — security / proctoring.
 * Outlined (not a filled blob) so the silhouette and the check both read clearly.
 */
function shieldPath(scale) {
  const s = new THREE.Shape();
  s.moveTo(0, 1.3 * scale);
  s.bezierCurveTo(0.9 * scale, 1.0 * scale, 1.2 * scale, 0.9 * scale, 1.2 * scale, 0.6 * scale);
  s.lineTo(1.2 * scale, -0.2 * scale);
  s.bezierCurveTo(1.2 * scale, -0.9 * scale, 0.7 * scale, -1.3 * scale, 0, -1.6 * scale);
  s.bezierCurveTo(-0.7 * scale, -1.3 * scale, -1.2 * scale, -0.9 * scale, -1.2 * scale, -0.2 * scale);
  s.lineTo(-1.2 * scale, 0.6 * scale);
  s.bezierCurveTo(-1.2 * scale, 0.9 * scale, -0.9 * scale, 1.0 * scale, 0, 1.3 * scale);
  return s;
}

export default function incproctor(count) {
  // Shield outline = outer shield minus an inner shield (a thick ring).
  const outer = shieldPath(1.0);
  const innerPts = shieldPath(0.74).getPoints(60).reverse();
  outer.holes.push(new THREE.Path(innerPts));
  const shield = new THREE.ExtrudeGeometry(outer, {
    depth: 0.2,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2,
  });
  shield.center();

  // Bold check mark (two thick bars), raised toward the viewer.
  const c1 = new THREE.BoxGeometry(0.62, 0.22, 0.12);
  c1.rotateZ(-Math.PI / 4);
  c1.translate(-0.3, -0.2, 0.2);
  const c2 = new THREE.BoxGeometry(1.08, 0.22, 0.12);
  c2.rotateZ(Math.PI / 4);
  c2.translate(0.2, 0.08, 0.2);

  // ~58% shield outline, ~42% check so the symbol is bold and clear.
  const arr = new Float32Array(count * 3);
  const shieldPts = Math.floor(count * 0.58);
  arr.set(samplePoints(shield, shieldPts), 0);
  arr.set(samplePoints([c1, c2], count - shieldPts), shieldPts * 3);
  return arr;
}
