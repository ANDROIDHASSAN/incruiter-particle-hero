// Particle vertex shader: GPU morph + dispersion + hero field + mouse repulsion.
// Optimized: no per-frame simplex noise. Scatter/field directions are baked into
// the aScatter attribute (CPU, once); drift is cheap trig. This keeps the vertex
// stage light enough to run at full device pixel-ratio (crisp) on phones.

uniform float uTime;
uniform float uMorph;        // 0..1 transition driver
uniform float uSize;         // global point size
uniform float uPixelRatio;   // capped DPR for consistent point sizing
uniform vec3  uMouse;        // world-space mouse position
uniform float uMouseRadius;  // repulsion falloff radius
uniform float uMouseStrength;
uniform float uScatter;      // dispersion spread at mid-transition
uniform float uHero;         // 1 = screen-filling hero field, 0 = formed shapes
uniform vec3  uField;        // hero field extent (responsive: portrait vs wide)

attribute vec3  aTarget;     // next shape (B)
attribute float aRandom;     // per-particle 0..1 (stagger + drift phase)
attribute float aScale;      // per-particle size variance
attribute vec3  aColor;      // per-particle base color (multicolor cloud)
attribute float aShape;      // per-particle sprite shape (0..4)
attribute vec3  aScatter;    // per-particle scatter/field direction (-1..1)

varying float vEnergy;       // sparkle / mid-morph energy
varying float vDepth;        // 0 (far) .. 1 (near) for depth grading
varying float vRandom;       // per-particle seed for twinkle
varying vec3  vColor;        // per-particle base color
varying float vShape;        // per-particle sprite shape

float easeInOutCubic(float t){
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
  // Staggered morph so particles don't all arrive at once -> organic flow.
  float local = clamp((uMorph - aRandom * 0.35) / 0.65, 0.0, 1.0);
  float t = easeInOutCubic(local);
  vec3 morphed = mix(position, aTarget, t);

  // Dispersion: between two shapes particles explode into a wide cloud
  // (peak at mid-transition), then reform into the target.
  float peak = sin(t * 3.14159265);
  morphed += aScatter * peak * uScatter;

  // Hero field: at the top of the page the particles rest as a wide,
  // screen-filling cloud, then gather into the first shape as you scroll.
  vec3 fieldPos = aScatter * uField;
  morphed = mix(morphed, fieldPos, uHero);

  // Cheap breathing drift so the cloud never looks frozen (no noise needed).
  vec3 drift = vec3(
    sin(uTime * 0.6 + aRandom * 30.0),
    sin(uTime * 0.5 + aRandom * 40.0 + 2.1),
    sin(uTime * 0.55 + aRandom * 50.0 + 4.2)
  ) * 0.05;
  morphed += drift;

  // Mouse repulsion in world space — "part the cloud".
  vec4 world = modelMatrix * vec4(morphed, 1.0);
  vec3 away = world.xyz - uMouse;
  float dist = length(away);
  float force = smoothstep(uMouseRadius, 0.0, dist);
  world.xyz += normalize(away + 0.0001) * force * uMouseStrength;

  vec4 mvPosition = viewMatrix * world;

  // Energy peaks mid-morph (dispersed particles glow with the accent) + mouse.
  vEnergy = clamp(t * (1.0 - t) * 4.0 + peak * 0.7 + force, 0.0, 1.0);

  // Depth grading: map view-space z into 0..1.
  vDepth = clamp((-mvPosition.z - 3.0) / 5.0, 0.0, 1.0);
  vRandom = aRandom;
  vColor = aColor;
  vShape = aShape;

  // Size attenuation: distant particles shrink. Tiny per-particle variance.
  float sizeVar = 0.55 + aRandom * 0.95;
  gl_PointSize = uSize * aScale * sizeVar * uPixelRatio * (2.5 / -mvPosition.z);
  gl_PointSize = clamp(gl_PointSize, 1.0, 14.0);

  gl_Position = projectionMatrix * mvPosition;
}
