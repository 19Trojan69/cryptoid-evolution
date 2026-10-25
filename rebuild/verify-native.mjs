// Local native-browser acceptance of the incomplete, isolated migration core.
// No production page, account, API or payment is accessed by this fixture.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve, extname, basename } from 'node:path';
const directory = new URL('.', import.meta.url).pathname, root = resolve(directory, '..'), frontend = resolve(root, 'frontend');
const require = createRequire(frontend + '/package.json'), { build } = require('esbuild');
const engine = process.env.CRYPTOID_TEST_ENGINE || 'chromium';
const localRequire = createRequire(directory + 'package.json');
const playwright = process.env.CRYPTOID_PLAYWRIGHT_PATH ? require(process.env.CRYPTOID_PLAYWRIGHT_PATH)
  : engine === 'webkit' && process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright')
  : existsSync(resolve(root, 'verification/browser-tools/node_modules/playwright')) ? require(resolve(root, 'verification/browser-tools/node_modules/playwright'))
  : localRequire('playwright');
const artifacts = resolve(root, 'verification/rebuild'); mkdirSync(artifacts, { recursive: true });
const result = { isolatedCore: true, incompleteFeatureMigration: true, historicalWhiteScreenFixed: false,
  engine, version: null, errors: [], missing: [], navigations: [], crashes: 0, cases: [], samples: [], complete: false };
