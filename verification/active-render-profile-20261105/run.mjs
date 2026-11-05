import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {root,configuration} from '../boss2-forensics-20261028/fixture.mjs';
import {serveDevicePreview} from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import {STOPWATCH_KEY} from '../boss2-stopwatch-20261029/stopwatchState.mjs';
import {capture,summarize,nodeIds,resolveLabels,limits,categories} from './trace.mjs';

const req=createRequire(new URL('../boss2-forensics-20261028/package.json',import.meta.url)),pw=req('playwright');
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const output=root+'/verification/active-render-profile-20261105/results';mkdirSync(output,{recursive:true});
const result={version:1,kind:'short-active-native-style-origin-profile',complete:false,
 sourceCommit:git('rev-parse','HEAD'),sourceTree:git('rev-parse','HEAD^{tree}'),
 baseDeviceCommit:'9f3bf451c01d6976ea1a50342cdec1470e2e080b',physicalDevice:false,physicalPiBrowser:false,
 limits,categories,profileHostWaitMs:6000,requestedGc:false,memoryDumps:0,heapSnapshots:false,
 gameSourceFilesEdited:false,activeApiWrappers:false,extraGameTimersOrFrames:false,
 gameOrAnimationClocksWritten:false,memoryBenefitMeasured:false,whiteScreenFixed:false};
let browser,server,page,fatal;const blocked=[],assetErrors=[];
const save=(name,x)=>writeFileSync(output+'/'+name,x);
async function tap(locator){await locator.waitFor({state:'visible',timeout:45000});assert.ok(await locator.isEnabled());await locator.scrollIntoViewIfNeeded();
 const b=await locator.boundingBox(),v=page.viewportSize();assert.ok(b&&v);const x=b.x+b.width/2,y=b.y+b.height/2;
 assert.ok(x>=0&&y>=0&&x<v.width&&y<v.height);await page.touchscreen.tap(x,y);}
const observe=()=>page.evaluate(key=>({timeOrigin:performance.timeOrigin,hidden:document.hidden,
 mounted:!!document.querySelector('.game-shell'),scene:window.__crossDeviceTest?.inspect()??null,
 clock:JSON.parse(localStorage.getItem(key)||'null')}),STOPWATCH_KEY);
const running=row=>{assert.ok(!fatal,fatal);assert.equal(row.hidden,false);assert.equal(row.mounted,true);
 assert.equal(row.scene.status,'playing');assert.equal(row.scene.technicalPause,false);assert.equal(row.scene.ownerDiagnostics,false);
 assert.equal(row.clock.latest.mode,'running');assert.equal(row.clock.latest.source,result.sourceCommit);assert.equal(row.clock.latest.unobservedGaps,0);};
