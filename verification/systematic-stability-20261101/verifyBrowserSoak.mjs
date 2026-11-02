import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { sampleBrowserMemory } from '../boss2-forensics-20261028/processMemory.mjs';
import { STOPWATCH_KEY } from '../boss2-stopwatch-20261029/stopwatchState.mjs';
import { thrustConfig, thrustProof } from '../boss-thrust-scope-20261102/transform.mjs';
import { verifyThrustFidelity } from '../boss-thrust-scope-20261102/fidelity.mjs';
import { requireInactiveCheckpoint } from '../memory-retention-attribution-20261101/inspection.mjs';

const engine = process.env.CRYPTOID_SOAK_ENGINE;
const condition = process.env.CRYPTOID_SOAK_CONDITION;
const seconds = Number(process.env.CRYPTOID_SOAK_SECONDS || 1200);
const run = process.env.CRYPTOID_SOAK_RUN || 'soak';
const thrust = thrustConfig();
assert.ok(['chromium', 'webkit'].includes(engine), 'Explicit engine required');
assert.ok(['original', 'mini-start'].includes(condition), 'Explicit source treatment required');
assert.ok(Number.isInteger(seconds) && seconds >= 30 && seconds <= 1800);
assert.ok(['smoke', 'soak'].includes(run));
const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
if (thrust) { assert.equal(run, 'smoke'); assert.equal(seconds, 60); assert.equal(thrust.fidelity, true); }
const output = thrust
  ? resolve(root, 'verification/boss-thrust-scope-20261102/results', `${engine}-${thrust.condition}-r${thrust.replica}`)
  : resolve(root, 'verification/systematic-stability-20261101/results', `${engine}-${condition}`, run);
mkdirSync(output, { recursive: true });
const git = ref => execFileSync('git', ['rev-parse', ref], { cwd: root, encoding: 'utf8' }).trim();
const result = { version: 1, complete: false, sourceCommit: git('HEAD'), sourceTree: git('HEAD^{tree}'),
  engine, condition, run, requestedActiveSeconds: seconds, actualHostOS: process.platform,
  physicalDevice: false, physicalPiBrowser: false, nativeTerminationCauseMeasured: false,
  whiteScreenFixed: false, clocksAccelerated: false, automaticResume: false,
  additionalFullRecording: false, collisionProtection: true, activeScreenshots: false,
  forcedGc: false, heapSnapshots: false, extraGameCollectors: false,
  scenario: 'Existing protected guest Boss 2 reactor, then two short remounts in the same browser context',
  comparedConditionsAreVisuallyDifferent: true,
  limits: ['Independent Linux conditions; no causal A/B performance effect or phone acceptance inferred.',
    'Alive DOM and advancing game clocks do not measure native white pixels or a physical browser kill.',
    'Resource counters are sampled subsets. Linux process PSS is neither phone RAM nor GPU memory.'],
  cycles: [] };
if (thrust) {
  result.thrustComparison = thrust; result.comparedConditionsAreVisuallyDifferent = false;
  result.shortEngineCompatibilityOnly = true; result.memoryComparisonEligible = false;
}
let browser, server, page, fatal;
const external = [], assetFailures = [];
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 });
  assert.ok(await locator.isEnabled(), 'UI action enabled');
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox(), viewport = page.viewportSize();
  assert.ok(box && viewport);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  assert.ok(x >= 0 && y >= 0 && x < viewport.width && y < viewport.height, 'Native tap inside viewport');
  await page.touchscreen.tap(x, y);
}
const observe = () => page.evaluate(key => ({ timeOrigin: performance.timeOrigin, hidden: document.hidden,
  scene: window.__crossDeviceTest?.inspect(), clock: JSON.parse(localStorage.getItem(key) || 'null'),
  mounted: !!document.querySelector('.game-shell') }), STOPWATCH_KEY);
const waitMode = mode => page.waitForFunction(({ key, mode }) =>
  JSON.parse(localStorage.getItem(key) || 'null')?.latest?.mode === mode,
  { key: STOPWATCH_KEY, mode }, { timeout: 45000 });
