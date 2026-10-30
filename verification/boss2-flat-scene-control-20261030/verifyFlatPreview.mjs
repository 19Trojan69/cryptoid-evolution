import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { STOPWATCH_KEY } from '../boss2-stopwatch-20261029/stopwatchState.mjs';
const engine = process.env.CRYPTOID_FLAT_ENGINE, controlled = process.env.CRYPTOID_FLAT_SCENE === '1';
const backgroundComparison = process.env.CRYPTOID_BACKGROUND_COMPARISON === '1';
const originalBackground = backgroundComparison && process.env.CRYPTOID_FLAT_BACKGROUND === '1';
assert.ok(['chromium', 'webkit'].includes(engine));
const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
const directory = backgroundComparison
  ? resolve(root, 'verification/boss2-background-control-20261030/results', engine, originalBackground ? 'background-on' : 'background-off')
  : resolve(root, 'verification/boss2-flat-scene-control-20261030/results', engine, controlled ? 'flat' : 'artwork');
mkdirSync(directory, { recursive: true });
const result = { complete: false, engine, controlled, physicalDevice: false, physicalCrashSimulated: false,
  whiteScreenFixed: false, fullRecording: false, steeringEventsSynthetic: true, visualPreparationRetained: true,
  comparison: backgroundComparison ? 'original-background-toggle' : 'original-artwork-vs-flat', originalBackground };
