import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { sampleBrowserMemory } from '../boss2-forensics-20261028/processMemory.mjs';

const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
const engine = process.env.CRYPTOID_SMARTPHONE_ENGINE;
assert.ok(['chromium', 'webkit'].includes(engine));
const output = resolve(root, 'verification/boss2-heap-retention-20261029/results/render-' + engine);
mkdirSync(output, { recursive: true });
const summary = { complete: false, engine, sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  physicalDevice: false, physicalPiBrowser: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false,
  diagnostics: false, protection: true, activeScreenshots: false, forcedGc: false, heapSnapshots: false,
  requestedActiveSecondsPerCase: 30, cases: [] };
const scenarios = [
  { id: 'phone-standard-dpr3', width: 430, dpr: 3, reduced: false },
  { id: 'phone-standard-dpr1', width: 430, dpr: 1, reduced: false },
  { id: 'phone-reduced-dpr3', width: 430, dpr: 3, reduced: true },
  { id: 'wide-standard-dpr3', width: 820, dpr: 3, reduced: false },
];
let server, browser, page, fatal;
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded(); const box = await locator.boundingBox(), viewport = page.viewportSize(); assert.ok(box && viewport);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  assert.ok(x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height);
  await page.touchscreen.tap(x, y);
}
const appearance = () => {
  const field = document.querySelector('.game-field');
  const read = selector => { const node = document.querySelector(selector); if (!node) return null;
    const s = getComputedStyle(node); return { display: s.display, filter: s.filter, backdropFilter: s.backdropFilter, animationName: s.animationName, animationPlayState: s.animationPlayState }; };
  const animations = document.querySelector('.game-shell').getAnimations({ subtree: true });
  return { width: field.clientWidth, height: field.clientHeight, dpr: devicePixelRatio,
    motion: document.documentElement.dataset.motion, reducedMedia: matchMedia('(prefers-reduced-motion: reduce)').matches,
    runningAnimations: animations.filter(a => a.playState === 'running').length,
    playerReflection: read('.player-ship .hull-reflection'), haze: read('.space-haze'),
    bossHull: read('.boss-hull'), hud: read('.game-hud') };
};
try {
  server = await serveDevicePreview();
  for (const scenario of scenarios) {
    const result = { ...scenario, complete: false, points: [] }; summary.cases.push(result); fatal = null;
    browser = await pw[engine].launch({ headless: true }); summary.engineVersion = browser.version();
    const profile = configuration(engine === 'webkit' ? 'iphone' : 'android-phone', pw.devices);
    const context = await browser.newContext({ ...profile.context, viewport: { width: scenario.width, height: 825 }, deviceScaleFactor: scenario.dpr });
    const external = [];
    await context.route('**/*', route => { const url = new URL(route.request().url());
      if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
      external.push(url.hostname); return route.abort(); });
    page = await context.newPage(); page.setDefaultTimeout(20000);
    page.on('pageerror', () => { fatal ||= 'javascript-error'; }); page.on('crash', () => { fatal ||= 'renderer-crash'; });
    await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
    const toggle = page.getByRole('checkbox', { name: 'Diagnose lokal aufzeichnen', exact: true });
    assert.equal(await toggle.isChecked(), true); await tap(toggle); assert.equal(await toggle.isChecked(), false);
    await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
    await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
    await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
    if (scenario.reduced) {
      if (!await page.locator('#pause-settings-display').isVisible()) {
        await tap(page.locator('button[aria-controls="pause-settings-display"]'));
      }
      const effects = page.locator('#pause-settings-display .system-setting[aria-pressed]').last();
      assert.equal(await effects.getAttribute('aria-pressed'), 'false'); await tap(effects);
      assert.equal(await effects.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.evaluate(() => localStorage.getItem('cryptoid_reduced_effects')), '1');
    }
    await tap(page.locator('.pause-resume-button'));
    await page.waitForFunction(() => { const s = window.__crossDeviceTest?.inspect(); return s?.status === 'playing' && s.encounter === 'boss-fight'; }, {}, { timeout: 40000 });
    const first = await page.evaluate(() => ({ scene: window.__crossDeviceTest.inspect(), timeOrigin: performance.timeOrigin }));
    assert.equal(first.scene.ownerDiagnostics, false); assert.equal(first.scene.reactorOpen, true); assert.equal(first.scene.technicalPause, false);
    assert.deepEqual(first.scene.buildFlags, { development: false, production: true });
    result.initialAppearance = await page.evaluate(appearance);
    assert.equal(result.initialAppearance.width, scenario.width); assert.equal(result.initialAppearance.dpr, scenario.dpr);
    assert.equal(result.initialAppearance.motion, scenario.reduced ? 'reduced' : 'standard');
    if (scenario.reduced) assert.equal(result.initialAppearance.playerReflection.display, 'none');
    const started = Date.now(); let lastFrame, progress = started;
    while (Date.now() - started < 30000) {
      assert.ok(!fatal, fatal);
      const observed = await page.evaluate(() => ({ scene: window.__crossDeviceTest?.inspect(), timeOrigin: performance.timeOrigin }));
      assert.equal(observed.timeOrigin, first.timeOrigin); const s = observed.scene; assert.ok(s);
      assert.equal(s.status, 'playing'); assert.equal(s.technicalPause, false); assert.equal(s.ownerDiagnostics, false);
      assert.equal(s.reactorOpen, true); assert.equal(s.sector, 20);
      const now = Date.now(); if (s.frameAt !== lastFrame) progress = now; lastFrame = s.frameAt;
      assert.ok(now - progress < 5000);
      const memory = sampleBrowserMemory(); assert.ok(memory.contentProcessObserved && memory.summedPssKiB !== null);
      result.points.push({ seconds: (now - started) / 1000, coreVolley: s.coreVolley, frameAt: s.frameAt,
        pssKiB: memory.summedPssKiB, canvas: s.canvas, audio: s.audio });
      await page.waitForTimeout(1000);
    }
    result.observedActiveSeconds = (Date.now() - started) / 1000;
    result.finalAppearance = await page.evaluate(appearance);
    const end = await page.evaluate(() => window.__crossDeviceTest.inspect());
    result.volleyProgress = { first: first.scene.coreVolley, last: end.coreVolley }; assert.ok(end.coreVolley > first.scene.coreVolley);
    assert.equal(await page.evaluate(() => localStorage.getItem('cryptoid_owner_full_status_v1')), null);
    result.additionalFullRecordingAbsent = true;
    await tap(page.getByRole('button', { name: /^(Pause|Pausieren)$/, exact: true }));
    await page.waitForFunction(() => window.__crossDeviceTest.inspect().status === 'paused');
    await page.screenshot({ path: output + '/' + scenario.id + '-paused.png' });
    assert.deepEqual(external, []); result.unexpectedExternalRequests = external;
    assert.ok(!fatal, fatal); result.complete = true;
    console.log('CRYPTOID_SMARTPHONE_CASE ' + JSON.stringify({ engine, id: result.id, seconds: result.observedActiveSeconds,
      initialAppearance: result.initialAppearance, finalAppearance: result.finalAppearance, volleyProgress: result.volleyProgress }));
    await browser.close(); browser = null; page = null;
  }
  summary.complete = true;
} catch (error) {
  summary.failure = { code: fatal || 'verification-failed', message: error.message }; process.exitCode = 1;
  if (page && !page.isClosed()) try { await page.screenshot({ path: output + '/failure.png', timeout: 5000 }); } catch { /* Preserve original failure. */ }
} finally {
  summary.finishedAt = new Date().toISOString(); writeFileSync(output + '/verification.json', JSON.stringify(summary, null, 2) + '\n');
  console.log('CRYPTOID_SMARTPHONE_RESULT ' + JSON.stringify({ complete: summary.complete, engine,
    cases: summary.cases.map(c => ({ id: c.id, complete: c.complete, seconds: c.observedActiveSeconds })), failure: summary.failure }));
  if (browser) await browser.close(); if (server) await server.close();
}
