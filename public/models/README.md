# Optional assets

This folder is **optional**. The hero runs with zero downloaded assets using a
procedural brain and primitive product shapes.

## Brain upgrade (`models/brain.glb`)

Drop a low-poly brain `.glb` here and load it in `src/hero/shapes/brain.js`:

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { samplePoints } from './sampleGeometry.js';

// buildAllShapes would need to become async, or preload the GLB and pass the
// sampled brain array in. Sample every mesh surface in the scene:
const gltf = await new GLTFLoader().loadAsync('/models/brain.glb');
const geos = [];
gltf.scene.traverse((o) => o.isMesh && geos.push(o.geometry));
return samplePoints(geos, count);
```

## Product SVGs (`../icons/*.svg`) — premium route

Drop InCruiter's real product SVG logos in `public/icons/` and convert them with
`SVGLoader` -> `ShapeGeometry` -> `samplePoints(...)`. The particles will then
literally form each product's logo. See the README "Premium SVG route" section.
