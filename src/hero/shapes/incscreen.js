import * as THREE from 'three';
import { samplePoints } from './sampleGeometry.js';

/**
 * INCSCREEN — Conversational AI recruiter.
 *
 * A laptop: an upright landscape screen plus a foreshortened keyboard deck
 * angled toward the viewer, giving a clear 3/4 "open laptop" read.
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

export default function incscreen(count) {
  // Screen: landscape rounded panel, tilted slightly back.
  const screenShape = roundedRect(2.3, 1.5, 0.14);
  const screen = new THREE.ExtrudeGeometry(screenShape, {
    depth: 0.1,
    bevelEnabled: false,
  });
  screen.center();
  screen.rotateX(-0.16); // top leans back
  screen.translate(0, 0.5, -0.1);

  // Keyboard deck: a trapezoid (wider at the front) laid down toward the viewer.
  const deck = new THREE.Shape();
  const topW = 2.1;
  const botW = 2.7;
  const dh = 1.4;
  deck.moveTo(-topW / 2, dh / 2);
  deck.lineTo(topW / 2, dh / 2);
  deck.lineTo(botW / 2, -dh / 2);
  deck.lineTo(-botW / 2, -dh / 2);
  deck.closePath();
  const deckGeo = new THREE.ExtrudeGeometry(deck, { depth: 0.12, bevelEnabled: false });
  deckGeo.center();
  deckGeo.rotateX(-1.32); // lay nearly flat, facing up toward the camera
  deckGeo.translate(0, -0.62, 0.55);

  // ~60% screen, ~40% deck so both read clearly.
  const screenPts = Math.floor(count * 0.6);
  const screenArr = samplePoints(screen, screenPts);
  const deckArr = samplePoints(deckGeo, count - screenPts);

  const arr = new Float32Array(count * 3);
  arr.set(screenArr, 0);
  arr.set(deckArr, screenPts * 3);
  return arr;
}
