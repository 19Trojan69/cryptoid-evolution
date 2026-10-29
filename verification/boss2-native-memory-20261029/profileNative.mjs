import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { sampleBrowserMemory } from '../boss2-forensics-20261028/processMemory.mjs';
import { armNativeProfile } from '../save-retry/fixture/nativeProfile.mjs';
import { summarizeMemoryTrace, memoryTraceEvents } from './nativeSummary.mjs';

const engine = process.env.CRYPTOID_NATIVE_ENGINE, effects = process.env.CRYPTOID_NATIVE_EFFECTS;
assert.ok(['chromium', 'webkit'].includes(engine)); assert.ok(['standard', 'reduced'].includes(effects));
const require = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url));
// Existing Node-side Inspector bridge. It patches only this process's module
// compilation, not installed files, the browser executable or app source.
const webkit = engine === 'webkit' ? armNativeProfile(require) : null;
const pw = require('playwright');
const output = resolve(root, 'verification/boss2-native-memory-20261029/results', engine + '-' + effects);
mkdirSync(output, { recursive: true });
const summary = { complete: false, engine, effects, sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  physicalDevice: false, physicalPiBrowser: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false,
  diagnostics: false, protection: true, requestedActiveSeconds: 90, forcedGc: false, activeScreenshots: false,
  activeProfiler: engine === 'webkit' ? 'existing WebKit memory/canvas Inspector' : 'memory-infra tracing; explicit dumps only while paused',
  extraAppCollectors: false, points: [], endpoints: [], dumpRequests: [] };
