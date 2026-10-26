import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const {build}=createRequire(import.meta.url)('esbuild');

async function fixture(){
 const built=await build({stdin:{contents:"export {loadCardImage} from './src/pages/bossArtwork';export {loadShipArtwork} from './src/pages/shipArtwork';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent'});
 const images=[],canvases=[];
 class Image {width=4;height=4;naturalWidth=4;naturalHeight=4;constructor(){images.push(this);}set src(value){this.url=value;}}
 const document={createElement(tag){assert.equal(tag,'canvas');const c={width:0,height:0,getContext:()=>({drawImage(){},putImageData(){},getImageData:()=>({data:new Uint8ClampedArray(64).fill(255)})})};canvases.push(c);return c;}};
 const scope={Image,document,console,exports:{},module:{exports:{}}};scope.module.exports=scope.exports;vm.runInNewContext(built.outputFiles[0].text,scope);
 return {api:scope.module.exports,images,canvases};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('parallel card consumers share one pending original image and receive the same loaded object',async()=>{
 const f=await fixture(),first=f.api.loadCardImage('/same.png'),second=f.api.loadCardImage('/same.png');
 assert.equal(f.images.length,1);assert.strictEqual(first,second);
 f.images[0].onload();assert.strictEqual(await first,await second);
 assert.equal(f.images[0].onload,null);assert.equal(f.images[0].onerror,null);
});

test('eight distinct ship colors share the original load while retaining separate artwork',async()=>{
 const f=await fixture(),colors=['gold','silver','grey','metallic-blue','red','green','purple','orange'];
 const tasks=colors.map(color=>f.api.loadShipArtwork('/ships/evolution/ship_01_stage_1.png',color));
 assert.equal(f.images.length,1);f.images[0].onload();
 const art=await Promise.all(tasks);assert.equal(new Set(art).size,colors.length);
 assert.equal(f.canvases.filter(c=>c.width===0&&c.height===0).length,colors.length,'temporary readback surfaces are still released');
 assert.strictEqual(f.api.loadShipArtwork('/ships/evolution/ship_01_stage_1.png','gold'),tasks[0]);
 assert.equal(f.images.length,1,'a completed artwork cache hit does no new source work');
});

test('failed shared source rejects every consumer and permits one shared retry',async()=>{
 const f=await fixture(),first=f.api.loadShipArtwork('/retry.png','gold'),second=f.api.loadShipArtwork('/retry.png','silver');
 const failed=Promise.allSettled([first,second]);assert.equal(f.images.length,1);f.images[0].onerror();
 assert.ok((await failed).every(r=>r.status==='rejected'));await tick();
 assert.equal(f.images[0].onload,null);assert.equal(f.images[0].onerror,null);
 const retry=[f.api.loadShipArtwork('/retry.png','gold'),f.api.loadShipArtwork('/retry.png','silver')];
 assert.equal(f.images.length,2);f.images[1].onload();await Promise.all(retry);
});

test('different URLs remain independent and settled sources are not retained in another image cache',async()=>{
 const f=await fixture(),a=f.api.loadCardImage('/a.png'),b=f.api.loadCardImage('/b.png');
 assert.equal(f.images.length,2);f.images[0].onload();f.images[1].onload();await Promise.all([a,b]);
 const again=f.api.loadCardImage('/a.png');assert.equal(f.images.length,3);f.images[2].onload();await again;
});

test('unfinished source sharing survives eviction from the existing twenty-artwork cache',async()=>{
 const f=await fixture(),jobs=Array.from({length:21},(_,i)=>f.api.loadShipArtwork('/shared.png','color-'+i));
 const repeated=f.api.loadShipArtwork('/shared.png','color-0');assert.strictEqual(repeated,jobs[0]);
 assert.equal(f.images.length,1);f.images[0].onload();await Promise.all(jobs);
 const evicted=f.api.loadShipArtwork('/shared.png','color-0');assert.notStrictEqual(evicted,jobs[0]);
 assert.equal(f.images.length,2,'twenty-result bound remains in force after settlement');f.images[1].onload();await evicted;
});
