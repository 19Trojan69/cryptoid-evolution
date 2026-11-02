import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { sampleBrowserMemory } from '../boss2-forensics-20261028/processMemory.mjs';
import { STOPWATCH_KEY } from '../boss2-stopwatch-20261029/stopwatchState.mjs';
import { requireInactiveCheckpoint } from '../memory-retention-attribution-20261101/inspection.mjs';
import { pressurePlan, rendererPss, requireActivePressureState } from './policy.mjs';
import { captureActiveLight } from './collector.mjs';

const plan = pressurePlan();
const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
const frontendRequire = createRequire(root + '/frontend/package.json');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const output = resolve(root, 'verification/active-pressure-attribution-20261102/results', plan.mode + '-r' + plan.replica);
mkdirSync(output, { recursive: true });
const result = { version: 1, kind: 'active-pressure-attribution', complete: false, plan,
  sourceCommit: git('rev-parse', 'HEAD'), sourceTree: git('rev-parse', 'HEAD^{tree}'), actualHostOS: process.platform,
  actualInstalledPackages: Object.fromEntries(['react', 'react-dom', 'react-router-dom', 'vite', 'typescript']
    .map(name => [name, frontendRequire(name + '/package.json').version])),
  nodeVersion: process.version, playwrightVersion: createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright/package.json').version,
  lockSha256: createHash('sha256').update(readFileSync(root + '/frontend/yarn.lock')).digest('hex'),
  changedTrackedPaths: git('diff', '--name-only').split('\n').filter(Boolean),
  originalArtwork: true, additionalFullRecording: false, collisionProtection: true, randomnessSeeded: false,
  clocksAccelerated: false, automaticResume: false, activeApiWrappers: false, activeHeapProfiler: false,
  activeHeapSnapshots: false, activeScreenshots: false, activeAnimationScans: false, requestedGc: false,
  memoryComparisonEligible: false, calibrationOnly: plan.mode === 'calibration',
  physicalDevice: false, physicalPiBrowser: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false,
  points: [], lifecycle: [], pressureEvidenceQualified: false };
let server, browser, page, first, fatal;
const external = [], assets = [];
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded(); const box = await locator.boundingBox(), v = page.viewportSize();
  assert.ok(box && v); const x = box.x + box.width / 2, y = box.y + box.height / 2;
  assert.ok(x >= 0 && y >= 0 && x < v.width && y < v.height); await page.touchscreen.tap(x, y);
}
const observe = () => page.evaluate(key => ({ now: performance.now(), timeOrigin: performance.timeOrigin,
  url: location.href, hidden: document.hidden, mounted: !!document.querySelector('.game-shell'),
  scene: window.__crossDeviceTest?.inspect() ?? null, stats: window.__lifetimeAttributionStats?.() ?? null,
  clock: JSON.parse(localStorage.getItem(key) || 'null') }), STOPWATCH_KEY);
