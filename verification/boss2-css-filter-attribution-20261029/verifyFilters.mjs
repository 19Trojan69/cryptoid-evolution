import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { sampleBrowserMemory } from '../boss2-forensics-20261028/processMemory.mjs';

const engine = process.env.CRYPTOID_FILTER_ENGINE, condition = process.env.CRYPTOID_FILTER_CASE;
assert.ok(['chromium', 'webkit'].includes(engine));
// Browser-injected diagnostic ablations only. These deliberately change the
// test's appearance and are not a production quality setting or proposed fix.
const styles = {
  standard: '',
  'hud-backdrop-off': '.game-shell .game-hud { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }',
  'boss-hull-filter-off': '.game-shell .boss-hull { filter: none !important; }',
  'all-css-filters-off': ['.game-shell', '.game-shell::before', '.game-shell::after',
    '.game-shell *', '.game-shell *::before', '.game-shell *::after'].join(',') +
    ' { filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }',
};
assert.ok(Object.hasOwn(styles, condition));
const pw = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url))('playwright');
const output = resolve(root, 'verification/boss2-css-filter-attribution-20261029/results', engine + '-' + condition);
mkdirSync(output, { recursive: true });
const summary = { complete: false, engine, condition,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  physicalDevice: false, physicalPiBrowser: false, nativeTerminationCauseMeasured: false,
  temperatureMeasured: false, whiteScreenFixed: false, diagnostics: false, protection: true,
  requestedActiveSeconds: 90, activeScreenshots: false, activeProfiler: false,
  forcedGc: false, heapSnapshots: false, reducedEffects: false, seededRandomness: false,
  applicationSourceChanged: false, diagnosticStylesPublished: false,
  injectedCss: styles[condition], injectedCssSha256: createHash('sha256').update(styles[condition]).digest('hex'), points: [] };
