import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { samplePoints } from './sampleGeometry.js';

/**
 * INCBOT — AI Interview Software.
 *
 * A friendly AI robot head: a rounded-box face, two glowing eyes, and a small
 * antenna with a bulb. Composed from primitives, merged, then surface-sampled.
 */
export default function incbot(count) {
  const geos = [];

  // Head.
  const head = new RoundedBoxGeometry(2.0, 1.7, 1.2, 5, 0.35);
  geos.push(head);

  // Eyes (protruding spheres read clearly as eyes after sampling).
  const eyeGeo = () => new THREE.SphereGeometry(0.26, 20, 20);
  const eyeL = eyeGeo();
  eyeL.translate(-0.45, 0.18, 0.62);
  const eyeR = eyeGeo();
  eyeR.translate(0.45, 0.18, 0.62);
  geos.push(eyeL, eyeR);

  // Mouth bar.
  const mouth = new THREE.BoxGeometry(0.8, 0.12, 0.1);
  mouth.translate(0, -0.42, 0.62);
  geos.push(mouth);

  // Antenna stalk + bulb.
  const stalk = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
  stalk.translate(0, 1.1, 0);
  const bulb = new THREE.SphereGeometry(0.16, 16, 16);
  bulb.translate(0, 1.4, 0);
  geos.push(stalk, bulb);

  // Side "ears".
  const earL = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12);
  earL.rotateZ(Math.PI / 2);
  earL.translate(-1.05, 0, 0);
  const earR = earL.clone();
  earR.translate(2.1, 0, 0);
  geos.push(earL, earR);

  return samplePoints(geos, count);
}
