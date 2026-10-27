import test from 'node:test';
import assert from 'node:assert/strict';
import {Path2D as NativePath} from '@napi-rs/canvas';
import {prepareImpactClipPaths} from './impactClipPaths.ts';
import {canvasStaticUrlHost} from '../../scripts/canvasStaticUrlHost.mjs';

const pieces=[{points:[[0,0],[1,0],[.94,.97],[0,1]]},{points:[[.2,.1],[.8,.1],[.5,.9]]}];
const debris={props:{children:[{props:{style:{clipPath:'polygon(0% 0%,100% 0%,94% 97%,0% 100%)',transformOrigin:'50% 50%',
  '--fragment-x':'-70px','--fragment-y':'80px','--fragment-spin':'120deg','--fragment-delay':'17ms'}}}]}};
const effect={id:1,kind:'explosion',x:215,y:240,debrisSize:50,sprite:0,debrisColor:'gold',shipStage:1};

test('fixed original vertices are compiled once at their exact local size',()=>{
  const previous=globalThis.Path2D,commands=[];
  globalThis.Path2D=class{constructor(){this.commands=[];commands.push(this.commands);}moveTo(...args){this.commands.push(['move',...args]);}lineTo(...args){this.commands.push(['line',...args]);}closePath(){this.commands.push(['close']);}};
  try{
    const paths=prepareImpactClipPaths(pieces,58);
    assert.equal(paths.length,2);
    for(let i=0;i<pieces.length;i++)assert.deepEqual(commands[i],[...pieces[i].points.map(([x,y],index)=>[index?'line':'move',x*58,y*58]),['close']]);
  }finally{globalThis.Path2D=previous;}
});

test('unavailable or partially failed native path preparation keeps the original renderer available',()=>{
  const previous=globalThis.Path2D;
  try{
    globalThis.Path2D=undefined;assert.equal(prepareImpactClipPaths(pieces,50),null);
    globalThis.Path2D=class{constructor(){throw Error('native allocation unavailable');}};
    assert.equal(prepareImpactClipPaths(pieces,50),null);
    globalThis.Path2D=class{moveTo(){}lineTo(){throw Error('path preparation failed');}};
    assert.equal(prepareImpactClipPaths(pieces,50),null);
  }finally{globalThis.Path2D=previous;}
});

test('actual mounted impacts reuse native paths through frames, pause and resize, then release their records',async()=>{
  let paths=0;
  const Path=function(){paths++;return new NativePath();};
  const h=await canvasStaticUrlHost({Path2DClass:Path});
  const view=h.mount(effect,debris);await h.waitFor(()=>h.stats().registeredEffects===1);
  assert.equal(paths,1);
  for(let tick=0;tick<80;tick++)h.tick(100+tick*17);
  assert.equal(paths,1);assert.ok(h.stats().draws>50);
  h.setPaused(true);h.tick(1500);h.tick(6500);assert.equal(paths,1);
  h.setPaused(false);h.tick(6517);assert.equal(paths,1);
  h.setScale(1);await h.waitFor(()=>h.stats().registeredEffects===1);
  assert.equal(paths,2,'changed raster availability registers one replacement record');
  h.unmount(view);assert.equal(h.stats().registeredEffects,0);h.close();
});

test('path-preparation failure still draws original fragment pixels without a renderer failure',async()=>{
  const h=await canvasStaticUrlHost({Path2DClass:class{constructor(){throw Error('path unavailable');}}});
  h.mount(effect,debris);await h.waitFor(()=>h.stats().registeredEffects===1);h.tick(200);
  assert.ok(h.stats().fragmentDraws>0);assert.equal(h.stats().failures.length,0);h.close();
});

test('context loss keeps the original DOM fallback and retires all records with prepared paths',async()=>{
  const h=await canvasStaticUrlHost({Path2DClass:NativePath}),view=h.mount(effect,debris);
  await h.waitFor(()=>h.stats().registeredEffects===1);h.loseContext();
  assert.equal(h.stats().registeredEffects,0);assert.equal(h.stats().activeDrawFrame,false);assert.equal(h.fallback(view),true);h.close();
});
