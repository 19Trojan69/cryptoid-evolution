import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,readlinkSync,realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';import {dirname,basename} from 'node:path';import {createHash} from 'node:crypto';
import {root,configuration} from '../boss2-forensics-20261028/fixture.mjs';
import {serveDevicePreview} from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import {sampleBrowserMemory} from '../boss2-forensics-20261028/processMemory.mjs';
import {summarizeSmaps} from './smaps.mjs';
const req=createRequire(new URL('../boss2-forensics-20261028/package.json',import.meta.url)),pw=req('playwright');
assert.equal(req('playwright/package.json').version,'1.62.1');
const out=root+'/verification/native-allocation-20261106/results';mkdirSync(out,{recursive:true});
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const expected='cae96ae2b8f2668d9afab2bce22ac23d9a54f25e846909ddbc86fbcebfb2e925';
const result={version:2,kind:'passive-original-webkit-kernel-memory',complete:false,sourceCommit:git('rev-parse','HEAD'),sourceTree:git('rev-parse','HEAD^{tree}'),
 physicalDevice:false,whiteScreenFixed:false,heaptrackInstrumentation:false,workerFileModified:false,gameClockEdited:false,activeGameplayTested:false,
 normalGameExitOrExportTested:false,originalWorkerElfSha256:expected,cohorts:[]};
let server,browser,fatal;const save=()=>writeFileSync(out+'/result.json',JSON.stringify(result,null,2)+'\n');
async function tap(page,locator){await locator.waitFor({state:'visible',timeout:60000});assert.ok(await locator.isEnabled());await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();assert.ok(r);await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);}
function snapshot(){
 const before=Date.now(),raw=sampleBrowserMemory(),excluded=[];
 const processes=raw.processes.filter(p=>{if(p.role!=='webkit-content')return true;const exe=readlinkSync('/proc/'+p.pid+'/exe');if(basename(exe)==='WPEWebProcess')return true;excluded.push({pid:p.pid,actualExecutable:basename(exe)});return false;});
 const content=processes.filter(p=>p.role==='webkit-content');assert.ok(content.length,'Actual original WPE ELF required');
 const rows=content.map(p=>{
  const exe=readlinkSync('/proc/'+p.pid+'/exe');assert.equal(createHash('sha256').update(readFileSync(exe)).digest('hex'),expected);
  assert.equal(readFileSync('/proc/'+p.pid+'/maps','utf8').includes('libheaptrack_preload.so'),false,'No profiler may be injected into this passive observation');
  const smaps=readFileSync('/proc/'+p.pid+'/smaps','utf8');assert.ok(smaps.length<=8*1024*1024);
  return {pid:p.pid,originalElfVerified:true,profilerAbsent:true,rollupPssKiB:p.pssKiB,smaps:summarizeSmaps(smaps)};
 });
 const pss=processes.map(p=>p.pssKiB);assert.ok(pss.every(Number.isFinite));
 return {readStartedAt:before,readFinishedAt:Date.now(),rawClassifiedPssKiB:raw.summedPssKiB,excludedWrappers:excluded,
  processPssKiB:pss.reduce((a,b)=>a+b,0),processes,content:rows,
  limits:'Kernel mapping read and previous process rollup are not simultaneous; no allocation call-site ownership or physical phone memory is inferred.'};
}
try{
 const base=realpathSync(dirname(pw.webkit.executablePath()));
 const paths=execFileSync('find',[base,'-type','f','-name','WPEWebProcess'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);assert.equal(paths.length,1);
 assert.equal(createHash('sha256').update(readFileSync(paths[0])).digest('hex'),expected);
 server=await serveDevicePreview();
 for(const cohort of ['control-page','prepared-menu','paused-scene']){
  fatal=null;mkdirSync(out+'/'+cohort,{recursive:true});const row={cohort,complete:false,snapshots:[]};result.cohorts.push(row);save();
  browser=await pw.webkit.launch({headless:true,env:{...process.env,WEB_PROCESS_CMD_PREFIX:'',LD_PRELOAD:''}});result.engineVersion=browser.version();assert.equal(browser.version(),'26.5');
  const context=await browser.newContext({...configuration('iphone',pw.devices).context,viewport:{width:430,height:825},deviceScaleFactor:3});
  const external=[],assets=[];await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===server.origin||['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))return route.continue();external.push(u.hostname);return route.abort();});
  const page=await context.newPage();page.setDefaultTimeout(60000);page.on('crash',()=>fatal??='renderer-crash');page.on('pageerror',()=>fatal??='uncaught-js-error');
  page.on('response',r=>{if(r.url().startsWith(server.origin+'/')&&r.status()>=400&&['image','script','stylesheet','font'].includes(r.request().resourceType()))assets.push(r.status());});
  if(cohort==='control-page'){await page.goto('about:blank');await page.setContent('<!doctype html><meta name="viewport" content="width=device-width"><title>Native control</title><p>Constant control</p>');}
  else{
   await page.goto(server.origin,{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Testszene vorbereiten',exact:true}).waitFor();
   const info=await(await context.request.get(server.origin+'/device-preview-info.json')).json();
   assert.equal(info.sourceCommit,result.sourceCommit);assert.equal(info.sourceTree,result.sourceTree);assert.equal(info.guestOnly,true);
   for(const key of ['liveBackend','payments','actualPiAuthentication','automaticUpload','automaticResume'])assert.equal(info[key],false);
   assert.equal(info.playerMuzzleLocalCandidate.compiledVirtualControllerSha256,'00e3796f3eb0bbaec3f2ae16bb5ac46a2d88c8abc6647fee0e1a5b634249a18d');
   writeFileSync(out+'/'+cohort+'/build-info.json',JSON.stringify(info,null,2)+'\n');
   await tap(page,page.getByRole('button',{name:'Testszene vorbereiten',exact:true}));await page.getByRole('button',{name:'Boss-2-Test öffnen',exact:true}).waitFor();
   if(cohort==='paused-scene'){await tap(page,page.getByRole('button',{name:'Boss-2-Test öffnen',exact:true}));await page.waitForFunction(()=>window.__crossDeviceTest?.inspect().status==='paused');row.scene=await page.evaluate(()=>window.__crossDeviceTest.inspect());assert.equal(row.scene.technicalPause,false);}
   else assert.equal(await page.locator('.game-shell').count(),0);
  }
  for(let i=0;i<3;i++){assert.ok(!fatal,fatal);row.snapshots.push(snapshot());save();await new Promise(r=>setTimeout(r,1000));}
  if(cohort==='paused-scene'){row.finalScene=await page.evaluate(()=>window.__crossDeviceTest.inspect());assert.equal(row.finalScene.status,'paused');assert.equal(row.finalScene.technicalPause,false);}
  assert.deepEqual(external,[]);assert.deepEqual(assets,[]);assert.ok(!fatal,fatal);
  await browser.close();browser=null;row.complete=true;save();
 }
 result.complete=true;
}catch(e){result.failure={message:e.message};process.exitCode=1;}
finally{if(browser)await browser.close().catch(()=>{});if(server)await server.close();result.finishedAt=new Date().toISOString();save();console.log('PASSIVE_NATIVE_RESULT '+JSON.stringify({complete:result.complete,failure:result.failure,cohorts:result.cohorts.map(x=>({cohort:x.cohort,complete:x.complete}))}));}
