import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { build } from 'esbuild';

// Local acceptance host. Uses actual React/image/recorder/owner-export code;
// only the final image-load pause and subsequent process termination are injected.
const require = createRequire(import.meta.url);
const { webkit } = require(process.env.CRYPTOID_PLAYWRIGHT_PATH
  || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const frontend = new URL('../', import.meta.url).pathname;
const entry = `
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { usePreparedGameHulls } from './src/pages/usePreparedGameHulls';
import { retainPreparedHulls, paintedShipResourceStats, usePaintedShipStyle, usePreparedHullReady, useShipVisualOffset } from './src/pages/paintedShip';
import { preparedHullPlan } from './src/pages/hullSourcePlan';
import { createFullSessionRecorder } from './src/pages/fullSessionRecorder';
import { readFullSessionStatus, settleFullSessionWrites } from './src/pages/fullSessionStore';
import { readOwnerStabilityReport, exportOwnerFullSession } from './src/pages/stabilityReport.mjs';
import { observeSessionDiagnostics } from './src/lib/sessionDiagnosticEvents';
import { retainOwnerResourceTiming } from './src/pages/performanceDiagnostics';
const build={sourceCommit:'175e407622444ebe2dce7bfdb31e8037e25c1c97',sourceTree:'5bf22d80015c5a183fa58557647d647d9f3bc27c',workingTreeDirty:true};
window.signals=[]; observeSessionDiagnostics((kind,data)=>window.signals.push({kind,data}));
function Ship({hull}) {
  const style=usePaintedShipStyle(hull.sprite,hull.color,1), ready=usePreparedHullReady(hull.sprite,hull.color,1), offset=useShipVisualOffset(hull.sprite,1);
  return <div data-ready={ready} style={{width:100,height:100,...style,...offset,maskImage:style['--ship-surface-mask']}}/>;
}
function Harness({sector,offset,shown}) {
  usePreparedGameHulls(sector,'normal',offset,0,0,2);
  return <div>{preparedHullPlan(sector,'normal',offset,0,0,2).slice(0,shown).map(hull=><Ship key={hull.sprite+':'+hull.color} hull={hull}/>)}</div>;
}
const root=createRoot(document.getElementById('root'));
window.begin=async()=>{retainOwnerResourceTiming(Infinity);window.recorder=createFullSessionRecorder(true,()=>window,{build});window.recorder.start();await settleFullSessionWrites();};
window.advance=props=>root.render(<Harness {...props}/>);
window.phase=sector=>window.recorder.event({kind:'phase-start',sector,phase:'SECTOR_INTRO',encounter:'normal',status:'playing'});
window.save=()=>{window.recorder.sample({sector:55,phase:'SECTOR_INTRO',encounter:'normal',status:'playing',atMs:performance.now(),frames:1});return settleFullSessionWrites();};
window.graphicsStatus=()=>readFullSessionStatus(window);
window.stats=()=>({images:paintedShipResourceStats(),recorder:window.recorder.stats()});
window.armHeldLoad=()=>{
  const Original=window.Image;
  window.Image=class extends Original{
    set src(value){if(!value.endsWith('ship_20_stage_3_white.png'))super.src=value;}
    get src(){return super.src;}
  };
  window.held=retainPreparedHulls([{sprite:19,color:'white',stage:3}]);
};
window.recover=async()=>{
  const report=await readOwnerStabilityReport(async()=>({canAdmin:true}),()=>window);
  const summary=report.fullSessionRecording.sessions[0];
  const capture=JSON.parse(await (await exportOwnerFullSession(async()=>({canAdmin:true}),()=>window,summary.id)).text());
  return {summary,status:report.fullSessionRecording.status,capture};
};
window.ready=true;
`;
const compiled = await build({ absWorkingDir: frontend, resolveExtensions: ['.ts','.tsx','.mjs','.js','.json'],
  stdin: { contents: entry, sourcefile: 'hull-stage-acceptance.tsx', resolveDir: frontend, loader: 'tsx' },
  bundle: true, write: false, format: 'iife', platform: 'browser', logLevel: 'silent' });
let servedImages = 0;
const server=createServer((req,res)=>{
  res.setHeader('Cache-Control','public,max-age=3600');
  if(req.url==='/test.js'){res.setHeader('Content-Type','application/javascript');res.end(compiled.outputFiles[0].contents);return;}
  if(req.url.startsWith('/ships/')){
    const path=resolve(frontend,'public','.'+new URL(req.url,'http://localhost').pathname);
    if(!path.startsWith(frontend+'public/')){res.writeHead(403);res.end();return;}
    try{const data=readFileSync(path);servedImages++;res.setHeader('Content-Type','image/png');res.end(data);}
    catch{res.writeHead(404);res.end();}return;
  }
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body><div id="root"></div><script src="/test.js"></script></body></html>');
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const url=`http://127.0.0.1:${server.address().port}/`;
const processRows=()=>readdirSync('/proc').filter(x=>/^\d+$/.test(x)).flatMap(dir=>{
  try{const status=readFileSync(`/proc/${dir}/status`,'utf8'),ns=status.match(/^NSpid:\s+(.+)/m)?.[1].trim().split(/\s+/);
    return [{pid:+status.match(/^Pid:\s+(\d+)/m)[1],parent:+status.match(/^PPid:\s+(\d+)/m)[1],
      killPid:+(ns?.at(-1)??dir),args:readFileSync(`/proc/${dir}/cmdline`,'utf8').replaceAll('\0',' ')}];
  }catch{return [];}
});
const before=new Set(processRows().map(x=>x.pid));
const base=process.env.CRYPTOID_WEBKIT_BASE||'/root/.cache/ms-playwright/webkit-2336/minibrowser-wpe';
const libs=process.env.CRYPTOID_WEBKIT_LIBS||'/tmp/cryptoid-webkit-libs/usr/lib/x86_64-linux-gnu';
let browser;
try{
  browser=await webkit.launch({headless:true,executablePath:base+'/bin/MiniBrowser',env:{...process.env,
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS:'1',WEBKIT_EXEC_PATH:base+'/bin',WEBKIT_INJECTED_BUNDLE_PATH:base+'/lib',
    WEBKIT_INSPECTOR_RESOURCES_PATH:base+'/share',LD_LIBRARY_PATH:base+'/lib:'+base+'/sys/lib:'+libs,
    GST_PLUGIN_SYSTEM_PATH:libs+'/gstreamer-1.0'}});
  const context=await browser.newContext({viewport:{width:430,height:825},deviceScaleFactor:3});
  await context.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.abort());
  const errors=[],failures=[];
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)failures.push(r.status());});
  await page.goto(url);await page.waitForFunction(()=>window.ready);await page.evaluate(()=>window.begin());
  const checks=[];
  for(const props of [{sector:53,offset:0},{sector:54,offset:0},{sector:54,offset:6},{sector:55,offset:0}]){
    const count=await page.evaluate(()=>window.signals.length);
    await page.evaluate(props=>window.advance({...props,shown:0}),props);
    await page.waitForFunction(({count,sector})=>window.signals.slice(count).some(x=>x.data.operation==='hull-plan-settled'&&x.data.sector===sector),{count,sector:props.sector});
    const settled=await page.evaluate(count=>window.signals.slice(count).find(x=>x.data.operation==='hull-plan-settled').data,count);
    assert.equal(settled.prepared,12);assert.equal(settled.readinessFailures,0);
    await page.evaluate(props=>window.advance({...props,shown:6}),props);
    await page.waitForFunction(()=>document.querySelectorAll('[data-ready="true"]').length===6);
    const last=await page.evaluate(()=>window.graphicsStatus().lastGraphics);
    await page.evaluate(sector=>window.phase(sector),props.sector);
    assert.deepEqual(await page.evaluate(()=>window.graphicsStatus().lastGraphics),last,'later phase preserves graphics observation');
    checks.push({...props,...settled});
  }
  await page.evaluate(()=>window.save());
  const committed=await page.evaluate(()=>window.graphicsStatus().lastCommittedSeq);
  await page.evaluate(()=>window.armHeldLoad());
  await page.waitForFunction(()=>{const d=window.graphicsStatus()?.lastGraphics?.data;return d?.step==='variant-load-start'&&d.sprite===19&&d.hullStage===3;});
  const final=await page.evaluate(()=>({status:window.graphicsStatus(),stats:window.stats()}));
  assert.equal(final.status.lastCommittedSeq,committed);
  assert.ok(final.status.lastGraphics.seq>committed,'the final graphics step is an uncommitted synchronous observation');
  assert.ok(final.stats.recorder.queued>=2);
  const rows=processRows(),roots=new Set(rows.filter(x=>!before.has(x.pid)&&/\/bin\/MiniBrowser\b/.test(x.args)).map(x=>x.pid));
  const ours=pid=>{for(let i=0;i<10&&pid;i++){if(roots.has(pid))return true;pid=rows.find(x=>x.pid===pid)?.parent;}return false;};
  const children=rows.filter(x=>!before.has(x.pid)&&/(?:WebKit|WPE)WebProcess/.test(x.args)&&ours(x.pid));
  assert.equal(children.length,1,'kill only the isolated task-owned WebKit process');
  const crash=page.waitForEvent('crash',{timeout:10000});process.kill(children[0].killPid,'SIGKILL');await crash;
  const recovered=await context.newPage();recovered.on('pageerror',e=>errors.push(e.message));
  await recovered.goto(url);await recovered.waitForFunction(()=>window.ready);
  const data=await recovered.evaluate(()=>window.recover());
  assert.equal(data.capture.integrity.contiguous,true);assert.equal(data.summary.state,'recording');
  assert.equal(data.summary.lastSeq,committed);assert.equal(data.status.lastGraphics.data.step,'variant-load-start');
  assert.equal(data.status.lastGraphics.data.sprite,19);assert.equal(data.status.lastGraphics.data.hullStage,3);
  assert.equal(data.capture.storageStatus.lastGraphics.seq,final.status.lastGraphics.seq);
  assert.equal(data.capture.records.some(x=>x.seq===final.status.lastGraphics.seq),false,'export does not invent a commit for the marker');
  assert.equal(JSON.stringify(data.capture).includes('/ships/'),false);
  await recovered.evaluate(()=>window.begin());
  const normal=await recovered.evaluate(()=>{window.recorder.finish();return window.graphicsStatus();});
  assert.equal(normal.lastObserved.kind,'end');assert.equal(normal.lastObserved.data.operation,'finish');
  const closed=await recovered.evaluate(()=>window.recover());
  assert.equal(closed.summary.state,'closed');assert.equal(closed.capture.records.at(-1).kind,'end');
  assert.equal(errors.length,0);assert.equal(failures.length,0);
  const result={engine:'WebKit',version:browser.version(),viewport:'430x825',dpr:3,checks,servedImages,
    controlledContentProcessKill:true,lastGraphicsSurvivesLaterPhase:true,uncommittedGraphicsRecovered:true,
    normalFinishObservedSynchronously:true,normalFinishCommitted:true,
    committedRecords:committed,committedChunks:data.summary.chunks,tailGraphicsSeq:final.status.lastGraphics.seq,
    lastStep:data.status.lastGraphics.data,recorderWork:final.stats.recorder,integrity:data.capture.integrity,
    pageErrors:errors.length,imageHttpErrors:failures.length,
    limits:'Actual local Linux WebKit/React/image loading/IndexedDB and verified export functions. Final source assignment is deliberately withheld and only the task-owned content process is killed. No physical PiBrowser, iPhone timing/native memory, natural crash reproduction or crash-cause proof.'};
  if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
