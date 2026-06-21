/**
 * INCSERVE — Interview as a Service (4500+ interviewer network).
 *
 * A clean constellation: distinct, dense "people-node" clusters on a sphere,
 * joined by thin bright connection lines. Reads clearly as a network of experts.
 */
export default function incserve(count) {
  const arr = new Float32Array(count * 3);

  const NODE_COUNT = 12;
  const R = 1.7;
  const nodes = [];

  // Distribute nodes on a sphere via the golden-spiral method.
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let n = 0; n < NODE_COUNT; n++) {
    const yy = 1 - (n / (NODE_COUNT - 1)) * 2; // 1 -> -1
    const rad = Math.sqrt(1 - yy * yy);
    const theta = golden * n;
    nodes.push([Math.cos(theta) * rad * R, yy * R, Math.sin(theta) * rad * R]);
  }

  // Connections between nearby nodes.
  const links = [];
  for (let a = 0; a < NODE_COUNT; a++) {
    for (let b = a + 1; b < NODE_COUNT; b++) {
      const dx = nodes[a][0] - nodes[b][0];
      const dy = nodes[a][1] - nodes[b][1];
      const dz = nodes[a][2] - nodes[b][2];
      if (Math.hypot(dx, dy, dz) < R * 1.3) links.push([a, b]);
    }
  }

  // 58% tight node clusters, 42% thin connection lines.
  const nodePoints = Math.floor(count * 0.58);
  const linkPoints = count - nodePoints;

  for (let i = 0; i < nodePoints; i++) {
    const node = nodes[i % NODE_COUNT];
    // Tight, dense cluster so each node reads as a clear point.
    const r = Math.pow(Math.random(), 0.7) * 0.17;
    const u = Math.random() * 2 - 1;
    const phi = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    arr[i * 3] = node[0] + Math.cos(phi) * s * r;
    arr[i * 3 + 1] = node[1] + u * r;
    arr[i * 3 + 2] = node[2] + Math.sin(phi) * s * r;
  }

  for (let i = 0; i < linkPoints; i++) {
    const idx = nodePoints + i;
    const link = links.length ? links[i % links.length] : [0, 1];
    const A = nodes[link[0]];
    const B = nodes[link[1]];
    const t = Math.random();
    const j = 0.022;
    arr[idx * 3] = A[0] + (B[0] - A[0]) * t + (Math.random() - 0.5) * j;
    arr[idx * 3 + 1] = A[1] + (B[1] - A[1]) * t + (Math.random() - 0.5) * j;
    arr[idx * 3 + 2] = A[2] + (B[2] - A[2]) * t + (Math.random() - 0.5) * j;
  }

  return arr;
}
