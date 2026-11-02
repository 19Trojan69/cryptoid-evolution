import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, openSync, writeSync, closeSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { sampleBrowserMemory } from '../boss2-forensics-20261028/processMemory.mjs';
import { cleanHeapUsage } from '../boss2-forensics-20261028/chromiumHeap.mjs';
import { summarizeHeap } from '../boss2-forensics-20261028/heapObjects.mjs';
import { STOPWATCH_KEY } from '../boss2-stopwatch-20261029/stopwatchState.mjs';
import { requireInactiveCheckpoint } from './inspection.mjs';
import { comparisonConfig, comparisonProof, assertPathProof } from '../isolated-mini-pacing-20261101/comparison.mjs';
import { installNativePathProbe } from '../isolated-mini-pacing-20261101/nativePathProbe.mjs';
import { startInactiveNativeCollector } from '../inactive-native-allocation-20261101/collector.mjs';
import { styleProbeConfig, assertStyleProof } from '../style-variable-attribution-20261102/config.mjs';
import { installStyleWriteProbe } from '../style-variable-attribution-20261102/styleWriteProbe.mjs';

const seconds = Number(process.env.CRYPTOID_ATTRIBUTION_SECONDS);
assert.ok([60, 1200].includes(seconds), 'One short control or one twenty-minute observation');
const comparison = comparisonConfig();
const styleObservation = styleProbeConfig();
const nativeAllocation = process.env.CRYPTOID_INACTIVE_NATIVE_TRACE === '1';
if (process.env.CRYPTOID_INACTIVE_NATIVE_TRACE !== undefined) assert.ok(['0', '1'].includes(process.env.CRYPTOID_INACTIVE_NATIVE_TRACE));
if (nativeAllocation) {
  assert.equal(comparison, null); assert.equal(process.env.CRYPTOID_LIFETIME_ATTRIBUTION, '1');
  assert.equal(process.env.CRYPTOID_SOAK_CONDITION, 'original');
}
if (comparison?.pathProof) assert.equal(seconds, 60, 'Native wrappers only in the short path proof');
const output = styleObservation
  ? resolve(root, 'verification/style-variable-attribution-20261102/results', 'chromium-' + seconds)
  : nativeAllocation
  ? resolve(root, 'verification/inactive-native-allocation-20261101/results', 'chromium-' + seconds)
  : comparison
  ? resolve(root, 'verification/isolated-mini-pacing-20261101/results', comparison.condition + '-r' + comparison.replica + '-' + seconds)
  : resolve(root, 'verification/memory-retention-attribution-20261101/results', 'chromium-' + seconds);
mkdirSync(output, { recursive: true });
const require = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url));
const frontendRequire = createRequire(root + '/frontend/package.json');
const pw = require('playwright');
const git = ref => execFileSync('git', ['rev-parse', ref], { cwd: root, encoding: 'utf8' }).trim();
const result = { version: 1, complete: false, sourceCommit: git('HEAD'), sourceTree: git('HEAD^{tree}'),
  requestedSeconds: seconds, condition: 'original-artwork', actualHostOS: process.platform,
  physicalDevice: false, physicalPiBrowser: false, whiteScreenFixed: false, nativeTerminationCauseMeasured: false,
  actualInstalledPackages: Object.fromEntries(['react', 'react-dom', 'react-router-dom', 'vite', 'typescript']
    .map(name => [name, frontendRequire(name + '/package.json').version])),
  lockSha256: createHash('sha256').update(readFileSync(root + '/frontend/yarn.lock')).digest('hex'),
  clocksAccelerated: false, automaticResume: false, fullRecording: false, collisionProtection: true,
  randomnessSeeded: false, activeHeapProfilerAttached: false, activeForcedGc: false,
  activeHeapSnapshots: false, activeScreenshots: false, activeNativeAnimationScans: false,
  qaReadsExistingModuleCounters: true, snapshotsOnlyAfterInactiveGate: true,
  manualPauseTrigger: 'existing Home confirmation',
  interpretation: 'Synthetic Linux attribution; no physical-phone acceptance, exact native allocator cause or permanent leak inferred.',
  points: [], checkpoints: [], snapshots: [] };