let server, browser, page, fatal;
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled());
  await locator.scrollIntoViewIfNeeded(); const box = await locator.boundingBox(), viewport = page.viewportSize();
  assert.ok(box && viewport); const x = box.x + box.width / 2, y = box.y + box.height / 2;
  assert.ok(x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height);
  await page.touchscreen.tap(x, y);
}
const appearance = () => {
  const shell = document.querySelector('.game-shell'), field = document.querySelector('.game-field');
  const nodes = [shell, ...shell.querySelectorAll('*')];
  if (nodes.length > 4000) throw Error('Computed-style probe node bound exceeded');
  const inspect = (node, pseudo = null) => {
    const s = getComputedStyle(node, pseudo);
    return { filter: s.filter || 'none', backdropFilter: s.backdropFilter || s.webkitBackdropFilter || 'none',
      display: s.display, visibility: s.visibility, content: s.content };
  };
  const read = selector => {
    const node = shell.querySelector(selector), r = node.getBoundingClientRect();
    return { ...inspect(node), width: r.width, height: r.height };
  };
  const filtered = []; let filterCount = 0, backdropCount = 0, filteredEntryCount = 0;
  for (const node of nodes) {
    if (!node.getClientRects().length) continue;
    for (const pseudo of [null, '::before', '::after']) {
      const s = inspect(node, pseudo);
      if (s.display === 'none' || s.visibility === 'hidden' || pseudo && ['none', 'normal'].includes(s.content)) continue;
      const filteredHere = s.filter !== 'none', backdropHere = s.backdropFilter !== 'none';
      filterCount += Number(filteredHere); backdropCount += Number(backdropHere);
      if (filteredHere || backdropHere) filteredEntryCount++;
      if ((filteredHere || backdropHere) && filtered.length < 160) filtered.push({ tag: node.tagName,
        class: (node.getAttribute('class') || '').slice(0, 240), pseudo, filter: s.filter, backdropFilter: s.backdropFilter });
    }
  }
  return { width: field.clientWidth, height: field.clientHeight, dpr: devicePixelRatio,
    motion: document.documentElement.dataset.motion, nodeCount: nodes.length,
    filterCount, backdropCount, filtered, filteredDetailsTruncated: filteredEntryCount > 160,
    hud: read('.game-hud'), bossHull: read('.boss-hull'), player: read('.player-ship'),
    runningAnimations: shell.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length };
};
function verifyAppearance(value) {
  assert.equal(value.width, 430); assert.equal(value.dpr, 3); assert.equal(value.motion, 'standard');
  assert.equal(value.hud.backdropFilter, ['hud-backdrop-off', 'all-css-filters-off'].includes(condition) ? 'none' : 'blur(10px)');
  if (['boss-hull-filter-off', 'all-css-filters-off'].includes(condition)) assert.equal(value.bossHull.filter, 'none');
  else assert.match(value.bossHull.filter, /drop-shadow\(/);
  if (condition === 'all-css-filters-off') { assert.equal(value.filterCount, 0); assert.equal(value.backdropCount, 0); }
}
try {
  server = await serveDevicePreview(); browser = await pw[engine].launch({ headless: true }); summary.engineVersion = browser.version();
  const profile = configuration(engine === 'webkit' ? 'iphone' : 'android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  summary.emulation = { width: 430, height: 825, dpr: 3, actualPhysicalDevice: false };
  const external = [];
  await context.route('**/*', route => { const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort(); });
  page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', () => { fatal ||= 'javascript-error'; }); page.on('crash', () => { fatal ||= 'renderer-crash'; });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const recording = page.getByRole('checkbox', { name: 'Diagnose lokal aufzeichnen', exact: true });
  assert.equal(await recording.isChecked(), true); await tap(recording); assert.equal(await recording.isChecked(), false);
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused');
  await page.waitForFunction(() => window.__crossDeviceTest.inspect().audio?.audioSampleBuffers === 46, {}, { timeout: 45000 });
  summary.originalPausedAppearance = await page.evaluate(appearance);
  assert.equal(summary.originalPausedAppearance.hud.backdropFilter, 'blur(10px)');
  assert.match(summary.originalPausedAppearance.bossHull.filter, /drop-shadow\(/);
  if (styles[condition]) await page.addStyleTag({ content: styles[condition] });
  summary.preparedAppearance = await page.evaluate(appearance); verifyAppearance(summary.preparedAppearance);
  for (const key of ['width', 'height', 'dpr', 'motion', 'nodeCount'])
    assert.equal(summary.preparedAppearance[key], summary.originalPausedAppearance[key], key + ' unaffected by style ablation');
  for (const actor of ['hud', 'bossHull', 'player']) for (const key of ['width', 'height'])
    assert.equal(summary.preparedAppearance[actor][key], summary.originalPausedAppearance[actor][key]);
  await tap(page.locator('.pause-resume-button'));
  await page.waitForFunction(() => { const s = window.__crossDeviceTest?.inspect(); return s?.status === 'playing' && s.encounter === 'boss-fight'; }, {}, { timeout: 40000 });
  const first = await page.evaluate(() => ({ scene: window.__crossDeviceTest.inspect(), origin: performance.timeOrigin }));
  assert.deepEqual(first.scene.buildFlags, { development: false, production: true });
  assert.equal(first.scene.ownerDiagnostics, false); assert.equal(first.scene.reactorOpen, true);
  const started = Date.now(); let lastFrame, lastProgress = started;
  while (Date.now() - started < 90000) {
    assert.ok(!fatal, fatal);
    const observed = await page.evaluate(() => ({ scene: window.__crossDeviceTest?.inspect(), origin: performance.timeOrigin }));
    assert.equal(observed.origin, first.origin); const s = observed.scene; assert.ok(s);
    assert.equal(s.status, 'playing'); assert.equal(s.technicalPause, false); assert.equal(s.sector, 20);
    assert.equal(s.reactorOpen, true); assert.equal(s.ownerDiagnostics, false);
    const now = Date.now(); if (s.frameAt !== lastFrame) lastProgress = now; lastFrame = s.frameAt;
    assert.ok(now - lastProgress < 5000);
    const memory = sampleBrowserMemory(); assert.ok(memory.contentProcessObserved && memory.summedPssKiB !== null);
    summary.points.push({ seconds: (now - started) / 1000, frameAt: s.frameAt, coreVolley: s.coreVolley,
      process: memory, canvas: s.canvas, audio: s.audio });
    await page.waitForTimeout(1000);
  }
  summary.observedActiveSeconds = (Date.now() - started) / 1000;
  const end = await page.evaluate(() => window.__crossDeviceTest.inspect());
  summary.volleyProgress = { first: first.scene.coreVolley, last: end.coreVolley }; assert.ok(end.coreVolley > first.scene.coreVolley);
  assert.equal(await page.evaluate(() => localStorage.getItem('cryptoid_owner_full_status_v1')), null);
  summary.additionalFullRecordingAbsent = true;
  await tap(page.getByRole('button', { name: /^(Pause|Pausieren)$/, exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest.inspect().status === 'paused');
  summary.finalPausedAppearance = await page.evaluate(appearance); verifyAppearance(summary.finalPausedAppearance);
  await page.screenshot({ path: output + '/completed-paused.png' });
  assert.deepEqual(external, []); summary.unexpectedExternalRequests = external; assert.ok(!fatal, fatal); summary.complete = true;
} catch (error) {
  summary.failure = { code: fatal || 'filter-verification-failed', message: error.message }; process.exitCode = 1;
  if (page && !page.isClosed()) try { await page.screenshot({ path: output + '/failure.png', timeout: 5000 }); } catch { /* Original failure preserved. */ }
} finally {
  summary.finishedAt = new Date().toISOString(); writeFileSync(output + '/verification.json', JSON.stringify(summary, null, 2) + '\n');
  console.log('CRYPTOID_FILTER_RESULT ' + JSON.stringify({ complete: summary.complete, engine, condition,
    observedActiveSeconds: summary.observedActiveSeconds, volleys: summary.volleyProgress,
    before: summary.originalPausedAppearance && { filterCount: summary.originalPausedAppearance.filterCount, backdropCount: summary.originalPausedAppearance.backdropCount },
    after: summary.finalPausedAppearance && { filterCount: summary.finalPausedAppearance.filterCount, backdropCount: summary.finalPausedAppearance.backdropCount }, failure: summary.failure }));
  if (browser) await browser.close(); if (server) await server.close();
}
