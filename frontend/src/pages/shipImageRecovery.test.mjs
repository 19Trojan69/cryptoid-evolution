import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require=createRequire(import.meta.url),{build}=require('esbuild');
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
async function fixture(kind) {
 const source=process.env.CRYPTOID_PAINT_BASELINE
  ?execFileSync('git',['show','1c1c7f9:frontend/src/pages/paintedShip.ts'],{cwd:root,encoding:'utf8'})
  :fs.readFileSync(path.join(root,'src/pages/paintedShip.ts'),'utf8');
 const compiled=await build({absWorkingDir:root,entryPoints:['src/pages/paintedShip.ts'],bundle:true,write:false,platform:'node',format:'cjs',define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent',plugins:[{name:'actual-source-image',setup(b){b.onLoad({filter:/paintedShip\.ts$/},()=>({contents:source+'\nexport {shipImage};',loader:'ts'}));}}]});
 let fault=true,id=0;const timers=new Map(),canvases=[],escaped=[];
 const setTimer=fn=>{timers.set(++id,fn);return id;},clearTimer=id=>timers.delete(id);
 class Image {
  naturalWidth=3;naturalHeight=3;
  set src(value){this.url=value;if(value)queueMicrotask(()=>{try{const result=this.onload?.();if(result?.catch)result.catch(error=>escaped.push(error));}catch(error){escaped.push(error);}});}
  decode(){return Promise.resolve();}
 }
 const createCanvas=()=>{
  if(fault&&kind==='create')throw new Error('Canvas creation fixture');
  let width=0,height=0;
  const canvas={get width(){return width;},set width(value){if(fault&&kind==='allocation'&&value>0)throw new RangeError('Canvas allocation fixture');width=value;},get height(){return height;},set height(value){height=value;},getContext(){if(fault&&kind==='context')throw new Error('Canvas context fixture');return {drawImage(){},getImageData:(_x,_y,w,h)=>({data:new Uint8ClampedArray(w*h*4).fill(128)})};}};
  canvases.push(canvas);return canvas;
 };
 const storage={getItem(){return null;},setItem(){}};
 const scope={exports:{},module:{exports:{}},console,Image,Uint8ClampedArray,queueMicrotask,setTimeout:setTimer,clearTimeout:clearTimer,window:{setTimeout:setTimer,clearTimeout:clearTimer,localStorage:storage,location:{hostname:'localhost'},__ENV:{appNetwork:'testnet'}},localStorage:storage,document:{createElement:createCanvas},URL};
 scope.module.exports=scope.exports;vm.runInNewContext(compiled.outputFiles[0].text,scope);
 const url='/ships/evolution/ship_01_stage_1.png';let state='pending';
 scope.module.exports.shipImage(url).then(()=>state='resolved',()=>state='rejected');
 for(let turn=0;turn<20;turn++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(state,'rejected','a failed Canvas must settle the image promise instead of wedging the serial paint queue');
 assert.equal(escaped.length,0,'no error escapes the Image callback');
 assert.equal(timers.size,0,'failed image timeout is removed');
 assert.ok(canvases.every(canvas=>canvas.width===0&&canvas.height===0),'partial canvases are released');
 fault=false;
 const restored=await scope.module.exports.shipImage(url);assert.equal(restored.url,url,'failed image is removed so the same source can retry');
 assert.equal(timers.size,0);assert.ok(canvases.every(canvas=>canvas.width===0&&canvas.height===0));
}
for(const kind of ['create','allocation','context'])test(`actual ship image preparation recovers after ${kind} throws`,()=>fixture(kind));
