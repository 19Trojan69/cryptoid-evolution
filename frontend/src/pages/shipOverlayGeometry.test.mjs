import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {shipOverlayGeometry} from './shipOverlayGeometry.ts';
import {shipHullStyle,shipNozzleStyles} from './shipFleet.ts';

for(let sprite=0;sprite<20;sprite++)test(`original hull ${sprite}: visible bounds and drive outlets agree at every evolution stage`,async()=>{
 for(const stage of [1,2,3]){
  const image=await loadImage(new URL(`../../public/ships/evolution/ship_${String(sprite+1).padStart(2,'0')}_stage_${stage}.png`,import.meta.url).pathname);
  const c=createCanvas(image.width,image.height),ctx=c.getContext('2d');ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,image.width,image.height).data,{bounds,nozzles}=shipOverlayGeometry(sprite,stage);
  let left=image.width,top=image.height,right=0,bottom=0;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(pixels[(y*image.width+x)*4+3]>64){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
  [left/image.width*100,top/image.height*100,right/image.width*100,bottom/image.height*100].forEach((n,i)=>assert.ok(Math.abs(n-bounds[i])<.001));
  for(const [x,y,width] of nozzles){
   assert.ok(width>0&&width<10);let adjacent=false;
   const px=Math.round(x/100*image.width),py=Math.round(y/100*image.height);
   for(let yy=Math.max(0,py-3);yy<Math.min(image.height,py+4);yy++)for(let xx=Math.max(0,px-3);xx<Math.min(image.width,px+4);xx++)adjacent ||= pixels[(yy*image.width+xx)*4+3]>128;
   assert.ok(adjacent,`outlet ${sprite}/${stage}/${x}/${y} must meet the original hull`);
  }
 }
 const [l,,r,b]=shipOverlayGeometry(sprite).bounds,style=shipHullStyle(sprite,true);
 assert.ok(Math.abs(Number.parseFloat(style['--hull-x'])-(100-(l+r)/2))<.001);
 assert.ok(Math.abs(Number.parseFloat(style['--hull-top'])-(100-b))<.001);
});

test('all plume profiles share the same palette and keep mirrored outlet geometry',()=>{
 const palettes=new Set();
 for(let i=0;i<20;i++)for(const stage of [1,2,3])for(const style of shipNozzleStyles(i,false,stage))palettes.add([style['--flame-core'],style['--flame-mid'],style['--flame-tail'],style['--flame-glow']].join('|'));
 assert.equal(palettes.size,1);
});

test('boss damage indicators and the entire game controller remain the published source',()=>{
 const expected={"BossHealthView.tsx": "daf937b8ada1cc5fee307b0addbf195c249d79a43219efbed615889bd1c9d7f1", "bossHealthLayout.ts": "0cb788992f91d2ecac8476ea5456a577e947e8b6931440ed1f338422e167d358", "GamePage.tsx": "e835ec4c470bc0a967013c1d3a4015f65546b63fae9c3a8eb6b9766cad657f91"};
 for(const [file,sha] of Object.entries(expected))assert.equal(createHash('sha256').update(readFileSync(new URL(file,import.meta.url))).digest('hex'),sha,file);
});
