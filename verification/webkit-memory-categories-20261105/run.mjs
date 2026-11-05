import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {root,configuration} from '../boss2-forensics-20261028/fixture.mjs';
import {serveDevicePreview} from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import {sampleBrowserMemory} from '../boss2-forensics-20261028/processMemory.mjs';
import {STOPWATCH_KEY} from '../boss2-stopwatch-20261029/stopwatchState.mjs';
const req=createRequire(new URL('../boss2-forensics-20261028/package.json',import.meta.url)),pw=req('playwright');
assert.equal(req('playwright/package.json').version,'1.62.1');assert.ok(existsSync(pw.webkit.executablePath()));
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const output=root+'/verification/webkit-memory-categories-20261105/results';mkdirSync(output,{recursive:true});
const result={version:1,kind:'webkit-native-memory-categories-and-layer-owners',complete:false,
 sourceCommit:git('rev-parse','HEAD'),sourceTree:git('rev-parse','HEAD^{tree}'),baseDeviceCommit:'9f3bf451c01d6976ea1a50342cdec1470e2e080b',
 physicalDevice:false,physicalPiBrowser:false,requestedGc:false,memoryDumpRequests:0,heapSnapshots:false,
 gameClocksWritten:false,gameTimersOrFramesAdded:false,extraPeriodicGameInspector:false,
 processPssIsNotPureGameOrGpuMemory:true,shortIdleWindowsDoNotProveGcCompletion:true,
 playwrightVersion:req('playwright/package.json').version,
 officialContainerIndex:'sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e',
 nativeMemoryTracking:true,protocolLayerQueriesAtStageBoundary:true,instrumentedPssNotUninstrumentedAcceptance:true,stages:[],whiteScreenFixed:false};
let browser,server,page,fatal,nativeSession;const nativeUpdates=[],pressure=[];const assets=[],external=[];const save=()=>writeFileSync(output+'/observation.json',JSON.stringify(result,null,2)+'\n');
const observe=()=>page.evaluate(key=>{let clock=null,clockStorage='read';try{clock=JSON.parse(localStorage.getItem(key)||'null')}catch{clockStorage='unavailable'}
 return{url:location.href,timeOrigin:performance.timeOrigin,hidden:document.hidden,mounted:!!document.querySelector('.game-shell'),
 scene:window.__crossDeviceTest?.inspect()??null,clock,clockStorage};},STOPWATCH_KEY);
async function tap(locator){await locator.waitFor({state:'visible',timeout:45000});assert.ok(await locator.isEnabled());await locator.scrollIntoViewIfNeeded();
 const r=await locator.boundingBox(),v=page.viewportSize();assert.ok(r&&v);const x=r.x+r.width/2,y=r.y+r.height/2;assert.ok(x>=0&&x<v.width&&y>=0&&y<v.height);await page.touchscreen.tap(x,y);}
async function capture(label,seconds){await trackNative();const begin=Date.now();const stage={label,seconds,startedAt:new Date().toISOString(),before:await observe(),points:[]};result.stages.push(stage);
 for(let i=0;i<seconds;i++){assert.ok(!fatal,fatal);const memory=sampleBrowserMemory();
  assert.equal(memory.contentProcessObserved,true,'Actual WebKit content process must be observed');assert.ok(Number.isFinite(memory.summedPssKiB));
  stage.points.push({hostAt:Date.now(),memory});await new Promise(resolve=>setTimeout(resolve,1000));}
 stage.after=await observe();stage.nativeUpdates=nativeUpdates.filter(x=>x.hostAt>=begin);assert.ok(stage.nativeUpdates.length,'Native Memory tracking must yield samples');
 for(const u of stage.nativeUpdates){assert.ok(Array.isArray(u.event?.categories));for(const c of u.event.categories){assert.ok(Number.isFinite(c.size)&&c.size>=0);}}
 stage.layerOwners=await layerOwners();const values=stage.points.map(x=>x.memory.summedPssKiB/1024);
 stage.pssMiB={samples:values.length,min:Math.min(...values),max:Math.max(...values),mean:values.reduce((a,b)=>a+b,0)/values.length};
 stage.finishedAt=new Date().toISOString();save();console.log('WEBKIT_MEMORY_STAGE '+JSON.stringify({label,pssMiB:stage.pssMiB,mounted:stage.after.mounted,status:stage.after.scene?.status??null}));return stage;}
