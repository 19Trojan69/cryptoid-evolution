// Actual React component effects + Canvas renderer, hosted in Node, not a browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {build}=require('esbuild'),{createCanvas,Image:NativeImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
(async()=>{
 const compiled=await build({absWorkingDir:root,entryPoints:['preview/InsectoidsPreview.tsx'],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',plugins:[{name:'host',setup(b){
  b.onResolve({filter:/^(react|react\/jsx-runtime)$/},a=>({path:a.path,namespace:'host'}));
  b.onResolve({filter:/\/gameAudio$/},a=>({path:a.path,namespace:'audio'}));
  b.onResolve({filter:/\.css$/},a=>({path:a.path,namespace:'css'}));
  b.onLoad({filter:/.*/,namespace:'host'},a=>({contents:a.path==='react'?'export const {useState,useRef,useEffect}=globalThis.__hooks;':'export const jsx=globalThis.__jsx,jsxs=jsx;'}));
  b.onLoad({filter:/.*/,namespace:'audio'},()=>({contents:'export class GameAudio{start(){return Promise.resolve(true)}close(){}setPaused(){}}'}));
  b.onLoad({filter:/.*/,namespace:'css'},()=>({contents:''}));
  b.onLoad({filter:/InsectoidsPreview\.tsx$/},a=>({contents:fs.readFileSync(a.path,'utf8').replace(' if(!running)return',' globalThis.__missionQA={engine,start,leave,pause,assets,view};\n if(!running)return'),loader:'tsx'}));
 }}]});
 let slots=[],cursor=0,pending=false,effects=[],frames=new Map(),nextFrame=0,clock=0,canvas;const listeners=new Map(),created=[];
 const events=id=>({addEventListener(type,fn){const key=id+':'+type,set=listeners.get(key)||new Set();set.add(fn);listeners.set(key,set);},removeEventListener(type,fn){listeners.get(id+':'+type)?.delete(fn);}});
 const makeCanvas=()=>{const c=createCanvas(390,760);Object.assign(c,events('canvas'+created.length),{getBoundingClientRect:()=>({left:0,top:0,width:390,height:760}),setPointerCapture(){}});created.push(c);return c;};
 class HostImage extends NativeImage{set src(value){this.path=value;if(value.startsWith('blob:'))fetch(value).then(r=>r.arrayBuffer()).then(bytes=>{super.src=Buffer.from(bytes)}).catch(e=>this.onerror?.(e));else super.src=fs.readFileSync(path.join(root,'public',value));}get src(){return this.path;}}
 const hooks={useRef(value){const i=cursor++;return slots[i]??(slots[i]={current:value});},useState(initial){const i=cursor++;if(!slots[i])slots[i]={value:typeof initial==='function'?initial():initial};return [slots[i].value,next=>{slots[i].value=typeof next==='function'?next(slots[i].value):next;pending=true;}];},useEffect(fn,deps){const i=cursor++,old=slots[i];if(!old||deps?.some((x,n)=>x!==old.deps?.[n]))effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:fn()};});}};
 const doc={...events('document'),hidden:false,createElement:tag=>{assert.equal(tag,'canvas');return makeCanvas();}};
 const win={...events('window'),innerWidth:390,innerHeight:846,devicePixelRatio:1};
 const context={console,Buffer,Blob,URL,Image:HostImage,document:doc,window:win,performance:{now:()=>clock},requestAnimationFrame:fn=>{frames.set(++nextFrame,fn);return nextFrame},cancelAnimationFrame:id=>frames.delete(id),__hooks:hooks,__jsx:(type,props)=>{if(type==='canvas'&&props.ref){canvas??=makeCanvas();props.ref.current=canvas;}return{type,props}},module:{exports:{}},exports:{}};
 context.exports=context.module.exports;vm.createContext(context);vm.runInContext(compiled.outputFiles[0].text,context);
 const render=()=>{cursor=0;pending=false;context.module.exports.default();const todo=effects;effects=[];todo.forEach(f=>f());};const flush=()=>{for(let n=0;pending&&n<10;n++)render();};render();
 for(let i=0;i<200&&!context.__missionQA.assets.current;i++){await new Promise(r=>setTimeout(r,5));flush();}
 assert.equal(context.__missionQA.assets.current.enemies.length,20);context.__missionQA.start(false);flush();assert.equal(frames.size,1);
 const tick=n=>{for(let i=0;i<n;i++){clock+=16.6667;const queue=[...frames.values()];frames.clear();queue.forEach(f=>f(clock));flush();assert.equal(frames.size,1);}};
 tick(240);const e=context.__missionQA.engine.current;assert.ok(e.time>3000);assert.ok(e.virusShots>0);
 fs.writeFileSync('/workspace/scratch/5fce634eaaca/special-mission-canvas-qa.png',canvas.toBuffer('image/png'));
 context.__missionQA.pause();flush();const paused=e.time;tick(120);assert.equal(e.time,paused);context.__missionQA.pause();flush();tick(12);assert.ok(e.time>paused);
 doc.hidden=true;for(const f of listeners.get('document:visibilitychange'))f();flush();const hidden=e.time;tick(60);assert.equal(e.time,hidden);doc.hidden=false;
 context.__missionQA.leave();flush();assert.equal(frames.size,0);assert.equal([...listeners.values()].reduce((n,s)=>n+s.size,0),0);
 // Repeat mount/run to expose multiple animation owners or duplicate listeners.
 context.__missionQA.start(true);flush();tick(240);assert.equal(frames.size,1);assert.equal(context.__missionQA.engine.current.phase,'boss');
 fs.writeFileSync('/workspace/scratch/5fce634eaaca/special-boss-canvas-qa.png',canvas.toBuffer('image/png'));
 context.__missionQA.leave();flush();assert.equal(frames.size,0);assert.equal([...listeners.values()].reduce((n,s)=>n+s.size,0),0);
 for(const s of slots)s?.cleanup?.();
 console.log(JSON.stringify({passed:true,actualComponentEffects:true,actualNativeCanvasRendering:true,decodedEnemySprites:20,singleAnimationOwner:true,pauseAndBackground:true,repeatedStartAndStop:true,remainingRAF:frames.size,remainingListeners:0,limits:'Node host, no browser, no real device or GPU/FPS claims'}));
})().catch(e=>{console.error(e);process.exitCode=1});
