import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { STOPWATCH_KEY } from '../boss2-stopwatch-20261029/stopwatchState.mjs';
import { BRIEF_KEY, MAX_BYTES, MAX_EVENTS } from './briefState.mjs';
const engine = process.env.CRYPTOID_BRIEF_ENGINE;
assert.ok(['chromium', 'webkit'].includes(engine));
const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
const directory = resolve(root, 'verification/boss2-brief-report-20261030/results', engine);
mkdirSync(directory, { recursive: true });
const result = { complete: false, engine, physicalDevice: false, physicalCrashSimulated: false,
  fullRecording: false, multiContactsSynthetic: true, whiteScreenFixed: false };
let server, browser, page, fatal;
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded(); const box = await locator.boundingBox(); assert.ok(box);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}
const saved = key => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
const waitClock = mode => page.waitForFunction(({ key, mode }) => JSON.parse(localStorage.getItem(key))?.latest?.mode === mode,
  { key: STOPWATCH_KEY, mode }, { timeout: 45000 });
async function start() {
  const recording = page.getByRole('checkbox', { name: 'Vollaufzeichnung zusätzlich aktivieren', exact: true });
  assert.equal(await recording.isChecked(), false);
  assert.equal(await page.getByRole('checkbox', { name: 'Testschutz: Tod und Bossende verhindern', exact: true }).isChecked(), true);
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  await tap(page.locator('.pause-resume-button')); await waitClock('running');
}
async function prepare() {
  await tap(page.getByRole('button', { name: 'Letzten Testbericht vorbereiten', exact: true }));
  await page.getByRole('button', { name: 'Bericht speichern', exact: true }).waitFor();
  await tap(page.getByRole('button', { name: 'Berichtstext in Teilen anzeigen', exact: true }));
  const area = page.getByRole('textbox', { name: 'Diagnosebericht', exact: true });
  await area.waitFor();
  const part = JSON.parse(await area.inputValue()); assert.equal(part.total, 1);
  return { report: JSON.parse(part.data), bytes: part.data };
}
try {
  server = await serveDevicePreview(); browser = await pw[engine].launch({ headless: true }); result.engineVersion = browser.version();
  const profile = configuration(engine === 'webkit' ? 'iphone' : 'android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  const external = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort();
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => {
      const file = data.files[0]; window.__syntheticShare = { name: file.name, type: file.type, text: await file.text() };
    } });
  });
  page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', error => { fatal ||= 'javascript-error: ' + error.message; });
  page.on('crash', () => { fatal ||= 'renderer-crash'; });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const response = await context.request.get(server.origin + '/device-preview-info.json');
  assert.equal(response.status(), 200); const info = await response.json(); result.source = info.sourceCommit;
  assert.equal(info.briefReport.activeWithFullRecordingOff, true);
  assert.equal(info.diagnosticReactorControl.kind, 'svg-reactor-display-none');
  assert.equal(info.diagnosticCssControl.kind, 'all-css-filters-off');
  assert.ok((await page.locator('.device-preview-menu section').evaluate(n => getComputedStyle(n, '::before').content)).includes('SVG-Reaktor ausgeblendet'));
  await start(); const origin = await page.evaluate(() => performance.timeOrigin);
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.latest?.elapsedMs >= 20000, STOPWATCH_KEY, { timeout: 90000 });
  const clock = await saved(STOPWATCH_KEY); const brief = await saved(BRIEF_KEY);
  assert.equal(brief.latest.clock.id, clock.latest.id); assert.equal(brief.latest.options.fullRecording, false);
  assert.equal(await page.evaluate(() => localStorage.getItem('cryptoid_owner_full_status_v1')), null);
  assert.equal(await page.evaluate(() => window.__crossDeviceTest.inspect().ownerDiagnostics), false);
  assert.equal(await page.locator('.boss-special-weapon').evaluate(n => getComputedStyle(n).display), 'none');
  await page.locator('.game-field').evaluate(field => {
    for (const id of [900001, 900002]) field.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true, pointerId: id, pointerType: 'touch', isPrimary: false }));
    for (const id of [900001, 900002]) field.dispatchEvent(new PointerEvent('pointercancel', {
      bubbles: true, cancelable: true, pointerId: id, pointerType: 'touch', isPrimary: false }));
  });
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.latest?.events.some(e => e.contacts === 2), BRIEF_KEY);
  const contacts = (await saved(BRIEF_KEY)).latest.events.filter(e => e.kind === 'pointerdown' && e.contacts === 2);
  assert.ok(contacts.length); assert.equal(contacts[0].trusted, false);
  result.syntheticContactCapture = true; result.activeObservedMs = clock.latest.elapsedMs;
  await tap(page.getByRole('button', { name: /^(Pause|Pausieren)$/, exact: true })); await waitClock('paused');
  const paused = await saved(STOPWATCH_KEY); await page.waitForTimeout(2100);
  assert.equal((await saved(STOPWATCH_KEY)).latest.elapsedMs, paused.latest.elapsedMs);
  assert.equal((await saved(BRIEF_KEY)).latest.clock.mode, 'paused'); result.pauseFreezes = true;
  await page.screenshot({ path: directory + '/paused-brief-preview.png' });
  await tap(page.locator('.pause-resume-button')); await waitClock('running');
  const beforeReload = await saved(STOPWATCH_KEY);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-diagnostic-stopwatch][data-location="menu"]').waitFor();
  const restored = await saved(STOPWATCH_KEY); assert.equal(restored.latest.id, beforeReload.latest.id);
  assert.ok(restored.latest.elapsedMs >= beforeReload.latest.elapsedMs);
  const first = await prepare(), report = first.report;
  assert.equal(report.version, 2); assert.equal(report.source.sourceCommit, info.sourceCommit);
  assert.equal(report.fullSession, null); assert.equal(report.selectedFullSessionId, null);
  assert.equal(report.stopwatch.latest.id, restored.latest.id); assert.equal(report.briefMatchesLatestStopwatch, true);
  assert.equal(report.briefDiagnostics.latest.options.fullRecording, false);
  assert.ok(report.returnEvidence.activeDocument.startedAt > origin);
  assert.ok(report.briefDiagnostics.latest.events.some(e => e.contacts === 2));
  assert.equal(report.stopwatch.exactCrashTime, false); result.activeReloadRestoresReport = true;
  const second = await prepare(); assert.notEqual(second.report.reportId, report.reportId);
  const downloadPromise = page.waitForEvent('download');
  await tap(page.getByRole('button', { name: 'Bericht speichern', exact: true })); const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), `cryptoid-diagnose-${second.report.reportId}.json`);
  await download.saveAs(directory + '/synthetic-downloaded-report.json');
  assert.equal(readFileSync(directory + '/synthetic-downloaded-report.json', 'utf8'), second.bytes);
  await tap(page.getByRole('button', { name: 'Bericht teilen', exact: true }));
  await page.waitForFunction(() => window.__syntheticShare?.text);
  const shared = await page.evaluate(() => window.__syntheticShare);
  assert.equal(shared.name, download.suggestedFilename()); assert.equal(shared.text, second.bytes);
  result.uniqueFilenameDownloadTextAndShareAgree = true;
  await start(); await page.waitForFunction(({ key, id }) => JSON.parse(localStorage.getItem(key))?.latest?.id !== id,
    { key: STOPWATCH_KEY, id: restored.latest.id });
  assert.equal((await saved(BRIEF_KEY)).previous.clock.id, restored.latest.id);
  await tap(page.locator('.home-control')); await page.locator('#leave-mission-title').waitFor();
  await tap(page.locator('.game-overlay .game-modal').filter({ has: page.locator('#leave-mission-title') }).locator('.modal-actions .button-primary'));
  await waitClock('ended');
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.latest?.clock.mode === 'ended', BRIEF_KEY);
  assert.equal((await saved(BRIEF_KEY)).previous.clock.id, restored.latest.id);
  const raw = await page.evaluate(key => localStorage.getItem(key), BRIEF_KEY);
  assert.ok(raw.length <= MAX_BYTES); assert.doesNotMatch(raw, /pointerId|clientX|clientY|pressure|pageX|pageY/);
  assert.ok((await saved(BRIEF_KEY)).latest.events.length <= MAX_EVENTS);
  result.previousRunPreservedAndNormalEnd = true;
  await page.screenshot({ path: directory + '/completed-brief-preview.png' });
  assert.deepEqual(external, []); assert.ok(!fatal, fatal); result.complete = true;
} catch (error) {
  result.failure = { code: fatal || 'brief-preview-verification-failed', message: error.message, stack: error.stack }; process.exitCode = 1;
  if (page && !page.isClosed()) try { await page.screenshot({ path: directory + '/failure.png', timeout: 5000 }); } catch { /* Preserve first failure. */ }
} finally {
  result.finishedAt = new Date().toISOString(); writeFileSync(directory + '/verification.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_BRIEF_PREVIEW_RESULT ' + JSON.stringify(result));
  if (browser) await browser.close(); if (server) await server.close();
}
