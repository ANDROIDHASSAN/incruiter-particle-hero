import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Strip a geometry down to a position-only, non-indexed form so a set of
 * heterogeneous geometries can be merged for sampling.
 */
function toPositionOnly(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', g.getAttribute('position').clone());
  return out;
}

/**
 * Sample `count` points uniformly (area-weighted) from one geometry's surface.
 * @returns {Float32Array} length count*3
 */
export function sampleGeometry(geometry, count) {
  const mesh = new THREE.Mesh(geometry);
  const sampler = new MeshSurfaceSampler(mesh).build();
  const arr = new Float32Array(count * 3);
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(p);
    arr[i * 3] = p.x;
    arr[i * 3 + 1] = p.y;
    arr[i * 3 + 2] = p.z;
  }
  return arr;
}

/**
 * Merge one or more geometries (area-weighted) and sample `count` points.
 * @param {THREE.BufferGeometry | THREE.BufferGeometry[]} geometries
 */
export function samplePoints(geometries, count) {
  const list = Array.isArray(geometries) ? geometries : [geometries];
  const merged = mergeGeometries(list.map(toPositionOnly));
  return sampleGeometry(merged, count);
}

/**
 * Center a point cloud and uniformly scale it to fit within `targetRadius`.
 * Mutates and returns the array so all shapes share a consistent footprint.
 */
export function normalizePoints(arr, targetRadius = 2.2) {
  const n = arr.length / 3;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < n; i++) {
    cx += arr[i * 3];
    cy += arr[i * 3 + 1];
    cz += arr[i * 3 + 2];
  }
  cx /= n; cy /= n; cz /= n;

  let maxR = 0;
  for (let i = 0; i < n; i++) {
    const x = arr[i * 3] - cx;
    const y = arr[i * 3 + 1] - cy;
    const z = arr[i * 3 + 2] - cz;
    const r = Math.sqrt(x * x + y * y + z * z);
    if (r > maxR) maxR = r;
  }
  const s = maxR > 0 ? targetRadius / maxR : 1;
  for (let i = 0; i < n; i++) {
    arr[i * 3] = (arr[i * 3] - cx) * s;
    arr[i * 3 + 1] = (arr[i * 3 + 1] - cy) * s;
    arr[i * 3 + 2] = (arr[i * 3 + 2] - cz) * s;
  }
  return arr;
}
