import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {readFileSync,writeFileSync,mkdirSync,readdirSync,statSync,existsSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {root,configuration} from '../boss2-forensics-20261028/fixture.mjs';
import {serveDevicePreview} from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import {sampleBrowserMemory} from '../boss2-forensics-20261028/processMemory.mjs';
import {summarizeSmaps} from './smaps.mjs';
const req=createRequire(new URL('../boss2-forensics-20261028/package.json',import.meta.url)),pw=req('playwright');
assert.equal(req('playwright/package.json').version,'1.62.1');assert.ok(existsSync(pw.webkit.executablePath()));
const dir=root+'/verification/native-allocation-20261106',out=dir+'/results';mkdirSync(out,{recursive:true});
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const result={version:1,complete:false,kind:'native-allocation-before-gameplay',sourceCommit:git('rev-parse','HEAD'),sourceTree:git('rev-parse','HEAD^{tree}'),
 physicalDevice:false,whiteScreenFixed:false,heaptrackInstrumentation:true,heaptrackDoesNotMeasureAllMmapOrGpuMemory:true,
 gameClockEdited:false,activeGameplayTested:false,normalGameExitOrExportTested:false,cohorts:[]};
const save=()=>writeFileSync(out+'/result.json',JSON.stringify(result,null,2)+'\n');
const command=(args,timeout=60000)=>{const r=spawnSync(args[0],args.slice(1),{encoding:'utf8',timeout,maxBuffer:8*1024*1024});assert.equal(r.status,0,(r.error?.message??'')+r.stderr);return r.stdout+r.stderr;};
let server,browser,fatal;
async function tap(page,locator){await locator.waitFor({state:'visible',timeout:90000});assert.ok(await locator.isEnabled());await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();assert.ok(r);await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);}
function recordProcesses(cohort){
 const memory=sampleBrowserMemory();assert.ok(memory.contentProcessObserved&&Number.isFinite(memory.summedPssKiB));
 const content=memory.processes.filter(p=>p.role==='webkit-content');assert.ok(content.length);
 const records=content.map(p=>{
  const status=readFileSync('/proc/'+p.pid+'/status','utf8'),parent=Number(status.match(/^PPid:\s+(\d+)/m)?.[1]);assert.ok(parent>0);
  const meta=JSON.parse(readFileSync(out+'/'+cohort+'/wrapper-'+parent+'.json','utf8'));assert.equal(meta.cohort,cohort);
  const maps=readFileSync('/proc/'+p.pid+'/maps','utf8');assert.ok(maps.includes('libheaptrack_preload.so'),'The actual observed content process must load heaptrack');
  const smaps=readFileSync('/proc/'+p.pid+'/smaps','utf8');assert.ok(smaps.length<=8*1024*1024);
  return {pid:p.pid,parentPid:parent,wrapper:meta,heaptrackPreloadObserved:true,smaps:summarizeSmaps(smaps)};
 });
 return {at:new Date().toISOString(),memory,content:records};
}
async function finishProfiles(cohort,row){
 await browser.close();browser=null;await new Promise(r=>setTimeout(r,1000));
 const folder=out+'/'+cohort,files=readdirSync(folder).filter(n=>/\.gz$|\.zst$/.test(n)&&n.startsWith('native-'));
 assert.ok(files.length,'Web-content traces must exist');assert.ok(files.every(n=>statSync(folder+'/'+n).size>0));
 assert.ok(files.reduce((n,f)=>n+statSync(folder+'/'+f).size,0)<=128*1024*1024,'Bounded profiling output');
 row.profiles=[];
 for(const file of files){
  const path=folder+'/'+file;command(file.endsWith('.gz')?['gzip','-t',path]:['zstd','-t',path]);
  const report=command(['heaptrack_print',path,'--print-peaks=1','--print-allocators=0','--print-temporary=0','--peak-limit=20','--print-massif='+folder+'/'+file+'.massif'],120000);
  writeFileSync(path+'.txt',report);
  row.profiles.push({file,bytes:statSync(path).size,sha256:createHash('sha256').update(readFileSync(path)).digest('hex'),reportFile:file+'.txt',massifFile:file+'.massif'});
 }
 for(const p of row.snapshots.flatMap(x=>x.content))assert.ok(row.profiles.some(f=>f.file.startsWith(p.wrapper.outputPrefix+'.')),'Observed content PID must have a complete trace');
}
try{
 result.heaptrackVersion=command(['heaptrack','--version']).trim();result.heaptrackPrintVersion=command(['heaptrack_print','--version']).trim();
 command(['g++','-g','-O0','-fno-omit-frame-pointer','-rdynamic',dir+'/control.cpp','-o',out+'/control']);
 const ctrl=command(['heaptrack','--record-only','-o',out+'/control-heap','--',out+'/control']);
 writeFileSync(out+'/control-run.txt',ctrl);
 const file=readdirSync(out).find(n=>/^control-heap\.(gz|zst)$/.test(n));assert.ok(file);
 const text=command(['heaptrack_print',out+'/'+file,'--print-peaks=1','--print-allocators=0','--print-temporary=0','--peak-limit=10','--print-massif='+out+'/control.massif']);
 writeFileSync(out+'/control-profile.txt',text);assert.ok(text.includes('known_heap_owner'),'Known allocation call site must resolve');
 const knownPeaks=[...readFileSync(out+'/control.massif','utf8').matchAll(/^mem_heap_B=(\d+)$/gm)].map(m=>Number(m[1]));assert.ok(knownPeaks.length&&Math.max(...knownPeaks)>=4*1024*1024,'Known four-MiB allocation must be quantitatively observed');result.knownAllocationControlPassed=true;result.knownControlPeakBytes=Math.max(...knownPeaks);save();
 server=await serveDevicePreview();
 for(const cohort of ['control-page','prepared-menu','paused-scene']){
  fatal=null;mkdirSync(out+'/'+cohort,{recursive:true});const row={cohort,complete:false,snapshots:[]};result.cohorts.push(row);save();
  browser=await pw.webkit.launch({headless:true,env:{...process.env,WEB_PROCESS_CMD_PREFIX:'/usr/bin/python3 '+dir+'/prefix.py',CRYPTOID_ALLOCATION_COHORT:cohort,DEBUGINFOD_URLS:''}});
  const context=await browser.newContext({...configuration('iphone',pw.devices).context,viewport:{width:430,height:825},deviceScaleFactor:3});
  const external=[],assets=[];await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===server.origin||['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))return route.continue();external.push(u.hostname);return route.abort();});
  const page=await context.newPage();page.setDefaultTimeout(90000);page.on('crash',()=>fatal??='renderer-crash');page.on('pageerror',()=>fatal??='uncaught-js-error');
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
   if(cohort==='paused-scene'){
    await tap(page,page.getByRole('button',{name:'Boss-2-Test öffnen',exact:true}));
    await page.waitForFunction(()=>window.__crossDeviceTest?.inspect().status==='paused',null,{timeout:90000});
    const scene=await page.evaluate(()=>window.__crossDeviceTest.inspect());assert.equal(scene.status,'paused');assert.equal(scene.technicalPause,false);row.scene=scene;
   }else assert.equal(await page.locator('.game-shell').count(),0);
  }
  for(let i=0;i<3;i++){assert.ok(!fatal,fatal);row.snapshots.push(recordProcesses(cohort));save();await new Promise(r=>setTimeout(r,1000));}
  if(cohort==='paused-scene'){const s=await page.evaluate(()=>window.__crossDeviceTest.inspect());assert.equal(s.status,'paused');assert.equal(s.technicalPause,false);row.finalScene=s;}
  assert.deepEqual(external,[]);assert.deepEqual(assets,[]);assert.ok(!fatal,fatal);
  await finishProfiles(cohort,row);row.complete=true;save();
 }
 result.complete=true;
}catch(e){result.failure={message:e.message};process.exitCode=1;}
finally{if(browser)await browser.close().catch(()=>{});if(server)await server.close();result.finishedAt=new Date().toISOString();save();console.log('NATIVE_ALLOCATION_RESULT '+JSON.stringify({complete:result.complete,failure:result.failure,cohorts:result.cohorts.map(x=>({cohort:x.cohort,complete:x.complete,profiles:x.profiles}))}));}