let server, browser, page, fatal;
const inspect = () => page.evaluate(() => window.__crossDeviceTest.inspect());
const clock = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STOPWATCH_KEY);
const waitMode = mode => page.waitForFunction(({ key, mode }) => JSON.parse(localStorage.getItem(key))?.latest?.mode === mode,
  { key: STOPWATCH_KEY, mode }, { timeout: 45000 });
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded(); const box = await locator.boundingBox(); assert.ok(box);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}
async function pause() { await tap(page.getByRole('button', { name: 'Pause', exact: true })); await waitMode('paused'); }
async function resume() { await tap(page.locator('.pause-resume-button')); await waitMode('running'); }
async function initialGeometry() {
  return page.evaluate(() => Object.fromEntries(['.game-field', '.game-hud', '.home-control', '.pause-control', '.player-ship'].map(selector => {
    const node = document.querySelector(selector); if (!node) throw Error('Missing layout node ' + selector);
    const r = node.getBoundingClientRect(); return [selector, { x: r.x, y: r.y, width: r.width, height: r.height }];
  })));
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
  page = await context.newPage(); page.setDefaultTimeout(25000);
  page.on('pageerror', e => { fatal ||= 'javascript-error: ' + e.message; }); page.on('crash', () => { fatal ||= 'renderer-crash'; });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const response = await context.request.get(server.origin + '/device-preview-info.json'); assert.equal(response.status(), 200);
  const info = await response.json(); result.source = info.sourceCommit;
  assert.equal(info.flatSceneControl.enabled, controlled); assert.equal(info.canvasEffectControl.enabled, true);
  assert.equal(info.flatSceneControl.originalImagePreparationRetained, true);
  if (backgroundComparison) {
    assert.equal(controlled, true); assert.equal(info.backgroundControl.originalBackgroundRestored, originalBackground);
    assert.equal(info.backgroundControl.simpleForegroundRetained, true);
  }
  const label = await page.locator('.device-preview-menu section').evaluate(n => getComputedStyle(n, '::before').content);
  assert.ok(label.includes(controlled ? 'Einfache Formen' : 'Originaldarstellung')); result.bannerMatches = true;
  assert.equal(await page.getByRole('checkbox', { name: 'Vollaufzeichnung zusätzlich aktivieren', exact: true }).isChecked(), false);
  assert.equal(await page.getByRole('checkbox', { name: 'Testschutz: Tod und Bossende verhindern', exact: true }).isChecked(), true);
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  await page.evaluate(() => document.fonts.ready); result.initialPausedGeometry = await initialGeometry();
  assert.equal(await page.locator('[data-stopwatch-value]').innerText(), '00:00');
  if (controlled && (!backgroundComparison || originalBackground)) {
    const before = JSON.parse(readFileSync(resolve(directory, backgroundComparison ? '../background-off/verification.json' : '../artwork/verification.json'), 'utf8'));
    assert.equal(before.complete, true);
    for (const [selector, rect] of Object.entries(before.initialPausedGeometry)) for (const key of ['x', 'y', 'width', 'height'])
      assert.ok(Math.abs(rect[key] - result.initialPausedGeometry[selector][key]) <= 1, selector + ' ' + key);
    result.originalLayoutBoxesPreserved = true;
  }
  await resume(); await page.waitForFunction(() => window.__crossDeviceTest.inspect().encounter === 'boss-fight');
  const first = await inspect(), origin = await page.evaluate(() => performance.timeOrigin);
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.latest?.elapsedMs >= 20000, STOPWATCH_KEY, { timeout: 90000 });
  const active = await inspect(); assert.equal(active.status, 'playing'); assert.ok(active.frameAt > first.frameAt);
  assert.ok(active.coreVolley > first.coreVolley); assert.equal(active.ownerDiagnostics, false);
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  const art = await page.evaluate(() => ({
    canvases: document.querySelectorAll('.game-field canvas').length,
    images: document.querySelectorAll('.game-field img').length,
    starfields: document.querySelectorAll('.starfield, .space-scene').length,
    foregroundImages: [...document.querySelectorAll('.game-field img')].filter(n => !n.closest('.space-scene, .starfield')).length,
    backgroundStarCircles: document.querySelectorAll('.game-field .starfield circle').length,
    backgroundPlanets: document.querySelectorAll('.game-field .space-scene .space-world').length,
    detailedShips: document.querySelectorAll('.game-field .fleet-sprite, .game-field .ship-thruster, .game-field .hull-heat-layer').length,
    flatBosses: document.querySelectorAll('.diagnostic-flat-boss').length,
    flatShips: document.querySelectorAll('.diagnostic-flat-ship').length,
    playerShotCount: document.querySelectorAll('.player-laser').length,
    playerShotBackground: document.querySelector('.player-laser') ? getComputedStyle(document.querySelector('.player-laser')).backgroundImage : null,
  }));
  if (controlled) {
    for (const key of ['canvases', 'foregroundImages', 'detailedShips']) assert.equal(art[key], 0, key);
    if (originalBackground) {
      assert.equal(art.starfields, 2); assert.ok(art.backgroundStarCircles >= 215); assert.equal(art.backgroundPlanets, 4);
      assert.equal(await page.locator('.game-field .starfield').isVisible(), true);
      assert.equal(await page.locator('.game-field .space-scene').isVisible(), true);
      assert.equal(await page.locator('.game-field .space-scene .space-world').first().isVisible(), true);
      result.originalBackgroundVisible = true;
    } else { assert.equal(art.images, 0); assert.equal(art.starfields, 0); }
    assert.equal(art.flatBosses, 1); assert.ok(art.flatShips > 0); assert.equal(art.playerShotBackground, 'none');
  } else { assert.ok(art.canvases > 0); assert.ok(art.images > 0); assert.ok(art.starfields > 0); }
  result.activeObservation = { activeMs: (await clock()).latest.elapsedMs, coreVolley: active.coreVolley,
    frameAt: active.frameAt, scene: art, sameDocument: true };
  // Feed the unchanged pointer controller a disclosed synthetic one-finger drag.
  const field = await page.locator('.game-field').boundingBox(); assert.ok(field);
  const start = { x: field.x + field.width * .50, y: field.y + field.height * .80 };
  const end = { x: field.x + field.width * .30, y: field.y + field.height * .70 };
  const pointer = { bubbles: true, cancelable: true, pointerId: 900001, pointerType: 'touch', isPrimary: true, buttons: 1 };
  const playerBefore = (await inspect()).player;
  await page.locator('.game-field').dispatchEvent('pointerdown', { ...pointer, clientX: start.x, clientY: start.y });
  await page.locator('.game-field').dispatchEvent('pointermove', { ...pointer, clientX: end.x, clientY: end.y });
  await page.locator('.game-field').dispatchEvent('pointerup', { ...pointer, buttons: 0, clientX: end.x, clientY: end.y });
  await page.waitForFunction(before => Math.abs(window.__crossDeviceTest.inspect().player.x - before.x) > .03, playerBefore);
  result.pointerSteeringPreserved = true;
  await tap(page.getByRole('button', { name: /^Waffen · Aktive Waffe:/ }));
  await page.locator('.weapon-selection-dialog').waitFor(); await waitMode('paused');
  const weaponPause = await clock(); await page.waitForTimeout(2100);
  assert.equal((await clock()).latest.elapsedMs, weaponPause.latest.elapsedMs);
  await tap(page.locator('.weapon-drawer-tab')); await waitMode('running'); result.weaponMenuRoundtrip = true;
  await pause(); const paused = await clock(); await page.waitForTimeout(2100);
  assert.equal((await clock()).latest.elapsedMs, paused.latest.elapsedMs); result.manualPauseFreezes = true;
  await page.screenshot({ path: directory + '/paused-scene.png' });
  await resume(); await tap(page.locator('.home-control')); await page.locator('#leave-mission-title').waitFor();
  await tap(page.getByRole('button', { name: 'Spiel verlassen', exact: true })); await waitMode('ended');
  await tap(page.getByRole('button', { name: 'Letzten Testbericht vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Berichtstext in Teilen anzeigen', exact: true }));
  const part = JSON.parse(await page.getByRole('textbox', { name: 'Diagnosebericht', exact: true }).inputValue());
  assert.equal(part.total, 1); const report = JSON.parse(part.data);
  assert.equal(report.source.sourceCommit, info.sourceCommit);
  assert.equal(report.source.diagnosticScene, originalBackground ? 'flat-live-scene-original-background' : controlled ? 'flat-live-scene' : 'original-artwork');
  assert.equal(report.briefMatchesLatestStopwatch, true); assert.equal(report.fullSession, null);
  assert.equal(report.briefDiagnostics.latest.options.fullRecording, false); result.normalExitAndReportPreserved = true;
  assert.deepEqual(external, []); assert.ok(!fatal, fatal); result.complete = true;
} catch (error) {
  result.failure = { message: error.message, stack: error.stack }; process.exitCode = 1;
  if (page && !page.isClosed()) try { await page.screenshot({ path: directory + '/failure.png', timeout: 5000 }); } catch { /* Preserve first failure. */ }
} finally {
  result.finishedAt = new Date().toISOString(); writeFileSync(directory + '/verification.json', JSON.stringify(result, null, 2) + '\n');
  console.log((backgroundComparison ? 'CRYPTOID_BACKGROUND_RESULT ' : 'CRYPTOID_FLAT_SCENE_RESULT ') + JSON.stringify(result));
  if (browser) await browser.close(); if (server) await server.close();
}
