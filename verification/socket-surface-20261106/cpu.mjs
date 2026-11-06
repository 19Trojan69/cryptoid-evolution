import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {code,original,candidate,root,scope} from './source.mjs';
import {compareSurfaces} from './compare.mjs';
const req=createRequire(import.meta.url);
let pkg;try{pkg=req.resolve('@napi-rs/canvas');}catch{pkg=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas';}
const {createCanvas,loadImage}=req(pkg);
const before=eval(code(original)),after=eval(code(candidate));
// This CPU package resets a zero dimension to 350/150, unlike HTMLCanvasElement.
// Preserve assigned HTML dimensions for the release assertions and keep its
// retired native allocation at 1px. Actual zero backing release is browser-only.
const makeCanvas=(w,h)=>{
 const c=createCanvas(w,h),proto=Object.getPrototypeOf(c);
 for(const name of ['width','height']){
  const d=Object.getOwnPropertyDescriptor(proto,name);let assigned=c[name];
  Object.defineProperty(c,name,{get:()=>assigned,set:value=>{assigned=value;d.set.call(c,Math.max(1,value));}});
 }
 return c;
};
const available=before.bossManifest.filter(c=>existsSync(root+'/frontend/public'+c.weaponImage));
if(process.env.CRYPTOID_LOCAL_PARTIAL==='1')before.bossManifest=available;
else assert.equal(available.length,50,'All original weapon atlases must be present');
const result=await compareSurfaces({before,after,makeCanvas,
 loadImage:p=>loadImage(root+'/frontend/public'+p),pixels:c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data});
result.identity=scope();result.engine='@napi-rs/canvas 0.1.100';result.physicalDevice=false;result.whiteScreenFixed=false;
result.limits='Exact renderer pixel equality and logical allocated source bytes; no total process/GPU/phone RAM claim.';
result.zeroReleaseIsAdapterOnly=true;
mkdirSync(root+'/verification/socket-surface-20261106/results',{recursive:true});
writeFileSync(root+'/verification/socket-surface-20261106/results/cpu.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({complete:result.complete,bosses:result.rows.length,cases:result.cases,
 beforeBytes:result.rows.reduce((s,r)=>s+r.sourceBeforeBytes,0),afterBytes:result.rows.reduce((s,r)=>s+r.sourceAfterBytes,0)}));
