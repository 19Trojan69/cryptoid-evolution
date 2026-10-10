import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceHomeNetwork, createHomeNetwork, HOME_ART, makeHomeNetworkMesh, opposingEdgeMeeting, pointOnEdge } from './homeNetworkModel.ts';

const mesh=makeHomeNetworkMesh();
const random=()=>{let seed=42;return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};};
const actor=(id,team,edge,u,direction,speed=90)=>({id,team,edge,u,direction,speed,cooldown:0});

test('the dense mesh follows a sphere and traffic joins at the same surface node',()=>{
  assert.ok(mesh.paths.length>250);
  for(const edge of mesh.paths) for(const [x,y] of edge.points) assert.ok(Math.hypot(x-HOME_ART.cx,y-HOME_ART.cy)<=HOME_ART.radius+.0001);
  for(const [node,connected] of mesh.neighbors) {
    const ends=connected.map(index=>{const edge=mesh.edges[index];return pointOnEdge(edge,edge.a===node?0:1);});
    for(const end of ends) assert.ok(Math.hypot(end[0]-ends[0][0],end[1]-ends[0][1])<.0001);
  }
});

test('only actual opposing meetings produce an edge collision',()=>{
  const edge=mesh.edges[0];
  const blue=actor(0,0,0,.4,1),red=actor(1,1,0,.6,-1);
  const hit=opposingEdgeMeeting(blue,red,edge,1);
  assert.ok(hit>0);
  assert.equal(opposingEdgeMeeting(blue,{...red,team:0},edge,1),null);
  assert.equal(opposingEdgeMeeting(blue,{...red,edge:1},edge,1),null);
  assert.equal(opposingEdgeMeeting(blue,{...red,direction:1},edge,1),null);
  assert.equal(opposingEdgeMeeting(blue,red,edge,hit/2),null);
  assert.equal(opposingEdgeMeeting({...blue,cooldown:1},red,edge,1),null);
  const state={time:0,actors:[blue,red],visits:mesh.edges.map(()=>0),flashes:[],bursts:[],collisions:0};
  advanceHomeNetwork(state,mesh,hit+.01,random());
  assert.equal(state.collisions,1);assert.equal(state.bursts.length,1);
  assert.ok(state.actors.every(value=>value.cooldown>state.time));
  const at=pointOnEdge(edge,.5);
  assert.ok(Math.hypot(state.bursts[0].point[0]-at[0],state.bursts[0].point[1]-at[1])<.001);
});

test('red and blue arriving at a shared junction explode, matching colors continue',()=>{
  const [node,connected]=[...mesh.neighbors].find(([,edges])=>edges.length>=2);
  const pair=connected.slice(0,2).map((index,id)=>{
    const edge=mesh.edges[index],direction=edge.b===node?1:-1;
    return actor(id,id,index,direction>0?1-.009*90/edge.length:.009*90/edge.length,direction);
  });
  const state={time:0,actors:pair,visits:mesh.edges.map(()=>0),flashes:[],bursts:[],collisions:0};
  advanceHomeNetwork(state,mesh,.02,random());
  assert.equal(state.collisions,1);
  const friendly={time:0,actors:pair.map(value=>({...value,team:0,cooldown:0})),visits:mesh.edges.map(()=>0),flashes:[],bursts:[],collisions:0};
  advanceHomeNetwork(friendly,mesh,.02,random());assert.equal(friendly.collisions,0);assert.ok(friendly.flashes.length>0);
});

test('random traffic covers the planet, remains bounded and produces distributed collisions',()=>{
  const rng=random(),state=createHomeNetwork(mesh,rng),collisionPoints=[];
  for(let frame=0;frame<24*180;frame++) {
    const before=state.collisions;advanceHomeNetwork(state,mesh,1/24,rng);
    if(state.collisions>before) collisionPoints.push(...state.bursts.slice(-(state.collisions-before)).map(burst=>burst.point));
    assert.equal(state.actors.length,12);
    assert.ok(state.flashes.length<100 && state.bursts.length<20);
    for(const value of state.actors) {
      assert.ok(Number.isFinite(value.u)&&value.u>=0&&value.u<=1);
      const [x,y]=pointOnEdge(mesh.edges[value.edge],value.u);
      assert.ok(Number.isFinite(x)&&Number.isFinite(y));
    }
  }
  assert.equal(state.visits.filter(value=>value>0).length,mesh.edges.length);
  assert.ok(state.collisions>10);
  assert.ok(Math.max(...collisionPoints.map(point=>point[0]))-Math.min(...collisionPoints.map(point=>point[0]))>HOME_ART.radius);
  assert.ok(Math.max(...collisionPoints.map(point=>point[1]))-Math.min(...collisionPoints.map(point=>point[1]))>HOME_ART.radius);
});
