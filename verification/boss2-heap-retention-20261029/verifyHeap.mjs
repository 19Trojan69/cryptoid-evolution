import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { sampleBrowserMemory } from '../boss2-forensics-20261028/processMemory.mjs';
import { summarizeHeap } from './heapSummary.mjs';

const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
const seconds = Number(process.env.CRYPTOID_HEAP_SECONDS);
assert.ok([60, 360].includes(seconds));
const output = resolve(root, 'verification/boss2-heap-retention-20261029/results', 'chromium-' + seconds);
mkdirSync(output, { recursive: true });
const summary = { complete: false, engine: 'chromium', requestedSeconds: seconds,
  physicalDevice: false, physicalPiBrowser: false, nativeTerminationCauseMeasured: false,
  whiteScreenFixed: false, diagnostics: false, protection: true, scene: 'reactor',
  activeScreenshots: false, activeForcedGc: false, activeHeapSnapshots: false,
  postDurationForcedGcAndSnapshots: true, extraGameCollectors: false, points: [] };
let server, browser, page, fatal;

async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 });
  assert.ok(await locator.isEnabled()); await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox(), viewport = page.viewportSize(); assert.ok(box && viewport);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  assert.ok(x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height, 'native tap inside viewport');
  await page.touchscreen.tap(x, y);
}
async function snapshot(label) {
  const client = await page.context().newCDPSession(page);
  const file = output + '/' + label + '.heapsnapshot';
  const result = { state: label, forcedGc: true, observedAfterActiveDuration: true };
  try {
    result.beforeGc = { heap: await client.send('Runtime.getHeapUsage'), dom: await client.send('Memory.getDOMCounters') };
    await client.send('HeapProfiler.enable');
    await client.send('HeapProfiler.collectGarbage');
    result.afterGc = { heap: await client.send('Runtime.getHeapUsage'), dom: await client.send('Memory.getDOMCounters') };
    writeFileSync(file, ''); let chunks = 0;
    const write = event => { appendFileSync(file, event.chunk); chunks++; };
    client.on('HeapProfiler.addHeapSnapshotChunk', write);
    try { await client.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false }); }
    finally { client.off('HeapProfiler.addHeapSnapshotChunk', write); }
    assert.ok(chunks > 0);
    const raw = readFileSync(file), parsed = JSON.parse(raw.toString('utf8'));
    const graph = summarizeHeap(parsed); assert.ok(graph.nodeCount > 0);
    const compressed = gzipSync(raw, { level: 6 }); writeFileSync(file + '.gz', compressed); unlinkSync(file);
    result.snapshot = { file: label + '.heapsnapshot.gz', chunks, bytes: raw.length, gzipBytes: compressed.length,
      sha256: createHash('sha256').update(compressed).digest('hex'), ...graph };
    await client.send('HeapProfiler.disable');
    return result;
  } finally { await client.detach(); }
}
try {
  server = await serveDevicePreview(); browser = await pw.chromium.launch({ headless: true });
  summary.engineVersion = browser.version();
  const profile = configuration('android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  summary.emulation = { preset: profile.preset, width: 430, height: 825, dpr: 3, actualPhysicalDevice: false };
  const external = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', () => { fatal ||= 'javascript-error'; }); page.on('crash', () => { fatal ||= 'renderer-crash'; });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const toggle = page.getByRole('checkbox', { name: 'Diagnose lokal aufzeichnen', exact: true });
  assert.equal(await toggle.isChecked(), true); await tap(toggle); assert.equal(await toggle.isChecked(), false);
  assert.equal(await page.getByRole('checkbox', { name: 'Testschutz: Tod und Bossende verhindern', exact: true }).isChecked(), true);
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  await tap(page.locator('.pause-resume-button'));
  await page.waitForFunction(() => { const s = window.__crossDeviceTest?.inspect(); return s?.status === 'playing' && s.encounter === 'boss-fight'; }, {}, { timeout: 40000 });
  const first = await page.evaluate(() => ({ scene: window.__crossDeviceTest.inspect(), timeOrigin: performance.timeOrigin }));
  assert.equal(first.scene.ownerDiagnostics, false); assert.equal(first.scene.technicalPause, false);
  assert.equal(first.scene.sector, 20); assert.equal(first.scene.reactorOpen, true);
  assert.deepEqual(first.scene.buildFlags, { development: false, production: true });
  let lastFrameAt, lastProgress = Date.now(), printed = Date.now(); const started = Date.now();
  while (Date.now() - started < seconds * 1000) {
    assert.ok(!fatal, fatal);
    const observed = await page.evaluate(() => ({ scene: window.__crossDeviceTest?.inspect(), timeOrigin: performance.timeOrigin }));
    assert.equal(observed.timeOrigin, first.timeOrigin); const s = observed.scene; assert.ok(s);
    assert.equal(s.status, 'playing'); assert.equal(s.technicalPause, false); assert.equal(s.ownerDiagnostics, false);
    assert.equal(s.sector, 20); assert.equal(s.reactorOpen, true);
    const now = Date.now(); if (s.frameAt !== lastFrameAt) lastProgress = now; lastFrameAt = s.frameAt;
    assert.ok(now - lastProgress < 5000, 'game frame callbacks continue');
    const memory = sampleBrowserMemory(); assert.ok(memory.contentProcessObserved && memory.summedPssKiB !== null);
    const point = { elapsedSeconds: (now - started) / 1000, coreVolley: s.coreVolley, frameAt: s.frameAt,
      pssKiB: memory.summedPssKiB, audio: s.audio, canvas: s.canvas };
    summary.points.push(point);
    if (now - printed >= 60000) { printed = now; console.log('CRYPTOID_HEAP_PROGRESS ' + JSON.stringify({ seconds, activeSeconds: Math.round(point.elapsedSeconds), pssMiB: point.pssKiB / 1024 })); }
    await page.waitForTimeout(1000);
  }
  const end = await page.evaluate(() => window.__crossDeviceTest.inspect());
  summary.observedActiveSeconds = (Date.now() - started) / 1000;
  summary.volleyProgress = { first: first.scene.coreVolley, last: end.coreVolley }; assert.ok(end.coreVolley > first.scene.coreVolley);
  assert.equal(await page.evaluate(() => localStorage.getItem('cryptoid_owner_full_status_v1')), null);
  summary.additionalFullRecordingAbsent = true;
  // Native Home opens the original paused confirmation. Profiling starts only
  // after the uninterrupted active observation has finished.
  await tap(page.locator('.home-control'));
  await page.locator('#leave-mission-title').waitFor();
  assert.equal(await page.evaluate(() => window.__crossDeviceTest.inspect().status), 'paused');
  await page.waitForTimeout(500);
  summary.paused = await snapshot('paused');
  await page.screenshot({ path: output + '/paused.png' });
  await tap(page.locator('.game-overlay .game-modal').filter({ has: page.locator('#leave-mission-title') }).locator('.modal-actions .button-primary'));
  await page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }).waitFor();
  assert.equal(await page.locator('.game-shell').count(), 0);
  assert.equal(await page.evaluate(() => performance.timeOrigin), first.timeOrigin);
  // The unchanged private fixture leaves its inspection function on Window.
  // That function closes over the last controller. Remove only this QA bridge
  // after unmount, otherwise the harness itself invalidates a cleanup test.
  summary.unmount = await page.evaluate(() => {
    const removedFixtureBridge = typeof window.__crossDeviceTest === 'object';
    delete window.__crossDeviceTest;
    return { removedFixtureBridge, gameShells: document.querySelectorAll('.game-shell').length };
  });
  assert.equal(summary.unmount.removedFixtureBridge, true); await page.waitForTimeout(1500);
  summary.unmounted = await snapshot('unmounted');
  await page.screenshot({ path: output + '/unmounted.png' });
  assert.deepEqual(external, []); summary.unexpectedExternalRequests = external; assert.ok(!fatal, fatal);
  summary.complete = true;
} catch (error) {
  summary.failure = { code: fatal || 'verification-failed', message: error.message }; process.exitCode = 1;
  if (page && !page.isClosed()) try { await page.screenshot({ path: output + '/failure.png', timeout: 5000 }); } catch { /* Preserve original failure. */ }
} finally {
  summary.finishedAt = new Date().toISOString(); writeFileSync(output + '/verification.json', JSON.stringify(summary, null, 2) + '\n');
  console.log('CRYPTOID_HEAP_RESULT ' + JSON.stringify({ complete: summary.complete, requestedSeconds: seconds,
    observedActiveSeconds: summary.observedActiveSeconds, volleyProgress: summary.volleyProgress,
    pausedHeap: summary.paused?.afterGc, unmountedHeap: summary.unmounted?.afterGc, failure: summary.failure }));
  if (browser) await browser.close(); if (server) await server.close();
}
