// Native React/Canvas lifetime check. The texture loader alone is deterministic
// QA scaffolding; the production component, renderer, atlases and CSS are real.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process'),assert=require('node:assert/strict'),{build}=require('esbuild');
const root=path.resolve(__dirname,'..'),base='171cb5c4507a1530a9bbb080d61805be0da545f7';
const old=f=>execFileSync('git',['show',`${base}:frontend/src/pages/${f}`],{cwd:root,encoding:'utf8'});
(async()=>{
 const source=`import React from 'react';import{createRoot}from'react-dom/client';import{flushSync}from'react-dom';
 import Before from './src/pages/BeforeWeapons';import After from './src/pages/BossWeaponsView';import{createSectorBoss}from'./src/pages/sectorBoss';import'./src/index.css';
 const Component=location.search.includes('before')?Before:After,root=createRoot(document.getElementById('mount'));let boss;
 window.mountQa=async(id,width)=>{boss=createSectorBoss(id*10,width,96,825);const image=new Image();image.src=boss.config.weaponImage;await image.decode();window.qaAtlas=image;flushSync(()=>root.render(<Component key={id} boss={boss}/>));};
 window.updateQa=(mode)=>{boss={...boss,weaponClock:10050};if(mode==='hot')boss.turrets=boss.turrets.map((t,i)=>({...t,a:.2+i*.1,health:t.maxHealth*.4,lastFired:10000,firedBarrels:[0]}));
 if(mode==='partial')boss.turrets=boss.turrets.map((t,i)=>({...t,health:i?t.health:0}));if(mode==='dead')boss.turrets=boss.turrets.map(t=>({...t,health:0}));
 if(mode==='resize'){boss.width*=.873;boss.height*=.873;}if(mode==='restore')boss.turrets=boss.turrets.map(t=>({...t,health:t.maxHealth*.4}));
 flushSync(()=>root.render(<Component key={boss.config.id} boss={boss} frozen={mode==='fall'}/>));};
 window.readyQa=()=>{const c=document.querySelector('canvas');return !!c&&!c.hidden&&c.width>300;};
 window.readQa=async()=>{const c=document.querySelector('canvas'),ctx=c.getContext('2d'),rgba=ctx.getImageData(0,0,c.width,c.height).data;
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',rgba)),v=>v.toString(16).padStart(2,'0')).join('');
 const sources=window.qaCanvases.filter(s=>s!==c),sourceBytes=sources.reduce((n,s)=>n+s.width*s.height*4,0);
 return{width:c.width,height:c.height,hash,sourceBytes,sourceAlive:sources.filter(s=>s.width*s.height>0).length,clears:window.qaClears};};
 window.clearQa=()=>flushSync(()=>root.render(null));`;
 const bundle=await build({absWorkingDir:root,stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,write:false,outdir:'/virtual',platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},external:['/ships/*','/planets/*','/satellite.svg'],plugins:[{name:'baseline-and-texture-loader',setup(b){
  b.onResolve({filter:/\/BeforeWeapons$/},()=>({path:root+'/src/pages/BeforeWeapons.tsx'}));
  b.onLoad({filter:/\/BeforeWeapons\.tsx$/},()=>({loader:'tsx',contents:old('BossWeaponsView.tsx')}));
  b.onResolve({filter:/\/bossWeaponRenderer$/},a=>a.importer.endsWith('BeforeWeapons.tsx')?{path:root+'/src/pages/BeforeRenderer.ts'}:undefined);
  b.onLoad({filter:/\/BeforeRenderer\.ts$/},()=>({loader:'ts',contents:old('bossWeaponRenderer.ts')}));
  b.onResolve({filter:/\/bossWeaponTextures$/},()=>({path:'texture',namespace:'qa'}));
  b.onLoad({filter:/.*/,namespace:'qa'},()=>({loader:'js',contents:'export const preloadBossWeapons=()=>Promise.resolve(window.qaAtlas);'}));
 }}]});
 const output=new Map(bundle.outputFiles.map(f=>[path.extname(f.path),f.text]));
 const html=`<!doctype html><link rel="stylesheet" href="/qa.css"><body><div id="mount"></div><script>window.qaCanvases=[];window.qaClears=0;const original=document.createElement.bind(document);document.createElement=function(tag,...rest){const node=original(tag,...rest);if(tag==='canvas')window.qaCanvases.push(node);return node;};const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...a){window.qaClears++;return clear.apply(this,a);};</script><script src="/qa.js"></script>`;
 const server=http.createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname;if(p==='/'){res.setHeader('Content-Type','text/html');return res.end(html);}if(p==='/qa.js'||p==='/qa.css'){res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':'text/css');return res.end(output.get(p.endsWith('.js')?'.js':'.css'));}
  const asset=path.resolve(root,'public','.'+p);if(asset.startsWith(root+'/public/')&&fs.existsSync(asset)&&fs.statSync(asset).isFile())return fs.createReadStream(asset).pipe(res);res.statusCode=404;res.end();});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright'),pkg=await import('/tmp/cryptoid-boss-native-qa/node_modules/@sparticuz/chromium/build/index.js');
  browser=await chromium.launch({executablePath:'/tmp/cryptoid-boss-native-runtime/chromium',headless:true,args:[...pkg.default.args,'--disable-gpu','--disable-accelerated-2d-canvas']});
  const page=await browser.newPage({viewport:{width:900,height:825},deviceScaleFactor:1.5}),errors=[];page.on('pageerror',e=>errors.push(String(e)));const origin='http://127.0.0.1:'+server.address().port;
  const results={};
  for(const variant of ['before','after']){
   await page.goto(origin+'/?'+variant);const snapshots=[];
   for(const id of [1,2,7,25,50])for(const width of [320,430,820]){
    await page.evaluate(p=>window.mountQa(...p),[id,width]);await page.waitForFunction(()=>window.readyQa());
    for(const mode of ['hot','partial','dead','idle','fall','resize','restore','dead']){
     await page.evaluate(mode=>window.updateQa(mode),mode);
     const snapshot=await page.evaluate(()=>window.readQa());snapshots.push({id,width,mode,...snapshot});
     if(mode==='dead'||mode==='fall'||mode==='resize'){
      assert.equal(snapshot.sourceAlive,variant==='after'?0:1,'only baseline retains the copied source');
     }
     if(mode==='idle'){
      const prior=snapshots.at(-2);assert.equal(snapshot.clears,prior.clears,'no redraw of already dead guns');assert.equal(snapshot.hash,prior.hash,'released source cannot clear the destination');
     }
    }
    await page.evaluate(()=>window.clearQa());assert.equal(await page.evaluate(()=>window.qaCanvases.reduce((n,c)=>n+c.width*c.height,0)),0,'native source/destination dimensions zero after unmount');
   }results[variant]=snapshots;
  }
  assert.equal(results.before.length,results.after.length);for(let i=0;i<results.before.length;i++){
   const a=results.before[i],b=results.after[i];assert.deepEqual([b.width,b.height,b.hash],[a.width,a.height,a.hash],`${b.id}/${b.width}/${b.mode}`);
  }assert.deepEqual(errors,[]);
  const report={passed:true,baseline:base,browser:await browser.version(),softwareFlags:true,bosses:[1,2,7,25,50],fieldWidths:[320,430,820],devicePixelRatio:1.5,exactRgbaComparisons:results.after.length,
   checks:['native React commit/effect lifetime','offscreen source canvases zero after final copied frame','visible canvas exact after source release and repeated static updates','resize and restored live guns rebuild','native unmount zeroes every owned canvas'],pageErrors:errors,
   limits:'Actual Linux Chromium with accelerated rendering disabled; loader is deterministic QA scaffolding. No physical iPhone/WebKit GPU retirement, thermal state, whole-process memory, FPS or interruption-fix proof.'};
  fs.writeFileSync(root+'/../docs/spent-boss-weapon-cache-20261021/browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
