import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(new URL('../..',import.meta.url).pathname),require=createRequire(root+'/frontend/package.json');
const {createServer}=require('vite'),{webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const output=root+'/verification/ship-overlay-alignment/results';mkdirSync(output,{recursive:true});
const before=process.env.BASELINE==='1',result={localOnly:true,physicalDevice:false,baseline:before,checks:[],errors:[]};let server,browser;
const check=(label,value)=>{assert.ok(value,label);result.checks.push(label);};
try{
 server=await createServer({root:root+'/frontend',logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false,fs:{allow:[root,root+'/frontend/node_modules']}},plugins:[{name:'pinned-overlay-control',enforce:'pre',transform(code,id){if(!before)return;const path=id.split('?')[0];if(['src/pages/GameShipVisual.tsx','src/pages/BossHullView.tsx','src/pages/shipFleet.ts','src/index.css'].some(f=>path===root+'/frontend/'+f))return execFileSync('git',['show','4ec0683:frontend/'+path.slice((root+'/frontend/').length)],{cwd:root,encoding:'utf8'});}}]});
 writeFileSync(root+'/frontend/ship-overlay-local.html','<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/@fs/'+root+'/verification/ship-overlay-alignment/preview.tsx"></script></body></html>');
 server.middlewares.use((req,res,next)=>{if(!/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(req.url||''))return next();res.setHeader('Content-Type','font/ttf');res.end(readFileSync(root+'/verification/white-screen-fonts/'+req.url.split('/').at(-1)));});
 await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
 const base=root+'/verification/native-browsers/webkit-2336/minibrowser-wpe',libs=root+'/verification/webkit-libs/usr/lib/x86_64-linux-gnu';
 browser=await webkit.launch({headless:true,executablePath:base+'/bin/MiniBrowser',env:{...process.env,WEBKIT_EXEC_PATH:base+'/bin',WEBKIT_INJECTED_BUNDLE_PATH:base+'/lib',WEBKIT_INSPECTOR_RESOURCES_PATH:base+'/share',LD_LIBRARY_PATH:`${base}/lib:${base}/sys/lib:${libs}`,GST_PLUGIN_SYSTEM_PATH_1_0:libs+'/gstreamer-1.0',GST_PLUGIN_SCANNER:libs+'/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner',GST_REGISTRY_1_0:output+'/registry.bin'}});
 result.engine=browser.version();const context=await browser.newContext({viewport:{width:1040,height:1460},reducedMotion:'reduce'});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='fonts.googleapis.com')return route.fulfill({contentType:'text/css',body:readFileSync(root+'/verification/white-screen-fonts/fonts.css','utf8').replaceAll('/font-mirror/',origin+'/font-mirror/')});if(u.origin===origin)return route.continue();return route.fulfill({status:200,body:''});});
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));result.frames=[];
 for(const scenario of (before?[{stage:1,kind:'enemy'}]:[{stage:1,kind:'enemy'},{stage:1,kind:'player'},{stage:2,kind:'player'},{stage:3,kind:'player'}])){
  await page.goto(origin+`/ship-overlay-local.html?stage=${scenario.stage}&kind=${scenario.kind}`);
  await page.waitForFunction(()=>document.querySelectorAll('.qa-cell[data-sprite] .material-hull[data-hull-ready="true"]').length===20);await page.evaluate(()=>document.fonts.ready);
  const frames=await page.locator('.qa-cell[data-sprite]').evaluateAll(cells=>cells.map(cell=>{
   const actor=cell.querySelector('.asteroid,.player-ship'),box=actor.getBoundingClientRect(),bar=actor.querySelector('.health-bar'),nozzles=[...actor.querySelectorAll('.exhaust,.player-engine')];
   return {sprite:Number(cell.getAttribute('data-sprite')),width:box.width,height:box.height,bar:bar?{width:bar.getBoundingClientRect().width,height:bar.getBoundingClientRect().height,left:bar.getBoundingClientRect().left-box.left,top:bar.getBoundingClientRect().top-box.top}:null,nozzles:nozzles.map(n=>{const s=getComputedStyle(n);return{x:n.style.getPropertyValue('--nozzle-x'),y:n.style.getPropertyValue('--nozzle-y'),background:s.backgroundImage,clip:s.clipPath,filter:s.filter};})};
  }));
  check(`${scenario.kind} stage ${scenario.stage}: all twenty original hulls ready`,frames.length===20);
  if(!before)check(`${scenario.kind} stage ${scenario.stage}: same plume appearance across all models`,new Set(frames.flatMap(f=>f.nozzles.map(n=>[n.background,n.clip,n.filter].join('|')))).size===1);
  result.frames.push({...scenario,frames});
  if(scenario.kind==='enemy')result.bossBars=await page.locator('.qa-cell:not([data-sprite])').evaluateAll(cells=>cells.map(cell=>[...cell.querySelectorAll('[role=progressbar]')].map(bar=>{const actor=bar.closest('.sector-boss'),r=bar.getBoundingClientRect(),p=actor.getBoundingClientRect(),s=getComputedStyle(bar);return {role:bar.getAttribute('aria-label'),width:r.width,height:r.height,x:r.left-p.left,y:r.top-p.top,border:s.borderWidth};})));
  await page.screenshot({path:output+`/${before?'before':'after'}-${scenario.kind}-${scenario.stage}.png`,fullPage:true});
 }
 if(!before){
  const prior=JSON.parse(readFileSync(output+'/gallery-before.json','utf8'));
  const old=prior.frames.find(f=>f.kind==='enemy').frames,now=result.frames.find(f=>f.kind==='enemy').frames;
  for(let i=0;i<20;i++){
   check(`enemy ${i}: half the released bar width`,Math.abs(now[i].bar.width-old[i].bar.width*.5)<.02);
   check(`enemy ${i}: half the released bar height`,Math.abs(now[i].bar.height-old[i].bar.height*.5)<.02);
   check(`enemy ${i}: bar is closer to its visible hull`,now[i].bar.top>old[i].bar.top);
  }
  check('boss turret and hull indicators retain exact native geometry',JSON.stringify(result.bossBars)===JSON.stringify(prior.bossBars));
 }
 check('no page errors',result.errors.length===0);result.complete=true;
}finally{try{unlinkSync(root+'/frontend/ship-overlay-local.html');}catch{}writeFileSync(output+`/${before?'gallery-before':'gallery'}.json`,JSON.stringify(result,null,2)+'\n');await browser?.close();await server?.close();console.log(JSON.stringify({complete:result.complete,checks:result.checks.length,errors:result.errors}));}
