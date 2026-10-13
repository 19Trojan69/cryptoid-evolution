import test from 'node:test';
import assert from 'node:assert/strict';
import { paintShipMaterial } from './shipMaterial.ts';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const workerSource=ts.transpileModule(fs.readFileSync(new URL('./shipMaterialWorker.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;

test('worker results and worker failure fallback preserve every original pixel',async()=>{
 const saved={Worker:globalThis.Worker,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
 const timers=new Map();let id=0,workers=0,fail=false;
 globalThis.setTimeout=fn=>{timers.set(++id,fn);return id;};globalThis.clearTimeout=id=>timers.delete(id);
 globalThis.Worker=class {
  constructor(){workers++;this.scope={self:{postMessage:(value,options)=>{const copied=structuredClone(value,{transfer:options?.transfer??[]});queueMicrotask(()=>this.onmessage?.({data:copied}));}},exports:{},require:()=>({paintShipMaterial})};vm.runInNewContext(workerSource,this.scope);}
  postMessage(message,transfer){
   const copied=structuredClone(message,{transfer});
   queueMicrotask(()=>{if(fail){this.onerror?.({});return;}
    this.scope.self.onmessage({data:copied});
   });
  }
  terminate(){this.terminated=true;}
 };
 try {
  const {paintShipMaterialAsync}=await import('./shipMaterialAsync.ts');
  for(let sample=0;sample<20;sample++){
   const size=sample<2?282:32;
   const data=new Uint8ClampedArray(size*size*4).map((_,i)=>(i*37+sample*71)%256),expected=data.slice();
   const job={data,width:size,height:size,target:[225,183,72],accent:sample%2?[68,161,89]:undefined};
   paintShipMaterial(expected,size,size,job.target,job.accent);
   await paintShipMaterialAsync(job);assert.deepEqual(data,expected);assert.equal(workers,1);
  }
  fail=true;
  const data=new Uint8ClampedArray(32*32*4).fill(100),expected=data.slice();
  paintShipMaterial(expected,32,32,[212,48,62]);
  await paintShipMaterialAsync({data,width:32,height:32,target:[212,48,62]});
  assert.deepEqual(data,expected);assert.ok(timers.size<=1);
 }finally{Object.assign(globalThis,saved);}
});
