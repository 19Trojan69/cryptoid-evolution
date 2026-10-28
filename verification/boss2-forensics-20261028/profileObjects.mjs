// Explicit invasive laboratory profile. Never imported into the game bundle.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, openSync, writeSync, closeSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { configuration, root, DIRECTORY, BASELINE, baselineController } from './fixture.mjs';
import { createLabServer } from './labServer.mjs';
import { sampleBrowserMemory } from './processMemory.mjs';
import { cleanHeapUsage } from './chromiumHeap.mjs';
import { summarizeHeap, compareHeaps } from './heapObjects.mjs';
import { inspectRetainers } from './heapRetainers.mjs';
const require = createRequire(import.meta.url), pw = require(process.env.CRYPTOID_PLAYWRIGHT_MODULE || 'playwright');
const seconds = Number(process.env.CRYPTOID_PROFILE_SECONDS || 60);
assert.ok(Number.isInteger(seconds) && seconds >= 30 && seconds <= 120);
const cycles = Number(process.env.CRYPTOID_PROFILE_CYCLES || 1);
const warmupSeconds = Number(process.env.CRYPTOID_PROFILE_WARMUP_SECONDS || 0);
assert.ok(Number.isInteger(cycles) && cycles >= 1 && cycles <= 5);
assert.ok(Number.isInteger(warmupSeconds) && warmupSeconds >= 0 && warmupSeconds <= 120);
const buildMode = process.env.CRYPTOID_PROFILE_BUILD || 'development';
assert.ok(['development', 'production'].includes(buildMode));
const output = resolve(process.env.CRYPTOID_TEST_OUTPUT || `${root}/${DIRECTORY}/results/object-profile`);
mkdirSync(output, { recursive: true });
const source = readFileSync(root + '/frontend/src/pages/GamePage.tsx', 'utf8');
assert.equal(baselineController(source), execFileSync('git', ['show', BASELINE + ':frontend/src/pages/GamePage.tsx'], { cwd: root, encoding: 'utf8' }));
const result = { complete: false, baseline: BASELINE, pauseEvidenceOnlyControllerChanges: true, baselineControllerSha256: createHash('sha256').update(baselineController(source)).digest('hex'), controllerSha256: createHash('sha256').update(source).digest('hex'),
  buildMode, reactVersion: createRequire(root + '/frontend/package.json')('react/package.json').version,
  reactDomVersion: createRequire(root + '/frontend/package.json')('react-dom/package.json').version,
  seconds, cyclesRequested:cycles, warmupSeconds, nodeVersion:process.version, completedCycles:[],
  actualHostOS: process.platform, physicalDevice: false, realPiBrowser: false, realAuthentication: false,
  syntheticAccount: true, realDatabase: false, realPayments: false, collisionProtection: true, nativeClocksAltered: false,
  directTurretRemoval: true, bossHealthFloorRatio: .4, ownerDiagnostics: true, inputEvidence: true,
  explicitGc: true, snapshotsOnlyWhilePaused: true, stabilityAcceptance: false, historicalWhiteScreenFixed: false,
  osScreenshot: false, nativeEdgeNavigation: false, points: [], snapshots: [] };
