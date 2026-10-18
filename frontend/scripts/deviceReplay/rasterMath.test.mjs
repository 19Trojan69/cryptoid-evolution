import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {easing,FIRE_KEYS,SMOKE_KEYS,layerFrame,fragmentFrame,parseGradients,gradientStops,layerSvg,roundedPath} from './rasterMath.mjs';

test('original keyframe endpoints, easing and separate fragment property tracks are preserved',()=>{
  for(const keys of [FIRE_KEYS,SMOKE_KEYS])for(const k of keys)layerFrame(keys,k[0]).forEach((v,i)=>assert.ok(Math.abs(v-k[i+1])<1e-6));
  for(const delay of [0,44]){assert.equal(fragmentFrame(delay,delay).alpha,0);assert.equal(fragmentFrame(delay+2120,delay).alpha,0);assert.equal(fragmentFrame(delay+2120,delay).scale,.55);assert.ok(Math.abs(fragmentFrame(delay+.09*2120,delay).alpha-1)<1e-6);}
  let previous=0;for(let i=0;i<=100;i++){const v=easing(i/100,.1,.49,.23,1);assert.ok(v>=previous);previous=v;}
});
test('original gradient layers, rounded clipping and premultiplied fades survive texture preparation',()=>{
  const css=fs.readFileSync(new URL('../../src/index.css',import.meta.url),'utf8');
  const line=css.split('\n').find(l=>l.includes('.impact-effect.explosion::before,')&&l.includes('{ position: absolute; z-index: 0;'));
  const art=Object.fromEntries([...line.slice(line.indexOf('{')+1,line.lastIndexOf('}')).matchAll(/([\w-]+):\s*([^;]+);/g)].map(m=>[m[1],m[2]]));
  assert.equal(parseGradients(art.background).length,5);
  const stops=gradientStops([[0,'#ff0000'],[1,'transparent']]);
  for(const [,rgb,alpha] of stops){assert.ok(alpha>=0&&alpha<=1);assert.equal(rgb[0],255);assert.equal(rgb[1],0);}
  const result=layerSvg(art,90,3);assert.ok(result.pixels>90*1.24*3);
  assert.ok(result.svg.includes('stdDeviation="0.7"'));assert.ok(result.svg.includes('color-interpolation-filters="sRGB"'));
  assert.equal((result.svg.match(/<radialGradient /g)||[]).length,5);
  assert.ok(roundedPath(100,'60% 60% 60% 60% / 60% 60% 60% 60%').startsWith('M 50 0 H 50'));
});
