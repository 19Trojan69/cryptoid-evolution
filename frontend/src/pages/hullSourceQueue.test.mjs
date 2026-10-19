import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {build} from 'esbuild';
import {hullSourcePlan} from './hullSourcePlan.ts';
import {shipEvolutionAsset} from './shipEvolution.ts';

async function fixture(){
 const built=await build({entryPoints:['src/pages/paintedShip.ts'],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',define:{'import.meta.env':'{}'},plugins:[{name:'source-queue-host',setup(b){
  b.onLoad({filter:/paintedShip\.ts$/},a=>({contents:fs.readFileSync(a.path,'utf8')+'\nexport {shipImage,createPaintedSprite,cache};',loader:'ts'}));
  b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'host'}));
  b.onLoad({filter:/.*/,namespace:'host'},()=>({contents:'export const useState=()=>{},useEffect=()=>{};',loader:'js'}));
 }}]});
 const images=[],pending=new Set(),canvases=[];let peak=0;
 class Image{
  constructor(){images.push(this);}naturalWidth=2;naturalHeight=2;decode(){return Promise.resolve();}
  set src(url){this.url=url;pending.add(this);peak=Math.max(peak,pending.size);}
 }
 let blobId=0;
 const scope={Image,Blob,Uint8ClampedArray,URL:{createObjectURL:()=>`blob:paint-${++blobId}`,revokeObjectURL(){}},window:{setTimeout:fn=>{queueMicrotask(fn);return 0;},localStorage:{getItem:()=>null},location:{hostname:'example.invalid'}},document:{createElement:()=>{const c={width:0,height:0,toBlob:fn=>fn(new Blob(['bitmap'])),getContext:()=>({drawImage(){},putImageData(){},getImageData:(_x,_y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})})};canvases.push(c);return c;}},exports:{},module:{exports:{}}};
 scope.module.exports=scope.exports;vm.runInNewContext(built.outputFiles[0].text,scope);
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 const finish=(image,error=false)=>{assert.ok(pending.delete(image));const callback=error?image.onerror:image.onload;assert.equal(typeof callback,'function');callback();};
 const drain=async()=>{for(let guard=0;pending.size||scope.module.exports.paintedShipResourceStats().sourceQueued||scope.module.exports.paintedShipResourceStats().pending;guard++){assert.ok(guard<100,'source queue settles');for(const image of [...pending])finish(image);await flush();}};
 return {api:scope.module.exports,images,pending,peak:()=>peak,finish,flush,drain,canvases};
}

test('all 500 normal-block source plans stay at three active/eight speculative requests under stalled loading',async()=>{
 const f=await fixture();
 for(let stage=1;stage<=500;stage++)if(stage%10)for(const offset of [0,6,12])f.api.preloadHullSources(hullSourcePlan(stage,'normal',offset,0));
 assert.equal(f.images.length,2,'warming reserves a native-load slot for a mounted hull');
 const stats=f.api.paintedShipResourceStats();assert.equal(stats.sourceActive,2);assert.equal(stats.sourceQueued,6);assert.equal(stats.sources,8);assert.equal(stats.sourceRetainCount,8);
 await f.drain();assert.equal(f.peak(),2);assert.equal(f.images.length,8);
 const done=f.api.paintedShipResourceStats();assert.equal(done.sourceActive,0);assert.equal(done.sourceQueued,0);assert.equal(done.sourceRetainCount,0);assert.ok(done.sources<=8);
 for(const c of f.canvases){assert.equal(c.width,0);assert.equal(c.height,0);}
});

test('pending foreground loads survive LRU pressure and thousands of repeats without duplicate Images',async()=>{
 const f=await fixture(),urls=Array.from({length:19},(_,i)=>shipEvolutionAsset(i,1));
 const promises=urls.map(url=>f.api.shipImage(url));
 for(let i=0;i<3000;i++)assert.equal(f.api.shipImage(urls[i%urls.length]),promises[i%urls.length]);
 assert.equal(f.images.length,3);assert.equal(f.api.paintedShipResourceStats().sourceQueued,16);
 await f.drain();const loaded=await Promise.all(promises);assert.equal(loaded.length,19);assert.equal(f.images.length,19);assert.equal(new Set(f.images.map(i=>i.url)).size,19);assert.equal(f.peak(),3);
 assert.ok(f.api.paintedShipResourceStats().sources<=8);assert.equal(f.api.paintedShipResourceStats().sourceRetainCount,0);
});