const note = (kind, data = {}) => appendFileSync(output + '/events.jsonl', JSON.stringify({ at: new Date().toISOString(), kind, ...data }) + '\n');
const within = (promise, ms, label) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(Error(label)), ms);
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});
let lab, browser, page, session, fatal, expectedNavigation = true, documentId;
let warmHeapState;
const navigationChecks = new Set();
async function inspect() {
  if (fatal) throw Error(fatal);
  const state = await within(page.evaluate(() => window.__crossDeviceTest.inspect()), 8000, 'inspection-timeout');
  assert.equal(state.technicalPause, false, 'Profiler must not mask a technical pause');
  assert.ok(!state.failed && state.sector === 20 && state.encounter === 'boss-fight' && state.reactorOpen, 'Active target scene');
  return state;
}
async function measure(label) {
  const state = await inspect();
  const heap = cleanHeapUsage(await session.send('Runtime.getHeapUsage'));
  assert.ok(heap, 'Heap counters available');
  const dom = await session.send('Memory.getDOMCounters');
  for (const name of ['documents', 'nodes', 'jsEventListeners']) assert.ok(Number.isSafeInteger(dom[name]));
  const attached = await page.evaluate(() => ({ elements: document.querySelectorAll('*').length,
    images: document.images.length, canvases: document.querySelectorAll('canvas').length,
    animations: document.getAnimations().length, measureEntries: performance.getEntriesByType('measure').length,
    markEntries: performance.getEntriesByType('mark').length }));
  const memory = sampleBrowserMemory(); assert.ok(memory.contentProcessObserved && memory.summedPssKiB !== null);
  const point = { at: new Date().toISOString(), label, status: state.status, frameAt: state.frameAt, coreVolley: state.coreVolley,
    shots: state.shots, hostileShots: state.hostileShots, effects: state.effects, canvas: state.canvas, audio: state.audio,
    heap, dom, attached, memory };
  appendFileSync(output + '/profile-counters.jsonl', JSON.stringify(point) + '\n'); return point;
}
async function pause() {
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.waitForFunction(() => window.__crossDeviceTest.inspect().status === 'paused', null, { timeout: 5000 });
  assert.equal((await inspect()).status, 'paused');
}
async function snapshot(label) {
  assert.equal((await inspect()).status, 'paused', 'Heavy snapshot only while manually paused');
  const path = output + '/' + label + '.heapsnapshot', fd = openSync(path, 'wx');
  let bytes = 0, over = false; const hash = createHash('sha256');
  const receive = ({ chunk }) => {
    const value = Buffer.from(chunk); bytes += value.length;
    if (bytes > 128 * 1024 * 1024) { over = true; return; }
    if (!over) { writeSync(fd, value); hash.update(value); }
  };
  session.on('HeapProfiler.addHeapSnapshotChunk', receive);
  try {
    await within(session.send('HeapProfiler.takeHeapSnapshot', { captureNumericValue: false, reportProgress: false, exposeInternals:true }), 90000, 'snapshot-timeout');
  } finally { session.off('HeapProfiler.addHeapSnapshotChunk', receive); closeSync(fd); }
  if (over) { unlinkSync(path); throw Error('snapshot-byte-budget-exceeded'); }
  let aggregate, retainers;
  try {
    const data=JSON.parse(readFileSync(path, 'utf8'));
    aggregate=summarizeHeap(data);
    const analysis=inspectRetainers(data,warmHeapState);
    warmHeapState ??= analysis.state;
    retainers=analysis.report;
  }
  finally { unlinkSync(path); }
  result.snapshots.push({ label, bytes, sha256: hash.digest('hex'), rawSnapshotRetained: false, exposeInternals:true, retainers, ...aggregate });
  return aggregate;
}
async function playWindow(label, duration) {
  const start=Date.now();let first,last,lastFrame,frameChangedAt=Date.now(),progress=0;
  while(Date.now()-start<duration*1000) {
    const point=await measure(label);first??=point;last=point;assert.equal(point.status,'playing');
    if(point.frameAt!==lastFrame)frameChangedAt=Date.now();
    assert.ok(Date.now()-frameChangedAt<5000,'Frames advance');lastFrame=point.frameAt;
    if(Date.now()-progress>=15000){progress=Date.now();console.log('CRYPTOID_OBJECT_PROGRESS '+JSON.stringify({label,seconds:Math.round((Date.now()-start)/1000)}));}
    await page.waitForTimeout(1000);
  }
  assert.ok(last.coreVolley>first.coreVolley,'Reactor fires during observed play');
  return {label,observedActiveSeconds:(Date.now()-start)/1000,first,last};
}
try {
  lab = await createLabServer({ mode: 'direct', diagnostics: true, production: buildMode === 'production', cacheDir: output + '/vite-cache', note });
  result.buildIdentity=lab.identity?.()??null;
  browser = await pw.chromium.launch({ headless: true }); result.engineVersion = browser.version();
  const context = await browser.newContext(configuration('android-phone', pw.devices).context);
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === lab.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  page = await context.newPage(); page.setDefaultTimeout(10000);
  page.on('crash', () => { fatal ||= 'renderer-crash'; });
  page.on('pageerror', () => { fatal ||= 'javascript-error'; });
  page.on('console', message => { if (message.type() === 'error') fatal ||= 'console-error'; });
  page.on('request', request => {
    if (!expectedNavigation && request.isNavigationRequest() && request.frame() === page.mainFrame()) fatal ||= 'unexpected-document-request';
  });
  page.on('framenavigated', frame => {
    if (frame !== page.mainFrame() || expectedNavigation) return;
    // Pause/Resume deliberately push/pop modal history in this same document.
    // An actual replacement gets a new lab boot token and still fails.
    const check = frame.evaluate(() => window.__bossLabDocument).then(id => {
      if (expectedNavigation) return;
      if (id !== documentId) fatal ||= 'unexpected-document-replacement';
      else result.sameDocumentNavigationEvents = (result.sameDocumentNavigationEvents || 0) + 1;
    }).catch(() => { if (!expectedNavigation) fatal ||= 'document-inspection-failed'; });
    navigationChecks.add(check); void check.finally(() => navigationChecks.delete(check));
  });
  browser.on('disconnected', () => { if (!expectedNavigation) fatal ||= 'browser-disconnected'; });
  await page.goto(lab.origin + '/game', { waitUntil: 'domcontentloaded' });
  await page.bringToFront();
  await page.getByRole('button', { name: 'Resume', exact: true }).click({ timeout: 45000 });
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'playing', null, { timeout: 30000 });
  await page.evaluate(() => { window.__crossDeviceTest.protect(); window.__crossDeviceTest.park(); });
  await page.waitForFunction(() => window.__crossDeviceTest.inspect().reactorOpen, null, { timeout: 30000 });
  result.bundledFlags = (await inspect()).buildFlags;
  assert.equal(result.bundledFlags.production, buildMode === 'production', 'Actual browser bundle mode matches requested mode');
  assert.equal(result.bundledFlags.development, buildMode !== 'production');
  documentId = await page.evaluate(() => window.__bossLabDocument); expectedNavigation = false;
  session = await context.newCDPSession(page); await session.send('HeapProfiler.enable');
  result.points.push(await measure('initial-playing'));
  if(warmupSeconds)result.warmup=await playWindow('warmup',warmupSeconds);
  await pause();result.points.push(await measure('warm-paused-before-gc'));
  await session.send('HeapProfiler.collectGarbage');const baselinePoint=await measure('warm-paused-after-gc');result.points.push(baselinePoint);
  const before=await snapshot('warm-baseline');result.points.push(await measure('warm-paused-after-snapshot'));
  let previous=before;
  for(let cycle=1;cycle<=cycles;cycle++) {
    await page.locator('.pause-resume-button').click();
    await page.waitForFunction(()=>window.__crossDeviceTest.inspect().status==='playing',null,{timeout:30000});
    const window=await playWindow('cycle-'+cycle,seconds);
    result.points.push(window.first,window.last);
    await pause();const beforeGc=await measure('cycle-'+cycle+'-paused-before-gc');result.points.push(beforeGc);
    await session.send('HeapProfiler.collectGarbage');const afterGc=await measure('cycle-'+cycle+'-paused-after-gc');result.points.push(afterGc);
    const after=await snapshot('cycle-'+cycle);result.points.push(await measure('cycle-'+cycle+'-paused-after-snapshot'));
    result.completedCycles.push({cycle,observedActiveSeconds:window.observedActiveSeconds,
      pssBeforeGcKiB:beforeGc.memory.summedPssKiB,pssAfterGcKiB:afterGc.memory.summedPssKiB,
      pssIncreaseFromWarmBaselineKiB:afterGc.memory.summedPssKiB-baselinePoint.memory.summedPssKiB,
      fromWarmBaseline:compareHeaps(before,after),fromPreviousCycle:compareHeaps(previous,after)});
    previous=after;
  }
  result.observedActiveSeconds=result.completedCycles.reduce((sum,row)=>sum+row.observedActiveSeconds,0);
  // One disclosed synthetic focus event checks the real existing pause callback.
  // It is not an Android OS focus-change or physical-device test.
  await page.locator('.pause-resume-button').click();
  await page.waitForFunction(()=>window.__crossDeviceTest.inspect().status==='playing',null,{timeout:30000});
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await page.waitForFunction(()=>window.__crossDeviceTest.inspect().status==='paused',null,{timeout:5000});
  assert.equal((await inspect()).technicalPause,false);
  result.pauseEvidence=await page.evaluate(()=>window.__bossLabPauseEvents);
  assert.equal(result.pauseEvidence.at(-1)?.pauseReason,'blur');
  assert.ok(result.pauseEvidence.filter(row=>row.pauseReason==='manual-pause').length>=cycles+1);
  result.syntheticBlurProbe={passed:true,dispatch:'DOM blur event only',nativeDevice:false};
  result.finalBuildIdentity=lab.identity?.()??null;
  assert.deepEqual(result.finalBuildIdentity,result.buildIdentity,'Same assets and dependency locks throughout all cycles');
  await within(Promise.all([...navigationChecks]), 8000, 'navigation-check-timeout');
  assert.equal(await page.evaluate(() => window.__bossLabDocument), documentId);
  assert.equal(lab.apiErrors.length, 0); assert.ok(!fatal);
  result.complete = true;
} catch (error) {
  result.failure = { code: fatal || 'profile-failed', message: error.message }; process.exitCode = 1;
} finally {
  expectedNavigation = true;
  result.finishedAt = new Date().toISOString(); result.apiErrors = lab?.apiErrors || [];
  writeFileSync(output + '/object-profile-summary.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_OBJECT_RESULT ' + JSON.stringify({ complete: result.complete, failure: result.failure, points: result.points.length,
    snapshots: result.snapshots.length, engineVersion: result.engineVersion, finishedAt: result.finishedAt }));
  if (session) try { await within(session.detach(), 3000, 'detach-timeout'); } catch { process.exitCode = 1; }
  if(page&&!page.isClosed())try { await within(page.evaluate(()=>window.__bossLabStopPauseObserver?.()),2000,'observer-stop-timeout'); } catch { /* A crashed document may be gone. */ }
  if (browser) try { await within(browser.close(), 8000, 'close-timeout'); } catch { process.exitCode = 1; }
  if (lab) try { await within(lab.server.close(), 8000, 'server-close-timeout'); } catch { process.exitCode = 1; }
}
