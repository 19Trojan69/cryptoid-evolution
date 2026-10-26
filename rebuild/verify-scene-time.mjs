// Real elapsed time with one original scene. This cannot establish full-game,
// smartphone, driver-independent memory bounds or a historical White Screen fix.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, openSync, closeSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { resolve, extname } from 'node:path';
import { armNativeProfile } from './fixture/nativeProfile.mjs';

const directory = new URL('.', import.meta.url).pathname, root = resolve(directory, '..');
const require = createRequire(resolve(root, 'frontend/package.json'));
const engine = process.env.CRYPTOID_TEST_ENGINE || 'webkit', mode = process.env.CRYPTOID_TIME_MODE;
const decoder = process.env.CRYPTOID_TEXTURE_DECODER || 'image';
const seconds = Number(process.env.CRYPTOID_TIME_SECONDS || 600), tag = process.env.CRYPTOID_NATIVE_OUTPUT_TAG;
assert.ok(['chromium', 'webkit'].includes(engine)); assert.ok(['held', 'static', 'motion'].includes(mode));
assert.ok(['image', 'blob-image', 'bitmap'].includes(decoder));
assert.ok(Number.isSafeInteger(seconds) && seconds >= 1 && seconds <= 1200);
assert.ok(tag && /^[a-z0-9-]{1,40}$/.test(tag));
const outputDirectory = resolve(root, 'verification/rebuild'); mkdirSync(outputDirectory, { recursive: true });
const out = resolve(outputDirectory, `scene-time-${engine}-${decoder}-${mode}-${seconds}-${tag}.json`);
closeSync(openSync(out, 'wx'));
const result = { engine, mode, decoder, seconds, tag, complete: false, localOnly: true,
  historicalWhiteScreenFixed: false, fullGameAcceptance: false, forcedGC: false, pixelReadback: false,
  realElapsedTime: true, combatSimulated: false, oneScene: true, originalAssets: [], samples: [],
  crashes: 0, errors: [], missing: [], assetRequests: [], navigations: [],
  sourceHashes: Object.fromEntries(['verify-scene-time.mjs', 'fixture/sceneTime.ts', 'browser/renderer.ts', 'browser/textures.ts',
    '../frontend/src/pages/bossWeaponRenderer.ts', 'fixture/nativeProfile.mjs'].map(path =>
    [path, createHash('sha256').update(readFileSync(resolve(directory, path))).digest('hex')])) };
