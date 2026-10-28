// Explicit invasive laboratory profile. Never imported into the game bundle.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, openSync, writeSync, closeSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { configuration, root, DIRECTORY, BASELINE } from './fixture.mjs';
import { createLabServer } from './labServer.mjs';
import { sampleBrowserMemory } from './processMemory.mjs';
import { cleanHeapUsage } from './chromiumHeap.mjs';
import { summarizeHeap, compareHeaps } from './heapObjects.mjs';
const require = createRequire(import.meta.url), pw = require(process.env.CRYPTOID_PLAYWRIGHT_MODULE || 'playwright');
const seconds = Number(process.env.CRYPTOID_PROFILE_SECONDS || 60);
assert.ok(Number.isInteger(seconds) && seconds >= 30 && seconds <= 120);
const buildMode = process.env.CRYPTOID_PROFILE_BUILD || 'development';
assert.ok(['development', 'production'].includes(buildMode));
const output = resolve(process.env.CRYPTOID_TEST_OUTPUT || `${root}/${DIRECTORY}/results/object-profile`);
mkdirSync(output, { recursive: true });
const source = readFileSync(root + '/frontend/src/pages/GamePage.tsx', 'utf8');
assert.equal(source, execFileSync('git', ['show', BASELINE + ':frontend/src/pages/GamePage.tsx'], { cwd: root, encoding: 'utf8' }));
const result = { complete: false, baseline: BASELINE, controllerSha256: createHash('sha256').update(source).digest('hex'),
  buildMode, reactVersion: createRequire(root + '/frontend/package.json')('react/package.json').version,
  reactDomVersion: createRequire(root + '/frontend/package.json')('react-dom/package.json').version,
  seconds, actualHostOS: process.platform, physicalDevice: false, realPiBrowser: false, realAuthentication: false,
  syntheticAccount: true, realDatabase: false, realPayments: false, collisionProtection: true, nativeClocksAltered: false,
  directTurretRemoval: true, bossHealthFloorRatio: .4, ownerDiagnostics: true, inputEvidence: true,
  explicitGc: true, snapshotsOnlyWhilePaused: true, stabilityAcceptance: false, historicalWhiteScreenFixed: false,
  osScreenshot: false, nativeEdgeNavigation: false, points: [], snapshots: [] };
