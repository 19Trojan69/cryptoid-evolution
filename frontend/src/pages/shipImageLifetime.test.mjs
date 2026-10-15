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
 const compiled=await build({absWorkingDir:root,entryPoints:['src/pages/paintedShip.ts'],bundle:true,write:false,platform:'node',format:'cjs',define:{'process.env.NODE_ENV':'"production"','import.meta.env':kind==='probe'?'{"VITE_CRYPTOID_DIAGNOSTICS":"1"}':'{}'},logLevel:'silent',plugins:[{name:'actual-paint-source',setup(b){b.onLoad({filter:/paintedShip\.ts$/},()=>({contents:source+'\nexport {shipImage,createPaintedSprite,cache};',loader:'ts'}));}}]});
 let fault=kind,images=0,blobs=0,revoked=0;const canvases=[],escaped=[];
 class Image {naturalWidth=3;naturalHeight=3;constructor(){images++;}decode(){return fault==='blobdecode'&&this.url.startsWith('blob:')?Promise.reject(new Error('Blob decode fixture')):Promise.resolve();}set src(value){this.url=value;queueMicrotask(()=>{try{this.onload?.();}catch(error){escaped.push(error);}});}}
 const makeCanvas=()=>{if(fault==='create')throw new Error('Canvas creation fixture');let width=0,height=0;const canvas={get width(){return width;},set width(value){if(fault==='allocation'&&value>0)throw new RangeError('Canvas allocation fixture');width=value;},get height(){return height;},set height(value){height=value;},getContext(){if(fault==='context')throw new Error('Canvas context fixture');return {drawImage(){},getImageData:(_x,_y,w,h)=>({data:new Uint8ClampedArray(w*h*4).fill(128)}),putImageData(){}};},toBlob:callback=>queueMicrotask(()=>callback({size:31}))};canvases.push(canvas);return canvas;};
 const storage={getItem(){return null;},setItem(){}};
 const scope={exports:{},module:{exports:{}},console,Image,Uint8ClampedArray,queueMicrotask,URL:{createObjectURL:()=>`blob:fixture-${++blobs}`,revokeObjectURL(){revoked++;}},window:{setTimeout,clearTimeout,localStorage:storage,location:{hostname:'localhost'},__ENV:{appNetwork:'testnet'}},localStorage:storage,document:{createElement:makeCanvas}};
 let probeClock=0;scope.performance={now:()=>++probeClock};scope.window.__ENV.combatProbe=kind==='probe';
 scope.module.exports=scope.exports;vm.runInNewContext(compiled.outputFiles[0].text,scope);
 return {api:scope.module.exports,allow:()=>fault='none',canvases,escaped,images:()=>images,blobs:()=>blobs,revoked:()=>revoked};
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
test('failed painted Blob decoding never publishes an unready hull and releases its URL',async()=>{
 const f=await fixture('blobdecode'),release=f.api.cache.retain('0:1:gold');
 await assert.rejects(f.api.createPaintedSprite(0,'gold',1),/Blob decode/);
 assert.equal(f.api.cache.get('0:1:gold'),undefined);assert.equal(f.revoked(),1);
 assert.ok(f.canvases.every(canvas=>canvas.width===0&&canvas.height===0));
 f.allow();assert.ok((await f.api.createPaintedSprite(0,'gold',1)).startsWith('blob:'));release();
});
test('complete colored decoded hull is cached before its future consumer mounts',async()=>{
 const f=await fixture();
 const prepared=f.api.retainPreparedHulls([{sprite:0,color:'gold'},{sprite:0,color:'gold'}]);
 assert.deepEqual(Array.from(await prepared.settled),[true]);
 const url=f.api.cache.get('0:1:gold');assert.ok(url.startsWith('blob:'));
 const images=f.images(),blobs=f.blobs();const mounted=f.api.cache.retain('0:1:gold');
 assert.equal(await f.api.createPaintedSprite(0,'gold',1),url);
 assert.equal(f.images(),images);assert.equal(f.blobs(),blobs,'mount must not enqueue painting or decode again');
 prepared.release();prepared.release();assert.equal(f.api.cache.retained('0:1:gold'),true);
 mounted();assert.equal(f.api.cache.retained('0:1:gold'),false);
});
test('obsolete prepared groups cancel before allocation and never exceed twelve unique pins',async()=>{
 const f=await fixture(),hulls=Array.from({length:30},(_,sprite)=>({sprite,color:'gold'}));
 const prepared=f.api.retainPreparedHulls(hulls);prepared.release();
 const results=await prepared.settled;assert.equal(results.length,12);
 assert.ok(results.every(value=>value===false));assert.equal(f.images(),0);assert.equal(f.blobs(),0);
 for(let sprite=0;sprite<30;sprite++)assert.equal(f.api.cache.retained(`${sprite}:1:gold`),false);
});
test('opt-in paint measurement keeps output/cache allocation unchanged and is silent by default',async()=>{
 const measured=await fixture('probe'),normal=await fixture();
 for(const f of [measured,normal]){const release=f.api.cache.retain('0:1:gold');await f.api.createPaintedSprite(0,'gold',1);release();}
 const stats=measured.api.paintedShipResourceStats(),off=normal.api.paintedShipResourceStats();
 assert.equal(stats.jobsStarted,1);assert.equal(stats.jobsFinished,1);assert.ok(stats.materialTotalMs>0);assert.ok(stats.decodeTotalMs>0);
 assert.equal(off.jobsStarted,0);assert.equal(off.materialTotalMs,0);
 assert.equal(stats.estimatedBytes,off.estimatedBytes);assert.equal(measured.images(),normal.images());assert.equal(measured.blobs(),normal.blobs());
});
