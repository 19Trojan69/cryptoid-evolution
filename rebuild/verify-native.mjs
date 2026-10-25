// Local native-browser acceptance of the incomplete, isolated migration core.
// No production page, account, API or payment is accessed by this fixture.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve, extname, basename } from 'node:path';
import { armNativeProfile } from './fixture/nativeProfile.mjs';
const directory = new URL('.', import.meta.url).pathname, root = resolve(directory, '..'), frontend = resolve(root, 'frontend');
const require = createRequire(frontend + '/package.json'), { build } = require('esbuild');
const engine = process.env.CRYPTOID_TEST_ENGINE || 'chromium';
const allBossModels = process.env.CRYPTOID_ALL_BOSS_MODELS === '1';
const decoderOption = process.env.CRYPTOID_TEXTURE_DECODER;
const decoder = decoderOption === 'blob-image' || decoderOption === 'bitmap' || decoderOption === 'bitmap-padded' ? decoderOption : 'image';
const freshCanvas = process.env.CRYPTOID_CANVAS_LIFETIME === 'fresh';
const sceneCycles = Number(process.env.CRYPTOID_SCENE_CYCLES || (allBossModels ? 50 : 12));
assert.ok(Number.isInteger(sceneCycles) && sceneCycles >= 1 && sceneCycles <= 1000);
const localRequire = createRequire(directory + 'package.json');
const nativeProfile = engine === 'webkit' && process.env.CRYPTOID_NATIVE_PROFILE === '1' ? armNativeProfile(require) : null;
const playwright = process.env.CRYPTOID_PLAYWRIGHT_PATH ? require(process.env.CRYPTOID_PLAYWRIGHT_PATH)
  : engine === 'webkit' && process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright')
  : existsSync(resolve(root, 'verification/browser-tools/node_modules/playwright')) ? require(resolve(root, 'verification/browser-tools/node_modules/playwright'))
  : localRequire('playwright');
const artifacts = resolve(root, 'verification/rebuild'); mkdirSync(artifacts, { recursive: true });
const result = { isolatedCore: true, incompleteFeatureMigration: true, historicalWhiteScreenFixed: false, decoderAcceptance: 'open',
  engine, version: null, decoder, freshCanvas, sceneCycles, controlledBossModels: allBossModels, graphicsModels: [], errors: [], missing: [], navigations: [], crashes: 0, cases: [], samples: [], nativeMemory: [], complete: false };