const note = (kind, data = {}) => appendFileSync(output + '/events.jsonl', JSON.stringify({ at: new Date().toISOString(), kind, ...data }) + '\n');
const within = (promise, ms, label) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(Error(label)), ms);
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});
let lab, browser, page, session, fatal, expectedNavigation = true, documentId;
const navigationChecks = new Set();
async function inspect() {
  if (fatal) throw Error(fatal);
  const state = await within(page.evaluate(() => window.__crossDeviceTest.inspect()), 8000, 'inspection-timeout');
  assert.equal(state.technicalPause, false, 'Profiler must not mask a technical pause');
  assert.ok(!state.failed && state.sector === 20 && state.encounter === 'boss-fight' && state.reactorOpen, 'Active target scene');
  return state;
}
async function measure(label) {
  const state = await inspect();
  const heap = cleanHeapUsage(await session.send('Runtime.getHeapUsage'));
  assert.ok(heap, 'Heap counters available');
  const dom = await session.send('Memory.getDOMCounters');
  for (const name of ['documents', 'nodes', 'jsEventListeners']) assert.ok(Number.isSafeInteger(dom[name]));
  const attached = await page.evaluate(() => ({ elements: document.querySelectorAll('*').length,
    images: document.images.length, canvases: document.querySelectorAll('canvas').length,
    animations: document.getAnimations().length, measureEntries: performance.getEntriesByType('measure').length,
    markEntries: performance.getEntriesByType('mark').length }));
  const memory = sampleBrowserMemory(); assert.ok(memory.contentProcessObserved && memory.summedPssKiB !== null);
  const point = { at: new Date().toISOString(), label, status: state.status, frameAt: state.frameAt, coreVolley: state.coreVolley,
    shots: state.shots, hostileShots: state.hostileShots, effects: state.effects, canvas: state.canvas, audio: state.audio,
    heap, dom, attached, memory };
  appendFileSync(output + '/profile-counters.jsonl', JSON.stringify(point) + '\n'); return point;
}
async function pause() {
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.waitForFunction(() => window.__crossDeviceTest.inspect().status === 'paused', null, { timeout: 5000 });
  assert.equal((await inspect()).status, 'paused');
}
async function snapshot(label) {
  assert.equal((await inspect()).status, 'paused', 'Heavy snapshot only while manually paused');
  const path = output + '/' + label + '.heapsnapshot', fd = openSync(path, 'wx');
  let bytes = 0, over = false; const hash = createHash('sha256');
  const receive = ({ chunk }) => {
    const value = Buffer.from(chunk); bytes += value.length;
    if (bytes > 128 * 1024 * 1024) { over = true; return; }
    if (!over) { writeSync(fd, value); hash.update(value); }
  };
  session.on('HeapProfiler.addHeapSnapshotChunk', receive);
  try {
    await within(session.send('HeapProfiler.takeHeapSnapshot', { captureNumericValue: false, reportProgress: false }), 90000, 'snapshot-timeout');
  } finally { session.off('HeapProfiler.addHeapSnapshotChunk', receive); closeSync(fd); }
  if (over) { unlinkSync(path); throw Error('snapshot-byte-budget-exceeded'); }
  let aggregate;
  try { aggregate = summarizeHeap(JSON.parse(readFileSync(path, 'utf8'))); }
  finally { unlinkSync(path); }
  result.snapshots.push({ label, bytes, sha256: hash.digest('hex'), rawSnapshotRetained: false, ...aggregate });
  return aggregate;
}
try {
  lab = await createLabServer({ mode: 'direct', diagnostics: true, production: buildMode === 'production', cacheDir: output + '/vite-cache', note });
  browser = await pw.chromium.launch({ headless: true }); result.engineVersion = browser.version();
  const context = await browser.newContext(configuration('android-phone', pw.devices).context);
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === lab.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  page = await context.newPage(); page.setDefaultTimeout(10000);
  page.on('crash', () => { fatal ||= 'renderer-crash'; });
  page.on('pageerror', () => { fatal ||= 'javascript-error'; });
  page.on('console', message => { if (message.type() === 'error') fatal ||= 'console-error'; });
  page.on('request', request => {
    if (!expectedNavigation && request.isNavigationRequest() && request.frame() === page.mainFrame()) fatal ||= 'unexpected-document-request';
  });
  page.on('framenavigated', frame => {
    if (frame !== page.mainFrame() || expectedNavigation) return;
    // Pause/Resume deliberately push/pop modal history in this same document.
    // An actual replacement gets a new lab boot token and still fails.
    const check = frame.evaluate(() => window.__bossLabDocument).then(id => {
      if (expectedNavigation) return;
      if (id !== documentId) fatal ||= 'unexpected-document-replacement';
      else result.sameDocumentNavigationEvents = (result.sameDocumentNavigationEvents || 0) + 1;
    }).catch(() => { if (!expectedNavigation) fatal ||= 'document-inspection-failed'; });
    navigationChecks.add(check); void check.finally(() => navigationChecks.delete(check));
  });
  browser.on('disconnected', () => { if (!expectedNavigation) fatal ||= 'browser-disconnected'; });
  await page.goto(lab.origin + '/game', { waitUntil: 'domcontentloaded' });
  await page.bringToFront();
  await page.getByRole('button', { name: 'Resume', exact: true }).click({ timeout: 45000 });
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'playing', null, { timeout: 30000 });
  await page.evaluate(() => { window.__crossDeviceTest.protect(); window.__crossDeviceTest.park(); });
  await page.waitForFunction(() => window.__crossDeviceTest.inspect().reactorOpen, null, { timeout: 30000 });
  result.bundledFlags = (await inspect()).buildFlags;
  assert.equal(result.bundledFlags.production, buildMode === 'production', 'Actual browser bundle mode matches requested mode');
  assert.equal(result.bundledFlags.development, buildMode !== 'production');
  documentId = await page.evaluate(() => window.__bossLabDocument); expectedNavigation = false;
  session = await context.newCDPSession(page); await session.send('HeapProfiler.enable');
  result.points.push(await measure('initial-playing'));
  await pause(); result.points.push(await measure('initial-paused-before-gc'));
  await session.send('HeapProfiler.collectGarbage'); result.points.push(await measure('initial-paused-after-gc'));
  const before = await snapshot('before'); result.points.push(await measure('initial-paused-after-snapshot'));
  await page.locator('.pause-resume-button').click();
  await page.waitForFunction(() => window.__crossDeviceTest.inspect().status === 'playing', null, { timeout: 30000 });
  const start = Date.now(); let first, last, lastFrame, frameChangedAt = Date.now();
  while (Date.now() - start < seconds * 1000) {
    const point = await measure('active-baseline'); first ??= point; last = point;
    assert.equal(point.status, 'playing');
    if (point.frameAt !== lastFrame) frameChangedAt = Date.now();
    assert.ok(Date.now() - frameChangedAt < 5000, 'Frames advance'); lastFrame = point.frameAt;
    if (Math.round((Date.now() - start) / 1000) % 15 === 0) console.log('CRYPTOID_OBJECT_PROGRESS ' + Math.round((Date.now() - start) / 1000));
    await page.waitForTimeout(1000);
  }
  assert.ok(last.coreVolley > first.coreVolley, 'Reactor fires during observed play');
  result.observedActiveSeconds = (Date.now() - start) / 1000;
  result.points.push(first, last);
  await pause(); result.points.push(await measure('final-paused-before-gc'));
  await session.send('HeapProfiler.collectGarbage'); result.points.push(await measure('final-paused-after-gc'));
  const after = await snapshot('after'); result.points.push(await measure('final-paused-after-snapshot'));
  result.difference = compareHeaps(before, after);
  await within(Promise.all([...navigationChecks]), 8000, 'navigation-check-timeout');
  assert.equal(await page.evaluate(() => window.__bossLabDocument), documentId);
  assert.equal(lab.apiErrors.length, 0); assert.ok(!fatal);
  result.complete = true;
} catch (error) {
  result.failure = { code: fatal || 'profile-failed', message: error.message }; process.exitCode = 1;
} finally {
  expectedNavigation = true;
  result.finishedAt = new Date().toISOString(); result.apiErrors = lab?.apiErrors || [];
  writeFileSync(output + '/object-profile-summary.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_OBJECT_RESULT ' + JSON.stringify({ complete: result.complete, failure: result.failure, points: result.points.length,
    snapshots: result.snapshots.length, engineVersion: result.engineVersion, finishedAt: result.finishedAt }));
  if (session) try { await within(session.detach(), 3000, 'detach-timeout'); } catch { process.exitCode = 1; }
  if (browser) try { await within(browser.close(), 8000, 'close-timeout'); } catch { process.exitCode = 1; }
  if (lab) try { await within(lab.server.close(), 8000, 'server-close-timeout'); } catch { process.exitCode = 1; }
}
