// Controlled native-browser storage/reload test, not physical iPhone/GPU proof.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const { default: native } = await import(process.env.CRYPTOID_CHROMIUM_PACKAGE || '/tmp/cryptoid-boss-native-qa/node_modules/@sparticuz/chromium/build/index.js');
const result = await build({ stdin: { contents: `
  import { createOwnerDiagnosticProbe } from './src/pages/ownerFlightRecorder.ts';
  import { readFlightRecorders } from './src/pages/flightRecorderReport.mjs';
  import { browserProbeRuntime, resourceTimingEnabled } from './src/pages/performanceDiagnostics.ts';
  window.qa = {createOwnerDiagnosticProbe, readFlightRecorders, browserProbeRuntime, resourceTimingEnabled};
`, resolveDir: new URL('../', import.meta.url).pathname }, bundle: true, write: false,
  format: 'iife', platform: 'browser', define: {'import.meta.env':'{}'} });
const browser = await chromium.launch({ executablePath: process.env.CRYPTOID_CHROMIUM || '/tmp/cryptoid-boss-native-runtime/chromium',
  args: native.args, headless: true });
try {
  const context = await browser.newContext();
  // Entire request is fulfilled locally; no account/API, server or deployment.
  await context.route('http://cryptoid-recorder.test/**', route => route.fulfill({contentType:'text/html',
    body: '<!doctype html><title>Local recorder QA</title><script>' + result.outputFiles[0].text + '</script>'}));
  const page = await context.newPage(); await page.goto('http://cryptoid-recorder.test/');
  const before = await page.evaluate(() => {
    const {qa} = window;
    const build = {sourceCommit:'a'.repeat(40),sourceTree:'b'.repeat(40),workingTreeDirty:true};
    const noOwner = qa.createOwnerDiagnosticProbe(false, () => { throw Error('ordinary player access'); }, {build});
    if (noOwner !== null) throw Error('owner guard');
    let clock = 100, runtimeCalls = 0, writes = 0, writeTotalMs = 0, writeMaxMs = 0;
    const started = performance.now();
    const wrap = storage => ({getItem:k=>storage.getItem(k),removeItem:k=>storage.removeItem(k),setItem:(k,v)=>{
      const start=performance.now();storage.setItem(k,v);const ms=performance.now()-start;
      writes++;writeTotalMs+=ms;writeMaxMs=Math.max(writeMaxMs,ms);
    }});
    const host = {localStorage:wrap(localStorage),sessionStorage:wrap(sessionStorage),__cryptoidBootId:'native-browser-first'};
    const probe = qa.createOwnerDiagnosticProbe(true,()=>host,{build,now:()=>clock,
      runtime:()=>{runtimeCalls++;return qa.browserProbeRuntime();}});
    const state = {sector:20,flight:0,phase:'ATTACK_CYCLE',encounter:'boss-fight',status:'playing',enemies:1,attackers:0,
      returning:0,playerShots:3,enemyShots:4,effects:0,rocks:0,rockEffects:0,pickups:0};
    for(let i=0;i<72000;i++){
      probe.begin(clock,state);probe.mark('boss-motion-and-weapons');probe.sceneRequested();
      probe.sceneCommitted(probe.sceneRenderBegin());probe.simulationStep(1000/60,1000/60);probe.end(clock);clock+=1000/60;
    }
    window.firstProbe = probe;
    const saved=qa.readFlightRecorders(window)[0];
    return {noOwner:noOwner===null,samples:saved.samples.length,lastSampleMs:saved.samples.at(-1).atMs,
      finished:saved.finished,bytes:localStorage.getItem('cryptoid_owner_flight_v1').length,
      actualHostMs:performance.now()-started,runtimeCalls,writes,writeTotalMs,writeMaxMs,
      resourceTimingActive:qa.resourceTimingEnabled()};
  });
  assert.equal(before.noOwner,true);assert.equal(before.samples,30);assert.equal(before.finished,false);
  assert.ok(before.lastSampleMs>1190000);assert.ok(before.bytes<=64*1024);assert.ok(before.runtimeCalls<=121);
  assert.equal(before.resourceTimingActive,true);
  // No finish/unload hook on the old object: replacement reads persisted strings.
  await page.reload();
  const after = await page.evaluate(() => {
    const old=window.qa.readFlightRecorders(window)[0];
    let clock=100;
    const p=window.qa.createOwnerDiagnosticProbe(true,()=>window,{build:{sourceCommit:'c'.repeat(40),sourceTree:'d'.repeat(40),workingTreeDirty:false},
      now:()=>clock});
    const state={sector:1,flight:0,phase:'ENTRY',encounter:'normal',status:'playing',enemies:4,attackers:0,returning:0,
      playerShots:0,enemyShots:0,effects:0,rocks:0,rockEffects:0,pickups:0};
    p.begin(clock,state);p.end(clock);clock+=2100;p.begin(clock,state);p.end(clock);p.finish();
    const captures=window.qa.readFlightRecorders(window);
    return {oldFinished:old.finished,captures:captures.length,commits:captures.map(c=>c.metadata.sourceCommit),
      oldLastMs:old.samples.at(-1).atMs,released:!window.qa.resourceTimingEnabled()};
  });
  assert.equal(after.oldFinished,false);assert.equal(after.captures,2);
  assert.ok(after.commits.includes('a'.repeat(40)) && after.commits.includes('c'.repeat(40)));
  assert.equal(after.released,true);assert.equal(after.oldLastMs,before.lastSampleMs);
  console.log(JSON.stringify({passed:true,controlledFrames:72000,simulatedMinutes:20,before,after,
    limits:'Synthetic timestamps and scene callbacks. Native Chromium local/session storage and document reload; no displayed-FPS, physical iPhone, GPU memory or termination-cause conclusion.'},null,2));
} finally { await browser.close(); }