let server, browser, page, client, tracing = false, fatal;
const traceEvents = [];
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded(); const box = await locator.boundingBox(), viewport = page.viewportSize(); assert.ok(box && viewport);
  const x = box.x + box.width / 2, y = box.y + box.height / 2; assert.ok(x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height);
  await page.touchscreen.tap(x, y);
}
async function endpoint(label) {
  const memory = sampleBrowserMemory(); assert.ok(memory.contentProcessObserved && memory.summedPssKiB !== null);
  const result = { label, process: memory };
  if (webkit) {
    result.inspector = webkit.snapshot(); assert.deepEqual(result.inspector.errors, []);
    assert.ok(result.inspector.patched && Array.isArray(result.inspector.latest?.categories), 'native categories actually observed');
  } else {
    result.jsHeap = await client.send('Runtime.getHeapUsage'); result.dom = await client.send('Memory.getDOMCounters');
    const dump = await client.send('Tracing.requestMemoryDump', { deterministic: false, levelOfDetail: 'detailed' });
    summary.dumpRequests.push({ label, ...dump }); assert.equal(dump.success, true, 'explicit global memory dump succeeded');
  }
  summary.endpoints.push(result);
}
async function stopTrace() {
  if (!tracing) return;
  let timer;
  const completed = new Promise((resolve, reject) => {
    client.once('Tracing.tracingComplete', resolve);
    timer = setTimeout(() => reject(new Error('Memory trace finalization timed out')), 15000);
  });
  let completion;
  try { await client.send('Tracing.end'); completion = await completed; }
  finally { clearTimeout(timer); tracing = false; }
  const raw = Buffer.from(JSON.stringify({ traceEvents })); const compressed = gzipSync(raw, { level: 6 });
  writeFileSync(output + '/memory-infra.json.gz', compressed);
  summary.trace = { events: traceEvents.length, bytes: raw.length, gzipBytes: compressed.length, dataLossOccurred: completion.dataLossOccurred,
    sha256: createHash('sha256').update(compressed).digest('hex') };
  assert.equal(completion.dataLossOccurred, false, 'memory trace is complete');
  summary.nativeAllocators = summarizeMemoryTrace(traceEvents, summary.dumpRequests, { exportedSnapshotIds: true });
  for (const dump of summary.nativeAllocators) {
    assert.ok(dump.matchedProcessDumps > 0);
    assert.ok(dump.processes.some(p => /renderer/i.test(p.processName) && p.allocatorCount > 0), 'renderer allocator attribution present');
  }
}
try {
  server = await serveDevicePreview(); browser = await pw[engine].launch({ headless: true }); summary.engineVersion = browser.version();
  const profile = configuration(engine === 'webkit' ? 'iphone' : 'android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  summary.emulation = { width: 430, height: 825, dpr: 3, actualPhysicalDevice: false };
  const external = [];
  await context.route('**/*', route => { const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort(); });
  page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', () => { fatal ||= 'javascript-error'; }); page.on('crash', () => { fatal ||= 'renderer-crash'; });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  await tap(page.getByRole('checkbox', { name: 'Diagnose lokal aufzeichnen', exact: true }));
  assert.equal(await page.getByRole('checkbox', { name: 'Diagnose lokal aufzeichnen', exact: true }).isChecked(), false);
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  if (effects === 'reduced') {
    if (!await page.locator('#pause-settings-display').isVisible()) await tap(page.locator('button[aria-controls="pause-settings-display"]'));
    const toggle = page.locator('#pause-settings-display .system-setting[aria-pressed]').last();
    assert.equal(await toggle.getAttribute('aria-pressed'), 'false'); await tap(toggle); assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
  }
  assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), effects);
  await page.waitForFunction(() => window.__crossDeviceTest.inspect().audio?.audioSampleBuffers === 46, {}, { timeout: 45000 });
  if (webkit) {
    const deadline = Date.now() + 15000;
    while (!webkit.snapshot().latest && Date.now() < deadline) await page.waitForTimeout(250);
  } else {
    client = await browser.newBrowserCDPSession();
    client.on('Tracing.dataCollected', event => {
      const memory = memoryTraceEvents(event.value);
      if (traceEvents.length + memory.length > 10000) { fatal ||= 'trace-event-bound'; return; }
      traceEvents.push(...memory);
    });
    await client.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: {
      recordMode: 'recordUntilFull', traceBufferSizeInKb: 32768,
      excludedCategories: ['*'], includedCategories: ['disabled-by-default-memory-infra'], memoryDumpConfig: { triggers: [] } } });
    tracing = true;
    // Renderer-specific queries use the page session; tracing is browser-wide.
    const tracingClient = client, pageClient = await context.newCDPSession(page);
    client = { send: (method, params) => method.startsWith('Tracing.') ? tracingClient.send(method, params) : pageClient.send(method, params),
      once: (...args) => tracingClient.once(...args) };
  }
  await endpoint('initial-paused');
  await tap(page.locator('.pause-resume-button'));
  await page.waitForFunction(() => { const s = window.__crossDeviceTest?.inspect(); return s?.status === 'playing' && s.encounter === 'boss-fight'; }, {}, { timeout: 40000 });
  const first = await page.evaluate(() => ({ scene: window.__crossDeviceTest.inspect(), origin: performance.timeOrigin }));
  assert.deepEqual(first.scene.buildFlags, { development: false, production: true });
  assert.equal(first.scene.ownerDiagnostics, false); assert.equal(first.scene.reactorOpen, true);
  const started = Date.now(); let lastFrame, lastProgress = started;
  while (Date.now() - started < 90000) {
    assert.ok(!fatal, fatal); const now = Date.now();
    const observed = await page.evaluate(() => ({ scene: window.__crossDeviceTest?.inspect(), origin: performance.timeOrigin }));
    assert.equal(observed.origin, first.origin); const s = observed.scene; assert.ok(s);
    assert.equal(s.status, 'playing'); assert.equal(s.technicalPause, false); assert.equal(s.sector, 20); assert.equal(s.reactorOpen, true);
    if (s.frameAt !== lastFrame) lastProgress = now; lastFrame = s.frameAt; assert.ok(now - lastProgress < 5000);
    const memory = sampleBrowserMemory(); assert.ok(memory.contentProcessObserved && memory.summedPssKiB !== null);
    summary.points.push({ seconds: (now - started) / 1000, frameAt: s.frameAt, coreVolley: s.coreVolley,
      process: memory, inspector: webkit?.snapshot() ?? null, canvas: s.canvas, audio: s.audio });
    await page.waitForTimeout(1000);
  }
  summary.observedActiveSeconds = (Date.now() - started) / 1000;
  const end = await page.evaluate(() => window.__crossDeviceTest.inspect());
  summary.volleyProgress = { first: first.scene.coreVolley, last: end.coreVolley }; assert.ok(end.coreVolley > first.scene.coreVolley);
  assert.equal(await page.evaluate(() => localStorage.getItem('cryptoid_owner_full_status_v1')), null); summary.additionalFullRecordingAbsent = true;
  await tap(page.getByRole('button', { name: /^(Pause|Pausieren)$/, exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest.inspect().status === 'paused');
  await page.waitForTimeout(1000); await endpoint('after-active-paused');
  if (webkit) {
    const timestamps = new Set(summary.points.map(p => p.inspector?.latest?.timestamp).filter(x => x !== undefined));
    assert.ok(timestamps.size >= 3, 'native tracking actually advances'); summary.uniqueNativeUpdates = timestamps.size;
  }
  // Use existing Resume/Home confirmation to unmount through the real handler.
  // This extra UI interval is outside the measured 90-second active window.
  await tap(page.locator('.pause-resume-button')); await page.waitForFunction(() => window.__crossDeviceTest.inspect().status === 'playing');
  await tap(page.locator('.home-control')); await page.locator('#leave-mission-title').waitFor();
  await tap(page.locator('.game-overlay .game-modal').filter({ has: page.locator('#leave-mission-title') }).locator('.modal-actions .button-primary'));
  await page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }).waitFor();
  assert.equal(await page.locator('.game-shell').count(), 0); assert.equal(await page.evaluate(() => performance.timeOrigin), first.origin);
  await page.evaluate(() => { delete window.__crossDeviceTest; });
  summary.qaInspectionBridgeRemovedAfterUnmount = true; summary.extraUiResumeOutsideObservation = true;
  await page.waitForTimeout(3000); await endpoint('unmounted'); await stopTrace();
  await page.screenshot({ path: output + '/completed-unmount.png' });
  assert.deepEqual(external, []); summary.unexpectedExternalRequests = external; assert.ok(!fatal, fatal); summary.complete = true;
} catch (error) {
  summary.failure = { code: fatal || 'profiling-verification-failed', message: error.message }; process.exitCode = 1;
  if (page && !page.isClosed()) try { await page.screenshot({ path: output + '/failure.png', timeout: 5000 }); } catch { /* Preserve original error. */ }
} finally {
  if (tracing) try { await stopTrace(); } catch (error) { summary.traceFinalizationError = error.message; }
  summary.finishedAt = new Date().toISOString(); writeFileSync(output + '/verification.json', JSON.stringify(summary, null, 2) + '\n');
  console.log('CRYPTOID_NATIVE_RESULT ' + JSON.stringify({ complete: summary.complete, engine, effects,
    observedActiveSeconds: summary.observedActiveSeconds, volleys: summary.volleyProgress,
    nativeUpdates: summary.uniqueNativeUpdates, dumps: summary.nativeAllocators?.map(d => ({ label: d.label, processes: d.matchedProcessDumps })), failure: summary.failure }));
  if (browser) await browser.close(); if (server) await server.close();
}
