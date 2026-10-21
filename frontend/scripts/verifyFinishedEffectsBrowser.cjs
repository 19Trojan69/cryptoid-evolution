// Actual old/new HullDamage and impact declarations with unchanged authored CSS.
// Controlled snapshots are separate from fresh-document native lifetime tests.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict'),ts=require('typescript');
const {createHash}=require('node:crypto'),{build}=require('esbuild');
const root=path.resolve(__dirname,'..'),base='171cb5c4507a1530a9bbb080d61805be0da545f7';
const lifetimeOnly=process.env.CRYPTOID_FINISHED_LIFETIME_ONLY==='1';
const old=file=>execFileSync('git',['show',`${base}:frontend/src/pages/${file}`],{cwd:root,encoding:'utf8'});
const extract=source=>{
 const ast=ts.createSourceFile('GamePage.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),names=new Set(['scatteredPieces','shipDebris','OriginalImpactEffectView']),parts=[];
 const visit=n=>{if(ts.isVariableDeclaration(n)&&names.has(n.name.getText(ast)))parts.push('const '+n.getText(ast)+';');ts.forEachChild(n,visit);};visit(ast);assert.equal(parts.length,3);
 return `import React,{memo,type CSSProperties} from 'react';import FinishedEffect from './FinishedEffect';
 import PaintedShip from './PaintedShip';import {spriteStyle} from './shipFleet';import {fragmentFlight,explosionDiameter} from './shipRealism';
 type Effect=any;const fallingBoss=()=>null;${parts.join('\n')}export default OriginalImpactEffectView;`;
};
(async()=>{
 const modules={BeforeImpact:extract(old('GamePage.tsx')),AfterImpact:extract(fs.readFileSync(root+'/src/pages/GamePage.tsx','utf8')),BeforeDamage:old('HullDamage.tsx')};
 const source=`
 import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
 import BeforeImpact from './src/pages/BeforeImpact';import AfterImpact from './src/pages/AfterImpact';
 import BeforeDamage from './src/pages/BeforeDamage';import AfterDamage from './src/pages/HullDamage';
 import FinishedEffect from './src/pages/FinishedEffect';import {createSectorBoss} from './src/pages/sectorBoss';
 import {hullImpactProfile} from './src/pages/hullFires';
 import {startCssFramePacing,cssFramePacingStats} from './src/lib/cssFramePacing';
 import './src/index.css';import './src/fleetMenus.css';import './src/pages/bossExplosionBudget.css';
 const roots=['before','after'].map(id=>createRoot(document.getElementById(id)));const stop=startCssFramePacing(document.body);
 window.setQa=(kind,id,width,serial=1,delay=0)=>{
  const boss=createSectorBoss(id*10,width,96,825),effect={id:serial,kind,x:width/2,y:200,sprite:id%20,
   debrisSize:kind==='boss-explosion'?240:72,bossFragments:8,bossShipWidth:boss.width,bossHeight:boss.height,
   bossImage:boss.config.wreckImage,finalDelayMs:delay,shipClass:'heavy'};
  const hit={id:serial,x:50,y:50,impactPower:3},sites=[{id:1,x:40,y:40},{id:2,x:65,y:60}];
  flushSync(()=>roots.forEach((r,i)=>r.render(kind==='hit'?<div key={kind} style={{position:'absolute',left:width/2-boss.width/2,top:80,width:boss.width,height:boss.height}}>
   <img src={boss.config.image} style={{position:'absolute',width:'100%',height:'100%'}}/>
   {React.createElement(i?AfterDamage:BeforeDamage,{hit,sites,bossDamage:.72,maskImage:"url('"+boss.config.image+"')"})}
  </div>:React.createElement(i?AfterImpact:BeforeImpact,{key:kind+'-'+serial,effect}))));
  document.querySelectorAll('section').forEach(s=>s.style.width=width+'px');
 };
 window.freezeQa=time=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=time;});
 window.pauseQa=paused=>document.body.dataset.effectsPaused=String(paused);
 window.readQa=()=>({afterBursts:document.querySelectorAll('#after .hull-mini-explosion').length,
  afterImpacts:document.querySelectorAll('#after .impact-effect').length,afterHeat:document.querySelectorAll('#after .hull-hotspot').length,
  beforeBursts:document.querySelectorAll('#before .hull-mini-explosion').length,beforeImpacts:document.querySelectorAll('#before .impact-effect').length,
  nativeAnimations:document.getAnimations().length,pacing:cssFramePacingStats()});
 window.guardQa=()=>flushSync(()=>roots[1].render(<FinishedEffect tag="div" className="hull-mini-explosion"><i style={{animation:'reactor-core-pulse 1.1s infinite'}}/></FinishedEffect>));
 window.fallbackQa=mode=>{window.setQa('hit',2,430,200+mode);const node=document.querySelector('#after .hull-mini-explosion');node.getAnimations=mode===1?undefined:()=>{throw new Error('Unsupported native inspection');};};
 window.clearQa=()=>flushSync(()=>roots.forEach(r=>r.render(null)));
 window.stopQa=stop;
 `;
 const bundle=await build({absWorkingDir:root,stdin:{contents:source,resolveDir:root,loader:'tsx'},bundle:true,write:false,
  outdir:'/virtual',platform:'browser',format:'iife',jsx:'automatic',external:['/ships/*','/planets/*','/satellite.svg'],define:{'process.env.NODE_ENV':'"production"'},
  plugins:[{name:'actual-effect-declarations',setup(b){
   b.onResolve({filter:/\/paintedShip$/},()=>({path:path.join(root,'src/pages/paintedShip.ts')}));
   b.onResolve({filter:/\/(BeforeImpact|AfterImpact|BeforeDamage)$/},a=>({path:path.join(root,'src/pages',a.path.split('/').at(-1)+'.tsx')}));
   b.onLoad({filter:/\/(BeforeImpact|AfterImpact|BeforeDamage)\.tsx$/},a=>({contents:modules[path.basename(a.path,'.tsx')],loader:'tsx'}));
  }}]});
 const output=new Map(bundle.outputFiles.map(f=>[path.extname(f.path),f.text]));
 const html='<!doctype html><link rel="stylesheet" href="/qa.css"><style>body{margin:0;background:#050b18}section{position:absolute;left:0;top:0;height:560px;background:#050b18}</style><body class="game-shell"><section id="before"></section><section id="after"></section><script src="/qa.js"></script>';
 const server=http.createServer((req,res)=>{
  const p=new URL(req.url,'http://localhost').pathname;
  if(p==='/'){res.setHeader('Content-Type','text/html');return res.end(html);}
  if(p==='/qa.js'||p==='/qa.css'){res.setHeader('Content-Type',p.endsWith('js')?'text/javascript':'text/css');return res.end(output.get(p.endsWith('js')?'.js':'.css'));}
  const asset=path.resolve(root,'public','.'+p);
  if(asset.startsWith(path.join(root,'public')+path.sep)&&fs.existsSync(asset)&&fs.statSync(asset).isFile()){
   if(asset.endsWith('.webp'))res.setHeader('Content-Type','image/webp');if(asset.endsWith('.png'))res.setHeader('Content-Type','image/png');return fs.createReadStream(asset).pipe(res);
  }res.statusCode=404;res.end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');let browser;
 try{
  const pkg=await import('/tmp/cryptoid-boss-native-qa/node_modules/@sparticuz/chromium/build/index.js');
  browser=await chromium.launch({executablePath:'/tmp/cryptoid-boss-native-runtime/chromium',headless:true,args:[...pkg.default.args,'--disable-gpu','--disable-accelerated-2d-canvas']});
  const page=await browser.newPage({viewport:{width:900,height:580},deviceScaleFactor:1.5}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const origin='http://127.0.0.1:'+server.address().port;
  await page.goto(origin);const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  let domComparisons=0,pixelComparisons=0;
  if(!lifetimeOnly)for(let id=1;id<=50;id++)for(const width of [320,430,820])for(const kind of ['hit','explosion','player-explosion','boss-explosion']){
   await page.evaluate(p=>window.setQa(...p),[kind,id,width,1]);await settle();
   await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));window.freezeQa(50);});await settle();
   const trees=await page.evaluate(()=>['before','after'].map(id=>document.getElementById(id).innerHTML));
   assert.equal(trees[1],trees[0],`visible DOM ${id}/${width}/${kind}`);domComparisons++;
   if([1,2,3,7,50].includes(id))for(const age of [50,kind==='hit'?250:kind==='boss-explosion'?2200:1600]){
    await page.evaluate(age=>window.freezeQa(age),age);await settle();
    const show=id=>page.evaluate(id=>document.querySelectorAll('section').forEach(s=>s.style.visibility=s.id===id?'visible':'hidden'),id);
    await show('before');const before=await page.locator('#before').screenshot({animations:'allow'});
    await show('after');const after=await page.locator('#after').screenshot({animations:'allow'});
    const hash=b=>createHash('sha256').update(b).digest('hex');assert.equal(hash(after),hash(before),`pixels ${id}/${width}/${kind}/${age}`);pixelComparisons++;
   }
  }
  // Fresh native clocks/events, no seeking: after-parent/after-last-child,
  // rapid replacements, pause/resume, delayed fragments and finished ownership.
  await page.reload();await page.evaluate(()=>window.setQa('hit',2,430,1));await settle();
  await page.evaluate(()=>window.pauseQa(true));await settle();
  await page.waitForTimeout(600);assert.equal((await page.evaluate(()=>window.readQa())).afterBursts,1,'paused hit must remain');
  await page.evaluate(()=>window.pauseQa(false));
  await page.waitForFunction(()=>window.readQa().afterBursts===0);assert.equal((await page.evaluate(()=>window.readQa())).afterHeat,2);
  let maxController=0;
  for(let serial=2;serial<=100;serial++){
   await page.evaluate(serial=>window.setQa('hit',2,430,serial),serial);await settle();
   const state=await page.evaluate(()=>window.readQa());maxController=Math.max(maxController,state.pacing.active);assert.ok(state.pacing.active<100);
  }
  await page.waitForFunction(()=>window.readQa().afterBursts===0);
  const hitIdle=await page.evaluate(()=>window.readQa());assert.equal(hitIdle.beforeBursts,1);assert.equal(hitIdle.afterHeat,2);assert.equal(hitIdle.pacing.active,0);
  const nativeLifetimes=[];
  for(const [kind,delay] of [['explosion',0],['player-explosion',0],['boss-explosion',0],['boss-explosion',500]]){
   await page.evaluate(p=>window.setQa(...p),[kind,2,430,++domComparisons,delay]);await settle();
   const checkedAtMs=(kind==='boss-explosion'?1650:1000)+delay;
   await page.waitForTimeout(checkedAtMs);
   assert.equal((await page.evaluate(()=>window.readQa())).afterImpacts,1,'finished fire/smoke must not remove still-visible fragments');
   await page.waitForFunction(()=>window.readQa().afterImpacts===0,{},{timeout:10000});
   const state=await page.evaluate(()=>window.readQa());assert.equal(state.beforeImpacts,1);nativeLifetimes.push({kind,delay,checkedVisibleAfterMs:checkedAtMs,afterImpacts:state.afterImpacts,beforeImpacts:state.beforeImpacts});
  }
  await page.evaluate(()=>window.guardQa());await settle();await page.waitForTimeout(600);
  assert.equal(await page.locator('#after .hull-mini-explosion').count(),1,'an unfinished infinite child prevents retirement');
  for(const mode of [1,2]){
   await page.evaluate(mode=>window.fallbackQa(mode),mode);await settle();await page.waitForTimeout(600);
   assert.equal((await page.evaluate(()=>window.readQa())).afterBursts,1,'unsupported inspection must preserve the original parent-owned lifetime');
  }
  await page.evaluate(()=>window.clearQa());await settle();await settle();
  const cleanup=await page.evaluate(()=>window.readQa());assert.equal(cleanup.nativeAnimations,0);assert.equal(cleanup.pacing.active,0);assert.deepEqual(errors,[]);
  await page.evaluate(()=>window.stopQa());
  const report={passed:true,baseline:base,browser:await browser.version(),softwareFlags:true,lifetimeOnly,domComparisons:domComparisons-nativeLifetimes.length,pixelComparisons,
   nativeHitReplacements:100,maxControllerEntries:maxController,hitIdle,nativeLifetimes,pausedHitPreserved:true,infiniteChildPreserved:true,unsupportedInspectionPreserved:true,cleanup,pageErrors:errors,
   limits:'Linux Chromium, actual effect declarations/HullDamage/production CSS; native event lifetime tests separate from paused phase snapshots. PaintedShip colour generation is unchanged; normal pixel effects use the atlas fallback while Canvas pixels cover painted hulls. No physical iPhone/WebKit GPU/memory/FPS or interruption-fix proof.'};
  fs.writeFileSync(path.join(root,'../docs/finished-hit-debris-cleanup-20261021/'+(lifetimeOnly?'native-lifetime-edges.json':'native.json')),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
