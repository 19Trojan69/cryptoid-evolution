export type Point = readonly [number, number];
type Vector = readonly [number, number, number];
type Face = readonly [number, number, number];
export type NetworkEdge = { a: number; b: number; points: Point[]; lengths: number[]; length: number; depth: number };
export type NetworkMesh = { paths: NetworkEdge[]; edges: NetworkEdge[]; neighbors: Map<number, number[]> };
export type NetworkActor = { id: number; team: 0 | 1; edge: number; u: number; direction: number; speed: number; cooldown: number };
export type NetworkFlash = { time: number; point: Point };
export type NetworkState = { time: number; actors: NetworkActor[]; visits: number[]; flashes: NetworkFlash[]; bursts: NetworkFlash[]; collisions: number };

// Coordinates belong to the bundled artwork, not the viewport. The same scaled
// wrapper holds the image and both network layers, so the sphere cannot drift.
export const HOME_ART = { width: 862, height: 904, cx: 608, cy: 696, radius: 353 };
const normalize = ([x, y, z]: Vector): Vector => {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
};
const rotate = ([x, y, z]: Vector): Vector => {
  const pitch = -.21, yaw = .32, roll = .11;
  const py = y * Math.cos(pitch) - z * Math.sin(pitch);
  const pz = y * Math.sin(pitch) + z * Math.cos(pitch);
  const xx = x * Math.cos(yaw) + pz * Math.sin(yaw);
  return [xx * Math.cos(roll) - py * Math.sin(roll), xx * Math.sin(roll) + py * Math.cos(roll), -x * Math.sin(yaw) + pz * Math.cos(yaw)];
};
const project = ([x, y]: Vector): Point => [HOME_ART.cx + HOME_ART.radius * x, HOME_ART.cy - HOME_ART.radius * y];

export function makeHomeNetworkMesh(): NetworkMesh {
  const t = (1 + Math.sqrt(5)) / 2;
  const vertices: Vector[] = ([[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]] as Vector[]).map(normalize);
  let faces: Face[] = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  const midpoints = new Map<string, number>();
  const midpoint = (a: number, b: number) => {
    const key = [a,b].sort((one,two) => one-two).join(':');
    const existing = midpoints.get(key);
    if (existing !== undefined) return existing;
    const index = vertices.push(normalize(vertices[a].map((value,j) => value+vertices[b][j]) as unknown as Vector))-1;
    midpoints.set(key,index);
    return index;
  };
  for (let pass = 0; pass < 2; pass++) {
    const next: Face[] = [];
    for (const [a,b,c] of faces) {
      const ab = midpoint(a,b), bc = midpoint(b,c), ca = midpoint(c,a);
      next.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);
    }
    faces = next;
  }
  const pairs = new Map<string, [number,number]>();
  for (const face of faces) for (let j = 0; j < 3; j++) {
    const pair = [face[j],face[(j+1)%3]].sort((a,b)=>a-b) as [number,number];
    pairs.set(pair.join(':'),pair);
  }
  const surface = vertices.map(rotate), paths: NetworkEdge[] = [], edges: NetworkEdge[] = [];
  for (const [a,b] of pairs.values()) {
    const samples = Array.from({length:17},(_,i) => normalize(surface[a].map((value,j) => value*(1-i/16)+surface[b][j]*i/16) as unknown as Vector));
    const visible: Vector[] = [];
    for (let i=0; i<samples.length; i++) {
      const point = samples[i], previous = samples[i-1];
      if (previous && (previous[2]>=0)!==(point[2]>=0)) {
        const fraction = -previous[2]/(point[2]-previous[2]);
        visible.push(normalize(previous.map((value,j)=>value+(point[j]-value)*fraction) as unknown as Vector));
      }
      if (point[2]>=0) visible.push(point);
    }
    if (visible.length<2) continue;
    const points = visible.map(project), lengths = [0];
    for (let i=1;i<points.length;i++) lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
    const edge = {a,b,points,lengths,length:lengths[lengths.length-1],depth:visible.reduce((sum,point)=>sum+point[2],0)/visible.length};
    paths.push(edge);
    // Never join two unrelated clipped endpoints at the planet's horizon.
    if (surface[a][2]>=0 && surface[b][2]>=0 && edge.length>1) edges.push(edge);
  }
  const neighbors = new Map<number,number[]>();
  edges.forEach((edge,i)=>{for (const node of [edge.a,edge.b]) neighbors.set(node,[...(neighbors.get(node)??[]),i]);});
  return {paths,edges,neighbors};
}

export function pointOnEdge(edge: NetworkEdge, u: number): Point {
  const distance = Math.max(0,Math.min(1,u))*edge.length;
  for (let i=1;i<edge.lengths.length;i++) if (edge.lengths[i]>=distance) {
    const fraction = (distance-edge.lengths[i-1])/(edge.lengths[i]-edge.lengths[i-1]||1);
    const a = edge.points[i-1], b = edge.points[i];
    return [a[0]+(b[0]-a[0])*fraction,a[1]+(b[1]-a[1])*fraction];
  }
  return edge.points[edge.points.length-1];
}

