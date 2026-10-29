import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { STOPWATCH_KEY, formatStopwatch } from '../boss2-stopwatch-20261029/stopwatchState.mjs';

const engine = process.env.CRYPTOID_REACTOR_CONTROL_ENGINE;
assert.ok(['chromium', 'webkit'].includes(engine));
const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
const directory = resolve(root, 'verification/boss2-reactor-visual-control-20261029/results', engine);
mkdirSync(directory, { recursive: true });
const result = { complete: false, engine, physicalDevice: false, whiteScreenFixed: false,
  fullRecording: false, diagnosticVisualControl: true, physicalCrashSimulated: false };
let server, browser, page, fatal;
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded(); const box = await locator.boundingBox(), viewport = page.viewportSize();
  assert.ok(box && viewport); const x = box.x + box.width / 2, y = box.y + box.height / 2;
  assert.ok(x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height);
  await page.touchscreen.tap(x, y);
}
const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STOPWATCH_KEY);
const inspect = () => page.evaluate(() => window.__crossDeviceTest.inspect());
const waitMode = mode => page.waitForFunction(({ key, mode }) => JSON.parse(localStorage.getItem(key))?.latest?.mode === mode,
  { key: STOPWATCH_KEY, mode }, { timeout: 45000 });
async function pause() {
  await tap(page.getByRole('button', { name: /^(Pause|Pausieren)$/, exact: true }));
  await waitMode('paused');
}
async function resume() { await tap(page.locator('.pause-resume-button')); await waitMode('running'); }
async function paintSnapshot() {
  return page.evaluate(() => {
    const svg = document.querySelector('.boss-special-weapon');
    const boxes = Object.fromEntries(['.game-field', '.boss-hull', '.player-ship'].map(selector => {
      const node = document.querySelector(selector); if (!node) throw Error('Missing retained node ' + selector);
      const box = node.getBoundingClientRect(); return [selector, { x: box.x, y: box.y, width: box.width, height: box.height }];
    }));
    return { boxes, reactorCount: document.querySelectorAll('.boss-special-weapon').length,
      reactorDisplay: getComputedStyle(svg).display, reactorRects: svg.getClientRects().length,
      phase: window.__crossDeviceTest.inspect().encounter };
  });
}
try {
  server = await serveDevicePreview(); browser = await pw[engine].launch({ headless: true });
  result.engineVersion = browser.version();
  const profile = configuration(engine === 'webkit' ? 'iphone' : 'android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  const external = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', () => { fatal ||= 'javascript-error'; }); page.on('crash', () => { fatal ||= 'renderer-crash'; });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const infoResponse = await context.request.get(server.origin + '/device-preview-info.json');
  assert.equal(infoResponse.status(), 200); const info = await infoResponse.json(); result.build = info;
  assert.equal(info.diagnosticReactorControl.kind, 'svg-reactor-display-none');
  assert.equal(info.diagnosticReactorControl.audioChanged, false);
  assert.equal(info.diagnosticCssControl.kind, 'all-css-filters-off');
  const label = await page.locator('.device-preview-menu section').evaluate(node => getComputedStyle(node, '::before').content);
  assert.ok(label.includes('SVG-Reaktor ausgeblendet')); result.visibleMenuLabel = true;
  const recording = page.getByRole('checkbox', { name: 'Diagnose lokal aufzeichnen', exact: true });
  assert.equal(await recording.isChecked(), true); await tap(recording); assert.equal(await recording.isChecked(), false);
  assert.equal(await page.getByRole('checkbox', { name: 'Testschutz: Tod und Bossende verhindern', exact: true }).isChecked(), true);
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  assert.equal(await page.locator('[data-stopwatch-value]').innerText(), '00:00');
  const origin = await page.evaluate(() => performance.timeOrigin);
  await resume();
  await page.waitForFunction(() => window.__crossDeviceTest.inspect().encounter === 'boss-fight'
    && document.querySelector('.boss-special-weapon'), null, { timeout: 45000 });
  await pause();
  const hidden = await paintSnapshot(); assert.equal(hidden.reactorCount, 1); assert.equal(hidden.reactorDisplay, 'none');
  assert.equal(hidden.reactorRects, 0); assert.equal(hidden.phase, 'boss-fight');
  await page.locator('#diagnostic-reactor-control').evaluate(link => { link.disabled = true; });
  const original = await paintSnapshot(); assert.notEqual(original.reactorDisplay, 'none'); assert.equal(original.reactorRects, 1);
  assert.deepEqual(original.boxes, hidden.boxes);
  await page.locator('#diagnostic-reactor-control').evaluate(link => { link.disabled = false; });
  assert.deepEqual(await paintSnapshot(), hidden);
  result.pausedSameBuildComparison = { original, hidden };
  await resume();
  const before = await inspect(), beforeTime = (await saved()).latest.elapsedMs;
  await page.waitForFunction(({ key, elapsed, volley }) => {
    const state = window.__crossDeviceTest.inspect(), clock = JSON.parse(localStorage.getItem(key));
    return state.status === 'playing' && state.coreVolley >= volley + 2 && clock.latest.elapsedMs >= elapsed + 20000;
  }, { key: STOPWATCH_KEY, elapsed: beforeTime, volley: before.coreVolley }, { timeout: 90000 });
  const after = await inspect(), afterClock = await saved();
  assert.ok(after.frameAt > before.frameAt); assert.equal(after.reactorOpen, true); assert.equal(after.ownerDiagnostics, false);
  assert.equal(afterClock.latest.source, info.sourceCommit);
  assert.equal(await page.evaluate(() => localStorage.getItem('cryptoid_owner_full_status_v1')), null);
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  assert.equal((await paintSnapshot()).reactorDisplay, 'none');
  result.activeObservation = { durationMs: afterClock.latest.elapsedMs - beforeTime,
    initialCoreVolley: before.coreVolley, finalCoreVolley: after.coreVolley,
    initialFrameAt: before.frameAt, finalFrameAt: after.frameAt,
    coreStillOpen: after.reactorOpen, sameDocument: true };
  await pause(); const paused = await saved(); await page.waitForTimeout(3000);
  assert.equal((await saved()).latest.elapsedMs, paused.latest.elapsedMs); result.realPauseFreezes = true;
  await page.screenshot({ path: directory + '/paused-reactor-control.png' });
  await resume(); await tap(page.locator('.home-control')); await page.locator('#leave-mission-title').waitFor();
  await tap(page.locator('.game-overlay .game-modal').filter({ has: page.locator('#leave-mission-title') }).locator('.modal-actions .button-primary'));
  await page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }).waitFor();
  await waitMode('ended'); const ended = await saved(); result.ended = ended.latest;
  assert.equal(await page.locator('[data-stopwatch-value]').innerText(), formatStopwatch(ended.latest.elapsedMs));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-diagnostic-stopwatch][data-location="menu"]').waitFor();
  assert.equal((await saved()).latest.id, ended.latest.id); assert.equal((await saved()).latest.elapsedMs, ended.latest.elapsedMs);
  result.explicitReloadRestoresTime = true;
  await tap(page.getByRole('button', { name: 'Begrenzten lokalen Bericht vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Berichtstext in Teilen anzeigen', exact: true }));
  const part = JSON.parse(await page.getByRole('textbox', { name: 'Diagnosebericht', exact: true }).inputValue());
  assert.equal(part.total, 1); const report = JSON.parse(part.data);
  assert.equal(report.source.sourceCommit, info.sourceCommit); assert.equal(report.fullSession, null);
  assert.ok(report.returnEvidence.activeDocument.startedAt > origin);
  result.limitedTextExportAfterDeliberateReload = true;
  assert.deepEqual(external, []); assert.ok(!fatal, fatal); result.complete = true;
} catch (error) {
  result.failure = { code: fatal || 'reactor-control-verification-failed', message: error.message, stack: error.stack }; process.exitCode = 1;
  if (page && !page.isClosed()) try { await page.screenshot({ path: directory + '/failure.png', timeout: 5000 }); } catch { /* Preserve first error. */ }
} finally {
  result.finishedAt = new Date().toISOString(); writeFileSync(directory + '/verification.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_REACTOR_CONTROL_RESULT ' + JSON.stringify({ complete: result.complete, engine,
    activeObservation: result.activeObservation, endMs: result.ended?.elapsedMs, failure: result.failure }));
  if (browser) await browser.close(); if (server) await server.close();
}