async function trackNative(){
 const connection=page._connection;assert.equal(typeof connection.toImpl,'function','Pinned in-process Playwright implementation bridge must exist');
 const current=connection.toImpl(page)._delegate._session;assert.ok(current?.send);if(current===nativeSession)return;
 nativeSession=current;current.on('Memory.trackingUpdate',payload=>nativeUpdates.push({hostAt:Date.now(),...payload}));
 current.on('Memory.memoryPressure',payload=>pressure.push({hostAt:Date.now(),...payload}));
 await current.send('Memory.enable');await current.send('Memory.startTracking');
}
async function layerOwners(){
 const session=page._connection.toImpl(page)._delegate._session;await session.send('LayerTree.enable');
 const nodes=new Map();const visit=n=>{if(!n||typeof n!=='object')return;if(n.nodeId){const a=n.attributes??[];const attrs={};
  for(let i=0;i<a.length;i+=2)if(['class','id'].includes(a[i]))attrs[a[i]]=a[i+1];nodes.set(n.nodeId,{nodeId:n.nodeId,nodeName:n.nodeName,...attrs});}
  for(const c of n.children??[])visit(c);for(const c of n.pseudoElements??[])visit(c);};
 const listen=e=>{for(const n of e.nodes??[])visit(n)};session.on('DOM.setChildNodes',listen);
 try{const {root}=await session.send('DOM.getDocument');visit(root);await session.send('DOM.requestChildNodes',{nodeId:root.nodeId,depth:-1});
  const {layers}=await session.send('LayerTree.layersForNode',{nodeId:root.nodeId});
  return {layers:await Promise.all(layers.map(async l=>({...l,node:nodes.get(l.nodeId)??{nodeId:l.nodeId,unmapped:true},
    ...(await session.send('LayerTree.reasonsForCompositingLayer',{layerId:l.layerId}).then(x=>({reasons:x.compositingReasons}),e=>({reasonsUnavailable:e.message})))}))),nodeCount:nodes.size};
 }finally{session.removeListener('DOM.setChildNodes',listen);}
}
const running=s=>{assert.equal(s.hidden,false);assert.equal(s.mounted,true);assert.equal(s.scene.status,'playing');assert.equal(s.scene.technicalPause,false);
 assert.equal(s.scene.ownerDiagnostics,false);assert.equal(s.clock.latest.mode,'running');assert.equal(s.clock.latest.source,result.sourceCommit);assert.equal(s.clock.latest.unobservedGaps,0);};
