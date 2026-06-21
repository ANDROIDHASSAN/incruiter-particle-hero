/**
 * INCSERVE — Interview as a Service (4500+ interviewer network).
 *
 * A constellation: ~14 clustered "people-nodes" arranged on a sphere, with
 * thin point-trails connecting nearby nodes. Reads as a network of experts.
 */
export default function incserve(count) {
  const arr = new Float32Array(count * 3);

  const NODE_COUNT = 14;
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

  // Build a list of connections between reasonably close nodes.
  const links = [];
  for (let a = 0; a < NODE_COUNT; a++) {
    for (let b = a + 1; b < NODE_COUNT; b++) {
      const dx = nodes[a][0] - nodes[b][0];
      const dy = nodes[a][1] - nodes[b][1];
      const dz = nodes[a][2] - nodes[b][2];
      const d = Math.hypot(dx, dy, dz);
      if (d < R * 1.25) links.push([a, b]);
    }
  }

  // 65% of points form node blobs, 35% form connection trails.
  const nodePoints = Math.floor(count * 0.65);
  const linkPoints = count - nodePoints;

  for (let i = 0; i < nodePoints; i++) {
    const node = nodes[i % NODE_COUNT];
    // Small gaussian-ish blob around the node.
    const r = Math.pow(Math.random(), 0.5) * 0.22;
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
    const jitter = 0.04;
    arr[idx * 3] = A[0] + (B[0] - A[0]) * t + (Math.random() - 0.5) * jitter;
    arr[idx * 3 + 1] = A[1] + (B[1] - A[1]) * t + (Math.random() - 0.5) * jitter;
    arr[idx * 3 + 2] = A[2] + (B[2] - A[2]) * t + (Math.random() - 0.5) * jitter;
  }

  return arr;
}
