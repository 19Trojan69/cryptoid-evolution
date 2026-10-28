import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync,writeFileSync,readFileSync,appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root,configuration } from './fixture.mjs';
import { serveDevicePreview } from './devicePreviewServer.mjs';
import { sampleBrowserMemory } from './processMemory.mjs';
const pw=createRequire(import.meta.url)('playwright');
const engine=process.env.CRYPTOID_DEVICE_ENGINE||'chromium',seconds=Number(process.env.CRYPTOID_DEVICE_SECONDS||8);
assert.ok(['chromium','webkit'].includes(engine));assert.ok(Number.isInteger(seconds)&&seconds>=5&&seconds<=900);
const output=resolve(root,'verification/boss2-forensics-20261028/results/device-'+engine+'-'+seconds);mkdirSync(output,{recursive:true});
const summary={complete:false,engine,seconds,physicalPiBrowser:false,osScreenshot:false,snapshots:false,explicitGc:false,
  actualHostOS:process.platform,playwrightConnectionPresent:true,processMemoryIsNotNativeDeviceMemory:true,whiteScreenFixed:false,points:[]};
let server,browser,page,fatal;
try{
 server=await serveDevicePreview();browser=await pw[engine].launch({headless:true});summary.engineVersion=browser.version();
 const context=await browser.newContext({...configuration(engine==='webkit'?'iphone':'android-phone',pw.devices).context,acceptDownloads:true});
 const external=[];
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin===server.origin||['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname))return route.continue();
  external.push(url.hostname);return route.abort();
 });
 page=await context.newPage();page.setDefaultTimeout(10000);
 page.on('pageerror',()=>{fatal||='javascript-error';});page.on('crash',()=>{fatal||='renderer-crash';});
 await page.goto(server.origin,{waitUntil:'domcontentloaded'});await page.bringToFront();
 await page.getByRole('button',{name:'Testszene vorbereiten',exact:true}).waitFor();
 await page.screenshot({path:output+'/menu.png'});
 await page.getByRole('button',{name:'Testszene vorbereiten',exact:true}).click();
 await page.getByRole('button',{name:'Boss-2-Test starten',exact:true}).waitFor({timeout:45000});
 await page.getByRole('button',{name:'Boss-2-Test starten',exact:true}).click();
 await page.waitForFunction(()=>window.__crossDeviceTest?.inspect().status==='playing'&&window.__crossDeviceTest.inspect().encounter==='boss-fight',{},{timeout:40000});
 const first=await page.evaluate(()=>window.__crossDeviceTest.inspect());assert.equal(first.sector,20);assert.equal(first.reactorOpen,true);assert.equal(first.ownerDiagnostics,true);
 const started=Date.now();let last,frameAt,frameChanged=Date.now(),progress=0;
 while(Date.now()-started<seconds*1000){
  assert.ok(!fatal,fatal);last=await page.evaluate(()=>window.__crossDeviceTest.inspect());
  assert.equal(last.status,'playing');assert.equal(last.technicalPause,false);assert.equal(last.sector,20);assert.equal(last.reactorOpen,true);
  if(last.frameAt!==frameAt)frameChanged=Date.now();assert.ok(Date.now()-frameChanged<5000,'Frame callbacks advance');frameAt=last.frameAt;
  const memory=sampleBrowserMemory();assert.ok(memory.contentProcessObserved&&memory.summedPssKiB!==null);
  const row={elapsedSeconds:(Date.now()-started)/1000,status:last.status,frameAt:last.frameAt,coreVolley:last.coreVolley,
   shots:last.shots,hostileShots:last.hostileShots,effects:last.effects,canvas:last.canvas,audio:last.audio,
   processMemory:{summedPssKiB:memory.summedPssKiB,summedRssKiB:memory.summedRssKiB,contentProcessObserved:memory.contentProcessObserved}};
  summary.points.push(row);appendFileSync(output+'/process-counters.jsonl',JSON.stringify(row)+'\n');
  if(Date.now()-progress>=60000){progress=Date.now();console.log('CRYPTOID_DEVICE_PROGRESS '+JSON.stringify({engine,seconds:Math.round((Date.now()-started)/1000)}));}
  await page.waitForTimeout(1000);
 }
 assert.ok(last.coreVolley>first.coreVolley,'Native reactor volleys progress');summary.observedActiveSeconds=(Date.now()-started)/1000;
 await page.getByRole('button',{name:/^(Pause|Pausieren)$/}).click();
 await page.waitForFunction(()=>window.__crossDeviceTest.inspect().status==='paused');
 const pause=await page.evaluate(()=>window.__bossLabPauseEvents.at(-1));assert.equal(pause.pauseReason,'manual-pause');summary.pause=pause;
 await page.waitForFunction(()=>{try{const value=JSON.parse(localStorage.getItem('cryptoid_owner_full_status_v1')||'null');return value?.lastObserved?.kind==='pause'&&value.lastCommittedSeq>=value.lastObservedSeq;}catch{return false;}},null,{timeout:10000});
 await page.screenshot({path:output+'/paused.png'});
 // Deliberately reload while paused to verify local report recovery, not a simulated native kill.
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Testszene vorbereiten',exact:true}).waitFor();
 assert.equal(new URL(page.url()).pathname,'/');assert.equal(await page.locator('.game-shell').count(),0);
 await page.getByRole('button',{name:/^Bericht vorbereiten ·/}).first().click({timeout:10000});
 await page.getByRole('button',{name:'Bericht speichern',exact:true}).waitFor();
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Bericht speichern',exact:true}).click();
 const download=await pending,report=JSON.parse(readFileSync(await download.path(),'utf8'));
 assert.equal(report.isolatedGuest,true);assert.equal(report.automaticTransmission,false);assert.equal(report.fullSession.integrity.contiguous,true);
 assert.ok(report.fullSession.records.some(row=>row.kind==='pause'&&row.data.pauseReason==='manual-pause'));
 assert.equal(report.testOptions.scene,'reactor');assert.equal(report.testOptionsMatchedByStartTime,true);
 summary.report={downloaded:true,bytes:JSON.stringify(report).length,records:report.fullSession.integrity.records,contiguous:true,optionsMatched:true,recoveredAfterControlledReload:true};
 await page.getByRole('button',{name:'Begrenzten lokalen Bericht vorbereiten',exact:true}).click();
 await page.getByRole('button',{name:'Bericht speichern',exact:true}).waitFor();
 await page.screenshot({path:output+'/recovered-report.png'});
 assert.deepEqual(external,[]);summary.unexpectedExternalRequests=external;
 assert.ok(!fatal,fatal);summary.complete=true;
}catch(error){
 summary.failure={code:fatal||'verification-failed',message:error.message};process.exitCode=1;
 if(page&&!page.isClosed())try{
  summary.failure.observed=await page.evaluate(()=>({scene:window.__crossDeviceTest?.inspect(),pauses:window.__bossLabPauseEvents?.slice(-16),
   visibleMessage:document.body.innerText.slice(-2500),fullStatus:JSON.parse(localStorage.getItem('cryptoid_owner_full_status_v1')||'null')}));
  await page.screenshot({path:output+'/failure.png',timeout:5000});
 }catch{summary.failure.observationUnavailable=true;}
}
finally{
 summary.finishedAt=new Date().toISOString();writeFileSync(output+'/verification.json',JSON.stringify(summary,null,2)+'\n');
 console.log('CRYPTOID_DEVICE_RESULT '+JSON.stringify({complete:summary.complete,engine,seconds,points:summary.points.length,report:summary.report,failure:summary.failure}));
 if(browser)await browser.close();if(server)await server.close();
}