function verifyActive(observed, first) {
  assert.ok(!fatal, fatal); assert.equal(observed.timeOrigin, first.timeOrigin, 'Same document');
  assert.equal(observed.hidden, false); assert.equal(observed.mounted, true);
  assert.equal(observed.scene?.status, 'playing', 'Unexpected pause must fail, never auto-Resume');
  assert.equal(observed.scene.technicalPause, false);
  assert.equal(observed.scene.encounter, 'boss-fight'); assert.equal(observed.scene.sector, 20);
  assert.equal(observed.scene.reactorOpen, true); assert.equal(observed.scene.ownerDiagnostics, false);
  assert.deepEqual(observed.scene.buildFlags, { development: false, production: true });
  assert.equal(observed.clock.latest.source, result.sourceCommit);
  assert.equal(observed.clock.latest.id, first.clock.latest.id);
  assert.equal(observed.clock.latest.mode, 'running');
  assert.equal(observed.clock.latest.unobservedGaps, 0, 'No hidden/unobserved interval accepted');
}
try {
  server = await serveDevicePreview(); browser = await pw[engine].launch({ headless: true });
  result.engineVersion = browser.version();
  const profile = configuration(engine === 'webkit' ? 'iphone' : 'android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(25000);
  page.on('pageerror', () => { fatal ||= 'uncaught-javascript-error'; });
  page.on('crash', () => { fatal ||= 'renderer-crash'; });
  page.on('response', response => {
    const type = response.request().resourceType();
    if (response.url().startsWith(server.origin + '/') && ['script', 'stylesheet', 'image', 'font'].includes(type)
      && response.status() >= 400) assetFailures.push({ type, status: response.status() });
  });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const response = await context.request.get(server.origin + '/device-preview-info.json');
  assert.equal(response.status(), 200);
  const info = await response.json();
  assert.equal(info.sourceCommit, result.sourceCommit); assert.equal(info.sourceTree, result.sourceTree);
  assert.equal(info.guestOnly, true); assert.equal(info.liveBackend, false);
  assert.equal(info.actualPiAuthentication, false); assert.equal(info.payments, false);
  assert.equal(info.automaticResume, false); assert.equal(info.automaticUpload, false);
  assert.equal(info.diagnosticStopwatch?.version, 1);
  assert.equal(!!info.bossMiniStartControl?.enabled, condition === 'mini-start');
  assert.equal(!!info.bossMiniCompletionControl?.enabled, condition === 'mini-start');
  result.builtScene = info.diagnosticScene;
  if (thrust) {
    const expected = thrustProof(readFileSync(root + '/frontend/src/pages/BossHullView.tsx', 'utf8'), thrust.condition);
    assert.deepEqual(info.qaThrustScope, expected); result.thrustBuildProof = expected;
  } else assert.equal(info.qaThrustScope, undefined);
  result.productionRuntimeNotChanged = true;
  for (let cycle = 0; cycle < 3; cycle++) {
    const requestedMs = (cycle === 0 ? seconds : 10) * 1000;
    const row = { cycle, requestedMs, complete: false, points: [] }; result.cycles.push(row);
    const fullToggle = page.getByRole('checkbox', { name: 'Vollaufzeichnung zusätzlich aktivieren', exact: true });
    assert.equal(await fullToggle.isChecked(), false);
    assert.equal(await page.getByRole('checkbox', { name: 'Testschutz: Tod und Bossende verhindern', exact: true }).isChecked(), true);
    await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
    await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
    await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
    await tap(page.locator('.pause-resume-button')); await waitMode('running');
    // Resume first enters the existing boss intro. Begin the measured interval
    // only after the authored intro actually reaches the open-reactor fight.
    await page.waitForFunction(() => {
      const state = window.__crossDeviceTest?.inspect();
      return state?.status === 'playing' && state.encounter === 'boss-fight' && state.reactorOpen;
    }, null, { timeout: 45000 });
    const first = await observe(); verifyActive(first, first);
    const started = Date.now(); let previous = first, progressAt = started, printedAt = started, sampledAt = 0;
    while (previous.clock.latest.elapsedMs - first.clock.latest.elapsedMs < requestedMs) {
      assert.ok(Date.now() - started < requestedMs * 2 + 90000, 'Wall-time budget exceeded');
      const observed = await observe(); verifyActive(observed, first);
      assert.ok(observed.clock.latest.elapsedMs >= previous.clock.latest.elapsedMs, 'Monotonic active clock');
      if (observed.scene.frameAt > previous.scene.frameAt) progressAt = Date.now();
      assert.ok(Date.now() - progressAt < 5000, 'Game frame progress continues');
      if (Date.now() - sampledAt >= 5000) {
        sampledAt = Date.now(); const memory = sampleBrowserMemory();
        assert.equal(memory.contentProcessObserved, true); assert.ok(Number.isFinite(memory.summedPssKiB));
        const point = { activeMs: observed.clock.latest.elapsedMs - first.clock.latest.elapsedMs,
          coreVolley: observed.scene.coreVolley, shots: observed.scene.shots, hostileShots: observed.scene.hostileShots,
          effects: observed.scene.effects, canvas: observed.scene.canvas, audio: observed.scene.audio,
          linuxBrowserDescendantPssKiB: memory.summedPssKiB };
        row.points.push(point); appendFileSync(output + `/cycle-${cycle}.jsonl`, JSON.stringify(point) + '\n');
      }
      if (Date.now() - printedAt >= 30000) {
        printedAt = Date.now(); console.log('CRYPTOID_SOAK_PROGRESS ' + JSON.stringify({ engine, condition, cycle,
          activeSeconds: Math.floor((observed.clock.latest.elapsedMs - first.clock.latest.elapsedMs) / 1000) }));
      }
      previous = observed; await page.waitForTimeout(1000);
    }
    row.observedActiveMs = previous.clock.latest.elapsedMs - first.clock.latest.elapsedMs;
    row.observedWallMs = Date.now() - started;
    assert.ok(previous.scene.coreVolley > first.scene.coreVolley, 'Reactor advances real volleys');
    row.volleysAdvanced = previous.scene.coreVolley - first.scene.coreVolley;
    await tap(page.getByRole('button', { name: 'Pause', exact: true })); await waitMode('paused');
    const paused = await observe(); await page.waitForTimeout(1600); const held = await observe();
    assert.equal(held.clock.latest.elapsedMs, paused.clock.latest.elapsedMs);
    assert.equal(held.scene.coreVolley, paused.scene.coreVolley); row.pauseFreezeVerified = true;
    if (thrust) row.thrustFidelity = await verifyThrustFidelity({ page, condition: thrust.condition,
      guard: async phase => requireInactiveCheckpoint(await observe(), phase) });
    await tap(page.locator('.pause-resume-button')); await waitMode('running');
    await tap(page.getByRole('button', { name: /^Waffen · Aktive Waffe:/ }));
    await page.locator('.weapon-selection-dialog').waitFor(); await waitMode('paused');
    await tap(page.locator('.weapon-drawer-tab')); await waitMode('running'); row.weaponRoundtripVerified = true;
    await tap(page.locator('.home-control')); await page.locator('#leave-mission-title').waitFor();
    await tap(page.getByRole('button', { name: 'Spiel verlassen', exact: true })); await waitMode('ended');
    assert.equal(await page.locator('.game-shell').count(), 0);
    const closed = await observe(); assert.equal(closed.clock.latest.mode, 'ended');
    // The existing test-only inspection bridge closes over the last controller.
    // Removing it after unmount is harness cleanup, never an application fix.
    await page.evaluate(() => { delete window.__crossDeviceTest; });
    row.qaInspectionBridgeReleased = true; row.normalExitVerified = true; row.complete = true;
  }
  await tap(page.getByRole('button', { name: 'Letzten Testbericht vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Berichtstext in Teilen anzeigen', exact: true }));
  const part = JSON.parse(await page.getByRole('textbox', { name: 'Diagnosebericht', exact: true }).inputValue());
  assert.equal(part.total, 1); const report = JSON.parse(part.data);
  assert.equal(report.fullSession, null); assert.equal(report.briefMatchesLatestStopwatch, true);
  assert.equal(report.stopwatch.latest.mode, 'ended');
  assert.equal(report.briefDiagnostics.latest.options.fullRecording, false);
  result.normalReportVerified = true;
  assert.deepEqual(external, []); assert.deepEqual(assetFailures, []); assert.ok(!fatal, fatal);
  result.complete = true;
} catch (error) {
  result.failure = { code: fatal || 'verification-failed', message: error.message };
  if (page && !page.isClosed()) try { result.lastObservation = await observe(); }
  catch { result.lastObservationUnavailable = true; }
  process.exitCode = 1;
} finally {
  result.finishedAt = new Date().toISOString();
  writeFileSync(output + '/verification.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_SOAK_RESULT ' + JSON.stringify({ complete: result.complete, engine, condition,
    sourceCommit: result.sourceCommit, activeMs: result.cycles.map(row => row.observedActiveMs), failure: result.failure }));
  if (browser) await browser.close(); if (server) await server.close();
}