try{
 browser=await pw.webkit.launch({headless:true});result.engineVersion=browser.version();server=await serveDevicePreview();
 const context=await browser.newContext({...configuration('iphone',pw.devices).context,viewport:{width:430,height:825},deviceScaleFactor:3});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===server.origin||['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))return route.continue();external.push(u.hostname);return route.abort();});
 page=await context.newPage();page.setDefaultTimeout(30000);page.on('crash',()=>{fatal??='renderer-crash'});page.on('pageerror',()=>{fatal??='uncaught-javascript-error'});
 page.on('response',r=>{if(r.url().startsWith(server.origin+'/')&&r.status()>=400&&['image','script','stylesheet','font'].includes(r.request().resourceType()))assets.push({type:r.request().resourceType(),status:r.status()});});
 await page.goto('about:blank');await page.bringToFront();const blank=await capture('fresh-blank-document',5);assert.equal(blank.after.url,'about:blank');assert.equal(blank.after.mounted,false);
 await page.goto(server.origin,{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Testszene vorbereiten',exact:true}).waitFor();
 const info=await(await context.request.get(server.origin+'/device-preview-info.json')).json();writeFileSync(output+'/build-info.json',JSON.stringify(info,null,2)+'\n');
 assert.equal(info.sourceCommit,result.sourceCommit);assert.equal(info.sourceTree,result.sourceTree);assert.equal(info.guestOnly,true);
 for(const key of ['liveBackend','payments','actualPiAuthentication','automaticUpload','automaticResume'])assert.equal(info[key],false);
 assert.equal(info.qaLocalBossStyle.condition,'leaves');assert.equal(info.playerMuzzleLocalCandidate.condition,'leaf');
 assert.equal(info.playerMuzzleLocalCandidate.compiledVirtualControllerSha256,'00e3796f3eb0bbaec3f2ae16bb5ac46a2d88c8abc6647fee0e1a5b634249a18d');
 result.compiledControllerSha256=info.playerMuzzleLocalCandidate.compiledVirtualControllerSha256;
 const menu=await capture('menu-before-preparation',5);assert.equal(menu.after.mounted,false);const origin=menu.after.timeOrigin;
 assert.equal(await page.getByRole('checkbox',{name:'Vollaufzeichnung zusätzlich aktivieren',exact:true}).isChecked(),false);
 assert.equal(await page.getByRole('checkbox',{name:'Testschutz: Tod und Bossende verhindern',exact:true}).isChecked(),true);
 await tap(page.getByRole('button',{name:'Testszene vorbereiten',exact:true}));await page.getByRole('button',{name:'Boss-2-Test öffnen',exact:true}).waitFor({timeout:60000});
 const prepared=await capture('menu-after-asset-preparation',5);assert.equal(prepared.after.mounted,false);
 await tap(page.getByRole('button',{name:'Boss-2-Test öffnen',exact:true}));await page.waitForFunction(()=>window.__crossDeviceTest?.inspect().status==='paused');
 const paused=await capture('mounted-boss-paused-before-start',5);assert.equal(paused.after.scene.status,'paused');assert.equal(paused.after.scene.technicalPause,false);
 await tap(page.locator('.pause-resume-button'));await page.waitForFunction(()=>{const s=window.__crossDeviceTest?.inspect();return s?.status==='playing'&&s.encounter==='boss-fight'&&s.reactorOpen&&s.coreVolley>0},null,{timeout:45000});
 const active=await capture('playing-original-boss',15);running(active.before);running(active.after);assert.equal(active.before.timeOrigin,origin);assert.equal(active.after.timeOrigin,origin);
 assert.equal(active.after.clock.latest.id,active.before.clock.latest.id);assert.ok(active.after.clock.latest.elapsedMs>active.before.clock.latest.elapsedMs);
 assert.ok(active.after.scene.frameAt>active.before.scene.frameAt);assert.ok(active.after.scene.coreVolley>active.before.scene.coreVolley);
 await tap(page.locator('.home-control'));await page.locator('#leave-mission-title').waitFor();await tap(page.getByRole('button',{name:'Spiel verlassen',exact:true}));
 await page.waitForFunction(key=>!document.querySelector('.game-shell')&&JSON.parse(localStorage.getItem(key)).latest.mode==='ended',STOPWATCH_KEY);result.normalExitVerified=true;
 const held=await capture('home-with-existing-qa-bridge',5);assert.equal(held.after.mounted,false);assert.equal(held.after.clock.latest.mode,'ended');
 await page.evaluate(()=>{delete window.__crossDeviceTest});result.existingTestOnlyBridgeReleased=true;
 const home=await capture('home-after-qa-bridge-release',15);assert.equal(home.after.mounted,false);assert.equal(home.after.scene,null);assert.equal(home.after.timeOrigin,origin);
 await tap(page.getByRole('button',{name:'Letzten Testbericht vorbereiten',exact:true}));await tap(page.getByRole('button',{name:'Berichtstext in Teilen anzeigen',exact:true}));
 const part=JSON.parse(await page.getByRole('textbox',{name:'Diagnosebericht',exact:true}).inputValue());assert.equal(part.total,1);const report=JSON.parse(part.data);
 assert.equal(report.stopwatch.latest.mode,'ended');assert.equal(report.briefMatchesLatestStopwatch,true);assert.equal(report.criticalMatchesLatestStopwatch,true);
 const c=report.criticalDiagnostics.latest.clock,s=report.stopwatch.latest;for(const k of ['id','source','mode','elapsedMs'])assert.equal(c[k],s[k]);
 assert.equal(report.criticalDiagnostics.latest.events.error,undefined);assert.equal(report.criticalDiagnostics.latest.events.unhandledrejection,undefined);
 assert.equal(report.briefDiagnostics.latest.resourceCheckpoint.clockId,s.id);result.normalReportVerified=true;
 writeFileSync(output+'/synthetic-report.json',JSON.stringify(report,null,2)+'\n');
 await page.goto('about:blank');const destroyed=await capture('blank-after-navigation',10);assert.equal(destroyed.after.url,'about:blank');assert.equal(destroyed.after.mounted,false);
 assert.notEqual(destroyed.after.timeOrigin,origin);
 await context.close();assert.equal(page.isClosed(),true);nativeSession=null;
 const freshContext=await browser.newContext({...configuration('iphone',pw.devices).context,viewport:{width:430,height:825},deviceScaleFactor:3});
 page=await freshContext.newPage();await page.goto('about:blank');await page.bringToFront();
 const closed=await capture('fresh-context-after-old-context-close',10);assert.equal(closed.after.url,'about:blank');result.oldContextClosed=true;
 assert.deepEqual(assets,[]);assert.deepEqual(external,[]);assert.ok(!fatal,fatal);
 const metrics=Object.fromEntries(result.stages.map(x=>[x.label,x.pssMiB]));result.summary={metrics,
  playingMinusFreshBlankMeanMiB:active.pssMiB.mean-blank.pssMiB.mean,
  preparedMenuMinusColdMenuMeanMiB:prepared.pssMiB.mean-menu.pssMiB.mean,
  pausedSceneMinusPreparedMenuMeanMiB:paused.pssMiB.mean-prepared.pssMiB.mean,
  homeReleasedMinusFreshBlankMeanMiB:home.pssMiB.mean-blank.pssMiB.mean,
  navigatedBlankMinusFreshBlankMeanMiB:destroyed.pssMiB.mean-blank.pssMiB.mean,
  closedContextMinusFreshBlankMeanMiB:closed.pssMiB.mean-blank.pssMiB.mean,navigationIsNotClaimedDocumentDestruction:true,
  differencesAreStageObservationsNotAllocatorOwnership:true,processIdsAndRolesPreserved:true,
  processChangesAreNotMisrepresentedAsInProcessGc:true};result.nativePressureEvents=pressure;result.complete=true;
}catch(e){result.failure={code:fatal??'webkit-lifecycle-failed',message:e.message};process.exitCode=1;}
finally{result.finishedAt=new Date().toISOString();save();console.log('WEBKIT_NATIVE_CATEGORIES '+JSON.stringify({complete:result.complete,failure:result.failure,summary:result.summary}));
 if(browser)await browser.close();if(server)await server.close();}
