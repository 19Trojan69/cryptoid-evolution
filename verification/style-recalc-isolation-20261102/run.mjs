import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
import { serveDevicePreview } from '../boss2-forensics-20261028/devicePreviewServer.mjs';
import { STOPWATCH_KEY } from '../boss2-stopwatch-20261029/stopwatchState.mjs';
import { requireInactiveCheckpoint } from '../memory-retention-attribution-20261101/inspection.mjs';
import { pausedSceneProbe, conditions, pairs } from './sceneProbe.mjs';
import { captureStyleTimeline } from './timeline.mjs';
const replica = Number(process.env.CRYPTOID_STYLE_RECALC_REPLICA);
assert.ok([1, 2].includes(replica)); assert.equal(process.env.CRYPTOID_SOAK_CONDITION, 'original');
assert.equal(process.env.CRYPTOID_LIFETIME_ATTRIBUTION, '1');
for (const key of Object.keys(process.env)) if (key.startsWith('CRYPTOID_'))
  assert.ok(['CRYPTOID_STYLE_RECALC_REPLICA', 'CRYPTOID_SOAK_CONDITION', 'CRYPTOID_LIFETIME_ATTRIBUTION'].includes(key));
const pwRequire = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url)), pw = pwRequire('playwright');
const frontendRequire = createRequire(root + '/frontend/package.json');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const output = root + '/verification/style-recalc-isolation-20261102/results/r' + replica; mkdirSync(output, { recursive: true });
const result = { version: 1, kind: 'paused-native-style-recalc-isolation', complete: false, replica,
  sourceCommit: git('rev-parse', 'HEAD'), sourceTree: git('rev-parse', 'HEAD^{tree}'),
  actualHostOS: process.platform, actualInstalledPackages: Object.fromEntries(['react', 'react-dom', 'react-router-dom', 'vite', 'typescript']
    .map(name => [name, frontendRequire(name + '/package.json').version])), playwrightVersion: pwRequire('playwright/package.json').version,
  lockSha256: createHash('sha256').update(readFileSync(root + '/frontend/yarn.lock')).digest('hex'),
  originalArtwork: true, syntheticPausedStyleSweep: true, gameOrAnimationClocksWritten: false,
  newAppTimersOrFrames: false, requestedGc: false, heapSnapshots: false, memoryDumpRequests: 0,
  activeApiWrappers: false, physicalDevice: false, physicalPiBrowser: false, nativeTerminationCauseMeasured: false,
  performanceOrMemoryBenefitEstablished: false, whiteScreenFixed: false, pairs, cases: [] };
