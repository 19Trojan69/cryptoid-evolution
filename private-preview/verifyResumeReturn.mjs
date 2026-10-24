// Local, unchanged built app. Test transport/DOM observations only; no gameplay hooks.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { previewReply } from './api.mjs';
import { captureLifecycleState, assertLifecycleState, captureLifecycleFailure } from '../frontend/scripts/startupLifecycleEvidence.mjs';

const root = new URL('../', import.meta.url).pathname;
const dist = resolve(process.env.CRYPTOID_PRIVATE_OUTPUT);
const fixture = resolve(process.env.CRYPTOID_STARTUP_FIXTURE_ROOT);
const output = resolve(root, 'docs/preview-resume-investigation-20261024'); mkdirSync(output, { recursive: true });
const engine = process.env.CRYPTOID_STARTUP_ENGINE || 'chromium';
const report = { engine, passed: false, gameplayHooks: false, automaticResume: false, preflight: {}, results: [],
  limits: 'Controlled Linux native browsers, original fonts, synthetic guest transports. DOM observations and screenshots add overhead. Viewport resizing does not reproduce native browser translation, OS process termination or physical iPhone painting.' };
const fonts = new Map(JSON.parse(readFileSync(resolve(fixture, 'route-font-manifest.json'))).map(r => [r.url, readFileSync(resolve(fixture, r.path))]));
const fontCss = readFileSync(resolve(fixture, 'route-fonts.css'), 'utf8');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://local').pathname;
  if (pathname === '/preflight') { res.end('<!doctype html><p id="preflight">local-server-ok</p>'); return; }
  if (pathname.startsWith('/api/')) {
    for await (const chunk of req) void chunk;
    const result = previewReply(req.method, pathname, 'preview'); res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(result.body)); return;
  }
  const file = resolve(dist, pathname === '/' || pathname === '/game' ? 'index.html' : '.' + decodeURIComponent(pathname));
  if (!file.startsWith(dist + sep) || !existsSync(file) || !statSync(file).isFile()) { res.statusCode = 404; res.end(); return; }
  res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream'); res.end(readFileSync(file));
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = 'http://127.0.0.1:' + server.address().port;
const require = createRequire(import.meta.url);
const pw = require(process.env.CRYPTOID_PLAYWRIGHT_PACKAGE || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const snapshot = () => {
  const box = element => { const r = element?.getBoundingClientRect(); return r ? [r.x, r.y, r.width, r.height] : null; };
  const shell = document.querySelector('.game-shell');
  const registry = window.__localResumeDomEvidence ??= { nodes: new WeakMap(), serial: 0 };
  const id = element => { if (!element) return null; if (!registry.nodes.has(element)) registry.nodes.set(element, ++registry.serial); return registry.nodes.get(element); };
  let marker;
  try { const parsed = JSON.parse(sessionStorage.getItem('cryptoid_game_session_v1')); marker = parsed ? { at: parsed.at, active: parsed.active, hidden: parsed.hidden, phase: parsed.context?.phase, sector: parsed.context?.sector } : null; }
  catch { marker = { state: 'unavailable' }; }
  return { at: Date.now(), documentStartedAt: performance.timeOrigin, path: location.pathname,
    shellId: id(shell), shell: box(shell), viewport: [innerWidth, innerHeight], scroll: [scrollX, scrollY],
    hearts: document.querySelector('.hearts-stat')?.textContent.trim(), score: document.querySelector('.score-hud')?.textContent.trim(),
    enemies: [...document.querySelectorAll('.asteroid')].map(e => ({ node: id(e), title: e.getAttribute('title'), x: parseFloat(e.style.left), y: parseFloat(e.style.top), className: e.className })),
    marker };
};
let browser;
try {
  browser = await pw[engine].launch({ headless: true, executablePath: process.env.CRYPTOID_BROWSER_EXECUTABLE });
  report.version = browser.version(); report.preflight.browserStarted = true;
  const page = await browser.newPage(); const response = await page.goto(origin + '/preflight', { timeout: 10000 });
  report.preflight.status = response.status(); report.preflight.text = await page.locator('#preflight').textContent();
  assert.equal(report.preflight.status, 200); assert.equal(report.preflight.text, 'local-server-ok'); await page.close();
  for (const mode of ['pause-resume', 'pause-resume-resize', 'explicit-current-route-reload-control']) {
    const row = { mode, passed: false, errors: [], unexpected: [], httpErrors: [], navigations: [], samples: [] }; report.results.push(row);
    const context = await browser.newContext({ viewport: { width: 393, height: 744 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'de-AT' });
    await context.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith('https://fonts.googleapis.com/')) return route.fulfill({ contentType: 'text/css', body: fontCss });
      if (fonts.has(url)) return route.fulfill({ contentType: 'font/ttf', body: fonts.get(url) });
      if (url.startsWith(origin + '/') || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
      row.unexpected.push(url); return route.abort();
    });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', e => row.errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) row.httpErrors.push({ path: new URL(r.url()).pathname, status: r.status() }); });
    page.on('framenavigated', f => { if (f === page.mainFrame()) row.navigations.push(new URL(f.url()).pathname); });
    const sample = async label => { const state = await page.evaluate(snapshot); row.samples.push({ label, ...state }); return state; };
    const observe = async (label, expected = 'active') => {
      row.lifecycleStage = label;
      const s = await captureLifecycleState(page, row, label); assertLifecycleState(s, expected); return s;
    };
    try {
      row.lifecycleStage = 'home'; await page.goto(origin); await page.locator('.cinematic-play:not([disabled])').waitFor();
      const home = await captureLifecycleState(page, row, 'home'); row.lifecycleStartedAt = home.observedAtEpochMs;
      await page.locator('.cinematic-play').click(); await page.locator('.game-shell[data-effects-paused="false"]').waitFor();
      await page.locator('.asteroid').first().waitFor(); const before = await sample('entry-before-action'); await observe('entry-active');
      row.playNavigationIndex = row.navigations.length;
      if (mode === 'explicit-current-route-reload-control') {
        // Wait only for the existing application marker; never force its writes.
        row.lifecycleStage = 'existing-session-heartbeat';
        await page.waitForFunction(() => JSON.parse(sessionStorage.getItem('cryptoid_game_session_v1') || 'null')?.active === true, { timeout: 15000 });
        await observe('before-controlled-reload'); const old = await sample('before-controlled-reload');
        row.lifecycleStage = 'explicit-reload'; await page.reload();
        await page.locator('.game-shell[data-effects-paused="false"]').waitFor();
        await page.locator('.asteroid').first().waitFor(); const after = await sample('after-controlled-reload');
        const diagnostics = await captureLifecycleState(page, row, 'after-controlled-reload');
        assert.equal(after.path, '/game'); assert.notEqual(after.documentStartedAt, old.documentStartedAt);
        assert.ok(!row.navigations.slice(row.navigations.lastIndexOf('/game')).includes('/'));
        assert.ok(diagnostics.recordedInterruptions.length === 0, 'controlled reload is separate from a technical pause');
        row.controlledReload = { currentRouteStartsGameWithoutHome: true,
          restartMarker: diagnostics.diagnostics.entries.filter(e => e.reason === 'unexpected-restart'),
          notNaturalWhiteScreenReproduction: true };
      } else {
        row.lifecycleStage = 'pause'; await page.locator('.pause-control').click();
        await page.locator('.pause-settings-overlay').waitFor(); await observe('requested-pause', 'paused');
        const paused = await sample('paused');
        if (mode.endsWith('resize')) {
          await page.setViewportSize({ width: 393, height: 628 });
          await sample('paused-with-smaller-viewport');
          await page.setViewportSize({ width: 393, height: 744 });
        }
        await page.waitForTimeout(700); const stillPaused = await sample('still-paused');
        assert.deepEqual(stillPaused.enemies, paused.enemies, 'pause retains the exact enemy nodes and positions');
        row.lifecycleStage = 'explicit-resume'; await page.locator('.pause-resume-button').click();
        await page.locator('.weapon-resume-countdown').waitFor();
        await page.locator('.game-shell[data-effects-paused="false"]').waitFor(); await observe('resumed-active');
        const resumed = await sample('resumed');
        assert.equal(resumed.documentStartedAt, before.documentStartedAt); assert.equal(resumed.shellId, before.shellId);
        assert.ok(paused.enemies.every(e => resumed.enemies.some(live => live.node === e.node)), 'paused enemy nodes remain after Resume');
        if (mode.endsWith('resize')) { await page.setViewportSize({ width: 393, height: 628 }); await sample('active-with-smaller-viewport'); }
        await page.waitForTimeout(1800); await observe('after-active-wait'); await sample('after-active-wait');
        assert.ok(!row.navigations.slice(row.playNavigationIndex).includes('/'), 'no Home navigation after entering the game');
        row.lifecycleStage = 'pixels'; row.screenshot = `${engine}-${mode}.png`;
        await page.screenshot({ path: resolve(output, row.screenshot), timeout: 10000, animations: 'allow' });
        await observe('after-pixels');
        await page.locator('.pause-control').click(); await observe('final-explicit-pause', 'paused');
      }
      assert.deepEqual(row.errors, []); assert.deepEqual(row.unexpected, []); assert.deepEqual(row.httpErrors, []); row.passed = true;
    } catch (error) {
      await captureLifecycleFailure(page, row, error, { screenshotPath: resolve(output, `${engine}-${mode}-failure.png`) });
      throw error;
    } finally { writeFileSync(resolve(output, engine + '.json'), JSON.stringify(report, null, 2) + '\n'); await context.close(); }
  }
  report.passed = true;
} catch (error) { report.error = { name: error.name, message: error.message }; process.exitCode = 1; }
finally { writeFileSync(resolve(output, engine + '.json'), JSON.stringify(report, null, 2) + '\n'); await browser?.close(); server.closeAllConnections(); server.close(); }
console.log(JSON.stringify({ engine, passed: report.passed, preflight: report.preflight, cases: report.results.map(r => ({ mode: r.mode, passed: r.passed, controlledReload: r.controlledReload })), error: report.error }));