if (comparison) result.isolatedMiniPacing = comparison;
if (nativeAllocation) { result.inactiveNativeAllocationRequested = true; result.activeNativeTracing = false; }
if (styleObservation) result.activeStyleWriteProbe = true;
let server, browser, page, client, fatal, first, nativeCollector;
const external = [], assetFailures = [];
const within = (promise, ms, label) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(Error(label)), ms);
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded(); const box = await locator.boundingBox(), v = page.viewportSize();
  assert.ok(box && v); const x = box.x + box.width / 2, y = box.y + box.height / 2;
  assert.ok(x >= 0 && x < v.width && y >= 0 && y < v.height);
  await page.touchscreen.tap(x, y);
}
const observe = (beginStyleObservation = false) => page.evaluate(({ key, beginStyleObservation }) => {
  if (beginStyleObservation) window.__styleWriteProbe.begin();
  let clock = null;
  try { clock = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* Blank document may have an opaque origin. */ }
  return { url: location.href, timeOrigin: performance.timeOrigin,
    hidden: document.hidden, mounted: !!document.querySelector('.game-shell'),
    scene: window.__crossDeviceTest?.inspect() ?? null,
    stats: window.__lifetimeAttributionStats?.() ?? null, clock };
}, { key: STOPWATCH_KEY, beginStyleObservation });
function active(row) {
  assert.ok(!fatal, fatal); assert.equal(row.timeOrigin, first.timeOrigin); assert.equal(row.hidden, false);
  assert.equal(row.mounted, true); assert.equal(row.scene?.status, 'playing');
  assert.equal(row.scene.technicalPause, false); assert.equal(row.scene.sector, 20);
  assert.equal(row.scene.encounter, 'boss-fight'); assert.equal(row.scene.reactorOpen, true);
  assert.equal(row.scene.ownerDiagnostics, false);
  assert.deepEqual(row.scene.buildFlags, { development: false, production: true });
  assert.equal(row.clock.latest.id, first.clock.latest.id);
  assert.equal(row.clock.latest.source, result.sourceCommit); assert.equal(row.clock.latest.mode, 'running');
  assert.equal(row.clock.latest.unobservedGaps, 0);
  assert.ok(row.stats && Number.isFinite(row.stats.css.active));
}
async function checkpoint(label, phase, collect = false) {
  const observed = await observe(); requireInactiveCheckpoint(observed, phase);
  assert.ok(client, 'Dedicated profiler attached only after the active observation');
  if (collect) await within(client.send('HeapProfiler.collectGarbage'), 30000, 'paused-gc-timeout');
  const [heap, dom] = await Promise.all([client.send('Runtime.getHeapUsage'), client.send('Memory.getDOMCounters')]);
  const attached = await page.evaluate(() => {
    const animations = document.getAnimations();
    return { nodes: document.querySelectorAll('*').length, canvases: document.querySelectorAll('canvas').length,
      images: document.images.length, nativeAnimations: animations.length,
      animationStates: Object.fromEntries(['running', 'paused', 'finished', 'idle'].map(state =>
        [state, animations.filter(animation => animation.playState === state).length])) };
  });
  const memory = sampleBrowserMemory(); assert.equal(memory.contentProcessObserved, true);
  assert.ok(Number.isFinite(memory.summedPssKiB));
  const row = { label, phase, forcedGc: collect, at: new Date().toISOString(),
    sameGameDocument: observed.timeOrigin === first.timeOrigin,
    mounted: observed.mounted, stats: observed.stats, audio: observed.scene?.audio ?? null,
    heap: cleanHeapUsage(heap), dom, attached, memory };
  assert.ok(row.heap); result.checkpoints.push(row);
  if (nativeCollector?.wants(label)) {
    row.nativeDump = await nativeCollector.request(label, phase);
    row.afterNativeDumpMemory = sampleBrowserMemory();
    assert.equal(row.afterNativeDumpMemory.contentProcessObserved, true);
    assert.ok(Number.isFinite(row.afterNativeDumpMemory.summedPssKiB));
  }
  return row;
}
async function snapshot(label, phase) {
  requireInactiveCheckpoint(await observe(), phase);
  const path = output + '/' + label + '.heapsnapshot', fd = openSync(path, 'wx');
  let bytes = 0, over = false, chunks = 0;
  const receive = ({ chunk }) => {
    const value = Buffer.from(chunk); bytes += value.length; chunks++;
    if (bytes > 128 * 1024 * 1024) { over = true; return; }
    if (!over) writeSync(fd, value);
  };
  client.on('HeapProfiler.addHeapSnapshotChunk', receive);
  try {
    await within(client.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false, captureNumericValue: false }),
      90000, 'inactive-snapshot-timeout');
  } finally { client.off('HeapProfiler.addHeapSnapshotChunk', receive); closeSync(fd); }
  if (over) { unlinkSync(path); throw Error('snapshot-byte-budget-exceeded'); }
  const raw = readFileSync(path); assert.ok(chunks > 0);
  const graph = summarizeHeap(JSON.parse(raw.toString('utf8'))), compressed = gzipSync(raw, { level: 6 });
  writeFileSync(path + '.gz', compressed); unlinkSync(path);
  const row = { label, phase, activePlay: false, afterExplicitInactiveGc: true,
    file: label + '.heapsnapshot.gz', bytes: raw.length, compressedBytes: compressed.length,
    sha256: createHash('sha256').update(compressed).digest('hex'), ...graph };
  result.snapshots.push(row); return row;
}
try {
  server = await serveDevicePreview(); browser = await pw.chromium.launch({ headless: true });
  result.engineVersion = browser.version();
  const profile = configuration('android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  if (comparison?.pathProof) await context.addInitScript(installNativePathProbe);
  if (styleObservation) await context.addInitScript(installStyleWriteProbe);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(25000);
  page.on('pageerror', () => { fatal ||= 'uncaught-javascript-error'; });
  page.on('crash', () => { fatal ||= 'renderer-crash'; });
  page.on('response', response => {
    if (response.url().startsWith(server.origin + '/') && ['script', 'stylesheet', 'image', 'font'].includes(response.request().resourceType())
      && response.status() >= 400) assetFailures.push({ type: response.request().resourceType(), status: response.status() });
  });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const info = await (await context.request.get(server.origin + '/device-preview-info.json')).json();
  assert.equal(info.sourceCommit, result.sourceCommit); assert.equal(info.sourceTree, result.sourceTree);
  assert.equal(info.diagnosticScene, 'original-artwork'); assert.equal(info.guestOnly, true);
  assert.equal(info.liveBackend, false); assert.equal(info.payments, false); assert.equal(info.automaticUpload, false);
  assert.equal(info.qaLifetimeAttribution?.capturesGameInstance, false);
  assert.equal(info.qaLifetimeAttribution?.activeNativeAnimationScan, false);
  assert.equal(info.qaLifetimeAttribution?.cleanupPolicyChanged, false); result.buildProof = info.qaLifetimeAttribution;
  if (comparison) {
    const expected = comparisonProof(readFileSync(root + '/frontend/src/lib/cssFramePacing.ts', 'utf8'), comparison.condition);
    assert.deepEqual(info.qaIsolatedMiniPacing, expected); result.isolatedBuildProof = expected;
  } else assert.equal(info.qaIsolatedMiniPacing, undefined);
  assert.equal(await page.getByRole('checkbox', { name: 'Vollaufzeichnung zusätzlich aktivieren', exact: true }).isChecked(), false);
  assert.equal(await page.getByRole('checkbox', { name: 'Testschutz: Tod und Bossende verhindern', exact: true }).isChecked(), true);
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }).waitFor({ state: 'visible', timeout: 45000 });
  result.preparedMenuStats = await page.evaluate(() => window.__lifetimeAttributionStats());
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  await tap(page.locator('.pause-resume-button'));
  await page.waitForFunction(({ key }) => {
    const s = window.__crossDeviceTest?.inspect();
    return s?.status === 'playing' && s.encounter === 'boss-fight' && s.reactorOpen
      && JSON.parse(localStorage.getItem(key) || 'null')?.latest?.mode === 'running';
  }, { key: STOPWATCH_KEY }, { timeout: 45000 });
  first = await observe(styleObservation); active(first);
  const started = Date.now(); let previous = first, frameProgressAt = started, sampledAt = 0, printedAt = started;
  while (previous.clock.latest.elapsedMs - first.clock.latest.elapsedMs < seconds * 1000) {
    const row = styleObservation && result.points.length === 0 ? first : await observe(); active(row);
    assert.ok(row.clock.latest.elapsedMs >= previous.clock.latest.elapsedMs);
    if (row.scene.frameAt > previous.scene.frameAt) frameProgressAt = Date.now();
    assert.ok(Date.now() - frameProgressAt < 5000, 'Game frames advance');
    assert.ok(Date.now() - started < seconds * 2000 + 90000, 'Observation wall-time budget');
    if (Date.now() - sampledAt >= 5000) {
      sampledAt = Date.now(); const memory = sampleBrowserMemory();
      assert.equal(memory.contentProcessObserved, true); assert.ok(Number.isFinite(memory.summedPssKiB));
      const point = { activeMs: row.clock.latest.elapsedMs - first.clock.latest.elapsedMs,
        coreVolley: row.scene.coreVolley, shots: row.scene.shots, hostileShots: row.scene.hostileShots,
        effects: row.scene.effects, css: row.stats.css, painted: row.stats.painted,
        canvas: row.stats.canvas, audio: row.scene.audio, memory };
      result.points.push(point); appendFileSync(output + '/active-points.jsonl', JSON.stringify(point) + '\n');
    }
    if (Date.now() - printedAt >= 30000) {
      printedAt = Date.now(); console.log('CRYPTOID_ATTRIBUTION_PROGRESS ' + JSON.stringify({ seconds,
        activeSeconds: Math.floor((row.clock.latest.elapsedMs - first.clock.latest.elapsedMs) / 1000),
        cssActive: row.stats.css.active, pssMiB: result.points.at(-1).memory.summedPssKiB / 1024 }));
    }
    previous = row; await page.waitForTimeout(1000);
  }
  result.observedActiveMs = previous.clock.latest.elapsedMs - first.clock.latest.elapsedMs;
  result.observedWallMs = Date.now() - started;
  result.volleysAdvanced = previous.scene.coreVolley - first.scene.coreVolley;
  assert.ok(result.volleysAdvanced > 0);
  if (styleObservation) {
    result.styleWriteObservation = await page.evaluate(() => window.__styleWriteProbe.finish());
    assertStyleProof(result.styleWriteObservation);
    result.styleProbeRemovedBeforeInactiveInspection = await page.evaluate(() => typeof window.__styleWriteProbe === 'undefined');
    assert.equal(result.styleProbeRemovedBeforeInactiveInspection, true);
  }
  if (comparison?.pathProof) {
    result.isolatedMiniNativeProof = await page.evaluate(() => window.__isolatedMiniNativeProof());
    assertPathProof(result.isolatedMiniNativeProof, comparison.condition);
  } else if (comparison) {
    assert.equal(await page.evaluate(() => typeof window.__isolatedMiniNativeProof), 'undefined', 'No native wrappers in long observations');
  }
  await tap(page.locator('.home-control')); await page.locator('#leave-mission-title').waitFor();
  await page.waitForFunction(({ key }) => window.__crossDeviceTest.inspect().status === 'paused'
    && JSON.parse(localStorage.getItem(key)).latest.mode === 'paused', { key: STOPWATCH_KEY });
  requireInactiveCheckpoint(await observe(), 'paused');
  client = await context.newCDPSession(page); await client.send('HeapProfiler.enable');
  if (nativeAllocation) {
    const before = sampleBrowserMemory();
    nativeCollector = await startInactiveNativeCollector({
      session: await browser.newBrowserCDPSession(),
      guard: async phase => requireInactiveCheckpoint(await observe(), phase),
      save: bytes => writeFileSync(output + '/native-memory-infra.json.gz', bytes),
    });
    result.inactiveNativeTraceAttachment = { before, after: sampleBrowserMemory() };
  }
  await checkpoint('paused-before-gc', 'paused');
  await page.waitForTimeout(5000); await checkpoint('paused-settled-before-gc', 'paused');
  await checkpoint('paused-after-gc', 'paused', true);
  await snapshot('paused', 'paused');
  await checkpoint('paused-after-snapshot', 'paused');
  await tap(page.getByRole('button', { name: 'Spiel verlassen', exact: true }));
  await page.waitForFunction(({ key }) => !document.querySelector('.game-shell')
    && JSON.parse(localStorage.getItem(key)).latest.mode === 'ended', { key: STOPWATCH_KEY });
  assert.equal(await page.evaluate(() => performance.timeOrigin), first.timeOrigin);
  // Retire only the existing QA controller bridge; the module-only read bridge
  // remains available and has no component-instance references.
  result.qaControllerBridgeRemoved = await page.evaluate(() => {
    const present = !!window.__crossDeviceTest; delete window.__crossDeviceTest; return present;
  });
  assert.equal(result.qaControllerBridgeRemoved, true);
  await checkpoint('home-before-gc', 'unmounted');
  await page.waitForTimeout(5000); await checkpoint('home-settled-before-gc', 'unmounted');
  await checkpoint('home-after-gc', 'unmounted', true);
  await snapshot('home', 'unmounted'); await checkpoint('home-after-snapshot', 'unmounted');
  await client.send('HeapProfiler.disable'); await client.detach(); client = null;
  // Explicit document destruction is a diagnostic boundary, not game recovery.
  await page.goto('about:blank'); await page.waitForTimeout(5000);
  client = await context.newCDPSession(page); await client.send('HeapProfiler.enable');
  await checkpoint('blank-before-gc', 'blank'); await checkpoint('blank-after-gc', 'blank', true);
  if (nativeCollector) result.inactiveNativeAllocation = await nativeCollector.finish();
  result.explicitBlankDocumentControl = true;
  assert.deepEqual(external, []); assert.deepEqual(assetFailures, []); assert.ok(!fatal, fatal);
  result.complete = true;
} catch (error) {
  result.failure = { code: fatal || 'attribution-failed', message: error.message };
  process.exitCode = 1;
} finally {
  if (styleObservation && !result.styleWriteObservation && page) try {
    result.abortedStyleWriteObservation = await page.evaluate(() => window.__styleWriteProbe?.finish());
  } catch { /* A closed page is retired by browser cleanup below. */ }
  result.finishedAt = new Date().toISOString();
  writeFileSync(output + '/attribution.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_ATTRIBUTION_RESULT ' + JSON.stringify({ complete: result.complete, seconds,
    observedActiveMs: result.observedActiveMs, checkpoints: result.checkpoints.length,
    snapshots: result.snapshots.length, failure: result.failure }));
  if (nativeCollector && !nativeCollector.finished) try { await nativeCollector.abort(); } catch { /* Original failure already recorded. */ }
  if (client) try { await client.detach(); } catch { /* Preserve original capture failure. */ }
  if (browser) await browser.close(); if (server) await server.close();
}
