import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { configuration, root, DIRECTORY, BASELINE } from './fixture.mjs';
import { createLabServer } from './labServer.mjs';
import { sampleBrowserMemory } from './processMemory.mjs';
import { swipe } from './gesture.mjs';
const require = createRequire(import.meta.url);
const pw = require(process.env.CRYPTOID_PLAYWRIGHT_MODULE || 'playwright');
const name = process.env.CRYPTOID_TEST_PROFILE || 'android-phone';
const mode = process.env.CRYPTOID_FORENSIC_MODE || 'direct';
const diagnostics = process.env.CRYPTOID_OWNER_DIAGNOSTICS !== '0';
const warmLimit = Number(process.env.CRYPTOID_WARMUP_MAX_SECONDS || 900);
const caseSeconds = Number(process.env.CRYPTOID_CASE_SECONDS || 20);
assert.ok(Number.isInteger(warmLimit) && warmLimit >= 30 && warmLimit <= 1800);
assert.ok(Number.isInteger(caseSeconds) && caseSeconds >= 10 && caseSeconds <= 120);
const profile = configuration(name, pw.devices);
const output = resolve(process.env.CRYPTOID_TEST_OUTPUT || `${root}/${DIRECTORY}/results/${name}-${mode}`);
mkdirSync(output, { recursive: true });
const source = readFileSync(root + '/frontend/src/pages/GamePage.tsx', 'utf8');
assert.equal(source, execFileSync('git', ['show', BASELINE + ':frontend/src/pages/GamePage.tsx'], { cwd: root, encoding: 'utf8' }));
const result = { profile: name, mode, baseline: BASELINE, controllerSha256: createHash('sha256').update(source).digest('hex'),
  actualHostOS: process.platform, physicalDevice: false, realPiBrowser: false, realAuthentication: false,
  realDatabase: false, realPayments: false, syntheticAccount: true, collisionProtection: true,
  nativeClocksAltered: false, seededRandom: true, directTurretRemoval: mode === 'direct',
  ownerDiagnostics: diagnostics, cases: [], nativeMemoryAvailable: false, complete: false,
  osScreenshot: 'not-executed-requires-physical-device', screenshotPreview: 'not-executed-requires-physical-device',
  nativeEdgeNavigation: 'not-executed-requires-physical-device', historicalWhiteScreenFixed: false };