const out = resolve(artifacts, `native-${engine}.json`);
const bundle = await build({ entryPoints: [directory + 'fixture/index.ts'], absWorkingDir: root, bundle: true, write: false,
  outfile: 'fixture.js', format: 'iife', platform: 'browser', logLevel: 'silent',
  plugins: [{ name: 'original-css-assets', setup(builder) { builder.onResolve({ filter: /^\// }, args => args.kind === 'url-token' ? { path: args.path, external: true } : undefined); } }] });
const js = bundle.outputFiles.find(file => file.path.endsWith('.js')).text, css = bundle.outputFiles.find(file => file.path.endsWith('.css')).text;
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/fixture.js' || path === '/fixture.css') { res.setHeader('Content-Type', path.endsWith('.js') ? 'application/javascript' : 'text/css'); res.end(path.endsWith('.js') ? js : css); return; }
  if (/^\/font-mirror\/[a-f0-9]{64}\.ttf$/.test(path)) { res.setHeader('Content-Type', 'font/ttf'); res.end(readFileSync(resolve(root, 'verification/white-screen-fonts', basename(path)))); return; }
  if (path.startsWith('/ships/')) {
    const file = resolve(frontend, 'public', '.' + path);
    if (!file.startsWith(frontend + '/public/') || !existsSync(file)) { result.missing.push(path); res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', ({ '.png': 'image/png', '.webp': 'image/webp' })[extname(file)] || 'application/octet-stream');
    res.end(readFileSync(file)); return;
  }
  if (path === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><script src="/fixture.js"></script></body></html>');
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const options = { headless: true, timeout: 20000 };
if (engine === 'webkit' && existsSync('/root/.cache/ms-playwright/webkit-2336/minibrowser-wpe/bin/MiniBrowser')) {
  const base = '/root/.cache/ms-playwright/webkit-2336/minibrowser-wpe', libs = resolve(root, 'verification/webkit-libs/usr/lib/x86_64-linux-gnu');
  options.executablePath = base + '/bin/MiniBrowser';
  options.env = { ...process.env, WEBKIT_EXEC_PATH: base + '/bin', WEBKIT_INJECTED_BUNDLE_PATH: base + '/lib',
    WEBKIT_INSPECTOR_RESOURCES_PATH: base + '/share', LD_LIBRARY_PATH: `${base}/lib:${base}/sys/lib:${libs}`,
    GST_PLUGIN_SYSTEM_PATH_1_0: libs + '/gstreamer-1.0', GST_PLUGIN_SCANNER: libs + '/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner',
    GST_REGISTRY_1_0: resolve(root, 'verification/webkit-native-audio-registry.bin') };
}
let browser;
try {
  browser = await playwright[engine].launch(options); result.version = browser.version();
  const context = await browser.newContext({ viewport: { width: 393, height: 744 }, deviceScaleFactor: 3 });
  if (existsSync(resolve(root, 'verification/white-screen-fonts/fonts.css')))
    await context.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: readFileSync(resolve(root, 'verification/white-screen-fonts/fonts.css'), 'utf8') }));
  const page = await context.newPage();
  page.on('pageerror', error => result.errors.push(error.name + ': ' + error.message));
  page.on('crash', () => result.crashes++);
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) result.navigations.push(frame.url()); });
  await page.goto(origin, { waitUntil: 'networkidle' });
  const read = () => page.evaluate(() => window.__rebuild.read());
  const timeOrigin = await page.evaluate(() => performance.timeOrigin);
  async function mount(stage) {
    await page.evaluate(stage => window.__rebuild.mount(stage), stage);
    const state = await read();
    assert.equal(state.lastError, null); assert.equal(state.snapshot.status, 'playing'); assert.ok(state.resources.pool.bytes > 0);
    return state;
  }
  await page.click('#start-normal');
  await page.waitForFunction(() => window.__rebuild.read().snapshot?.status === 'playing');
  await page.waitForTimeout(2500);
  let state = await read(); assert.ok(state.snapshot.state.enemies.length > 0); assert.ok(state.events.sound > 0);
  const beforeX = state.snapshot.state.player.x;
  await page.locator('#field').focus(); await page.keyboard.down('ArrowRight'); await page.waitForTimeout(90); await page.keyboard.up('ArrowRight');
  state = await read(); assert.ok(state.snapshot.state.player.x > beforeX);
  await page.click('#pause'); const paused = await read(); await page.waitForTimeout(250);
  assert.equal((await read()).snapshot.elapsedMs, paused.snapshot.elapsedMs);
  await page.click('#resume'); await page.waitForTimeout(100); assert.ok((await read()).snapshot.elapsedMs > paused.snapshot.elapsedMs);
  result.cases.push('original ships, live input, projectiles, explicit pause/resume');
  // One controlled renderer exception must keep both run and last committed
  // canvas. It tests recovery plumbing; it is not a natural WebView crash.
  const pixels = await page.evaluate(() => { const data = document.querySelector('#actors').toDataURL(); window.__rebuild.failNextRender(); return data; });
  await page.waitForFunction(() => window.__rebuild.read().snapshot?.pausedBy === 'renderer-lost');
  assert.equal(await page.evaluate(() => document.querySelector('#actors').toDataURL()), pixels);
  assert.equal((await read()).snapshot.runId, paused.snapshot.runId);
  assert.equal((await read()).timeOrigin, timeOrigin);
  result.cases.push('controlled renderer failure retains last frame and same run');
  await page.screenshot({ path: resolve(artifacts, `paused-${engine}.png`) });
  await page.click('#resume');
  // Repeated mount/close exercises real decodes, bitmap close, canvas backing
  // stores, input abort and the original projectile/mounted-weapon cleanup.
  for (let cycle = 0; cycle < 12; cycle++) {
    await mount(cycle % 2 ? 40 : 1); await page.waitForTimeout(75);
    await page.click('#close');
    await page.waitForFunction(() => window.__rebuild.read().resources.pool.active === 0);
    const closed = await read();
    assert.equal(closed.resources.pool.bytes, 0); assert.equal(closed.resources.pool.entries, 0);
    assert.equal(closed.resources.pool.scopes, 0); assert.equal(closed.canvas.width, 0); assert.equal(closed.canvas.height, 0);
    assert.equal(closed.resources.pool.disposalFailures, 0);
    result.samples.push({ cycle, resources: closed.resources.pool, dom: closed.dom });
  }
  result.cases.push('12 actual normal/boss scene mount-close cycles return managed resources to zero');
  await mount(40); await page.waitForTimeout(7500);
  state = await read(); assert.equal(state.snapshot.status, 'playing'); assert.ok(state.snapshot.state.boss.elapsed > 1000);
  assert.equal(state.snapshot.state.boss.config.id, 4); assert.ok(state.snapshot.state.enemyShots.length > 0 || state.events.sound > 5);
  await page.screenshot({ path: resolve(artifacts, `boss4-${engine}.png`) });
  result.cases.push('boss 4 original hull, live mounted guns and original projectile presentation');
  await page.setViewportSize({ width: 1280, height: 900 }); await mount(1); await page.waitForTimeout(1200);
  state = await read(); assert.equal(state.snapshot.state.field.width, 1024); assert.equal(state.snapshot.status, 'playing');
  await page.screenshot({ path: resolve(artifacts, `desktop-${engine}.png`) });
  result.cases.push('desktop geometry starts with original image resolution');
  await page.click('#close');
  // Close a scene while fetch/decode is deliberately held. A late texture must
  // be released and cannot revive the closed session or acquire a new clock.
  let release; const held = new Promise(resolve => { release = resolve; });
  await page.route('**/ships/painted/**', async route => { await held; await route.continue().catch(() => {}); });
  await page.evaluate(() => { void window.__rebuild.mount(1); }); await page.waitForTimeout(50);
  await page.click('#close'); release();
  await page.waitForFunction(() => window.__rebuild.read().resources.pool.active === 0);
  state = await read(); assert.equal(state.snapshot, null); assert.equal(state.resources.pool.bytes, 0);
  result.cases.push('canceled real asset loading cannot revive a closed scene');
  assert.equal(result.navigations.length, 1); assert.equal(state.timeOrigin, timeOrigin);
  assert.deepEqual(result.errors, []); assert.deepEqual(result.missing, []); assert.equal(result.crashes, 0);
  result.final = state; result.complete = true;
} catch (error) { result.failure = String(error?.stack || error); process.exitCode = 1; }
finally {
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ engine, complete: result.complete, cases: result.cases.length, errors: result.errors.length, missing: result.missing.length, failure: result.failure ?? null, out }));
  await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
}
