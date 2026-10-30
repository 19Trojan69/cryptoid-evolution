import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { STOPWATCH_KEY } from '../boss2-stopwatch-20261029/stopwatchState.mjs';

const engine = process.env.CRYPTOID_FLAT_ENGINE;
const unmasked = process.env.CRYPTOID_BOSS_HEAT_UNMASKED === '1';
assert.ok(['chromium', 'webkit'].includes(engine));
const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
const directory = resolve(root, 'verification/boss2-boss-heat-unmasked-20261030/results', engine, unmasked ? 'unmasked' : 'original-mask');
mkdirSync(directory, { recursive: true });
const result = {
  complete: false, engine, unmasked, physicalDevice: false, physicalCrashSimulated: false,
  fullRecording: false, whiteScreenFixed: false, steeringEventsSynthetic: true,
};
let server, browser, page, fatal;
const clock = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STOPWATCH_KEY);
const inspect = () => page.evaluate(() => window.__crossDeviceTest.inspect());
const waitMode = mode => page.waitForFunction(({ key, mode }) => JSON.parse(localStorage.getItem(key))?.latest?.mode === mode,
  { key: STOPWATCH_KEY, mode }, { timeout: 45000 });
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox(); assert.ok(box);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}
async function resume() { await tap(page.locator('.pause-resume-button')); await waitMode('running'); }
const geometry = () => page.evaluate(() => Object.fromEntries(['.game-field', '.game-hud', '.home-control', '.pause-control', '.player-ship'].map(selector => {
  const node = document.querySelector(selector); if (!node) throw Error('Missing ' + selector);
  const r = node.getBoundingClientRect(); return [selector, { x: r.x, y: r.y, width: r.width, height: r.height }];
})));
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
  page = await context.newPage(); page.setDefaultTimeout(25000);
  page.on('pageerror', e => { fatal ||= 'javascript-error: ' + e.message; });
  page.on('crash', () => { fatal ||= 'renderer-crash'; });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const info = await (await context.request.get(server.origin + '/device-preview-info.json')).json();
  result.source = info.sourceCommit; result.sourceTree = info.sourceTree; result.scene = info.diagnosticScene;
  assert.equal(info.bossHeatMaskCandidate.enabled, unmasked);
  assert.equal(info.bossHeatMaskCandidate.reflectionHidden, true);
  assert.equal(info.bossWeaponControl.disabled, true);
  for (const key of ['actualPiAuthentication', 'liveBackend', 'realAccounts', 'payments', 'automaticUpload', 'automaticResume']) assert.equal(info[key], false, key);
  assert.equal(info.guestOnly, true); assert.equal(info.nativeGameClocks, true);
  const label = await page.locator('.device-preview-menu section').evaluate(n => getComputedStyle(n, '::before').content);
  assert.ok(label.includes(unmasked ? 'MASKENKANDIDAT' : 'MASKENVERGLEICH')); result.bannerMatches = true;
  assert.equal(await page.getByRole('checkbox', { name: 'Vollaufzeichnung zusätzlich aktivieren', exact: true }).isChecked(), false);
  assert.equal(await page.getByRole('checkbox', { name: 'Testschutz: Tod und Bossende verhindern', exact: true }).isChecked(), true);
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  await page.evaluate(() => document.fonts.ready);
  result.initialPausedGeometry = await geometry();
  assert.equal(await page.locator('[data-stopwatch-value]').innerText(), '00:00');
  let baseline;
  if (unmasked) {
    baseline = JSON.parse(readFileSync(resolve(directory, '../original-mask/verification.json'), 'utf8'));
    assert.equal(baseline.complete, true); assert.equal(baseline.source, result.source);
    for (const [selector, rect] of Object.entries(baseline.initialPausedGeometry)) for (const key of ['x', 'y', 'width', 'height'])
      assert.ok(Math.abs(rect[key] - result.initialPausedGeometry[selector][key]) <= 1, selector + ' ' + key);
    result.originalLayoutBoxesPreserved = true;
  }
  await resume(); await page.waitForFunction(() => window.__crossDeviceTest.inspect().encounter === 'boss-fight');
  const first = await inspect(), origin = await page.evaluate(() => performance.timeOrigin);
  await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.latest?.elapsedMs >= 20000, STOPWATCH_KEY, { timeout: 90000 });
  await page.waitForFunction(() => document.querySelectorAll('.sector-boss .hull-hotspot').length > 0);
  const active = await inspect(); assert.equal(active.status, 'playing'); assert.ok(active.frameAt > first.frameAt);
  assert.ok(active.coreVolley > first.coreVolley); assert.equal(active.ownerDiagnostics, false);
  assert.equal(await page.evaluate(() => performance.timeOrigin), origin);
  result.activeObservation = { activeMs: (await clock()).latest.elapsedMs, coreVolley: active.coreVolley, sameDocument: true };

  await tap(page.getByRole('button', { name: 'Pause', exact: true })); await waitMode('paused');
  const paused = await clock(); await page.waitForTimeout(2100);
  assert.equal((await clock()).latest.elapsedMs, paused.latest.elapsedMs); result.manualPauseFreezes = true;
  const scene = await page.evaluate(() => {
    const heat = document.querySelector('.sector-boss .hull-heat-layer');
    const reflection = document.querySelector('.sector-boss .hull-reflection');
    const image = document.querySelector('.sector-boss img.boss-hull');
    if (!heat || !reflection || !image) throw Error('Missing original boss subtree');
    const hs = getComputedStyle(heat), rs = getComputedStyle(reflection);
    const rect = document.querySelector('.sector-boss').getBoundingClientRect();
    const hotspots = [...heat.querySelectorAll('.hull-hotspot')].map(n => {
      const s = getComputedStyle(n), b = getComputedStyle(n.querySelector('b'));
      return { rects: n.getClientRects().length, opacity: s.opacity, transform: s.transform,
        width: s.width, height: s.height, animation: s.animationName, innerAnimation: b.animationName,
        background: b.backgroundImage, nativeAnimations: n.getAnimations({ subtree: true }).length };
    });
    // Same paused DOM, synchronous QA-only cascade probe. Restore the exact
    // inline style immediately; no game, clock, hit or production code changes.
    const properties = ['display', 'position', 'inset', 'overflow', 'z-index', 'opacity', 'transform'];
    const signature = () => ({ heat: properties.map(p => getComputedStyle(heat).getPropertyValue(p)),
      spots: [...heat.querySelectorAll('.hull-hotspot, .hull-hotspot b')].map(n => {
        const s = getComputedStyle(n); return ['left','top','width','height','transform','opacity','background-image','animation-name'].map(p => s.getPropertyValue(p));
      }), image: { src: image.currentSrc, width: image.width, height: image.height },
      mini: [...document.querySelectorAll('.sector-boss .hull-mini-explosion')].map(n => n.outerHTML) });
    const before = signature(), cssText = heat.style.cssText, originalMask = heat.style.maskImage || heat.style.webkitMaskImage;
    const wasUnmasked = hs.maskImage === 'none';
    let oppositeMask, after;
    try {
      heat.style.setProperty('mask-image', wasUnmasked ? originalMask : 'none', 'important');
      heat.style.setProperty('-webkit-mask-image', wasUnmasked ? originalMask : 'none', 'important');
      oppositeMask = getComputedStyle(heat).maskImage; after = signature();
    } finally { heat.style.cssText = cssText; }
    const restored = getComputedStyle(heat);
    const reactor = document.querySelector('.sector-boss .boss-reactor');
    return {
      heat: { display: restored.display, rects: heat.getClientRects().length, mask: restored.maskImage,
        webkitMask: restored.webkitMaskImage, inlineMask: originalMask, opacity: restored.opacity, overflow: restored.overflow },
      reflection: { display: rs.display, rects: reflection.getClientRects().length, inlineMask: reflection.style.maskImage },
      hotspots, cascadeOnlyProbe: { nonMaskPropertiesIdentical: JSON.stringify(before) === JSON.stringify(after), oppositeMask, exactInlineStyleRestored: heat.style.cssText === cssText },
      bossRect: { width: rect.width, height: rect.height }, bossImageReady: image.complete && image.naturalWidth > 0,
      sceneCanvases: document.querySelectorAll('.game-field canvas').length,
      backgroundStarCircles: document.querySelectorAll('.game-field .starfield circle').length,
      backgroundPlanets: document.querySelectorAll('.game-field .space-scene .space-world').length,
      flatShips: document.querySelectorAll('.diagnostic-flat-ship').length,
      reactor: reactor ? { display: getComputedStyle(reactor).display, rects: reactor.getClientRects().length } : null,
    };
  });
  assert.equal(scene.heat.display, 'block'); assert.equal(scene.heat.rects, 1); assert.equal(Number(scene.heat.opacity), 1);
  assert.equal(scene.heat.overflow, 'hidden'); assert.ok(scene.heat.inlineMask.includes('url('));
  for (const key of ['mask', 'webkitMask']) {
    if (unmasked) assert.equal(scene.heat[key], 'none', key); else assert.ok(scene.heat[key].includes('url('), key);
  }
  assert.equal(scene.reflection.display, 'none'); assert.equal(scene.reflection.rects, 0);
  assert.ok(scene.reflection.inlineMask.includes('url('));
  assert.ok(scene.hotspots.length > 0 && scene.hotspots.length <= 8);
  for (const spot of scene.hotspots) {
    assert.equal(spot.rects, 1); assert.ok(Number(spot.opacity) > 0); assert.ok(spot.background.includes('radial-gradient'));
    assert.equal(spot.animation, 'none'); assert.equal(spot.innerAnimation, 'none'); assert.equal(spot.nativeAnimations, 0);
  }
  assert.equal(scene.cascadeOnlyProbe.nonMaskPropertiesIdentical, true);
  assert.equal(scene.cascadeOnlyProbe.exactInlineStyleRestored, true);
  assert.equal(scene.cascadeOnlyProbe.oppositeMask === 'none', !unmasked);
  assert.equal(scene.bossImageReady, true); assert.equal(scene.sceneCanvases, 0);
  assert.ok(scene.backgroundStarCircles >= 215); assert.equal(scene.backgroundPlanets, 4); assert.ok(scene.flatShips > 0);
  if (scene.reactor) { assert.equal(scene.reactor.display, 'none'); assert.equal(scene.reactor.rects, 0); }
  if (baseline) for (const key of ['width', 'height']) assert.ok(Math.abs(scene.bossRect[key] - baseline.scene.bossRect[key]) <= 1, 'boss ' + key);
  result.scene = scene;
  await page.screenshot({ path: directory + '/paused-scene.png' });
  await resume();
  const field = await page.locator('.game-field').boundingBox(); assert.ok(field);
  const before = (await inspect()).player;
  const pointer = { bubbles: true, cancelable: true, pointerId: 900001, pointerType: 'touch', isPrimary: true, buttons: 1 };
  const start = { clientX: field.x + field.width * .50, clientY: field.y + field.height * .80 };
  const end = { clientX: field.x + field.width * .30, clientY: field.y + field.height * .70 };
  await page.locator('.game-field').dispatchEvent('pointerdown', { ...pointer, ...start });
  await page.locator('.game-field').dispatchEvent('pointermove', { ...pointer, ...end });
  await page.locator('.game-field').dispatchEvent('pointerup', { ...pointer, buttons: 0, ...end });
  await page.waitForFunction(p => Math.abs(window.__crossDeviceTest.inspect().player.x - p.x) > .03, before);
  result.pointerSteeringPreserved = true;
  await tap(page.getByRole('button', { name: /^Waffen · Aktive Waffe:/ }));
  await page.locator('.weapon-selection-dialog').waitFor(); await waitMode('paused');
  const weaponPause = await clock(); await page.waitForTimeout(2100);
  assert.equal((await clock()).latest.elapsedMs, weaponPause.latest.elapsedMs);
  await tap(page.locator('.weapon-drawer-tab')); await waitMode('running'); result.weaponMenuRoundtrip = true;
  await tap(page.locator('.home-control')); await page.locator('#leave-mission-title').waitFor();
  await tap(page.getByRole('button', { name: 'Spiel verlassen', exact: true })); await waitMode('ended');
  await tap(page.getByRole('button', { name: 'Letzten Testbericht vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Berichtstext in Teilen anzeigen', exact: true }));
  const part = JSON.parse(await page.getByRole('textbox', { name: 'Diagnosebericht', exact: true }).inputValue());
  assert.equal(part.total, 1); const report = JSON.parse(part.data);
  assert.equal(report.source.sourceCommit, info.sourceCommit); assert.equal(report.source.sourceTree, info.sourceTree);
  assert.equal(report.source.diagnosticScene, info.diagnosticScene);
  assert.equal(report.briefMatchesLatestStopwatch, true); assert.equal(report.fullSession, null);
  assert.equal(report.briefDiagnostics.latest.options.fullRecording, false);
  result.reportScene = report.source.diagnosticScene;
  result.normalExitAndReportPreserved = true; result.savedActiveMs = report.testStopwatch?.latest?.elapsedMs ?? (await clock()).latest.elapsedMs;
  assert.deepEqual(external, []); assert.ok(!fatal, fatal);
  result.complete = true;
} catch (error) {
  result.failure = { message: error.message, stack: error.stack }; process.exitCode = 1;
  if (page && !page.isClosed()) try { await page.screenshot({ path: directory + '/failure.png', timeout: 5000 }); } catch { /* Retain first error. */ }
} finally {
  result.finishedAt = new Date().toISOString(); writeFileSync(directory + '/verification.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_HEAT_MASK_RESULT ' + JSON.stringify(result));
  if (browser) await browser.close(); if (server) await server.close();
}
