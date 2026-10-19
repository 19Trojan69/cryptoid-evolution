import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {build} from 'esbuild';
import {bossManifest} from './bossManifest.ts';
async function fixture(){
 const result=await build({entryPoints:['src/pages/bossWeaponTextures.ts'],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',plugins:[{name:'atlas-load-host',setup(b){
  b.onLoad({filter:/bossWeaponTextures\.ts$/},a=>({loader:'ts',contents:fs.readFileSync(a.path,'utf8')+'\nexport const stats=()=>({active,queued:queued.length,cache:textures.size,pins:textures.retainCount});'}));
  b.onResolve({filter:/\/bossResourceDiagnostics\.ts$/},()=>({path:'diagnostics',namespace:'diag'}));
  b.onLoad({filter:/.*/,namespace:'diag'},()=>({loader:'js',contents:'export const reportBossResource=()=>{};'}));
 }}]});
 const images=[],pending=new Set();let peak=0;
 class Image{constructor(){images.push(this);}naturalWidth=2048;naturalHeight=1024;set src(url){this.url=url;pending.add(this);peak=Math.max(peak,pending.size);}}
 const scope={Image,exports:{},module:{exports:{}}};scope.module.exports=scope.exports;vm.runInNewContext(result.outputFiles[0].text,scope);
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 const finish=(image,error=false)=>{assert.ok(pending.delete(image));(error?image.onerror:image.onload)();};
 const drain=async()=>{for(let n=0;pending.size||scope.module.exports.stats().queued;n++){assert.ok(n<100);for(const image of [...pending])finish(image);await flush();}};
 return {api:scope.module.exports,images,pending,peak:()=>peak,flush,finish,drain};
}
test('all 50 pending boss atlases deduplicate under LRU pressure and never allocate more than two concurrently',async()=>{
 const f=await fixture(),requests=bossManifest.map(config=>f.api.preloadBossWeapons(config));
 for(let n=0;n<2000;n++)assert.equal(f.api.preloadBossWeapons(bossManifest[n%50]),requests[n%50]);
 assert.equal(f.images.length,2);assert.equal(f.api.stats().queued,48);
 await f.drain();await Promise.all(requests);assert.equal(f.images.length,50);assert.equal(f.peak(),2);assert.ok(f.api.stats().cache<=2);assert.equal(f.api.stats().pins,0);
 assert.ok(f.images.every(i=>i.onload===null&&i.onerror===null));
});
test('warming leaves a slot available and an already queued visible atlas is promoted',async()=>{
 const f=await fixture();bossManifest.slice(0,5).forEach(c=>f.api.preloadBossWeapons(c,false));assert.equal(f.images.length,1);
 const visible=f.api.preloadBossWeapons(bossManifest[4]);assert.equal(f.images.length,2);assert.equal(f.images[1].url,bossManifest[4].weaponImage);
 await f.drain();assert.equal((await visible).url,bossManifest[4].weaponImage);assert.equal(f.api.stats().pins,0);
});
test('failed atlas releases its pending pin and slot, and retry receives a new request',async()=>{
 const f=await fixture(),first=f.api.preloadBossWeapons(bossManifest[0]),failed=assert.rejects(first,/Boss weapon texture failed/);
 f.finish(f.images[0],true);await f.flush();await failed;assert.equal(f.api.stats().pins,0);assert.equal(f.api.stats().active,0);
 const retry=f.api.preloadBossWeapons(bossManifest[0]);assert.notEqual(retry,first);await f.drain();assert.equal((await retry).url,bossManifest[0].weaponImage);assert.equal(f.api.stats().pins,0);
});