export function createHomeNetwork(mesh: NetworkMesh, random = Math.random, count = 12): NetworkState {
  const state: NetworkState = {time:0,actors:[],visits:mesh.edges.map(()=>0),flashes:[],bursts:[],collisions:0};
  for (let id=0;id<count;id++) {
    let chosen = Math.floor(random()*mesh.edges.length), best = -1;
    for (let candidate=0;candidate<mesh.edges.length;candidate++) {
      const point = pointOnEdge(mesh.edges[candidate],.5);
      const separation = state.actors.reduce((minimum,actor)=>{
        const other = pointOnEdge(mesh.edges[actor.edge],actor.u);
        return Math.min(minimum,Math.hypot(point[0]-other[0],point[1]-other[1]));
      },Infinity);
      const score = separation+random()*15-state.visits[candidate]*100;
      if (score>best) {best=score;chosen=candidate;}
    }
    state.actors.push({id,team:(id%2) as 0|1,edge:chosen,u:.35+random()*.3,direction:random()<.5?-1:1,speed:70+random()*35,cooldown:0});
    state.visits[chosen]++;
  }
  return state;
}

export function opposingEdgeMeeting(a: NetworkActor,b: NetworkActor,edge: NetworkEdge,dt: number): number | null {
  if (a.cooldown || b.cooldown || a.team===b.team || a.edge!==b.edge) return null;
  const va=a.direction*a.speed/edge.length, vb=b.direction*b.speed/edge.length;
  if (Math.abs(va-vb)<1e-9) return null;
  const hit=(b.u-a.u)/(va-vb), u=a.u+va*hit;
  return hit>=0 && hit<=dt && u>=0 && u<=1 ? hit : null;
}

export function advanceHomeNetwork(state: NetworkState,mesh: NetworkMesh,seconds: number,random = Math.random) {
  const target=state.time+Math.max(0,seconds);
  while (state.time<target-1e-8) {
    const dt=Math.min(.02,target-state.time), now=state.time;
    for (const actor of state.actors) if (actor.cooldown && actor.cooldown<=now) {
      let selected=0, lowest=Infinity;
      for (let i=0;i<40;i++) {
        const edge=Math.floor(random()*mesh.edges.length), point=pointOnEdge(mesh.edges[edge],.5);
        const distance=state.actors.reduce((minimum,other)=>{
          if (other===actor||other.cooldown) return minimum;
          const at=pointOnEdge(mesh.edges[other.edge],other.u);
          return Math.min(minimum,Math.hypot(point[0]-at[0],point[1]-at[1]));
        },400);
        const score=state.visits[edge]+100/Math.max(15,distance)+random();
        if (score<lowest) {lowest=score;selected=edge;}
      }
      actor.edge=selected;actor.u=.4+random()*.2;actor.direction=random()<.5?-1:1;actor.cooldown=0;
      state.visits[selected]++;
    }
    const candidates: {a:NetworkActor;b:NetworkActor;hit:number;point:Point}[]=[];
    for (let i=0;i<state.actors.length;i++) for (let j=i+1;j<state.actors.length;j++) {
      const a=state.actors[i], b=state.actors[j];
      if (a.cooldown||b.cooldown||a.team===b.team) continue;
      const edge=mesh.edges[a.edge], hit=opposingEdgeMeeting(a,b,edge,dt);
      if (hit!==null) {candidates.push({a,b,hit,point:pointOnEdge(edge,a.u+a.direction*a.speed/edge.length*hit)});continue;}
      // Streams meeting at a shared junction also collide, even on different edges.
      const second=mesh.edges[b.edge], endA=a.direction>0?'b':'a', endB=b.direction>0?'b':'a';
      if (a.edge===b.edge || edge[endA]!==second[endB]) continue;
      const arrivalA=(a.direction>0?1-a.u:a.u)*edge.length/a.speed;
      const arrivalB=(b.direction>0?1-b.u:b.u)*second.length/b.speed;
      if (Math.max(arrivalA,arrivalB)<=dt && Math.abs(arrivalA-arrivalB)<.035) candidates.push({a,b,hit:Math.max(arrivalA,arrivalB),point:pointOnEdge(edge,a.direction>0?1:0)});
    }
    candidates.sort((a,b)=>a.hit-b.hit);
    for (const hit of candidates) {
      if (hit.a.cooldown||hit.b.cooldown) continue;
      state.bursts.push({time:now+hit.hit,point:hit.point});state.collisions++;
      hit.a.cooldown=hit.b.cooldown=now+hit.hit+.8;
    }
    for (const actor of state.actors) {
      if (actor.cooldown) continue;
      let remaining=dt;
      while (remaining>1e-8) {
        const edge=mesh.edges[actor.edge], distance=(actor.direction>0?1-actor.u:actor.u)*edge.length;
        const travel=actor.speed*remaining;
        if (travel<distance) {actor.u+=actor.direction*travel/edge.length;break;}
        remaining-=distance/actor.speed;
        const end=actor.direction>0?1:0, node=end?edge.b:edge.a;
        state.flashes.push({time:now+dt-remaining,point:pointOnEdge(edge,end)});
        const connected=mesh.neighbors.get(node)!;
        const choices=connected.length>1?connected.filter(index=>index!==actor.edge):connected;
        const weights=choices.map(index=>1/Math.pow(1+state.visits[index],1.5));
        let pick=random()*weights.reduce((sum,weight)=>sum+weight,0), next=choices[choices.length-1];
        for (let k=0;k<choices.length;k++) {pick-=weights[k];if(pick<=0){next=choices[k];break;}}
        actor.edge=next;actor.direction=mesh.edges[next].a===node?1:-1;actor.u=actor.direction>0?0:1;
        state.visits[next]++;
      }
    }
    state.time+=dt;
  }
  state.bursts=state.bursts.filter(burst=>state.time-burst.time<.68);
  state.flashes=state.flashes.filter(flash=>state.time-flash.time<.2);
}
