import { normalizePoints } from './sampleGeometry.js';
import brain from './brain.js';
import incserve from './incserve.js';
import incbot from './incbot.js';
import incscreen from './incscreen.js';
import incvid from './incvid.js';
import incfeed from './incfeed.js';
import incproctor from './incproctor.js';

// ORDER IS CONTRACTUAL — must match PRODUCTS in brand.js.
//   0 BRAIN  1 INCSERVE  2 INCBOT  3 INCSCREEN  4 INCVID  5 INCFEED  6 INCPROCTOR
const GENERATORS = [brain, incserve, incbot, incscreen, incvid, incfeed, incproctor];

const TARGET_RADIUS = 1.65;

/**
 * Build all 7 shapes as point clouds with the EXACT same particle count `count`.
 * Identical count is mandatory: particle i in shape A maps 1:1 to particle i in
 * shape B for linear morph interpolation on the GPU.
 *
 * @returns {Float32Array[]} array of 7 Float32Array(count*3), normalized + centered.
 */
export function buildAllShapes(count) {
  return GENERATORS.map((gen) => normalizePoints(gen(count), TARGET_RADIUS));
}
