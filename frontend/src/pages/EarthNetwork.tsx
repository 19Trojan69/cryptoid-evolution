type Vector = readonly [number, number, number];
type Face = readonly [number, number, number];

const center = 160;
const radius = 154;
const horizon = .035;
const goldenRatio = (1 + Math.sqrt(5)) / 2;
const normalize = ([x, y, z]: Vector): Vector => {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
};
const rotate = ([x, y, z]: Vector): Vector => {
  const pitch = -.21;
  const yaw = .32;
  const roll = .11;
  const py = y * Math.cos(pitch) - z * Math.sin(pitch);
  const pz = y * Math.sin(pitch) + z * Math.cos(pitch);
  const xx = x * Math.cos(yaw) + pz * Math.sin(yaw);
  const zz = -x * Math.sin(yaw) + pz * Math.cos(yaw);
  return [xx * Math.cos(roll) - py * Math.sin(roll), xx * Math.sin(roll) + py * Math.cos(roll), zz];
};
const project = ([x, y]: Vector) => `${(center + radius * x).toFixed(2)} ${(center - radius * y).toFixed(2)}`;

// Divide every icosahedron face once. Its near-equal spherical triangles keep
// the mesh regular while orthographic projection compresses it at the limb.
const makeMesh = () => {
  const t = goldenRatio;
  const vertices: Vector[] = ([[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]] as Vector[]).map(normalize);
  const faces: Face[] = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  const midpoints = new Map<string, number>();
  const midpoint = (a: number, b: number) => {
    const key = [a, b].sort((left, right) => left - right).join(":");
    const known = midpoints.get(key);
    if (known !== undefined) return known;
    const point = normalize([vertices[a][0] + vertices[b][0], vertices[a][1] + vertices[b][1], vertices[a][2] + vertices[b][2]]);
    const index = vertices.push(point) - 1;
    midpoints.set(key, index);
    return index;
  };
  const edges = new Map<string, readonly [number, number]>();
  const addEdge = (a: number, b: number) => {
    const pair = [a, b].sort((left, right) => left - right) as [number, number];
    edges.set(pair.join(":"), pair);
  };
  for (const [a, b, c] of faces) {
    const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
    for (const [one, two, three] of [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]]) {
      addEdge(one, two); addEdge(two, three); addEdge(three, one);
    }
  }
  const surface = vertices.map(rotate);
  const paths = [...edges.values()].map(([a, b]) => {
    const samples = Array.from({ length: 17 }, (_, index) => normalize([
      surface[a][0] * (1 - index / 16) + surface[b][0] * index / 16,
      surface[a][1] * (1 - index / 16) + surface[b][1] * index / 16,
      surface[a][2] * (1 - index / 16) + surface[b][2] * index / 16,
    ]));
    const visible: Vector[] = [];
    for (let index = 0; index < samples.length; index++) {
      const point = samples[index];
      if (index > 0 && (samples[index - 1][2] >= horizon) !== (point[2] >= horizon)) {
        const previous = samples[index - 1];
        const fraction = (horizon - previous[2]) / (point[2] - previous[2]);
        visible.push(normalize([
          previous[0] + (point[0] - previous[0]) * fraction,
          previous[1] + (point[1] - previous[1]) * fraction,
          previous[2] + (point[2] - previous[2]) * fraction,
        ]));
      }
      if (point[2] >= horizon) visible.push(point);
    }
    return visible.length >= 2 ? { d: `M${visible.map(project).join(" L")}`, depth: visible.reduce((sum, point) => sum + point[2], 0) / visible.length } : null;
  }).filter((path): path is { d: string; depth: number } => path !== null);
  const nodes = surface.filter((point) => point[2] > .07);
  return { paths, nodes };
};

const mesh = makeMesh();

const EarthNetwork = () => <svg className="home-earth-network" viewBox="0 0 320 320" aria-hidden="true">
  <circle className="home-network-rim" cx={center} cy={center} r={radius} />
  <g className="home-network-surface">
    {mesh.paths.map(({ d, depth }, index) => <path key={index} className="home-network-grid" d={d} opacity={.35 + .5 * depth} />)}
  </g>
  <g className="home-network-traces">
    {mesh.paths.filter((_, index) => index % 5 === 0).map(({ d, depth }, index) => <path key={index} className="home-network-links" d={d} opacity={.3 + .5 * depth} />)}
  </g>
  <path className="home-network-pulse" pathLength="100" d={mesh.paths.filter((_, index) => index % 9 === 0).map(({ d }) => d).join(" ")} />
  <path className="home-network-pulse home-network-pulse-alt" pathLength="100" d={mesh.paths.filter((_, index) => index % 11 === 2).map(({ d }) => d).join(" ")} />
  <g className="home-network-nodes">{mesh.nodes.map((point, index) => <circle key={index} cx={center + radius * point[0]} cy={center - radius * point[1]} r={1.45 + .9 * point[2]} opacity={.42 + .5 * point[2]} style={{ animationDelay: `${index * -.33}s` }} />)}</g>
</svg>;

export default EarthNetwork;
