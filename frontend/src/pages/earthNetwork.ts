type Vector = readonly [number, number, number];
const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
const RADIUS = 158;
const CENTER = 160;
const normalize = ([x, y, z]: Vector): Vector => {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
};
const vertices: Vector[] = ([
  [-1, GOLDEN_RATIO, 0], [1, GOLDEN_RATIO, 0], [-1, -GOLDEN_RATIO, 0], [1, -GOLDEN_RATIO, 0],
  [0, -1, GOLDEN_RATIO], [0, 1, GOLDEN_RATIO], [0, -1, -GOLDEN_RATIO], [0, 1, -GOLDEN_RATIO],
  [GOLDEN_RATIO, 0, -1], [GOLDEN_RATIO, 0, 1], [-GOLDEN_RATIO, 0, -1], [-GOLDEN_RATIO, 0, 1],
] as Vector[]).map(normalize);
let faces: [number, number, number][] = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
];

// A twice-subdivided icosahedron gives consistent-sized cells without latitude pole clustering.
for (let level = 0; level < 2; level++) {
  const midpoints = new Map<string, number>();
  const midpoint = (a: number, b: number) => {
    const key = [a, b].sort((left, right) => left - right).join("-");
    const existing = midpoints.get(key);
    if (existing !== undefined) return existing;
    const from = vertices[a], to = vertices[b];
    const index = vertices.push(normalize([from[0] + to[0], from[1] + to[1], from[2] + to[2]])) - 1;
    midpoints.set(key, index);
    return index;
  };
  faces = faces.flatMap(([a, b, c]): [number, number, number][] => {
    const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
    return [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]];
  });
}

const facing = vertices.map(([x, y, z]): Vector => {
  const turn = .28, tilt = -.18;
  const rotatedX = x * Math.cos(turn) + z * Math.sin(turn);
  const rotatedZ = z * Math.cos(turn) - x * Math.sin(turn);
  return [rotatedX, y * Math.cos(tilt) - rotatedZ * Math.sin(tilt), y * Math.sin(tilt) + rotatedZ * Math.cos(tilt)];
});
const project = ([x, y, z]: Vector) => {
  // Equal-area hemisphere projection keeps cells legible near the globe's rim.
  const scale = RADIUS / Math.sqrt(1 + Math.max(0, z));
  return [CENTER + x * scale, CENTER - y * scale] as const;
};
const traceEdge = (a: Vector, b: Vector) => {
  if (a[2] < 0 && b[2] < 0) return "";
  const intersection = () => {
    const t = a[2] / (a[2] - b[2]);
    return normalize([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0]);
  };
  const from = a[2] < 0 ? intersection() : a;
  const to = b[2] < 0 ? intersection() : b;
  return Array.from({ length: 5 }, (_, index) => {
    const t = index / 4;
    const [x, y] = project(normalize([
      from[0] * (1 - t) + to[0] * t,
      from[1] * (1 - t) + to[1] * t,
      from[2] * (1 - t) + to[2] * t,
    ]));
    return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
};
const seen = new Set<string>();
const edges: string[] = [];
for (const [a, b, c] of faces) {
  for (const [from, to] of [[a, b], [b, c], [c, a]]) {
    const key = from < to ? `${from}-${to}` : `${to}-${from}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const trace = traceEdge(facing[from], facing[to]);
    if (trace) edges.push(trace);
  }
}
export const earthNetwork = {
  path: edges.join(" "),
  highlights: edges.filter((_, index) => index % 13 === 4).join(" "),
  nodes: facing.flatMap((point, index) => point[2] > .09 && index % 5 === 0 ? [project(point)] : []),
};