const css = readFileSync(root + '/frontend/src/index.css', 'utf8');
assert.equal(css.match(/var\(--boss-thrust/g)?.length, 1); assert.equal(css.match(/var\(--weapon-charge/g)?.length, 2);
assert.ok(css.includes('.boss-special-weapon-firing .boss-special-muzzle { fill:#fff6dd; opacity:1; }'));
assert.equal(/\[\s*style(?:\s|\]|[~|^$*=])/i.test(css), false, 'No CSS selector distinguishes empty from absent inline style attributes');
result.consumerSourceProof = { cssBlob: git('hash-object', 'frontend/src/index.css'), thrustConsumers: 1, chargeConsumers: 2,
  firingOverridePreserved: true, noInlineStyleAttributeSelector: true };
let server, browser, page, first, paused, fatal; const external = [], assets = [];
async function tap(locator) {
  await locator.waitFor({ state: 'visible', timeout: 45000 }); assert.ok(await locator.isEnabled()); await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox(), v = page.viewportSize(); assert.ok(box && v);
  const x = box.x + box.width / 2, y = box.y + box.height / 2; assert.ok(x >= 0 && y >= 0 && x < v.width && y < v.height);
  await page.touchscreen.tap(x, y);
}
const observe = () => page.evaluate(key => ({ timeOrigin: performance.timeOrigin, hidden: document.hidden,
  mounted: !!document.querySelector('.game-shell'), scene: window.__crossDeviceTest?.inspect() ?? null,
  clock: JSON.parse(localStorage.getItem(key) || 'null'), url: location.href }), STOPWATCH_KEY);
const guard = async () => {
  assert.ok(!fatal, fatal); const row = await observe(); requireInactiveCheckpoint(row, 'paused');
  assert.equal(row.timeOrigin, first.timeOrigin); assert.equal(row.clock.latest.source, result.sourceCommit);
  assert.equal(row.clock.latest.id, paused.clock.latest.id); assert.equal(row.clock.latest.elapsedMs, paused.clock.latest.elapsedMs);
  assert.equal(row.clock.latest.unobservedGaps, 0); assert.equal(row.scene.coreVolley, paused.scene.coreVolley);
  return { source: row.clock.latest.source, clockId: row.clock.latest.id, timeOrigin: row.timeOrigin,
    clockMode: row.clock.latest.mode, elapsedMs: row.clock.latest.elapsedMs, coreVolley: row.scene.coreVolley,
    status: row.scene.status, technicalPause: row.scene.technicalPause, hidden: row.hidden };
};
try {
  server = await serveDevicePreview(); browser = await pw.chromium.launch({ headless: true }); result.engineVersion = browser.version();
  const profile = configuration('android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === server.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    external.push(url.hostname); return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(25000);
  page.on('pageerror', () => { fatal ||= 'uncaught-javascript-error'; }); page.on('crash', () => { fatal ||= 'renderer-crash'; });
  page.on('response', response => { if (response.url().startsWith(server.origin + '/') && response.status() >= 400
    && ['script', 'stylesheet', 'image', 'font'].includes(response.request().resourceType())) assets.push(response.status()); });
  await page.goto(server.origin, { waitUntil: 'domcontentloaded' }); await page.bringToFront();
  const info = await (await context.request.get(server.origin + '/device-preview-info.json')).json();
  assert.equal(info.sourceCommit, result.sourceCommit); assert.equal(info.sourceTree, result.sourceTree);
  assert.equal(info.diagnosticScene, 'original-artwork'); assert.equal(info.guestOnly, true);
  assert.equal(info.payments, false); assert.equal(info.liveBackend, false); assert.equal(info.automaticUpload, false);
  assert.equal(info.qaThrustScope, undefined); assert.equal(info.qaIsolatedMiniPacing, undefined); result.buildProof = info.qaLifetimeAttribution;
  assert.equal(await page.getByRole('checkbox', { name: 'Vollaufzeichnung zusätzlich aktivieren', exact: true }).isChecked(), false);
  assert.equal(await page.getByRole('checkbox', { name: 'Testschutz: Tod und Bossende verhindern', exact: true }).isChecked(), true);
  await tap(page.getByRole('button', { name: 'Testszene vorbereiten', exact: true }));
  await tap(page.getByRole('button', { name: 'Boss-2-Test öffnen', exact: true }));
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'paused'); await tap(page.locator('.pause-resume-button'));
  await page.waitForFunction(() => { const s = window.__crossDeviceTest?.inspect();
    return s?.status === 'playing' && s.encounter === 'boss-fight' && s.reactorOpen && s.coreVolley > 0; }, null, { timeout: 45000 });
  first = await observe(); assert.equal(first.hidden, false); assert.equal(first.scene.ownerDiagnostics, false);
  assert.deepEqual(first.scene.buildFlags, { development: false, production: true });
  await tap(page.locator('.home-control')); await page.locator('#leave-mission-title').waitFor();
  await page.waitForFunction(({ key }) => window.__crossDeviceTest.inspect().status === 'paused'
    && JSON.parse(localStorage.getItem(key)).latest.mode === 'paused', { key: STOPWATCH_KEY });
  paused = await observe(); await page.waitForTimeout(1600); result.pausedSource = await guard();
  const ps = await context.newCDPSession(page); try { result.frameId = (await ps.send('Page.getFrameTree')).frameTree.frame.id; } finally { await ps.detach(); }
  const order = replica === 1 ? conditions : [...conditions].reverse(); result.order = order;
  for (const [index, condition] of order.entries()) {
    const prefix = `cryptoid-recalc-r${replica}-${condition}-`;
    const c = await captureStyleTimeline({ session: await browser.newBrowserCDPSession(), guard, prefix, frameId: result.frameId,
      run: () => page.evaluate(pausedSceneProbe, { condition, pairs, prefix, firingFidelity: index === 0 }),
      save: bytes => writeFileSync(output + '/' + condition + '-timeline.json.gz', bytes) });
    result.cases.push({ condition, ...c });
    await page.evaluate(({ prefix, count }) => { for (let i = 0; i < count; i++) {
      performance.clearMarks(prefix + i + ':start'); performance.clearMarks(prefix + i + ':end');
    } }, { prefix, count: pairs.length });
    assert.equal(c.complete, true, c.failure); assert.equal(c.sessionDetached, true); assert.equal(c.tracingStopped, true);
  }
  const reference = result.cases.find(c => c.condition === 'root').proof.outputs;
  for (const c of result.cases) assert.deepEqual(c.proof.outputs, reference, 'Same sixteen native heights/opacities in every condition');
  result.sameNativeComputedOutputsAcrossConditions = true; result.afterAll = await guard();
  await tap(page.getByRole('button', { name: 'Spiel verlassen', exact: true }));
  await page.waitForFunction(({ key }) => !document.querySelector('.game-shell') && JSON.parse(localStorage.getItem(key)).latest.mode === 'ended', { key: STOPWATCH_KEY });
  result.normalExitVerified = true; await page.evaluate(() => { delete window.__crossDeviceTest; });
  assert.deepEqual(external, []); assert.deepEqual(assets, []); assert.ok(!fatal, fatal); result.complete = true;
} catch (e) {
  result.failure = { code: fatal || 'native-style-recalc-probe-failed', message: e.message };
  if (page && !page.isClosed()) try { result.lastObservation = await observe(); } catch { result.lastObservationUnavailable = true; }
  process.exitCode = 1;
} finally {
  result.finishedAt = new Date().toISOString(); writeFileSync(output + '/observation.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_STYLE_RECALC_RESULT ' + JSON.stringify({ complete: result.complete, replica, failure: result.failure,
    counts: result.cases.map(c => ({ condition: c.condition, totalElementStyleCalculations: c.native?.totalElementStyleCalculations })) }));
  if (browser) await browser.close(); if (server) await server.close();
}
