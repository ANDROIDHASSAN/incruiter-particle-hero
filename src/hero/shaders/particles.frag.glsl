// Particle fragment shader: a MIX of crisp sprite shapes — soft circles, square
// pixels, sharp circles, diamonds and plus/cross sparkles — in a multicolor
// jewel palette. Sharper + brighter than plain dots so every object reads clearly.

uniform vec3  uColorHot;
uniform float uTime;

varying float vEnergy;
varying float vDepth;
varying float vRandom;
varying vec3  vColor;
varying float vShape;

// Returns coverage 0..1 for the given shape at local coord uv (-0.5..0.5).
float shapeMask(int s, vec2 uv) {
  if (s == 0) {
    // Soft glowing circle.
    return smoothstep(0.5, 0.05, length(uv));
  } else if (s == 1) {
    // Crisp square pixel.
    float m = max(abs(uv.x), abs(uv.y));
    return 1.0 - smoothstep(0.34, 0.44, m);
  } else if (s == 2) {
    // Sharp filled circle.
    return 1.0 - smoothstep(0.38, 0.48, length(uv));
  } else if (s == 3) {
    // Diamond.
    float m = abs(uv.x) + abs(uv.y);
    return 1.0 - smoothstep(0.40, 0.50, m);
  }
  // Plus / cross sparkle.
  float t = 0.15;
  float bx = abs(uv.x) < t ? 1.0 - smoothstep(0.38, 0.48, abs(uv.y)) : 0.0;
  float by = abs(uv.y) < t ? 1.0 - smoothstep(0.38, 0.48, abs(uv.x)) : 0.0;
  return max(bx, by);
}

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  int s = int(vShape + 0.5);
  float mask = shapeMask(s, uv);
  if (mask < 0.02) discard;

  // Per-particle color, graded by depth (far particles recede / dim).
  vec3 color = mix(vColor * 0.55, vColor, vDepth);

  // Hot white center — full white-out for energized (mid-morph) particles.
  float core = 1.0 - smoothstep(0.0, 0.24, length(uv));
  color = mix(color, uColorHot, core * (0.4 + vEnergy * 0.6));

  // Subtle per-particle twinkle so the cloud shimmers with life.
  float twinkle = 0.82 + 0.18 * sin(uTime * 1.7 + vRandom * 6.2831);

  // Atmospheric fade: far particles dim but stay visible (objects read clearly).
  float fog = mix(0.5, 1.0, vDepth);

  float alpha = mask * 0.66 * twinkle * fog;
  gl_FragColor = vec4(color, alpha);
}