function active(row) {
  assert.ok(!fatal, fatal); requireActivePressureState(row, first, result.sourceCommit);
}
const guard = async () => {
  const row = await observe(); active(row);
  return { timeOrigin: row.timeOrigin, now: row.now, frameAt: row.scene.frameAt,
    clockElapsedMs: row.clock.latest.elapsedMs, clockMode: row.clock.latest.mode,
    gameStatus: row.scene.status, technicalPause: row.scene.technicalPause, unobservedGaps: row.clock.latest.unobservedGaps };
};
try {
  server = await serveDevicePreview(); browser = await pw.chromium.launch({ headless: true });
  result.engineVersion = browser.version();
  const profile = configuration('android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(25000);
  page.on('pageerror', () => { fatal ||= 'uncaught-javascript-error'; });
  page.on('crash', () => { fatal ||= 'renderer-crash-event'; });
  page.on('response', response => {
    if (response.url().startsWith(server.origin + '/') && ['script', 'stylesheet', 'image', 'font'].includes(response.request().resourceType())
      && response.status() >= 400) assets.push({ type: response.request().resourceType(), status: response.status() });
  });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const info = await (await context.request.get(server.origin + '/device-preview-info.json')).json();
  assert.equal(info.sourceCommit, result.sourceCommit); assert.equal(info.sourceTree, result.sourceTree);
  assert.equal(info.diagnosticScene, 'original-artwork'); assert.equal(info.guestOnly, true);
  assert.equal(info.liveBackend, false); assert.equal(info.payments, false); assert.equal(info.automaticUpload, false);
  for (const key of ['qaThrustScope', 'qaIsolatedMiniPacing']) assert.equal(info[key], undefined);
  assert.equal(info.qaLifetimeAttribution.capturesGameInstance, false); result.buildProof = info.qaLifetimeAttribution;
  result.buildWorkingTreeDirty = info.workingTreeDirty;
  assert.equal(await page.getByRole('checkbox', { name: 'Vollaufzeichnung zusätzlich aktivieren', exact: true }).isChecked(), false);
  assert.equal(await page.getByRole('checkbox', { name: 'Testschutz: Tod und Bossende verhindern', exact: true }).isChecked(), true);
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  await tap(page.locator('.pause-resume-button'));
  await page.waitForFunction(({ key }) => {
    const s = window.__crossDeviceTest?.inspect();
    return s?.status === 'playing' && s.encounter === 'boss-fight' && s.reactorOpen
      && JSON.parse(localStorage.getItem(key) || 'null')?.latest?.mode === 'running';
  }, { key: STOPWATCH_KEY }, { timeout: 45000 });
  first = await observe(); active(first);
  const began = Date.now(); let previous = first, sampledAt = 0, frameAt = began, printedAt = began;
  while (true) {
    const row = result.points.length === 0 ? first : await observe(); active(row);
    assert.ok(row.clock.latest.elapsedMs >= previous.clock.latest.elapsedMs);
    if (row.scene.frameAt > previous.scene.frameAt) frameAt = Date.now();
    assert.ok(Date.now() - frameAt < 5000, 'Real game frames advance');
    assert.ok(Date.now() - began < plan.maxActiveMs + 180000, 'Declared observation wall-time budget');
    const activeMs = row.clock.latest.elapsedMs - first.clock.latest.elapsedMs;
    result.observedActiveMs = activeMs; result.observedWallMs = Date.now() - began;
    let memory;
    if (Date.now() - sampledAt >= 5000 || activeMs >= plan.maxActiveMs) {
      sampledAt = Date.now(); memory = sampleBrowserMemory(); rendererPss(memory);
      const point = { activeMs, now: row.now, frameAt: row.scene.frameAt, coreVolley: row.scene.coreVolley,
        css: row.stats.css, canvas: row.stats.canvas, painted: row.stats.painted, audio: row.scene.audio, memory };
      result.points.push(point); appendFileSync(output + '/active-points.jsonl', JSON.stringify(point) + '\n');
    }
    if (memory && activeMs >= plan.minActiveMs && rendererPss(memory) >= plan.thresholdKiB) {
      result.trigger = { mode: plan.mode, metric: plan.metric, thresholdKiB: plan.thresholdKiB, activeMs, memory };
      result.nativeProbe = await captureActiveLight({ session: await browser.newBrowserCDPSession(), guard,
        trigger: result.trigger, sample: sampleBrowserMemory,
        save: bytes => writeFileSync(output + '/active-light-memory.json.gz', bytes) });
      assert.equal(result.nativeProbe.complete, true, result.nativeProbe.failure?.message);
      assert.equal(result.nativeProbe.tracingStopped, true); assert.equal(result.nativeProbe.sessionDetached, true);
      result.pressureEvidenceQualified = result.nativeProbe.pressureMaintainedAcrossProbe;
      result.outcome = plan.mode === 'calibration' ? 'calibration-collected'
        : result.pressureEvidenceQualified ? 'active-pressure-collected' : 'pressure-changed-during-probe';
      break;
    }
    if (activeMs >= plan.maxActiveMs) { result.outcome = 'pressure-threshold-not-observed'; break; }
    if (Date.now() - printedAt >= 30000) {
      printedAt = Date.now(); const m = result.points.at(-1).memory;
      console.log('CRYPTOID_PRESSURE_PROGRESS ' + JSON.stringify({ mode: plan.mode, replica: plan.replica,
        activeMs, rendererPssMiB: rendererPss(m) / 1024, totalPssMiB: m.summedPssKiB / 1024 }));
    }
    previous = row; await page.waitForTimeout(1000);
  }
  const last = await observe(); active(last); result.volleysAdvanced = last.scene.coreVolley - first.scene.coreVolley;
  assert.ok(result.volleysAdvanced > 0); result.activeMsAtProbeEnd = last.clock.latest.elapsedMs - first.clock.latest.elapsedMs;
  await tap(page.locator('.home-control')); await page.locator('#leave-mission-title').waitFor();
  await page.waitForFunction(({ key }) => window.__crossDeviceTest.inspect().status === 'paused'
    && JSON.parse(localStorage.getItem(key)).latest.mode === 'paused', { key: STOPWATCH_KEY });
  requireInactiveCheckpoint(await observe(), 'paused');
  result.lifecycle.push({ label: 'paused-immediate', memory: sampleBrowserMemory() });
  await page.waitForTimeout(5000); requireInactiveCheckpoint(await observe(), 'paused');
  result.lifecycle.push({ label: 'paused-settled-without-requested-gc', memory: sampleBrowserMemory() });
  await tap(page.getByRole('button', { name: 'Spiel verlassen', exact: true }));
  await page.waitForFunction(({ key }) => !document.querySelector('.game-shell')
    && JSON.parse(localStorage.getItem(key)).latest.mode === 'ended', { key: STOPWATCH_KEY });
  const ended = await observe(); requireInactiveCheckpoint(ended, 'unmounted');
  result.normalExitVerified = true;
  result.qaControllerBridgeRemoved = await page.evaluate(() => { const present = !!window.__crossDeviceTest; delete window.__crossDeviceTest; return present; });
  assert.equal(result.qaControllerBridgeRemoved, true); await page.waitForTimeout(5000);
  result.lifecycle.push({ label: 'home-settled-without-requested-gc', memory: sampleBrowserMemory(), stats: ended.stats });
  assert.deepEqual(external, []); assert.deepEqual(assets, []); assert.ok(!fatal, fatal);
  if (plan.mode === 'pressure' && !result.pressureEvidenceQualified) {
    result.failure = { code: result.outcome, message: 'Declared active high-pressure attribution target was not obtained; this is not a measured game crash.' };
    process.exitCode = 2;
  } else result.complete = true;
} catch (error) {
  result.failure = { code: fatal || 'active-pressure-observation-failed', message: error.message };
  if (page && !page.isClosed()) try { result.lastObservation = await observe(); } catch { result.lastObservationUnavailable = true; }
  process.exitCode = 1;
} finally {
  result.finishedAt = new Date().toISOString();
  writeFileSync(output + '/attribution.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_PRESSURE_RESULT ' + JSON.stringify({ complete: result.complete, mode: plan.mode, replica: plan.replica,
    activeMs: result.observedActiveMs, outcome: result.outcome, pressureQualified: result.pressureEvidenceQualified, failure: result.failure }));
  if (browser) await browser.close(); if (server) await server.close();
}
