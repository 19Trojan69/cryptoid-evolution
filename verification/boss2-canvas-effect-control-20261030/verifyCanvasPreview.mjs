import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { STOPWATCH_KEY } from '../boss2-stopwatch-20261029/stopwatchState.mjs';
const engine = process.env.CRYPTOID_CANVAS_ENGINE, controlled = process.env.CRYPTOID_CANVAS_EFFECT_CONTROL === '1';
assert.ok(['chromium', 'webkit'].includes(engine));
const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
const directory = resolve(root, 'verification/boss2-canvas-effect-control-20261030/results', engine, controlled ? 'fallback' : 'canvas');
mkdirSync(directory, { recursive: true });
const result = { complete: false, engine, controlled, physicalDevice: false, physicalCrashSimulated: false, whiteScreenFixed: false,
  fullRecording: false, comparisonUsesNaturalCombatAndAutomatedTouchSteering: true };
let server, browser, page, fatal;
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded(); const box = await locator.boundingBox(); assert.ok(box);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}
const inspect = () => page.evaluate(() => window.__crossDeviceTest.inspect());
const clock = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STOPWATCH_KEY);
const waitMode = mode => page.waitForFunction(({ key, mode }) => JSON.parse(localStorage.getItem(key))?.latest?.mode === mode,
  { key: STOPWATCH_KEY, mode }, { timeout: 45000 });
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
  page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', e => { fatal ||= 'javascript-error: ' + e.message; }); page.on('crash', () => { fatal ||= 'renderer-crash'; });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const response = await context.request.get(server.origin + '/device-preview-info.json');
  assert.equal(response.status(), 200); const info = await response.json(); result.source = info.sourceCommit;
  assert.equal(info.canvasEffectControl.enabled, controlled);
  assert.equal(info.canvasEffectControl.otherCanvasesDisabled, false);
  assert.equal(info.diagnosticReactorControl.kind, 'svg-reactor-display-none');
  assert.equal(info.diagnosticCssControl.kind, 'all-css-filters-off');
  assert.equal(await page.getByRole('checkbox', { name: 'Vollaufzeichnung zusätzlich aktivieren', exact: true }).isChecked(), false);
  assert.equal(await page.getByRole('checkbox', { name: 'Testschutz: Tod und Bossende verhindern', exact: true }).isChecked(), true);
  const banner = await page.locator('.device-preview-menu section').evaluate(n => getComputedStyle(n, '::before').content);
  assert.ok(banner.includes(controlled ? 'Explosions-Canvas aus' : 'Explosions-Canvas an')); result.bannerMatches = true;
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  assert.equal(await page.locator('[data-stopwatch-value]').innerText(), '00:00');
  await page.evaluate(() => {
    window.__qaOriginalImpacts = 0;
    const check = node => {
      if (!(node instanceof Element)) return;
      if (node.matches('.impact-effect.explosion, .impact-effect.shatter') && node.querySelector('.scattered-debris')) window.__qaOriginalImpacts++;
      for (const e of node.querySelectorAll('.impact-effect.explosion, .impact-effect.shatter')) if (e.querySelector('.scattered-debris')) window.__qaOriginalImpacts++;
    };
    new MutationObserver(rows => { for (const row of rows) for (const node of row.addedNodes) check(node); }).observe(document.querySelector('.game-field'), { childList: true, subtree: true });
  });
  await tap(page.locator('.pause-resume-button')); await waitMode('running');
  await page.waitForFunction(() => window.__crossDeviceTest.inspect().encounter === 'boss-fight');
  const before = await inspect(), origin = await page.evaluate(() => performance.timeOrigin), end = Date.now() + 90000;
  let snapshot, saved, originalImpacts = 0;
  while (Date.now() < end) {
    if (fatal) throw Error(fatal);
    snapshot = await inspect(); saved = await clock(); originalImpacts = await page.evaluate(() => window.__qaOriginalImpacts);
    if (saved.latest.elapsedMs >= 20000 && snapshot.destroyed > 0 && (controlled ? originalImpacts > 0 : snapshot.canvas.draws > 0)) break;
    const aim = await page.evaluate(() => {
      const field = document.querySelector('.game-field')?.getBoundingClientRect();
      const enemy = document.querySelector('.asteroid.cryptoid')?.getBoundingClientRect();
      if (!field || !enemy) return null;
      return { x: Math.max(field.left + 35, Math.min(field.right - 35, enemy.left + enemy.width / 2)), y: field.top + field.height * .70 };
    });
    if (aim) await page.touchscreen.tap(aim.x, aim.y);
    await page.waitForTimeout(750);
  }
  assert.ok(saved.latest.elapsedMs >= 20000); assert.ok(snapshot.destroyed > 0, 'A natural escort destruction is required');
  assert.equal(snapshot.status, 'playing'); assert.ok(snapshot.frameAt > before.frameAt);
  assert.ok(snapshot.coreVolley > before.coreVolley); assert.equal(snapshot.ownerDiagnostics, false);
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  assert.equal(await page.locator('.normal-effects-surface').count(), controlled ? 0 : 1);
  if (controlled) {
    assert.ok(originalImpacts > 0, 'The existing original-effect fallback actually rendered');
    for (const key of ['sourceImages', 'textureEntries', 'cacheBytes', 'surfaceBytes', 'draws', 'registeredEffects', 'retainedHullUsers']) assert.equal(snapshot.canvas[key], 0, key);
  } else assert.ok(snapshot.canvas.draws > 0, 'The comparison actually used the original 2D effect renderer');
  result.activeObservation = { elapsedMs: saved.latest.elapsedMs, destroyed: snapshot.destroyed, frameAt: snapshot.frameAt,
    coreVolley: snapshot.coreVolley, originalImpacts, canvasResources: snapshot.canvas,
    attachedCanvases: await page.locator('canvas').count(), sameDocument: true };
  await tap(page.getByRole('button', { name: 'Pause', exact: true })); await waitMode('paused');
  const paused = await clock(); await page.waitForTimeout(2100);
  assert.equal((await clock()).latest.elapsedMs, paused.latest.elapsedMs); result.pauseFreezes = true;
  await page.screenshot({ path: directory + '/paused-control.png' });
  await tap(page.locator('.pause-resume-button')); await waitMode('running');
  await tap(page.locator('.home-control')); await page.locator('#leave-mission-title').waitFor();
  await tap(page.getByRole('button', { name: 'Spiel verlassen', exact: true })); await waitMode('ended');
  await tap(page.getByRole('button', { name: 'Letzten Testbericht vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Berichtstext in Teilen anzeigen', exact: true }));
  const part = JSON.parse(await page.getByRole('textbox', { name: 'Diagnosebericht', exact: true }).inputValue());
  assert.equal(part.total, 1); const report = JSON.parse(part.data);
  assert.equal(report.source.sourceCommit, info.sourceCommit);
  assert.equal(report.source.diagnosticCanvasEffects, controlled ? 'existing-original-impact-fallback' : 'original-canvas-renderer');
  assert.equal(report.briefMatchesLatestStopwatch, true); assert.equal(report.fullSession, null);
  assert.equal(report.briefDiagnostics.latest.options.fullRecording, false); result.reportAndNormalEndPreserved = true;
  assert.deepEqual(external, []); assert.ok(!fatal, fatal); result.complete = true;
} catch (error) {
  result.failure = { message: error.message, stack: error.stack }; process.exitCode = 1;
  if (page && !page.isClosed()) try { await page.screenshot({ path: directory + '/failure.png', timeout: 5000 }); } catch { /* Preserve original failure. */ }
} finally {
  result.finishedAt = new Date().toISOString(); writeFileSync(directory + '/verification.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_CANVAS_CONTROL_RESULT ' + JSON.stringify(result));
  if (browser) await browser.close(); if (server) await server.close();
}
