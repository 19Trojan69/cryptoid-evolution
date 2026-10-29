import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { STOPWATCH_KEY, formatStopwatch } from './stopwatchState.mjs';

const engine = process.env.CRYPTOID_STOPWATCH_ENGINE;
assert.ok(['chromium', 'webkit'].includes(engine));
const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
const directory = resolve(root, 'verification/boss2-stopwatch-20261029/results', engine);
mkdirSync(directory, { recursive: true });
const result = { complete: false, engine, physicalDevice: false, whiteScreenFixed: false,
  fullRecording: false, originalGameClocks: true, originalSingleFingerInput: true,
  additionalStopwatch: true, deliberateReload: true, physicalCrashSimulated: false };
let server, browser, page, fatal;
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded(); const box = await locator.boundingBox(), viewport = page.viewportSize();
  assert.ok(box && viewport); const x = box.x + box.width / 2, y = box.y + box.height / 2;
  assert.ok(x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height);
  await page.touchscreen.tap(x, y);
}
const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STOPWATCH_KEY);
const clockValue = () => page.locator('[data-stopwatch-value]').innerText();
async function startScene() {
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  await page.locator('[data-diagnostic-stopwatch][data-location="game"]').waitFor();
  assert.equal(await clockValue(), '00:00');
}
try {
  server = await serveDevicePreview(); browser = await pw[engine].launch({ headless: true });
  result.engineVersion = browser.version();
  const profile = configuration(engine === 'webkit' ? 'iphone' : 'android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  const external = [];
  await context.route('**/*', route => { const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort(); });
  page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', () => { fatal ||= 'javascript-error'; }); page.on('crash', () => { fatal ||= 'renderer-crash'; });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  await page.locator('[data-diagnostic-stopwatch][data-location="menu"]').waitFor();
  assert.equal(await clockValue(), '00:00');
  const infoResponse = await context.request.get(server.origin + '/device-preview-info.json');
  assert.equal(infoResponse.status(), 200); const info = await infoResponse.json();
  assert.equal(info.diagnosticStopwatch.checkpointMs, 1000); assert.equal(info.diagnosticStopwatch.hardCrashTimeIsExact, false);
  assert.equal(info.diagnosticCssControl.kind, 'all-css-filters-off'); result.build = info;
  const recording = page.getByRole('checkbox', { name: 'Diagnose lokal aufzeichnen', exact: true });
  assert.equal(await recording.isChecked(), true); await tap(recording); assert.equal(await recording.isChecked(), false);
  await startScene();
  result.initialPauseZero = true;
  assert.equal(await page.locator('[data-diagnostic-stopwatch]').evaluate(node => getComputedStyle(node).pointerEvents), 'none');
  assert.equal(await page.locator('.game-hud').evaluate(node => getComputedStyle(node).backdropFilter || getComputedStyle(node).webkitBackdropFilter), 'none');
  const origin = await page.evaluate(() => performance.timeOrigin);
  await tap(page.locator('.pause-resume-button'));
  await page.waitForFunction(key => { const value = JSON.parse(localStorage.getItem(key));
    return window.__crossDeviceTest?.inspect().status === 'playing' && value?.latest?.mode === 'running'; }, STOPWATCH_KEY, { timeout: 45000 });
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.latest?.elapsedMs >= 12000, STOPWATCH_KEY, { timeout: 45000 });
  const playing = await saved(); assert.equal(playing.latest.source, info.sourceCommit);
  assert.equal(await page.evaluate(() => window.__crossDeviceTest.inspect().ownerDiagnostics), false);
  assert.equal(await page.evaluate(() => localStorage.getItem('cryptoid_owner_full_status_v1')), null);
  result.activeCheckpoint = playing.latest;
  await tap(page.getByRole('button', { name: /^(Pause|Pausieren)$/, exact: true }));
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.latest?.mode === 'paused', STOPWATCH_KEY);
  const paused = await saved(), pausedText = await clockValue();
  await page.waitForTimeout(3000);
  assert.equal((await saved()).latest.elapsedMs, paused.latest.elapsedMs); assert.equal(await clockValue(), pausedText);
  result.realPauseFreezes = true;
  await page.screenshot({ path: directory + '/paused-stopwatch.png' });
  await tap(page.locator('.pause-resume-button'));
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.latest?.mode === 'running', STOPWATCH_KEY, { timeout: 45000 });
  await page.waitForFunction(({ key, before }) => JSON.parse(localStorage.getItem(key))?.latest?.elapsedMs >= before + 4000,
    { key: STOPWATCH_KEY, before: paused.latest.elapsedMs }, { timeout: 30000 });
  assert.equal((await saved()).latest.id, paused.latest.id); result.resumeKeepsSameRun = true;
  await tap(page.locator('.home-control'));
  await page.locator('#leave-mission-title').waitFor();
  await tap(page.locator('.game-overlay .game-modal').filter({ has: page.locator('#leave-mission-title') }).locator('.modal-actions .button-primary'));
  await page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }).waitFor();
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.latest?.mode === 'ended', STOPWATCH_KEY);
  const ended = await saved(); result.ended = ended.latest;
  assert.equal(await clockValue(), formatStopwatch(ended.latest.elapsedMs));
  await page.waitForTimeout(2000); assert.equal((await saved()).latest.elapsedMs, ended.latest.elapsedMs);
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin); result.normalExitKeepsVisibleTime = true;
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-diagnostic-stopwatch][data-location="menu"]').waitFor();
  assert.equal(await clockValue(), formatStopwatch(ended.latest.elapsedMs));
  assert.equal((await saved()).latest.id, ended.latest.id); result.explicitReloadRestoresWithoutAddingTime = true;
  await page.screenshot({ path: directory + '/restored-stopwatch.png' });
  await startScene(); assert.equal((await saved()).latest.id, ended.latest.id);
  result.newPreparationDoesNotEraseOldTime = true;
  await tap(page.locator('.pause-resume-button'));
  await page.waitForFunction(({ key, old }) => { const value = JSON.parse(localStorage.getItem(key));
    return value?.latest?.id !== old && value?.previous?.id === old; }, { key: STOPWATCH_KEY, old: ended.latest.id }, { timeout: 45000 });
  const next = await saved(); assert.ok(next.latest.elapsedMs < 3000); result.newStartPreservesPreviousRun = true;
  assert.ok(JSON.stringify(next).length < 2048); assert.deepEqual(external, []); assert.ok(!fatal, fatal);
  result.unexpectedExternalRequests = external; result.complete = true;
} catch (error) {
  result.failure = { code: fatal || 'stopwatch-verification-failed', message: error.message }; process.exitCode = 1;
  if (page && !page.isClosed()) try { await page.screenshot({ path: directory + '/failure.png', timeout: 5000 }); } catch { /* Preserve first error. */ }
} finally {
  result.finishedAt = new Date().toISOString(); writeFileSync(directory + '/verification.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_STOPWATCH_RESULT ' + JSON.stringify({ complete: result.complete, engine, activeCheckpoint: result.activeCheckpoint?.elapsedMs,
    endMs: result.ended?.elapsedMs, pause: result.realPauseFreezes, reload: result.explicitReloadRestoresWithoutAddingTime, failure: result.failure }));
  if (browser) await browser.close(); if (server) await server.close();
}
