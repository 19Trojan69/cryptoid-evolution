import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require=createRequire(import.meta.url),{build}=require('esbuild');
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
async function fixture(kind='none') {
 const source=process.env.CRYPTOID_IMAGE_TEST_BASE?execFileSync('git',['show',`${process.env.CRYPTOID_IMAGE_TEST_BASE}:frontend/src/pages/paintedShip.ts`],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,'src/pages/paintedShip.ts'),'utf8');
 const compiled=await build({absWorkingDir:root,entryPoints:['src/pages/paintedShip.ts'],bundle:true,write:false,platform:'node',format:'cjs',define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent',plugins:[{name:'actual-paint-source',setup(b){b.onLoad({filter:/paintedShip\.ts$/},()=>({contents:source+'\nexport {shipImage,createPaintedSprite,cache};',loader:'ts'}));}}]});
 let fault=kind,images=0,blobs=0;const canvases=[],escaped=[];
 class Image {naturalWidth=3;naturalHeight=3;constructor(){images++;}set src(value){this.url=value;queueMicrotask(()=>{try{this.onload?.();}catch(error){escaped.push(error);}});}}
 const makeCanvas=()=>{if(fault==='create')throw new Error('Canvas creation fixture');let width=0,height=0;const canvas={get width(){return width;},set width(value){if(fault==='allocation'&&value>0)throw new RangeError('Canvas allocation fixture');width=value;},get height(){return height;},set height(value){height=value;},getContext(){if(fault==='context')throw new Error('Canvas context fixture');return {drawImage(){},getImageData:(_x,_y,w,h)=>({data:new Uint8ClampedArray(w*h*4).fill(128)}),putImageData(){}};},toBlob:callback=>queueMicrotask(()=>callback({size:31}))};canvases.push(canvas);return canvas;};
 const storage={getItem(){return null;},setItem(){}};
 const scope={exports:{},module:{exports:{}},console,Image,Uint8ClampedArray,queueMicrotask,URL:{createObjectURL:()=>`blob:fixture-${++blobs}`,revokeObjectURL(){}},window:{setTimeout,clearTimeout,localStorage:storage,location:{hostname:'localhost'},__ENV:{appNetwork:'testnet'}},localStorage:storage,document:{createElement:makeCanvas}};
 scope.module.exports=scope.exports;vm.runInNewContext(compiled.outputFiles[0].text,scope);
 return {api:scope.module.exports,allow:()=>fault='none',canvases,escaped,images:()=>images,blobs:()=>blobs};
}
for(const kind of ['create','allocation','context'])test(`actual ship source settles and retries after Canvas ${kind} failure`,async()=>{
 const f=await fixture(kind),url='/ships/evolution/ship_01_stage_1.png';let status='pending';
 f.api.shipImage(url).then(()=>status='resolved',()=>status='rejected');for(let turn=0;turn<20;turn++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(status,'rejected','failed source must not wedge the serial paint queue');assert.equal(f.escaped.length,0);assert.ok(f.canvases.every(canvas=>canvas.width===0&&canvas.height===0));
 f.allow();assert.equal((await f.api.shipImage(url)).url,url);assert.ok(f.canvases.every(canvas=>canvas.width===0&&canvas.height===0));
 const release=f.api.cache.retain('0:1:gold');assert.ok((await f.api.createPaintedSprite(0,'gold',1)).startsWith('blob:'));release();assert.ok(f.canvases.every(canvas=>canvas.width===0&&canvas.height===0));
});
test('unused queued paints allocate nothing, while a new live consumer can request the same variant',async()=>{
 const f=await fixture();const release=f.api.cache.retain('0:1:gold');const abandoned=f.api.createPaintedSprite(0,'gold',1);release();
 await assert.rejects(abandoned,/cancelled/);assert.equal(f.images(),0);assert.equal(f.canvases.length,0);assert.equal(f.blobs(),0);
 const active=f.api.cache.retain('0:1:gold');assert.ok((await f.api.createPaintedSprite(0,'gold',1)).startsWith('blob:'));assert.equal(f.blobs(),1);active();
});
