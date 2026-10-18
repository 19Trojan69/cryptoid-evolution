import test from 'node:test';import assert from 'node:assert/strict';
import {impactBounds,unionBounds,fieldBounds,compareSurfacePixels} from './effectBounds.mjs';
import {FIRE_KEYS,SMOKE_KEYS,layerFrame,fragmentFrame} from './rasterMath.mjs';

test('bounds contain all original fire/smoke rectangles and rotating fragment vertices across full lifetime',()=>{
  let checks=0;
  for(const size of [24,50,72,86,180])for(const count of [4,8]){
    const cols=count===4?2:4,rows=count/cols;
    const pieces=Array.from({length:count},(_,i)=>{const x=i%cols,y=Math.floor(i/cols);return {pivot:[(x+.5)/cols,(y+.5)/rows],points:[[x/cols,y/rows],[(x+1)/cols,y/rows],[(x+1)/cols,(y+1)/rows],[x/cols,(y+1)/rows]],x:(i%2?1:-1)*size*1.95,y:(i%3?1:-1)*size*1.95,spin:(i%2?1:-1)*Math.PI*2.5,delay:i*6};});
    const assets={fire:{size:size*1.25*1.24,extent:size*1.25*1.24+12},smoke:{size:size*1.25*1.44,extent:size*1.25*1.44+20}},effect={x:129.37,y:203.46,debrisSize:size};
    const box=impactBounds({effect,assets,pieces});
    const contains=(x,y)=>{checks++;assert.ok(x>=box.left&&x<=box.right&&y>=box.top&&y<=box.bottom,JSON.stringify({x,y,box}));};
    for(let age=0;age<=2250;age+=9){
      for(const [kind,keys,ms] of [['fire',FIRE_KEYS,880],['smoke',SMOKE_KEYS,1450]]){
        const [,x,y,sx,sy]=layerFrame(keys,Math.min(1,age/ms)),t=assets[kind];
        for(const dx of [-1,1])for(const dy of [-1,1])contains(effect.x+x*t.size+dx*sx*t.extent/2,effect.y+y*t.size+dy*sy*t.extent/2);
      }
      for(const p of pieces){const f=fragmentFrame(age,p.delay),angle=p.spin*f.motion,[px,py]=p.pivot.map(v=>v*size);
        for(const [x,y] of p.points){const dx=(x*size-px)*f.scale,dy=(y*size-py)*f.scale;
          contains(effect.x-size/2+px+p.x*f.motion+dx*Math.cos(angle)-dy*Math.sin(angle),effect.y-size/2+py+p.y*f.motion+dx*Math.sin(angle)+dy*Math.cos(angle));}
      }
    }
  }
  assert.ok(checks>80000);
});
test('growing bounds never exclude prior effects; only the existing field clips outside content',()=>{
  const a={left:10,top:120,right:280,bottom:420},b={left:-30,top:70,right:450,bottom:380};
  assert.deepEqual(unionBounds(a,b),{left:-30,top:70,right:450,bottom:420});
  assert.deepEqual(fieldBounds(unionBounds(a,b),430,825),{left:0,top:70,right:430,bottom:420});
  assert.deepEqual(fieldBounds(null,430,825),{left:0,top:0,right:1,bottom:1});
});
test('direct pixel comparison distinguishes shifted/cropped pixels from one-level color differences',()=>{
  const full=new Uint8ClampedArray(4*4*4),crop=new Uint8ClampedArray(2*2*4);
  full.set([125,72,19,17],(1*4+1)*4);crop.set([125,72,19,17],0);
  assert.deepEqual(compareSurfacePixels(full,4,4,crop,2,2,1,1),{differentPixels:0,maxChannelError:0,outsideNonzeroPixels:0});
  crop[0]--;
  assert.deepEqual(compareSurfacePixels(full,4,4,crop,2,2,1,1),{differentPixels:1,maxChannelError:1,outsideNonzeroPixels:0});
  assert.ok(compareSurfacePixels(full,4,4,crop,2,2,2,2).outsideNonzeroPixels===1);
});
