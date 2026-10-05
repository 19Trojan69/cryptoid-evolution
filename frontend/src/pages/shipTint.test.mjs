import test from 'node:test';
import assert from 'node:assert/strict';
import { tintShipPixels } from './shipTint.ts';
const original=(data,target)=>{
  for(let i=0;i<data.length;i+=4){const [r,g,b,a]=data.slice(i,i+4);if(a<20)continue;const brightness=.2126*r+.7152*g+.0722*b;if(b>r*1.18&&b>g*1.12&&brightness<115)continue;const strength=brightness<58?.32:.92,reflection=Math.max(0,brightness-190)*.42;for(let c=0;c<3;c++)data[i+c]=Math.min(255,Math.round(data[i+c]*(1-strength)+(target[c]*brightness/155+reflection)*strength));}
};
test('allocation-free tinting is byte-identical for glass, alpha, shadows and metallic paints',()=>{
  let seed=12345;const pixels=new Uint8ClampedArray(240*240*4);
  for(let i=0;i<pixels.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;pixels[i]=seed>>>24;}
  for(const color of [[205,167,87],[184,197,206],[99,131,190],[193,63,100]]){
    const expected=pixels.slice(),actual=pixels.slice();original(expected,color);tintShipPixels(actual,color);assert.deepEqual(actual,expected);
  }
});
