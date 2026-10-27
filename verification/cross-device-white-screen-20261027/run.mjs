// Actual GameEntry/GamePage and handlers; Linux browser emulation, not a phone.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createAccountFixture, configuration, instrumentController, root, DIRECTORY, BASELINE } from './fixture.mjs';

const require = createRequire(root + '/frontend/package.json');
const { createServer } = require('vite');
const pwRequire = createRequire(import.meta.url);
const pw = pwRequire(process.env.CRYPTOID_PLAYWRIGHT_MODULE || 'playwright');
const name = process.env.CRYPTOID_TEST_PROFILE || 'android-phone';
const seconds = Number(process.env.CRYPTOID_TEST_SECONDS || 90);
assert.ok(Number.isInteger(seconds) && seconds >= 30 && seconds <= 3600);
const profile = configuration(name, pw.devices);
const output = resolve(process.env.CRYPTOID_TEST_OUTPUT || root + '/' + DIRECTORY + '/results/' + name);
mkdirSync(output, { recursive: true });
const hash = s => createHash('sha256').update(s).digest('hex');
const controller = readFileSync(root + '/frontend/src/pages/GamePage.tsx', 'utf8');
assert.equal(controller, execFileSync('git', ['show', BASELINE + ':frontend/src/pages/GamePage.tsx'], { cwd: root, encoding: 'utf8' }));
const result = {
  profile: name, baseline: BASELINE, controllerSha256: hash(controller),
  engine: profile.engine, viewport: profile.viewport, preset: profile.preset,
  actualOperatingSystem: process.platform, physicalDevice: false, realPiBrowser: false,
  emulatedUserAgent: profile.context.userAgent, deviceScaleFactor: profile.context.deviceScaleFactor,
  realPiAuthentication: false, realDatabase: false, realPayments: false,
  syntheticAccount: true, testOnlyProtection: true, seededRandom: true,
  controlledNativeClock: false, browserCaptureIsNotOsScreenshot: true,
  requestedSeconds: seconds, observations: 0, sectors: [], milestones: [],
  pageErrors: [], apiErrors: [], browserEvents: [], complete: false,
  historicalWhiteScreenFixed: false,
};
let server, browser, context, page;
let expectedNavigation = true, initialDocumentId = null, fatal = null;
const { h, initialize } = createAccountFixture();
const requestCounts = {};
const note = (kind, extra = {}) => {
  const row = { at: new Date().toISOString(), kind, ...extra };
  appendFileSync(output + '/events.jsonl', JSON.stringify(row) + '\n');
};
const fail = (kind, details = {}) => { fatal ??= { kind, ...details }; note(kind, details); };
const within = (promise, ms, label) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(label)), ms);
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});
async function clickIfVisible(selector) {
  const button = page.locator(selector).first();
  if (await button.isVisible() && await button.isEnabled()) { await button.click({ timeout: 4000 }); return true; }
  return false;
}
async function capture(label) {
  const png = await page.screenshot({ path: output + '/' + label + '.png', timeout: 10000, animations: 'allow' });
  result.browserCaptureCount = (result.browserCaptureCount || 0) + 1;
  // Read pixels outside the browser; never mutate game images or render quality.
  const { createCanvas, loadImage } = require('@napi-rs/canvas');
  const image = await loadImage(png), canvas = createCanvas(64, 64), ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, 64, 64);
  const { data } = ctx.getImageData(0, 0, 64, 64);
  let white = 0;
  for (let i = 0; i < data.length; i += 4) if (data[i] > 248 && data[i + 1] > 248 && data[i + 2] > 248 && data[i + 3] > 248) white++;
  const ratio = white / 4096;
  note('browser-capture', { label, whitePixelRatio: ratio });
  if (ratio > .98) fail('nearly-all-white-browser-capture', { whitePixelRatio: ratio });
}
try {
  await initialize();
  server = await createServer({ root: root + '/frontend', cacheDir: output + '/vite-cache', logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [root] } },
    plugins: [{ name: 'isolated-duration-only', enforce: 'pre',
      transform(code, id) { if (id.split('?')[0].endsWith('/pages/GamePage.tsx')) return instrumentController(code); },
      transformIndexHtml: { order: 'post', handler: html => html.replace(/appNetwork:\s*"[^"]*"/, 'appNetwork: "testnet"').replace(/backendURL:\s*"[^"]*"/, 'backendURL: "/api"') },
    }],
  });
  await server.listen();
  const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  browser = await pw[profile.engine].launch({ headless: true });
  result.engineVersion = browser.version();
  browser.on('disconnected', () => { if (!expectedNavigation) fail('browser-disconnected'); });
  context = await browser.newContext(profile.context);
  await context.addInitScript(() => {
    window.__crossDeviceDocumentId = crypto.randomUUID();
    let seed = 0x271026;
    Math.random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
    localStorage.setItem('cryptoid_language', 'en');
    localStorage.setItem('cryptoid_control_hand', 'right');
    localStorage.setItem('cryptoid_pi_session', '1');
    sessionStorage.setItem('cryptoid_pi_access_token', 'isolated-duration-token');
    localStorage.setItem('cryptoid_auto_reload:testnet:pilot-a', JSON.stringify({ 5: true }));
    window.Pi = { init() {}, getPiHostAppInfo: async () => ({ hostApp: 'web' }),
      authenticate: async () => ({ accessToken: 'isolated-duration-token', user: { uid: 'pilot-a', username: 'Isolated duration test' } }) };
  });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) {
      if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    }
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const [group, ...parts] = url.pathname.slice(5).split('/');
    requestCounts[url.pathname] = (requestCounts[url.pathname] || 0) + 1;
    let response;
    try {
      if (group === 'user') response = { code: 200, body: { user: { uid: 'pilot-a', username: 'Isolated duration test' }, canAdmin: true, adminMode: false } };
      else if (group === 'admin') response = { code: 200, body: { canAdmin: true, adminMode: false } };
      else if (group === 'usage') response = { code: 204 };
      else if (['progress', 'hangar', 'rewards', 'leaderboard'].includes(group))
        response = await h.call(group, '/' + parts.join('/'), route.request().postDataJSON(), { method: route.request().method() });
      else response = { code: 404, body: { error: 'unhandled_isolated_endpoint' } };
      if (response.code >= 400) {
        const error = { path: url.pathname, status: response.code, code: response.body?.error };
        result.apiErrors.push(error); note('api-error', error);
      }
      return route.fulfill({ status: response.code, contentType: 'application/json', body: response.code === 204 ? '' : JSON.stringify(response.body) });
    } catch (error) { fail('fixture-handler-error', { path: url.pathname, message: error.message }); return route.fulfill({ status: 500, body: '{}' }); }
  });
  page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => { result.pageErrors.push(error.message); fail('javascript-page-error', { message: error.message }); });
  page.on('crash', () => fail('renderer-crash'));
  page.on('request', request => {
    if (!expectedNavigation && request.isNavigationRequest() && request.frame() === page.mainFrame())
      fail('unexpected-document-request', { path: new URL(request.url()).pathname });
  });
  page.on('framenavigated', frame => {
    if (frame !== page.mainFrame() || expectedNavigation) return;
    const path = new URL(frame.url()).pathname;
    if (path !== '/game') { fail('unexpected-main-frame-route', { path }); return; }
    // The game's modal Back guard uses same-document history entries. A real
    // reload gets a new init-script marker, including same-URL document loads.
    void frame.evaluate(() => window.__crossDeviceDocumentId).then(id => {
      if (expectedNavigation) return;
      if (id !== initialDocumentId) fail('unexpected-document-replacement', { path });
      else { const event = { kind: 'same-document-history', path }; result.browserEvents.push(event); note(event.kind, { path }); }
    }).catch(error => { if (!expectedNavigation) fail('navigation-inspection-failed', { path, message: error.message }); });
  });
  page.on('console', message => { if (message.type() === 'error') note('console-error', { text: message.text().slice(0, 1000) }); });
  await context.tracing.start({ screenshots: false, snapshots: false, sources: true });
  await page.goto(origin + '/game', { waitUntil: 'domcontentloaded' });
  await page.bringToFront();
  const resume = page.getByRole('button', { name: 'Resume', exact: true });
  await resume.waitFor({ state: 'visible', timeout: 30000 });
  result.startupDocument = await page.evaluate(() => ({ visible: document.visibilityState, focused: document.hasFocus(), ready: document.readyState }));
  await resume.click({ timeout: 30000 });
  await page.waitForFunction(() => window.__crossDeviceTest?.inspect().status === 'playing', null, { timeout: 30000 });
  await page.evaluate(() => window.__crossDeviceTest.protect());
  initialDocumentId = await page.evaluate(() => window.__crossDeviceDocumentId);
  assert.ok(initialDocumentId, 'Per-document identity is available');
  expectedNavigation = false;
  const start = Date.now();
  result.startedAt = new Date(start).toISOString();
  let lastSample = 0, lastConsoleSample = 0, lastCapture = 0, sawShots = false, pauseDone = false, pausedUntil = 0;
  let previousFrame = null, frameUnchangedSince = 0;
  let previousProgress = '', progressChangedAt = Date.now();
  let explicitPausePending = false, unexplainedPauseSince = 0;
  const seen = new Set();
  while (Date.now() - start < seconds * 1000) {
    if (fatal) throw new Error(fatal.kind);
    const state = await within(page.evaluate(() => window.__crossDeviceTest.inspect()), 8000, 'inspection-unresponsive');
    const elapsed = (Date.now() - start) / 1000;
    seen.add(state.sector); sawShots ||= state.shots > 0 || state.hostileShots > 0;
    if (state.technicalPause) { fail('unexpected-technical-pause', { sector: state.sector, phase: state.phase }); throw new Error('unexpected-technical-pause'); }
    if (state.failed) { fail('completion-preparation-failed', { sector: state.sector }); throw new Error('completion-preparation-failed'); }
    const explainedPause = state.summary || state.cards > 0 || state.countdown !== null || explicitPausePending;
    if (state.status === 'paused' && !explainedPause) {
      if (!unexplainedPauseSince) unexplainedPauseSince = Date.now();
      if (Date.now() - unexplainedPauseSince > 5000) throw new Error('unexpected-game-pause');
    } else unexplainedPauseSince = 0;
    if (await clickIfVisible('.card-reveal-dialog .collection-footer button:last-child')) result.milestones.push('card-dismissed');
    if (state.summary && state.prepared) {
      if (await clickIfVisible('.level-completion .button-primary')) { result.milestones.push('manual-continue:' + state.sector); note('explicit-level-continue', { sector: state.sector }); }
    } else if (state.status === 'playing') {
      const progress = JSON.stringify([state.sector, state.phase, state.encounter, state.score, state.destroyed, state.bossHealth, state.bonusHits]);
      if (progress !== previousProgress) { previousProgress = progress; progressChangedAt = Date.now(); }
      if (Date.now() - progressChangedAt > 180000) throw new Error('scenario-no-progress-pilot-or-game-needs-investigation');
      if (state.frameAt === previousFrame) {
        if (!frameUnchangedSince) frameUnchangedSince = Date.now();
        if (Date.now() - frameUnchangedSince > 5000) throw new Error('playing-frame-progress-stopped');
      } else frameUnchangedSince = 0;
      if (!pauseDone && elapsed >= Math.min(45, seconds / 3)) {
        if (await clickIfVisible('.pause-control')) { pauseDone = true; explicitPausePending = true; pausedUntil = Date.now() + 2000; result.milestones.push('explicit-pause'); }
      } else {
        const aim = state.encounter === 'boss-clear' ? { x: .5, y: .58 } : { x: state.bonusX ?? .5 + .29 * Math.sin(elapsed * .8), y: .84 };
        const field = page.locator('.game-field'), bounds = await field.boundingBox();
        assert.ok(bounds, 'Visible gameplay input surface');
        await field.dispatchEvent('pointerdown', { pointerId: 11, pointerType: 'mouse', isPrimary: true, buttons: 1,
          clientX: bounds.x + aim.x * bounds.width, clientY: bounds.y + aim.y * bounds.height, button: 0 });
      }
    } else if (state.status === 'paused' && explicitPausePending && !state.summary && !state.cards && state.countdown === null && Date.now() >= pausedUntil) {
      if (await clickIfVisible('.pause-resume-button')) { explicitPausePending = false; result.milestones.push('explicit-resume'); }
    } else if (['destroying', 'game-over'].includes(state.status)) throw new Error('duration-protection-did-not-hold');
    previousFrame = state.frameAt;
    if (Date.now() - lastSample >= 5000) {
      lastSample = Date.now();
      appendFileSync(output + '/progress.jsonl', JSON.stringify({ elapsedSeconds: Math.round(elapsed), ...state }) + '\n');
      result.observations++;
      writeFileSync(output + '/progress-status.json', JSON.stringify({ elapsedSeconds: Math.round(elapsed), sector: state.sector, status: state.status }));
    }
    if (Date.now() - lastConsoleSample >= 30000) {
      lastConsoleSample = Date.now();
      console.log('CRYPTOID_PROGRESS ' + JSON.stringify({ profile: name, elapsedSeconds: Math.round(elapsed),
        sector: state.sector, phase: state.phase, encounter: state.encounter, status: state.status,
        score: state.score, destroyed: state.destroyed, effects: state.effects, canvas: state.canvas }));
    }
    // Baseline first; browser capture only in the last third of the run.
    if (elapsed > seconds * 2 / 3 && Date.now() - lastCapture >= Math.min(60, seconds / 6) * 1000) {
      lastCapture = Date.now(); await capture('capture-' + Math.round(elapsed));
    }
    result.sectors = [...seen].sort((a, b) => a - b);
    await page.waitForTimeout(250);
  }
  result.observedSeconds = Math.round((Date.now() - start) / 1000);
  assert.ok(sawShots, 'Actual projectiles observed');
  assert.ok(result.sectors.length >= 2, 'Actual sector progression observed');
  assert.ok(pauseDone && result.milestones.includes('explicit-resume'), 'Explicit pause and Resume exercised');
  assert.equal(result.pageErrors.length, 0);
  assert.equal(result.apiErrors.length, 0, 'No unexpected API failures');
  result.complete = true;
} catch (error) {
  result.failure = { kind: fatal?.kind || 'test-failed', message: error.message, stack: error.stack };
  if (page && !page.isClosed()) {
    try { await capture('failure'); } catch (captureError) { result.captureFailure = captureError.message; }
    try { result.lastState = await within(page.evaluate(() => window.__crossDeviceTest?.inspect()), 2000, 'final-inspection-timeout'); } catch {}
  }
  process.exitCode = 1;
} finally {
  expectedNavigation = true;
  result.requestCounts = requestCounts;
  result.finishedAt = new Date().toISOString();
  if (result.startedAt) result.observedSeconds = Math.round((Date.now() - Date.parse(result.startedAt)) / 1000);
  if (context) { try { await context.tracing.stop({ path: output + '/trace.zip' }); } catch (error) { result.traceFailure = error.message; } }
  await browser?.close(); await server?.close();
  writeFileSync(output + '/summary.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ profile: name, complete: result.complete, engine: result.engineVersion,
    physicalDevice: false, requestedSeconds: seconds, observedSeconds: result.observedSeconds,
    sectors: result.sectors, failure: result.failure?.message }));
  console.log('CRYPTOID_RESULT ' + JSON.stringify(result));
}
