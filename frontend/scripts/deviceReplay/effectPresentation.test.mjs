import test from 'node:test';
import assert from 'node:assert/strict';
import {createEffectPresentationProbe} from './effectPresentation.mjs';

test('DOM sampling is rate/count bounded and cleans the temporary hint',()=>{
  let time=0,queries=0;const attrs=new Map();
  const document={documentElement:{clientWidth:430,clientHeight:825,
    setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k)},
    querySelectorAll:()=>{queries++;return [];},querySelector:()=>null};
  const probe=createEffectPresentationProbe({document,now:()=>time});
  probe.start('hint');
  for(time=0;time<60000;time+=16)probe.sample();
  assert.equal(queries,6);assert.equal(probe.read().samples.length,6);
  assert.equal(attrs.get('data-replay-compositor'),'hint');
  probe.start('original');assert.equal(probe.read().samples.length,0);
  assert.equal(attrs.get('data-replay-compositor'),'original');
  probe.stop();assert.equal(attrs.size,0);
});

test('layout evidence distinguishes an offscreen effect from styled opacity',()=>{
  const css={opacity:'1',display:'block',visibility:'visible',backgroundImage:'radial-gradient(red, transparent)',animationName:'enemy-destruction-fire',animationPlayState:'running'};
  const effect={className:'impact-effect explosion',getBoundingClientRect:()=>({x:120,y:900,width:90,height:90}),querySelector:()=>null};
  const document={documentElement:{clientWidth:430,clientHeight:825,setAttribute(){},removeAttribute(){}},querySelectorAll:()=>[effect],querySelector:()=>({getAttribute:()=> 'false'})};
  let time=0;
  const probe=createEffectPresentationProbe({document,now:()=>time,style:()=>css,pseudo:()=>css});
  probe.start();probe.sample();assert.equal(probe.read().samples.length,0,'wait for the phase commit');
  time=3000;probe.sample();const sample=probe.read().samples[0];
  assert.equal(sample.examples[0].intersectsViewport,false);
  assert.equal(sample.examples[0].fire.opacity,'1');
  assert.equal(sample.examples[0].fire.animationPlayState,'running');
});