const tag = process.env.CRYPTOID_NATIVE_OUTPUT_TAG || '';
assert.ok(/^[a-z0-9-]{0,40}$/.test(tag));
const out = resolve(artifacts, `native-${engine}${allBossModels ? '-boss-models' + sceneCycles : sceneCycles === 12 ? '' : '-stress' + sceneCycles}-${decoder}${freshCanvas ? '-fresh' : ''}${tag ? '-' + tag : ''}.json`);
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
// Aggregate only the native children launched by this runner. /proc uses host
// PIDs; process.pid may be namespace-local. No argv, other-app data or IDs are
// written to the evidence. This is Linux PSS, not phone/GPU memory.
const procRows = () => readdirSync('/proc').filter(id => /^\d+$/.test(id)).flatMap(id => {
  try { const text = readFileSync(`/proc/${id}/status`, 'utf8'); return [{ pid: Number(id), parent: Number(text.match(/^PPid:\s+(\d+)/m)[1]) }]; }
  catch { return []; }
});
const hostPid = Number(readFileSync('/proc/self/status', 'utf8').match(/^Pid:\s+(\d+)/m)[1]);
const existingChildren = new Set(procRows().filter(row => row.parent === hostPid).map(row => row.pid));
function nativeMemory() {
  const rows = procRows(), parents = new Map(rows.map(row => [row.pid, row.parent]));
  const roots = new Set(rows.filter(row => row.parent === hostPid && !existingChildren.has(row.pid)).map(row => row.pid));
  let pssKiB = 0, readable = 0, unavailable = 0;
  for (const row of rows) {
    let pid = row.pid, owned = false;
    for (let depth = 0; depth < 20 && pid; depth++, pid = parents.get(pid)) if (roots.has(pid)) { owned = true; break; }
    if (!owned) continue;
    try { pssKiB += Number(readFileSync(`/proc/${row.pid}/smaps_rollup`, 'utf8').match(/^Pss:\s+(\d+)/m)[1]); readable++; }
    catch { unavailable++; }
  }
  return { pssMiB: readable ? pssKiB / 1024 : null, readable, unavailable };
}
try {
  browser = await playwright[engine].launch(options); result.version = browser.version();
  const context = await browser.newContext({ viewport: { width: 393, height: 744 }, deviceScaleFactor: 3 });
  if (existsSync(resolve(root, 'verification/white-screen-fonts/fonts.css')))
    await context.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: readFileSync(resolve(root, 'verification/white-screen-fonts/fonts.css'), 'utf8') }));
  const page = await context.newPage();
  page.on('pageerror', error => result.errors.push(error.name + ': ' + error.message));
  page.on('crash', () => result.crashes++);
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) result.navigations.push(frame.url()); });
  await page.goto(origin + `?texture=${decoder}&canvas=${freshCanvas ? 'fresh' : 'shared'}`, { waitUntil: 'networkidle' });
  const read = () => page.evaluate(() => window.__rebuild.read());
  const timeOrigin = await page.evaluate(() => performance.timeOrigin);
  result.surfaceHandoff = await page.evaluate(() => window.__rebuild.sharedSurfaceHandoff());
  assert.equal(result.surfaceHandoff.staleRenderRejected, true, 'stale renderer must not overwrite the next scene');
  assert.equal(result.surfaceHandoff.lateFirstRenderRejected, true, 'late first presentation must not revive an older prepared scene');
  assert.equal(result.surfaceHandoff.currentFramePreserved, true, 'old cleanup must not zero the current scene canvas');
  result.cases.push('shared visible surface rejects stale renderer and survives old-scene disposal');
  result.decoderPixels = await page.evaluate(capture => window.__rebuild.compareDecoders(capture), process.env.CRYPTOID_DECODER_ONLY === '1');
  for (const [name, url] of Object.entries(result.decoderPixels.pictures)) writeFileSync(resolve(artifacts, `decoder-${engine}-${name}.png`), Buffer.from(url.split(',')[1], 'base64'));
  delete result.decoderPixels.pictures;
  assert.equal(result.decoderPixels.originalImageControl.channels, 0, 'independent original-image controls must have identical RGBA pixels');
  if (decoder === 'blob-image') assert.equal(result.decoderPixels.blobVsOriginalImage.channels, 0, 'fetched original image bytes must retain reference RGBA pixels');
  assert.equal(result.decoderPixels.managedBytes, 0);
  result.cases.push('RGBA decoder comparison retains two identical original-image controls');
  if (process.env.CRYPTOID_DECODER_ONLY === '1') { result.decoderProbeOnly = true; result.complete = true; }
  else {
  async function mount(stage, modelOnly = false) {
    await page.evaluate(({ stage, modelOnly }) => modelOnly ? window.__rebuild.mountBossModel(stage) : window.__rebuild.mount(stage), { stage, modelOnly });
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
  for (let cycle = 0; cycle < sceneCycles; cycle++) {
    const stage = allBossModels ? (cycle % 50 + 1) * 10 : cycle % 2 ? 40 : 1;
    await mount(stage, allBossModels);
    await page.waitForFunction(() => window.__rebuild.read().renderedFrames > 0);
    await page.waitForTimeout(75);
    const drawn = await read(); assert.equal(drawn.snapshot.status, 'playing');
    if (allBossModels) result.graphicsModels.push({ stage, bossId: drawn.snapshot.state.boss.config.id,
      turrets: drawn.snapshot.state.boss.turrets.length, renderedFrames: drawn.renderedFrames, managedBytes: drawn.resources.pool.bytes });
    await page.click('#close');
    await page.waitForFunction(() => window.__rebuild.read().resources.pool.active === 0);
    const closed = await read();
    assert.equal(closed.resources.pool.bytes, 0); assert.equal(closed.resources.pool.entries, 0);
    assert.equal(closed.resources.pool.scopes, 0); assert.equal(closed.canvas.width, 0); assert.equal(closed.canvas.height, 0);
    assert.equal(closed.resources.pool.disposalFailures, 0);
    result.samples.push({ cycle, resources: closed.resources.pool, dom: closed.dom });
    if (cycle % 10 === 9 || cycle === sceneCycles - 1) {
      const memory = { cycle, ...nativeMemory(), inspector: nativeProfile?.snapshot() ?? null }; result.nativeMemory.push(memory);
      console.log(JSON.stringify({ progress: cycle + 1, sceneCycles, ...memory }));
    }
  }
  result.cases.push(`${sceneCycles} ${allBossModels ? 'controlled original boss-model/heat-tile' : 'normal/boss'} scene mount-close cycles return managed resources to zero`);
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
  if (process.env.CRYPTOID_PROFILE_IDLE_SECONDS) {
    const idleSeconds = Number(process.env.CRYPTOID_PROFILE_IDLE_SECONDS); assert.ok(idleSeconds > 0 && idleSeconds <= 30);
    result.beforeIdle = { ...nativeMemory(), inspector: nativeProfile?.snapshot() ?? null };
    await page.waitForTimeout(idleSeconds * 1000);
    result.afterIdle = { ...nativeMemory(), inspector: nativeProfile?.snapshot() ?? null };
  }
  result.final = state; result.complete = true;
  }
} catch (error) { result.failure = String(error?.stack || error); process.exitCode = 1; }
finally {
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ engine, complete: result.complete, cases: result.cases.length, errors: result.errors.length, missing: result.missing.length, failure: result.failure ?? null, out }));
  await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
}
