import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';
import { readSourceState } from './sourceState.mjs';

const SOURCE = 'b042c8e50ad3f05a70418ae5ee6bb4412809035b', TREE = '921fe9212ce0ccfeaa7dc46352d3d6385c7f3fb2';
const [sourceArg, outputArg] = process.argv.slice(2);
assert.ok(sourceArg && outputArg);
const source = resolve(sourceArg), output = resolve(outputArg);
mkdirSync(output, { recursive: true });
const result = { version: 1, complete: false, sourceCommit: SOURCE, sourceTree: TREE,
  actualHostOS: process.platform, physicalDevice: false, physicalPiBrowser: false, whiteScreenFixed: false,
  runtimeSourceChanged: false, deliberateReloadControl: true, nativeKillSimulated: false,
  activeScreenshots: false, additionalQaContactListeners: true,
  limits: ['Original existing Chromium CDP contact probes; not physical OS navigation or physical fingers.',
    'Contact QA listeners are temporary measurement instrumentation, separate from the 30-minute captures.',
    'Deliberate ordinary page reload is not a native crash and does not identify the phone cause.'] };
let browser, server, page, fatal;
try {
  const git = ref => execFileSync('git', ['rev-parse', ref], { cwd: source, encoding: 'utf8' }).trim();
  assert.equal(git('HEAD'), SOURCE); assert.equal(git('HEAD^{tree}'), TREE);
  const generated = readSourceState(source);
  execFileSync(process.execPath, ['verification/direct-boss-style-device-20261102/verifyScope.mjs'], { cwd: source, stdio: 'inherit' });
  execFileSync(process.execPath, ['verification/direct-boss-style-device-20261102/verifyPackage.mjs'], { cwd: source, stdio: 'inherit' });
  const pw = createRequire(resolve(source, 'verification/boss2-forensics-20261028/package.json'))('playwright');
  const load = p => import(pathToFileURL(resolve(source, p)));
  const { configuration } = await load('verification/boss2-forensics-20261028/fixture.mjs');
  const { serveDevicePreview } = await load('verification/boss2-forensics-20261028/devicePreviewServer.mjs');
  const { STOPWATCH_KEY } = await load('verification/boss2-stopwatch-20261029/stopwatchState.mjs');
  // The old probe assumes owner-only full pause telemetry. The frozen minimal
  // package intentionally has that telemetry off. Adapt only its TWO reads to
  // actual menu/game/clock state, preserving every original input action.
  const originalProbe = readFileSync(resolve(source, 'verification/single-finger-controls-20261029/verify-device-input.mjs'), 'utf8');
  const oldPause = "assert.equal(await page.evaluate(()=>window.__bossLabPauseEvents.at(-1).pauseReason),'weapon-menu');";
  assert.equal(originalProbe.split(oldPause).length, 3, 'Exactly two legacy pause telemetry checks');
  const prefix = `async function assertMinimalWeaponPause(page) {
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || 'null')?.latest?.mode === 'paused', ${JSON.stringify(STOPWATCH_KEY)});
    const s = await page.evaluate(() => window.__crossDeviceTest.inspect());
    assert.equal(s.status, 'paused'); assert.equal(s.weaponMenuOpen, true); assert.equal(s.technicalPause, false);
    assert.equal(await page.locator('.weapon-selection-dialog').isVisible(), true);
  }\n`;
  let adapted = originalProbe.replaceAll(oldPause, 'await assertMinimalWeaponPause(page);');
  const imports = ['../contact-diagnostics-20261029/verifyNeutralContacts.mjs', '../window-focus-diagnostics-20261029/verifyElementFocus.mjs'];
  for (const old of imports) { assert.equal(adapted.split("'" + old + "'").length, 2);
    adapted = adapted.replace("'" + old + "'", JSON.stringify(pathToFileURL(resolve(source, 'verification/single-finger-controls-20261029', old)).href)); }
  let restored = adapted.replaceAll('await assertMinimalWeaponPause(page);', oldPause);
  for (const old of imports) restored = restored.replace(JSON.stringify(pathToFileURL(resolve(source, 'verification/single-finger-controls-20261029', old)).href), "'" + old + "'");
  assert.equal(restored, originalProbe, 'All native input actions and other checks remain byte-identical');
  const adaptedPath = resolve(dirname(fileURLToPath(import.meta.url)), 'inputProbe.generated.mjs');
  writeFileSync(adaptedPath, prefix + adapted);
  const { verifyDeviceInput } = await import(pathToFileURL(adaptedPath));
  result.measurementAdaptation = { legacyPauseLogReadsReplaced: 2, originalContactActionsRestoredExactly: true,
    requiresPausedClock: true, requiresVisibleWeaponsDialog: true, requiresPausedNontechnicalGame: true };
  server = await serveDevicePreview(); browser = await pw.chromium.launch({ headless: true });
  result.engineVersion = browser.version();
  const context = await browser.newContext({ ...configuration('android-phone', pw.devices).context,
    viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  const external = [], assetFailures = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', () => { fatal ||= 'uncaught-javascript-error'; });
  page.on('crash', () => { fatal ||= 'renderer-crash'; });
  page.on('response', response => {
    if (response.url().startsWith(server.origin + '/') && response.status() >= 400) assetFailures.push(response.status());
  });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const tap = async locator => { await locator.waitFor(); await locator.scrollIntoViewIfNeeded();
    const b = await locator.boundingBox(); assert.ok(b); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); };
  assert.equal(await page.getByRole('checkbox', { name: 'Vollaufzeichnung zusätzlich aktivieren', exact: true }).isChecked(), false);
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  await tap(page.locator('.pause-resume-button'));
  await page.waitForFunction(() => { const s = window.__crossDeviceTest?.inspect(); return s?.status === 'playing' && s.encounter === 'boss-fight' && s.reactorOpen; });
  result.input = await verifyDeviceInput(page, context);
  assert.equal(result.input.complete, true);
  const first = await page.evaluate(key => ({ timeOrigin: performance.timeOrigin,
    scene: window.__crossDeviceTest.inspect(), clock: JSON.parse(localStorage.getItem(key)) }), STOPWATCH_KEY);
  assert.equal(first.scene.ownerDiagnostics, false); assert.equal(first.scene.status, 'playing');
  assert.equal(first.scene.technicalPause, false); assert.equal(first.clock.latest.source, SOURCE);
  assert.equal(first.clock.latest.mode, 'running'); assert.equal(first.clock.latest.unobservedGaps, 0);
  await page.waitForTimeout(1200);
  const checkpoint = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).latest, STOPWATCH_KEY);
  assert.equal(checkpoint.id, first.clock.latest.id); assert.ok(checkpoint.elapsedMs > first.clock.latest.elapsedMs);
  assert.equal(checkpoint.mode, 'running');
  // Explicit negative control: a normal browser reload while combat is active.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }).waitFor();
  await page.locator('[data-diagnostic-stopwatch][data-location="menu"]').waitFor();
  assert.equal(await page.locator('.game-shell').count(), 0, 'No automatic combat resume');
  const next = await page.evaluate(() => ({ timeOrigin: performance.timeOrigin,
    navigationType: performance.getEntriesByType('navigation')[0]?.type }));
  assert.ok(next.timeOrigin > first.timeOrigin); assert.equal(next.navigationType, 'reload');
  await tap(page.getByRole('button', { name: 'Letzten Testbericht vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Berichtstext in Teilen anzeigen', exact: true }));
  const part = JSON.parse(await page.getByRole('textbox', { name: 'Diagnosebericht', exact: true }).inputValue());
  assert.equal(part.total, 1); const report = JSON.parse(part.data);
  assert.equal(report.source.sourceCommit, SOURCE); assert.equal(report.fullSession, null);
  assert.equal(report.briefMatchesLatestStopwatch, true);
  assert.equal(report.stopwatch.latest.id, first.clock.latest.id);
  assert.ok(report.stopwatch.latest.elapsedMs >= checkpoint.elapsedMs);
  assert.equal(report.returnEvidence.lastSession.active, true);
  assert.ok(report.returnEvidence.reloadTrace.events.some(e => e.kind === 'boot-after-active-session'));
  result.reload = { previousDocument: first.timeOrigin, newDocument: next.timeOrigin,
    navigationType: next.navigationType, oldRunIdRetained: true, savedActiveMs: report.stopwatch.latest.elapsedMs,
    bootAfterActiveSessionObserved: true, noAutomaticResume: true };
  writeFileSync(resolve(output, 'synthetic-report-after-deliberate-reload.json'), JSON.stringify(report, null, 2) + '\n');
  await page.screenshot({ path: resolve(output, 'menu-after-deliberate-reload.png') });
  assert.deepEqual(external, []); assert.deepEqual(assetFailures, []); assert.ok(!fatal, fatal);
  assert.deepEqual(readSourceState(source), generated);
  result.complete = true;
} catch (e) { result.failure = { code: fatal ?? 'verification-failed', message: String(e.message).slice(0, 4096) }; process.exitCode = 1; }
finally {
  result.finishedAt = new Date().toISOString();
  writeFileSync(resolve(output, 'input-reload-verification.json'), JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_NATIVE_INPUT_RELOAD ' + JSON.stringify({ complete: result.complete, failure: result.failure }));
  if (browser) await browser.close(); if (server) await server.close();
}
