import * as THREE from 'three';
import { samplePoints } from './sampleGeometry.js';

/**
 * INCPROCTOR — Online Proctoring Software.
 *
 * A classic shield with a check mark, conveying security / proctoring.
 */
export default function incproctor(count) {
  // Shield outline.
  const s = new THREE.Shape();
  s.moveTo(0, 1.3);
  s.bezierCurveTo(0.9, 1.0, 1.2, 0.9, 1.2, 0.6);
  s.lineTo(1.2, -0.2);
  s.bezierCurveTo(1.2, -0.9, 0.7, -1.3, 0, -1.6);
  s.bezierCurveTo(-0.7, -1.3, -1.2, -0.9, -1.2, -0.2);
  s.lineTo(-1.2, 0.6);
  s.bezierCurveTo(-1.2, 0.9, -0.9, 1.0, 0, 1.3);

  const shield = new THREE.ExtrudeGeometry(s, {
    depth: 0.22,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    bevelSegments: 2,
  });
  shield.center();

  // Check mark built from two boxes, raised slightly above the shield face.
  const c1 = new THREE.BoxGeometry(0.55, 0.16, 0.1);
  c1.rotateZ(-Math.PI / 4);
  c1.translate(-0.28, -0.18, 0.18);
  const c2 = new THREE.BoxGeometry(0.95, 0.16, 0.1);
  c2.rotateZ(Math.PI / 4);
  c2.translate(0.18, 0.05, 0.18);

  // ~70% shield, ~30% check so the symbol stays visible.
  const shieldPoints = Math.floor(count * 0.7);
  const shieldArr = samplePoints(shield, shieldPoints);
  const checkArr = samplePoints([c1, c2], count - shieldPoints);

  const arr = new Float32Array(count * 3);
  arr.set(shieldArr, 0);
  arr.set(checkArr, shieldPoints * 3);
  return arr;
}