const save = () => writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
const rows = () => readdirSync('/proc').filter(id => /^\d+$/.test(id)).flatMap(id => {
  try { const status = readFileSync(`/proc/${id}/status`, 'utf8'); return [{ pid: Number(id),
    parent: Number(status.match(/^PPid:\s+(\d+)/m)[1]), role: status.match(/^Name:\s+(.+)/m)[1] }]; } catch { return []; }
});
const self = Number(readFileSync('/proc/self/status', 'utf8').match(/^Pid:\s+(\d+)/m)[1]);
const excluded = new Set();
function nativeMemory() {
  const current = rows(), parents = new Map(current.map(row => [row.pid, row.parent]));
  const roots = new Set(current.filter(row => row.parent === self && !excluded.has(row.pid)).map(row => row.pid));
  const processes = []; let unavailable = 0;
  for (const row of current) {
    let ancestor = row.pid, owned = false;
    for (let depth = 0; depth < 20 && ancestor; depth++, ancestor = parents.get(ancestor)) if (roots.has(ancestor)) { owned = true; break; }
    if (!owned) continue;
    try {
      const maps = readFileSync(`/proc/${row.pid}/smaps_rollup`, 'utf8');
      const value = key => Number(maps.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'))?.[1] || 0) / 1024;
      processes.push({ role: row.role, pssMiB: value('Pss'), anonymousMiB: value('Pss_Anon'), fileMiB: value('Pss_File') });
    } catch { unavailable++; }
  }
  assert.ok(processes.length && unavailable === 0, 'Complete native browser memory reads required');
  return { pssMiB: processes.reduce((sum, row) => sum + row.pssMiB, 0), unavailable, processes };
}
let browser, server, page, profile;
try {
  const { build } = require('esbuild');
  const bundle = await build({ entryPoints: [resolve(directory, 'fixture/sceneTime.ts')], bundle: true, write: false,
    format: 'iife', platform: 'browser', logLevel: 'silent' });
  const js = bundle.outputFiles[0].text;
  const manifest = JSON.parse(readFileSync(resolve(directory, 'fixture/memoryAssetManifest.json'), 'utf8'));
  server = createServer((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/scene.js') { response.setHeader('Content-Type', 'application/javascript'); response.end(js); return; }
    if (path.startsWith('/ships/')) {
      const file = resolve(root, 'frontend/public', '.' + path);
      if (!file.startsWith(resolve(root, 'frontend/public') + '/') || !existsSync(file)) {
        result.missing.push(path); response.writeHead(404); response.end(); return;
      }
      result.assetRequests.push(path);
      response.setHeader('Content-Type', extname(file) === '.webp' ? 'image/webp' : 'image/png');
      response.end(readFileSync(file)); return;
    }
    if (path === '/') {
      response.setHeader('Content-Type', 'text/html');
      response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; img-src 'self' blob:; connect-src 'self'; style-src 'unsafe-inline'");
      response.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script src="/scene.js"></script></body></html>'); return;
    }
    response.writeHead(path === '/favicon.ico' ? 204 : 404); response.end();
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  profile = engine === 'webkit' ? armNativeProfile(require) : null;
  const playwright = engine === 'webkit' ? require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright')
    : require(resolve(root, 'verification/browser-tools/node_modules/playwright'));
  const cache = resolve(root, 'verification/native-browsers');
  const options = { headless: true, timeout: 20000 };
  if (engine === 'chromium') {
    options.chromiumSandbox = true;
    options.executablePath = resolve(cache, 'chromium_headless_shell-1194/chrome-linux/headless_shell');
  } else {
    const base = resolve(cache, 'webkit-2336/minibrowser-wpe'), libs = resolve(root, 'verification/webkit-libs/usr/lib/x86_64-linux-gnu');
    options.executablePath = base + '/bin/MiniBrowser';
    options.env = { ...process.env, WEBKIT_EXEC_PATH: base + '/bin', WEBKIT_INJECTED_BUNDLE_PATH: base + '/lib',
      WEBKIT_INSPECTOR_RESOURCES_PATH: base + '/share', LD_LIBRARY_PATH: `${base}/lib:${base}/sys/lib:${libs}`,
      GST_PLUGIN_SYSTEM_PATH_1_0: libs + '/gstreamer-1.0', GST_PLUGIN_SCANNER: libs + '/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner',
      GST_REGISTRY_1_0: resolve(root, 'verification/webkit-native-audio-registry.bin') };
  }
  for (const row of rows()) if (row.parent === self) excluded.add(row.pid);
  browser = await playwright[engine].launch(options); result.version = browser.version();
  const context = await browser.newContext({ viewport: { width: 393, height: 744 }, deviceScaleFactor: 3 });
  page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', error => result.errors.push(String(error)));
  page.on('crash', () => result.crashes++);
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) result.navigations.push(frame.url().replace(origin, '')); });
  await context.route('**/*', route => {
    const url = route.request().url();
    return url.startsWith(origin + '/') || url.startsWith('blob:' + origin + '/') ? route.continue() : route.abort();
  });
  await page.goto(`${origin}/?mode=${mode}&decoder=${decoder}`, { waitUntil: 'load' });
  const read = () => page.evaluate(() => window.__sceneTime.read());
  for (const spec of await page.evaluate(() => window.__sceneTime.specs())) {
    const data = readFileSync(resolve(root, 'frontend/public' + spec.url));
    const sha = createHash('sha1').update(Buffer.from(`blob ${data.length}\0`)).update(data).digest('hex');
    const entry = manifest.assets.find(row => row.url === spec.url);
    assert.equal(sha, entry?.sha, 'Byte-identical original images required');
    result.originalAssets.push({ url: spec.url, sha, bytes: data.length, provenance: entry.provenance });
  }
  result.before = { state: await read(), memory: nativeMemory() };
  result.prepared = await page.evaluate(() => window.__sceneTime.prepare());
  assert.equal(result.prepared.phase, 'prepared'); assert.equal(result.prepared.draws, 1);
  const requestCount = result.assetRequests.length;
  result.started = await page.evaluate(milliseconds => window.__sceneTime.start(milliseconds), seconds * 1000);
  const deadline = performance.now() + seconds * 1000 + 30000;
  while (true) {
    const state = await read(), memory = nativeMemory();
    result.samples.push({ state, memory, inspector: profile?.snapshot() ?? null }); save();
    console.log(JSON.stringify({ engine, mode, elapsedSeconds: Math.round(state.elapsedMs / 1000), phase: state.phase, frames: state.frames,
      draws: state.draws, pssMiB: memory.pssMiB, ownedBytes: state.resources.bytes }));
    assert.ok(memory.pssMiB < 1800, 'Native control ceiling exceeded; no memory acceptance');
    assert.notEqual(state.phase, 'failed', state.failure); assert.equal(result.crashes, 0);
    assert.equal(state.timeOrigin, result.started.timeOrigin); assert.equal(state.stage, 40);
    assert.equal(result.assetRequests.length, requestCount, 'No new image sources during the timed scene');
    assert.deepEqual(state.resources, result.prepared.resources, 'Managed ownership must remain constant');
    if (state.phase === 'finished') break;
    assert.equal(state.phase, 'running'); assert.ok(performance.now() < deadline, 'Real-time control deadline exceeded');
    await page.waitForTimeout(Math.min(10000, Math.max(100, seconds * 1000 - state.elapsedMs)));
  }
  result.closed = await page.evaluate(() => window.__sceneTime.close());
  for (const key of ['bytes', 'entries', 'active', 'scopes', 'disposalFailures']) assert.equal(result.closed.resources[key], 0);
  assert.equal(result.closed.canvas.width, 0); assert.equal(result.closed.canvas.height, 0);
  assert.equal(result.closed.projectileNodes, 0); assert.equal(result.closed.timeOrigin, result.started.timeOrigin);
  await page.waitForTimeout(20000); result.idle = { state: await read(), memory: nativeMemory(), inspector: profile?.snapshot() ?? null };
  assert.equal(result.navigations.length, 1); assert.deepEqual(result.errors, []); assert.deepEqual(result.missing, []); assert.equal(result.crashes, 0);
  assert.ok(result.closed.elapsedMs >= seconds * 1000);
  assert.ok(result.closed.frames >= seconds * 10, 'Require an advancing native frame stream');
  assert.equal(result.closed.draws, mode === 'held' ? 1 : result.closed.frames + 1);
  if (profile) { assert.equal(profile.snapshot().patched, true); assert.deepEqual(profile.snapshot().errors, []); }
  result.complete = true;
} catch (error) { result.failure = String(error?.stack || error); process.exitCode = 1; }
finally {
  save(); console.log(JSON.stringify({ engine, mode, complete: result.complete, idlePssMiB: result.idle?.memory.pssMiB,
    failure: result.failure ?? null, out }));
  await browser?.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