test('a mounted hull jumps ahead of speculative queued warming and is never dropped at its cap',async()=>{
 const f=await fixture(),urls=Array.from({length:7},(_,i)=>shipEvolutionAsset(i,1));f.api.preloadHullSources(urls);
 const wanted=shipEvolutionAsset(18,1),request=f.api.shipImage(wanted);
 assert.equal(f.images[2].url,wanted,'foreground starts even while both warming loads are stalled');
 f.finish(f.images[2]);await f.flush();assert.equal((await request).url,wanted);
 // A previously queued warm request receives the same foreground priority.
 const existing=f.api.shipImage(urls[6]);assert.equal(f.images.at(-1).url,urls[6]);
 await f.drain();assert.equal((await existing).url,urls[6]);assert.equal(f.peak(),3);
});

test('failed loads free their slot and pin, allow retry and do not poison other queued sources',async()=>{
 const f=await fixture(),urls=Array.from({length:7},(_,i)=>shipEvolutionAsset(i,1)),requests=urls.map(url=>f.api.shipImage(url));
 const failed=assert.rejects(requests[0],/Ship image unavailable/);
 f.finish(f.images[0],true);await f.flush();await failed;assert.equal(f.pending.size,3);
 const retry=f.api.shipImage(urls[0]);assert.notEqual(retry,requests[0]);
 await f.drain();await Promise.all([...requests.slice(1),retry]);assert.equal(f.peak(),3);assert.equal(f.api.paintedShipResourceStats().sourceRetainCount,0);
 assert.ok(f.images.every(i=>i.onload===null&&i.onerror===null),'completed image handlers are detached');
});

test('completed normal/boss/bonus plans across all 500 stages leave no source jobs or pins behind',async t=>{
 const f=await fixture();
 for(let stage=1;stage<=500;stage++)for(const encounter of stage%10?['normal']:['boss-intro','boss-fight','boss-clear','bonus']){
  const plan=hullSourcePlan(stage,encounter,0,1);f.api.preloadHullSources(plan);
  const visible=plan.slice(0,6).map(url=>f.api.shipImage(url));
  await f.drain();await Promise.all(visible);
  const stats=f.api.paintedShipResourceStats();assert.equal(stats.sourceActive,0);assert.equal(stats.sourceQueued,0);assert.equal(stats.sourceRetainCount,0);assert.ok(stats.sources<=8);
 }
 assert.equal(f.peak(),3);
 const uniqueSources=new Set(f.images.map(image=>image.url)).size;
 assert.equal(f.canvases.length,uniqueSources,'each immutable source center is measured at most once across every stage');
 t.diagnostic(JSON.stringify({sourceLoads:f.images.length,uniqueSources,centerCanvases:f.canvases.length}));
});

test('full speculative capacity defers a paint job; the same mounted variant retries and finishes',async()=>{
 const f=await fixture(),urls=Array.from({length:8},(_,i)=>shipEvolutionAsset(i,1));
 f.api.preloadHullSources(urls);f.api.preloadHullSources([urls[7]]);
 const prepared=f.api.retainPreparedHulls([{sprite:18,color:'steel'}]);
 assert.deepEqual(Array.from(await prepared.settled),[false]);
 assert.equal(f.images.length,2);assert.equal(f.api.paintedShipResourceStats().sourceQueued,6);assert.equal(f.api.paintedShipResourceStats().pending,0);
 const release=f.api.cache.retain('18:1:steel'),retry=f.api.createPaintedSprite(18,'steel',1);
 await f.flush();assert.equal(f.images[2].url,shipEvolutionAsset(18,1),'visible retry uses the reserved slot');
 await f.drain();assert.match(await retry,/^blob:paint-/);release();prepared.release();
 assert.equal(f.api.paintedShipResourceStats().sourceRetainCount,0);assert.equal(f.api.paintedShipResourceStats().retainCount,0);
});
