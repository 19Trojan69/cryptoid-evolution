// Local native-browser acceptance of the built app; no game hooks or auto-resume.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { previewReply } from './api.mjs';
import { captureLifecycleState, captureLifecycleFailure, assertLifecycleState } from '../frontend/scripts/startupLifecycleEvidence.mjs';

const root = new URL('../', import.meta.url).pathname;
const dist = resolve(process.env.CRYPTOID_PRIVATE_OUTPUT || root + 'frontend/dist');
const fixture = process.env.CRYPTOID_STARTUP_FIXTURE_ROOT;
assert.ok(fixture, 'Original-font fixture directory is required');
const reportDir = resolve(root, 'docs/private-playable-preview-20261024'); mkdirSync(reportDir, { recursive: true });
const engine = process.env.CRYPTOID_STARTUP_ENGINE || 'chromium';
const report = { engine, passed: false, preflight: {}, originalFonts: true, gameplayHooks: false, automaticResume: false,
  limitations: 'Native Linux viewport and input checks. Not physical Pi Browser/iPhone, audible device output or full-campaign acceptance. Samples and screenshots add overhead.', results: [] };
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://local').pathname;
  if (pathname === '/preflight') { res.end('<!doctype html><p id="preflight">local-server-ok</p>'); return; }
  if (pathname.startsWith('/api/')) {
    for await (const chunk of req) void chunk;
    const r = previewReply(req.method, pathname, 'preview'); res.statusCode = r.status;
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(r.body)); return;
  }
  const path = resolve(dist, pathname === '/' ? 'index.html' : '.' + decodeURIComponent(pathname));
  if (!path.startsWith(dist + sep) || !existsSync(path) || !statSync(path).isFile()) { res.statusCode = 404; res.end(); return; }
  res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream'); res.end(readFileSync(path));
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = 'http://127.0.0.1:' + server.address().port;
const require = createRequire(import.meta.url);
const pw = require(process.env.CRYPTOID_PLAYWRIGHT_PACKAGE || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const fonts = new Map(JSON.parse(readFileSync(resolve(fixture, 'route-font-manifest.json'))).map(x => [x.url, readFileSync(resolve(fixture, x.path))]));
const fontCss = readFileSync(resolve(fixture, 'route-fonts.css'), 'utf8');
const sizes = [['phone', 430, 825, 3], ['phone-bars', 390, 650, 3], ['tablet', 820, 1180, 2], ['tablet-landscape', 1180, 820, 2], ['pc', 1440, 900, 1]];
let browser;
try {
  browser = await pw[engine].launch({ headless: true, ...(process.env.CRYPTOID_BROWSER_EXECUTABLE ? { executablePath: process.env.CRYPTOID_BROWSER_EXECUTABLE } : {}) });
  report.version = browser.version(); report.preflight.browserStarted = true;
  const preflight = await browser.newPage(); const response = await preflight.goto(origin + '/preflight', { timeout: 10000 });
  report.preflight.status = response.status(); report.preflight.text = await preflight.locator('#preflight').textContent();
  assert.equal(report.preflight.status, 200); assert.equal(report.preflight.text, 'local-server-ok'); await preflight.close();
  for (const [label, width, height, dpr] of sizes) {
    const mobile = label.startsWith('phone');
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, locale: 'de-AT' });
    const row = { label, width, height, dpr, passed: false, unexpected: [], errors: [], httpErrors: [] }; report.results.push(row);
    await context.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith('https://fonts.googleapis.com/')) return route.fulfill({ contentType: 'text/css', body: fontCss });
      if (fonts.has(url)) return route.fulfill({ contentType: 'font/ttf', body: fonts.get(url) });
      if (url.startsWith(origin + '/') || url.startsWith('blob:') || url.startsWith('data:')) return route.continue();
      row.unexpected.push(url); return route.abort();
    });
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    page.on('pageerror', error => row.errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) row.httpErrors.push({ url: response.url().replace(origin, ''), status: response.status() }); });
    try {
      row.lifecycleStage = 'home'; await page.goto(origin); await page.locator('.cinematic-play:not([disabled])').waitFor();
      row.homeFullscreen = await page.evaluate(() => !!document.fullscreenElement);
      const home = await captureLifecycleState(page, row, 'home'); row.lifecycleStartedAt = home.observedAtEpochMs;
      row.lifecycleStage = 'play'; await page.locator('.cinematic-play').click();
      await page.locator('.game-shell[data-effects-paused="false"]').waitFor(); await page.locator('.pause-control:not([disabled])').waitFor();
      const measure = () => page.evaluate(() => {
        const box = selector => { const r = document.querySelector(selector)?.getBoundingClientRect(); return r ? [r.x, r.y, r.width, r.height] : null; };
        return { viewport: [innerWidth, innerHeight], scroll: [scrollX, scrollY], document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
          fullscreen: !!document.fullscreenElement, nativeFullscreenAvailable: typeof document.documentElement.requestFullscreen === 'function' || typeof document.documentElement.webkitRequestFullscreen === 'function',
          shell: box('.game-shell'), hud: box('.game-hud'), player: box('.player-ship'), controls: [...document.querySelectorAll('.game-hud button')].map(e => { const r = e.getBoundingClientRect(); return { text: e.getAttribute('aria-label') || e.textContent, box: [r.x, r.y, r.width, r.height] }; }) };
      });
      row.beforeInput = await measure();
      assertLifecycleState(await captureLifecycleState(page, row, 'before-input'), 'active');
      row.lifecycleStage = 'trusted-input';
      if (mobile && engine === 'chromium') {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: width / 2, y: height * .7 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: width / 2, y: height * .4 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach();
        row.input = 'native touch swipe';
      } else if (mobile) { await page.touchscreen.tap(width / 2, height / 2); await page.keyboard.press('PageDown'); row.input = 'native tap and PageDown; no iPhone swipe claim'; }
      else { await page.mouse.move(width / 2, height / 2); await page.mouse.wheel(0, 450); row.input = 'native wheel'; }
      row.afterInput = await measure(); const geometry = row.afterInput;
      assert.deepEqual(geometry.scroll, [0, 0]);
      assert.deepEqual(geometry.shell, [0, 0, ...geometry.viewport]);
      assert.deepEqual(geometry.document, geometry.viewport);
      for (const rect of [geometry.hud, geometry.player, ...geometry.controls.map(c => c.box)]) {
        assert.ok(rect && rect[0] >= -1 && rect[1] >= -1 && rect[0] + rect[2] <= geometry.viewport[0] + 1 && rect[1] + rect[3] <= geometry.viewport[1] + 1, 'Visible game content must fit');
      }
      if (engine === 'chromium') assert.equal(geometry.fullscreen, true);
      assertLifecycleState(await captureLifecycleState(page, row, 'after-input'), 'active');
      row.lifecycleStage = 'screenshot'; row.screenshot = label + '-' + engine + '.png';
      await page.screenshot({ path: resolve(reportDir, row.screenshot), timeout: 10000, animations: 'allow' });
      assertLifecycleState(await captureLifecycleState(page, row, 'after-screenshot'), 'active');
      assert.deepEqual(row.errors, []); assert.deepEqual(row.unexpected, []); assert.deepEqual(row.httpErrors, []);
      row.passed = true;
    } catch (error) {
      await captureLifecycleFailure(page, row, error, { screenshotPath: resolve(reportDir, label + '-' + engine + '-failure.png') });
      throw error;
    } finally { writeFileSync(resolve(reportDir, 'viewports-' + engine + '.json'), JSON.stringify(report, null, 2) + '\n'); await context.close(); }
  }
  report.passed = true;
} catch (error) { report.error = { name: error.name, message: error.message }; process.exitCode = 1; }
finally { writeFileSync(resolve(reportDir, 'viewports-' + engine + '.json'), JSON.stringify(report, null, 2) + '\n'); await browser?.close(); server.closeAllConnections(); server.close(); }
console.log(JSON.stringify({ engine, preflight: report.preflight, passed: report.passed, cases: report.results.map(r => ({ label: r.label, passed: r.passed })), error: report.error }));