try{
 browser=await pw.chromium.launch({headless:true});result.engineVersion=browser.version();result.playwrightVersion=req('playwright/package.json').version;
 const context=await browser.newContext({...configuration('android-phone',pw.devices).context,viewport:{width:430,height:825},deviceScaleFactor:3});
 // The synthetic control proves actual native events and DOM backend IDs before the game starts.
 const fixture=await context.newPage();await fixture.setContent('<style>#known-owner{--probe-color:rgb(1,2,3)}#known-owner span{color:var(--probe-color)}</style><div id="known-owner"><span>a</span><span>b</span><span>c</span></div>');
 const fs=await context.newCDPSession(fixture),ff=(await fs.send('Page.getFrameTree')).frameTree.frame.id;
 const calibration=await capture({session:await browser.newBrowserCDPSession(),save:x=>save('calibration-trace.json.gz',x),run:()=>fixture.evaluate(async()=>{
  const owner=document.getElementById('known-owner');for(let i=0;i<8;i++){
   await new Promise(requestAnimationFrame);owner.style.setProperty('--probe-color',`rgb(${i+10},20,30)`);
   getComputedStyle(owner.firstElementChild).color;}
  return{knownOwner:'known-owner',updates:8,syntheticOnly:true};})});
 result.calibration={...calibration.result,frameId:ff};
 assert.equal(calibration.result.complete,true,calibration.result.failure);
 const labels=await resolveLabels(fs,nodeIds(calibration.events,ff));
 result.calibration={...calibration.result,frameId:ff,nodeLabels:labels,summary:summarize(calibration.events,ff,labels.labels)};
 assert.ok(result.calibration.summary.invalidationEvents>0,'Real invalidation events required');
 assert.ok(result.calibration.summary.relatedEventGroups.some(g=>g.label?.includes('#known-owner')),'Known changed DOM owner must be identifiable');
 await fs.detach();await fixture.close();
 server=await serveDevicePreview();
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===server.origin||['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))return route.continue();blocked.push(u.hostname);return route.abort();});
 page=await context.newPage();page.setDefaultTimeout(25000);page.on('pageerror',()=>{fatal??='uncaught-javascript-error'});page.on('crash',()=>{fatal??='renderer-crash'});
 page.on('response',r=>{if(r.url().startsWith(server.origin+'/')&&r.status()>=400&&['script','stylesheet','image','font'].includes(r.request().resourceType()))assetErrors.push(r.status());});
 await page.goto(server.origin,{waitUntil:'domcontentloaded'});await page.bringToFront();
 const info=await(await context.request.get(server.origin+'/device-preview-info.json')).json();save('build-info.json',JSON.stringify(info,null,2));
 assert.equal(info.sourceCommit,result.sourceCommit);assert.equal(info.sourceTree,result.sourceTree);assert.equal(info.qaLocalBossStyle.condition,'leaves');
 assert.equal(info.playerMuzzleLocalCandidate.condition,'leaf');assert.equal(info.mobileHudBackdropCandidate.value,'none');
 assert.equal(info.criticalFailureJournal.originalClockRetained,true);assert.equal(info.guestOnly,true);
 for(const k of ['liveBackend','payments','automaticUpload','automaticResume'])assert.equal(info[k],false);
 result.compiledControllerSha256=info.playerMuzzleLocalCandidate.compiledVirtualControllerSha256;
 assert.equal(result.compiledControllerSha256,'00e3796f3eb0bbaec3f2ae16bb5ac46a2d88c8abc6647fee0e1a5b634249a18d');
 result.stopwatchSha256=createHash('sha256').update(readFileSync(root+'/verification/boss2-stopwatch-20261029/stopwatchState.mjs')).digest('hex');
 assert.equal(result.stopwatchSha256,'5e5845d5e5beef85ca5dadac597b8d751e81f931374b942b22fdedc7d83bbb5c');
 assert.equal(await page.getByRole('checkbox',{name:'Vollaufzeichnung zusätzlich aktivieren',exact:true}).isChecked(),false);
 assert.equal(await page.getByRole('checkbox',{name:'Testschutz: Tod und Bossende verhindern',exact:true}).isChecked(),true);
 await tap(page.getByRole('button',{name:'Testszene vorbereiten',exact:true}));await tap(page.getByRole('button',{name:'Boss-2-Test öffnen',exact:true}));
 await page.waitForFunction(()=>window.__crossDeviceTest?.inspect().status==='paused');await tap(page.locator('.pause-resume-button'));
 await page.waitForFunction(()=>{const s=window.__crossDeviceTest?.inspect();return s?.status==='playing'&&s.encounter==='boss-fight'&&s.reactorOpen&&s.coreVolley>0},null,{timeout:45000});
 const ps=await context.newCDPSession(page),frameId=(await ps.send('Page.getFrameTree')).frameTree.frame.id;
 result.before=await observe();running(result.before);
 const active=await capture({session:await browser.newBrowserCDPSession(),save:x=>save('active-trace.json.gz',x),run:async()=>{
  const at=Date.now();await new Promise(resolve=>setTimeout(resolve,result.profileHostWaitMs));return{hostWaitObservedMs:Date.now()-at,noInGamePollDuringTrace:true};}});
 result.active={...active.result,frameId};
 result.after=await observe();running(result.after);assert.equal(result.after.timeOrigin,result.before.timeOrigin);
 assert.equal(result.after.clock.latest.id,result.before.clock.latest.id);assert.ok(result.after.clock.latest.elapsedMs>result.before.clock.latest.elapsedMs);
 assert.ok(result.after.scene.frameAt>result.before.scene.frameAt);assert.ok(result.after.scene.coreVolley>result.before.scene.coreVolley);
 assert.equal(active.result.complete,true,active.result.failure);
 // Node labels are read only after native tracing ends and an actual manual pause is visible.
 await tap(page.locator('.home-control'));await page.locator('#leave-mission-title').waitFor();
 await page.waitForFunction(()=>window.__crossDeviceTest?.inspect().status==='paused');
 result.active.nodeLabels=await resolveLabels(ps,nodeIds(active.events,frameId));
 result.active.summary=summarize(active.events,frameId,result.active.nodeLabels.labels);
 assert.ok(result.active.summary.invalidationEvents>0);
 await ps.detach();await tap(page.getByRole('button',{name:'Spiel verlassen',exact:true}));
 await page.waitForFunction(key=>!document.querySelector('.game-shell')&&JSON.parse(localStorage.getItem(key)).latest.mode==='ended',STOPWATCH_KEY);
 result.normalExitVerified=true;result.final=await observe();assert.equal(result.final.timeOrigin,result.before.timeOrigin);
 assert.equal(result.final.clock.latest.id,result.before.clock.latest.id);assert.deepEqual(blocked,[]);assert.deepEqual(assetErrors,[]);assert.ok(!fatal,fatal);
 result.complete=true;
}catch(e){result.failure={code:fatal??'active-render-profile-failed',message:e.message};process.exitCode=1;
 if(page&&!page.isClosed())try{result.lastObservation=await observe()}catch{result.lastObservationUnavailable=true;}}
finally{result.finishedAt=new Date().toISOString();save('observation.json',JSON.stringify(result,null,2)+'\n');
 console.log('ACTIVE_RENDER_PROFILE '+JSON.stringify({complete:result.complete,failure:result.failure,calibration:result.calibration?.summary,
  active:result.active?.summary}));if(browser)await browser.close();if(server)await server.close();}