result.continuousPixelObservation = false;
const note = (kind, data = {}) => appendFileSync(output + '/events.jsonl', JSON.stringify({ at: new Date().toISOString(), kind, ...data }) + '\n');
const save = () => writeFileSync(output + '/summary.json', JSON.stringify(result, null, 2) + '\n');
let lab, browser, context, page, fatal, expectedNavigation = true, documentId;
const fail = kind => { fatal ||= kind; note(kind); };
const within = (promise, ms, label) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(Error(label)), ms);
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});
async function clickVisible(selector) {
  const button = page.locator(selector).first();
  if (await button.isVisible() && await button.isEnabled()) { await button.click({ timeout: 5000 }); return true; }
  return false;
}
async function inspect() {
  if (fatal) throw Error(fatal);
  const state = await within(page.evaluate(() => window.__crossDeviceTest.inspect()), 8000, 'renderer-inspection-unresponsive');
  if (state.technicalPause) throw Error('unexpected-technical-pause');
  if (state.failed) throw Error('completion-preparation-failed');
  if (['game-over', 'destroying'].includes(state.status)) throw Error('fixture-protection-failed');
  return state;
}
let lastMemory = 0;
function memory(stage) {
  if (Date.now() - lastMemory < 1000) return;
  lastMemory = Date.now(); const sample = sampleBrowserMemory();
  result.nativeMemoryAvailable ||= sample.available;
  if (sample.summedRssKiB !== null) result.maxSummedRssKiB = Math.max(result.maxSummedRssKiB || 0, sample.summedRssKiB);
  if (sample.summedPssKiB !== null) result.maxSummedPssKiB = Math.max(result.maxSummedPssKiB || 0, sample.summedPssKiB);
  appendFileSync(output + '/process-memory.jsonl', JSON.stringify({ at: new Date().toISOString(), stage, ...sample }) + '\n');
}
try {
  lab = await createLabServer({ mode, diagnostics, cacheDir: output + '/vite-cache', note });
  browser = await pw[profile.engine].launch({ headless: true }); result.engineVersion = browser.version();
  browser.on('disconnected', () => { if (!expectedNavigation) fail('browser-disconnected'); });
  context = await browser.newContext(profile.context);
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === lab.origin || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  page = await context.newPage(); page.setDefaultTimeout(10000);
  page.on('crash', () => fail('renderer-crash'));
  page.on('pageerror', error => { result.pageErrors ??= []; result.pageErrors.push(error.message); fail('javascript-error'); });
  page.on('console', message => { if (message.type() === 'error') { result.consoleErrors ??= []; result.consoleErrors.push(message.text().slice(0, 1000)); note('console-error'); } });
  page.on('request', request => { if (!expectedNavigation && request.isNavigationRequest() && request.frame() === page.mainFrame()) fail('unexpected-document-request'); });
  page.on('framenavigated', frame => {
    if (frame !== page.mainFrame() || expectedNavigation) return;
    void frame.evaluate(() => window.__bossLabDocument).then(id => { if (!expectedNavigation && id !== documentId) fail('unexpected-document-replacement'); })
      .catch(() => { if (!expectedNavigation) fail('document-inspection-failed'); });
  });
  await page.goto(lab.origin + '/game', { waitUntil: 'domcontentloaded' });
  await page.bringToFront();
  await page.getByRole('button', { name: 'Resume', exact: true }).click({ timeout: 45000 });
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'playing', null, { timeout: 30000 });
  await page.evaluate(() => window.__crossDeviceTest.protect());
  assert.equal((await inspect()).ownerDiagnostics, diagnostics, 'Verified owner-diagnostic mode matches the selected control');
  documentId = await page.evaluate(() => window.__bossLabDocument); assert.ok(documentId);
  expectedNavigation = false;
  await page.evaluate(async enabled => {
    window.__bossLabInputs = [];
    if (!enabled) return;
    const module = await import('/src/lib/sessionDiagnosticEvents.ts');
    window.__bossLabStopInput = module.observeSessionDiagnostics((kind, details) => {
      if (kind === 'input') { window.__bossLabInputs.push(details); if (window.__bossLabInputs.length > 256) window.__bossLabInputs.shift(); }
    });
  }, diagnostics);
  const warmStart = Date.now(), sectors = new Set(); let lastProgress = 0, pausedAt = 0, warmFrame, warmFrameAt = Date.now();
  while (true) {
    const state = await inspect(); sectors.add(state.sector);
    if (state.status === 'playing') {
      if (state.frameAt !== warmFrame) warmFrameAt = Date.now();
      assert.ok(Date.now() - warmFrameAt < 5000, 'Prelude frame callbacks continue'); warmFrame = state.frameAt;
    }
    if (state.status === 'paused' && !state.summary && !state.cards && state.countdown === null) {
      pausedAt ||= Date.now(); assert.ok(Date.now() - pausedAt < 5000, 'No unexplained prelude pause');
    } else pausedAt = 0;
    memory('prelude');
    if (state.sector === 20 && state.encounter === 'boss-fight' && state.reactorOpen) break;
    if (Date.now() - warmStart > warmLimit * 1000) throw Error('target-reactor-not-reached-within-budget');
    if (await clickVisible('.card-reveal-dialog .collection-footer button:last-child')) note('explicit-card-dismiss');
    if (state.summary && state.prepared) { if (await clickVisible('.level-completion .button-primary')) note('explicit-continue', { sector: state.sector }); }
    else if (state.status === 'playing') {
      const elapsed = (Date.now() - warmStart) / 1000;
      const aim = state.encounter === 'boss-clear' ? { x: .5, y: .58 } : { x: state.bonusX ?? .5 + .29 * Math.sin(elapsed * .8), y: .84 };
      const field = page.locator('.game-field'), box = await field.boundingBox(); assert.ok(box);
      await field.dispatchEvent('pointerdown', { pointerId: 11, pointerType: 'mouse', isPrimary: true, buttons: 1,
        clientX: box.x + aim.x * box.width, clientY: box.y + aim.y * box.height });
    }
    if (Date.now() - lastProgress >= 30000) { lastProgress = Date.now(); console.log('CRYPTOID_PROGRESS ' + JSON.stringify({ profile: name, mode, sector: state.sector, encounter: state.encounter })); save(); }
    await page.waitForTimeout(250);
  }
  result.preludeSeconds = Math.round((Date.now() - warmStart) / 1000);
  result.visitedSectors = [...sectors].sort((a, b) => a - b);
  if (mode === 'warm') for (let sector = 1; sector <= 20; sector++) assert.ok(sectors.has(sector), 'Natural prelude includes sector ' + sector);
  await page.evaluate(() => window.__crossDeviceTest.park());
  for (const label of ['baseline', 'interior-left', 'edge-left', 'cancelled-left', 'browser-capture']) {
    const record = { label, startedAt: new Date().toISOString(), passed: false, gestures: 0 };
    result.cases.push(record); note('case-start', { label });
    const start = Date.now(); let lastGesture = -Infinity, captured = false, frameAt = null, stalledAt = Date.now();
    while (Date.now() - start < caseSeconds * 1000) {
      const state = await inspect();
      assert.ok(state.sector === 20 && state.encounter === 'boss-fight' && state.reactorOpen, 'Target scene remains active');
      assert.equal(state.status, 'playing', 'No unexplained pause');
      record.startCoreVolley ??= state.coreVolley;
      record.endCoreVolley = state.coreVolley;
      if (state.frameAt !== frameAt) stalledAt = Date.now();
      assert.ok(Date.now() - stalledAt < 5000, 'Game frame callbacks continue'); frameAt = state.frameAt;
      memory(label);
      if (label.endsWith('left') && Date.now() - lastGesture >= 4000) {
        record.dispatchMethod = await swipe(page, profile.engine, label === 'edge-left', label === 'cancelled-left');
        record.gestures++; lastGesture = Date.now();
      }
      if (label === 'browser-capture' && !captured && Date.now() - start > 3000) {
        const png = await page.screenshot({ path: output + '/browser-capture-not-os.png', animations: 'allow', timeout: 10000 });
        const frontendRequire = createRequire(root + '/frontend/package.json');
        const { createCanvas, loadImage } = frontendRequire('@napi-rs/canvas');
        const canvas = createCanvas(64, 64), pixels = canvas.getContext('2d');
        pixels.drawImage(await loadImage(png), 0, 0, 64, 64);
        const data = pixels.getImageData(0, 0, 64, 64).data; let white = 0;
        for (let i = 0; i < data.length; i += 4) if (data[i] > 248 && data[i+1] > 248 && data[i+2] > 248 && data[i+3] > 248) white++;
        record.whitePixelRatio = white / 4096; assert.ok(record.whitePixelRatio < .98, 'Capture is not nearly all white');
        captured = true;
      }
      await page.waitForTimeout(250);
    }
    assert.ok(record.endCoreVolley > record.startCoreVolley, 'Active reactor continues firing');
    record.observedSeconds = (Date.now() - start) / 1000; record.passed = true; note('case-complete', { label }); save();
  }
  result.inputEvidence = await page.evaluate(() => window.__bossLabInputs);
  if (diagnostics) assert.ok(result.inputEvidence.some(row => row.operation === 'gesture-end' && row.direction === 'left'), 'Coarse left swipe evidence exported');
  else assert.equal(result.inputEvidence.length, 0, 'Disabled diagnostic control registers no test input observer');
  result.lastState = await inspect();
  assert.equal(lab.apiErrors.length, 0, 'Existing handlers accepted every request');
  assert.ok(result.nativeMemoryAvailable, 'Actual Linux browser process memory sampled');
  assert.equal((result.consoleErrors || []).length, 0, 'No console errors');
  result.complete = true;
} catch (error) {
  result.failure = { kind: fatal || 'test-failed', message: error.message };
  note('failure', result.failure); process.exitCode = 1;
  if (page && !page.isClosed()) {
    try { result.lastState = await within(page.evaluate(() => window.__crossDeviceTest?.inspect()), 2000, 'final-inspection-unresponsive'); } catch { /* Renderer may be unavailable. */ }
  }
} finally {
  expectedNavigation = true;
  result.finishedAt = new Date().toISOString(); result.apiErrors = lab?.apiErrors || []; result.requestCounts = lab?.requestCounts || {};
  save(); console.log('CRYPTOID_RESULT ' + JSON.stringify(result));
  if (browser) try { await within(browser.close(), 8000, 'browser-close-timeout'); } catch { process.exitCode = 1; }
  if (lab) try { await within(lab.server.close(), 8000, 'server-close-timeout'); } catch { process.exitCode = 1; }
}
