import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,unlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(new URL('../..',import.meta.url).pathname),require=createRequire(root+'/frontend/package.json');
const {createServer}=require('vite'),{webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const baseline=process.env.BASELINE==='1',output=root+'/verification/smartphone-work-20261027/results';
mkdirSync(output,{recursive:true});
const result={baseline,sourceBaseline:'f7197d61bca49b8b0fa5a10dcc3194efd0936c43',localOnly:true,physicalDevice:false,temperatureMeasured:false,checks:[],errors:[],measurements:{}};
const check=(label,value)=>{assert.ok(value,label);result.checks.push(label);};
let server,browser;
try{
 server=await createServer({root:root+'/frontend',cacheDir:output+(baseline?'/vite-before':'/vite-after'),logLevel:'error',
  server:{host:'127.0.0.1',port:0,hmr:false,fs:{allow:[root,root+'/frontend/node_modules']}},
  plugins:[{name:'published-work-control',enforce:'pre',transform(code,id){
   if(baseline&&['src/pages/gameLoop.ts','src/pages/projectilePresentation.ts','src/pages/HomeCombatPreview.tsx'].some(path=>id.split('?')[0]===root+'/frontend/'+path))
    code=execFileSync('git',['show','f7197d6:frontend/'+id.split('?')[0].slice((root+'/frontend/').length)],{cwd:root,encoding:'utf8'});
   if(id.split('?')[0]===root+'/frontend/src/pages/HomeCombatPreview.tsx') code=code.replace('const tick = (now: number) => {','const tick = (now: number) => { (window as any).__work.work.homeFrames++;');
   return code;
  }}]});
 const html=root+'/frontend/smartphone-work-local.html';
 writeFileSync(html,'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/@fs/'+root+'/verification/smartphone-work-20261027/preview.tsx"></script></body></html>');
 await server.listen();const origin='http://127.0.0.1:'+server.httpServer.address().port;
 const base=root+'/verification/native-browsers/webkit-2336/minibrowser-wpe',libs=root+'/verification/webkit-libs/usr/lib/x86_64-linux-gnu';
 browser=await webkit.launch({headless:true,executablePath:base+'/bin/MiniBrowser',env:{...process.env,WEBKIT_EXEC_PATH:base+'/bin',WEBKIT_INJECTED_BUNDLE_PATH:base+'/lib',WEBKIT_INSPECTOR_RESOURCES_PATH:base+'/share',LD_LIBRARY_PATH:`${base}/lib:${base}/sys/lib:${libs}`,GST_PLUGIN_SYSTEM_PATH_1_0:libs+'/gstreamer-1.0',GST_PLUGIN_SCANNER:libs+'/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner',GST_REGISTRY_1_0:output+'/registry.bin'}});
 result.engine=browser.version();
 const context=await browser.newContext({viewport:{width:393,height:744},reducedMotion:'reduce'});
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({status:200,body:''}));
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
 await page.clock.install();
 async function open(mode,reduced=true){await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await page.goto(origin+'/smartphone-work-local.html?mode='+mode);await page.waitForFunction(()=>!!window.__work);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));}
 await open('idle');
 let before=await page.evaluate(()=>window.__work.work.steps);await page.clock.runFor(2000);
 result.measurements.idleSteps=await page.evaluate(()=>window.__work.work.steps)-before;
 check(baseline?'published idle loop continues every game tick':'dormant loop requests no frames',baseline?result.measurements.idleSteps>=115:result.measurements.idleSteps===0);
 await page.evaluate(()=>window.__work.setActive(true));await page.clock.runFor(2000);
 const active=await page.evaluate(()=>window.__work.work.steps);result.measurements.activeSteps=active-before-result.measurements.idleSteps;
 check('explicit active state retains the existing sixty-Hz cadence',result.measurements.activeSteps>=115&&result.measurements.activeSteps<=121);
 await page.evaluate(()=>window.__work.setActive(false));before=await page.evaluate(()=>window.__work.work.steps);
 await page.clock.runFor(10_000);result.measurements.pausedSteps=await page.evaluate(()=>window.__work.work.steps)-before;
 check(baseline?'published paused loop keeps ticking':'pause remains dormant without automatic play',baseline?result.measurements.pausedSteps>=590:result.measurements.pausedSteps===0);
 check('long pause causes no technical fault',await page.evaluate(()=>window.__work.work.faults.length===0));
 await page.evaluate(()=>window.__work.setActive(true));await page.clock.runFor(20);
 check('manual Resume wakes without the monitoring-timer delay',await page.evaluate(()=>window.__work.work.steps)>before+result.measurements.pausedSteps);
 await page.evaluate(()=>window.__work.cleanup());
 result.projectiles=await page.evaluate(()=>window.__work.projectileCheck());
 check(baseline?'published angle preparation repeats despite locked heading':'angle preparation runs only at spawn and actual direction change',result.projectiles.angles===(baseline?600:2));
 await open('home',true);await page.waitForSelector('.home-cinematic-ship');
 const homeBefore=await page.evaluate(()=>window.__work.work.homeFrames);
 before=await page.evaluate(()=>window.__work.work.widthReads);await page.clock.runFor(2000);
 result.measurements.reducedHomeFrames=await page.evaluate(()=>window.__work.work.homeFrames)-homeBefore;
 check(baseline?'published reduced-motion preview redraws its static pose':'reduced-motion preview sleeps after its static pose',baseline?result.measurements.reducedHomeFrames>=115:result.measurements.reducedHomeFrames===0);
 result.measurements.reducedWidthReads=await page.evaluate(()=>window.__work.work.widthReads)-before;
 result.reducedHome=await page.locator('.home-cinematic-ship').evaluateAll(nodes=>nodes.map(n=>({transform:n.style.transform,opacity:n.style.opacity,bank:n.style.getPropertyValue('--flight-bank'),engine:n.style.getPropertyValue('--engine-strength')})));
 check('reduced motion retains three visible static ships',result.reducedHome.length===3&&result.reducedHome.every(n=>n.opacity==='1'));
 await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.runFor(100);
 const firstTime=await page.locator('.home-combat-preview').getAttribute('data-flight-time');
 before=await page.evaluate(()=>window.__work.work.widthReads);await page.clock.runFor(2000);
 result.measurements.activeHomeWidthReads=await page.evaluate(()=>window.__work.work.widthReads)-before;
 check('switching motion back on resumes the existing preview',await page.locator('.home-combat-preview').getAttribute('data-flight-time')!==firstTime);
 check(baseline?'published active preview repeatedly reads ship layout':'active preview uses resize measurements without frame-time layout reads',baseline?result.measurements.activeHomeWidthReads>0:result.measurements.activeHomeWidthReads===0);
 await page.setViewportSize({width:768,height:1024});await page.clock.runFor(100);
 check('resize retains all three original hulls',await page.locator('.home-cinematic-ship').count()===3);
 await page.getByRole('button',{name:'Pause preview'}).click();await page.clock.runFor(50);
 const pausedTime=await page.locator('.home-combat-preview').getAttribute('data-flight-time');await page.clock.runFor(1000);
 check('dialog pause keeps the preview clock frozen',await page.locator('.home-combat-preview').getAttribute('data-flight-time')===pausedTime);
 await page.getByRole('button',{name:'Pause preview'}).click();await page.clock.runFor(100);
 check('closing dialog continues at the same flight position',Number(await page.locator('.home-combat-preview').getAttribute('data-flight-time'))-Number(pausedTime)<.2);
 if(!baseline){
  const old=JSON.parse(readFileSync(output+'/baseline.json','utf8'));
  check('all sampled projectile DOM exactly matches the published renderer',JSON.stringify(result.projectiles.frames)===JSON.stringify(old.projectiles.frames));
  check('static reduced-motion ship poses exactly match the published preview',JSON.stringify(result.reducedHome)===JSON.stringify(old.reducedHome));
 }
 check('no JavaScript page errors',result.errors.length===0);result.complete=true;
}catch(error){result.failure={message:error.message,stack:error.stack};throw error;}
finally{
 try{unlinkSync(root+'/frontend/smartphone-work-local.html');}catch{}
 writeFileSync(output+(baseline?'/baseline.json':'/native.json'),JSON.stringify(result,null,2)+'\n');
 await browser?.close();await server?.close();console.log(JSON.stringify({complete:result.complete,checks:result.checks.length,measurements:result.measurements,failure:result.failure?.message}));
}
