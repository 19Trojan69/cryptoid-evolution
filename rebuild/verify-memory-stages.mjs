// Matched native-memory controls. Each invocation launches one fresh browser,
// consumes the same original 50-model plan at one fixed viewport and saves its
// failures as well as successful receipts. No forced GC or production access.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, openSync, closeSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { resolve, extname } from 'node:path';
import { armNativeProfile } from './fixture/nativeProfile.mjs';

const directory = new URL('.', import.meta.url).pathname, root = resolve(directory, '..'), frontend = resolve(root, 'frontend');
const require = createRequire(frontend + '/package.json'), { build } = require('esbuild');
const engine = process.env.CRYPTOID_TEST_ENGINE || 'chromium';
const mode = process.env.CRYPTOID_MEMORY_STAGE, decoder = process.env.CRYPTOID_TEXTURE_DECODER || 'blob-image';
const cycles = Number(process.env.CRYPTOID_SCENE_CYCLES || 100), idleSeconds = Number(process.env.CRYPTOID_PROFILE_IDLE_SECONDS || 20);
const tag = process.env.CRYPTOID_NATIVE_OUTPUT_TAG;
assert.ok(['chromium', 'webkit'].includes(engine));
assert.ok(['fetch-only', 'decode-only', 'prepare-only', 'draw-dispose'].includes(mode));
assert.ok(['blob-image', 'bitmap'].includes(decoder));
assert.ok(Number.isSafeInteger(cycles) && cycles >= 1 && cycles <= 1000);
assert.ok(Number.isSafeInteger(idleSeconds) && idleSeconds >= 1 && idleSeconds <= 30);
assert.ok(tag && /^[a-z0-9-]{1,40}$/.test(tag), 'Unique output tag required');
const artifacts = resolve(root, 'verification/rebuild'); mkdirSync(artifacts, { recursive: true });
const out = resolve(artifacts, `stages-${engine}-${decoder}-${mode}-${cycles}-${tag}.json`);
// Reserve exclusively before launching so failed/parallel runs cannot overwrite
// earlier evidence, including an earlier incomplete result with the same tag.
closeSync(openSync(out, 'wx'));
const result = { engine, mode, decoder, cycles, idleSeconds, tag, sourceCommit: '3741cbb4d0bb15595950c2c97c01addaa2156393',
  historicalWhiteScreenFixed: false, decoderAccepted: false, viewport: { width: 393, height: 744, deviceScaleFactor: 3 },
  explicitImageDecode: true, forcedGC: false, pixelReadback: false, originalAssets: [], samples: [], nativeMemory: [],
  errors: [], missing: [], failedRequests: [], blockedSchemes: [], crashes: 0, navigations: [], complete: false };
result.controlSourcesSha256 = Object.fromEntries(['verify-memory-stages.mjs', 'fixture/memoryStages.ts', 'fixture/memoryAssetManifest.json',
  'browser/renderer.ts', 'browser/textures.ts', 'fixture/nativeProfile.mjs'].map(path =>
  [path, createHash('sha256').update(readFileSync(resolve(directory, path))).digest('hex')]));
const profile = engine === 'webkit' ? armNativeProfile(require) : null;
const playwright = process.env.CRYPTOID_PLAYWRIGHT_PATH ? require(process.env.CRYPTOID_PLAYWRIGHT_PATH)
  : engine === 'webkit' ? require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright')
  : require(resolve(root, 'verification/browser-tools/node_modules/playwright'));
let browser, server, page;
const procRows = () => readdirSync('/proc').filter(id => /^\d+$/.test(id)).flatMap(id => {
  try { const status = readFileSync(`/proc/${id}/status`, 'utf8'); return [{ pid: Number(id), parent: Number(status.match(/^PPid:\s+(\d+)/m)[1]), name: status.match(/^Name:\s+(.+)/m)[1] }]; }
  catch { return []; }
});
const hostPid = Number(readFileSync('/proc/self/status', 'utf8').match(/^Pid:\s+(\d+)/m)[1]);
const existing = new Set(procRows().filter(row => row.parent === hostPid).map(row => row.pid));
function nativeMemory(includeMappings = false) {
  const rows = procRows(), parents = new Map(rows.map(row => [row.pid, row.parent]));
  const roots = new Set(rows.filter(row => row.parent === hostPid && !existing.has(row.pid)).map(row => row.pid));
  const totals = { pssMiB: 0, pssAnonMiB: 0, pssFileMiB: 0, privateDirtyMiB: 0, rssMiB: 0, readable: 0, unavailable: 0, processes: [] };
  for (const row of rows) {
    let pid = row.pid, owned = false;
    for (let depth = 0; depth < 20 && pid; depth++, pid = parents.get(pid)) if (roots.has(pid)) { owned = true; break; }
    if (!owned) continue;
    try {
      const maps = readFileSync(`/proc/${row.pid}/smaps_rollup`, 'utf8');
      const number = name => Number(maps.match(new RegExp(`^${name}:\\s+(\\d+)`, 'm'))?.[1] || 0) / 1024;
      const sample = { role: row.name, pssMiB: number('Pss'), pssAnonMiB: number('Pss_Anon'), pssFileMiB: number('Pss_File'), privateDirtyMiB: number('Private_Dirty'), rssMiB: number('Rss') };
      if (includeMappings) {
        const groups = {}; let group = 'unknown';
        for (const line of readFileSync(`/proc/${row.pid}/smaps`, 'utf8').split('\n')) {
          const header = line.match(/^[a-f0-9]+-[a-f0-9]+\s+\S+\s+\S+\s+\S+\s+\d+\s*(.*)$/);
          if (header) {
            const path = header[1];
            group = !path ? 'anonymous' : path === '[heap]' ? 'heap' : path.startsWith('[stack') ? 'stack'
              : /org\.chromium|com\.google\.Chrome/.test(path) ? 'chromium-shared-file'
              : /memfd:/.test(path) ? 'memfd' : path.startsWith('/dev/shm') ? 'shared-memory-file'
              : path.includes('(deleted)') ? 'other-deleted-file'
              : /[Ww]eb[Kk]it/.test(path) ? 'webkit-library'
              : /\.so(?:\.|$)/.test(path) ? 'other-shared-library'
              : path.includes('headless_shell') ? 'chromium-executable' : 'other-file';
          } else if (/^Pss:/.test(line)) groups[group] = (groups[group] ?? 0) + Number(line.match(/\d+/)[0]) / 1024;
        }
        sample.mappingPssMiB = groups;
      }
      for (const key of ['pssMiB', 'pssAnonMiB', 'pssFileMiB', 'privateDirtyMiB', 'rssMiB']) totals[key] += sample[key];
      totals.processes.push(sample); totals.readable++;
    } catch { totals.unavailable++; }
  }
  return { ...totals, inspector: profile?.snapshot() ?? null };
}
try {
  const bundle = await build({ entryPoints: [directory + 'fixture/memoryStages.ts'], absWorkingDir: root, bundle: true, write: false,
    outfile: 'memory.js', format: 'iife', platform: 'browser', logLevel: 'silent' });
  const js = bundle.outputFiles[0].text;
  server = createServer((req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/memory.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(js); return; }
    if (path.startsWith('/ships/')) {
      const file = resolve(frontend, 'public', '.' + path);
      if (!file.startsWith(frontend + '/public/') || !existsSync(file)) { result.missing.push(path); res.writeHead(404); res.end(); return; }
      res.setHeader('Content-Type', extname(file) === '.webp' ? 'image/webp' : 'image/png'); res.end(readFileSync(file)); return;
    }
    if (path === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script src="/memory.js"></script></body></html>'); return; }
    if (path === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    result.missing.push(path); res.writeHead(404); res.end();
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const options = { headless: true, timeout: 20000 };
  if (engine === 'webkit') {
    const base = '/root/.cache/ms-playwright/webkit-2336/minibrowser-wpe', libs = resolve(root, 'verification/webkit-libs/usr/lib/x86_64-linux-gnu');
    options.executablePath = base + '/bin/MiniBrowser';
    options.env = { ...process.env, WEBKIT_EXEC_PATH: base + '/bin', WEBKIT_INJECTED_BUNDLE_PATH: base + '/lib', WEBKIT_INSPECTOR_RESOURCES_PATH: base + '/share',
      LD_LIBRARY_PATH: `${base}/lib:${base}/sys/lib:${libs}`, GST_PLUGIN_SYSTEM_PATH_1_0: libs + '/gstreamer-1.0',
      GST_PLUGIN_SCANNER: libs + '/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner', GST_REGISTRY_1_0: resolve(root, 'verification/webkit-native-audio-registry.bin') };
  }
  // Exclude the completed bundler's native service: only browser children and
  // their descendants belong to browser PSS. Earlier matched-b raw receipts
  // include a separately identifiable esbuild row and remain unmodified.
  for (const row of procRows()) if (row.parent === hostPid) existing.add(row.pid);
  browser = await playwright[engine].launch(options); result.version = browser.version();
  const context = await browser.newContext({ viewport: { width: 393, height: 744 }, deviceScaleFactor: 3 });
  page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', error => result.errors.push(error.name + ': ' + error.message));
  page.on('crash', () => result.crashes++);
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) result.navigations.push(frame.url()); });
  page.on('requestfailed', request => result.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(origin + '/') || url.startsWith('blob:' + origin + '/')) return route.continue();
    result.blockedSchemes.push(new URL(url).protocol); return route.abort();
  });
  await page.goto(origin + `/?mode=${mode}&decoder=${decoder}`, { waitUntil: 'load' });
  const read = () => page.evaluate(() => window.__memoryStages.read());
  const plan = await page.evaluate(() => window.__memoryStages.plan());
  assert.equal(plan.length, 50);
  const gitManifest = JSON.parse(readFileSync(resolve(directory, 'fixture/memoryAssetManifest.json'), 'utf8'));
  for (const spec of new Map(plan.flat().map(spec => [spec.url, spec])).values()) {
    const path = 'frontend/public' + spec.url, data = readFileSync(resolve(root, path));
    const sha = createHash('sha1').update(Buffer.from(`blob ${data.length}\0`)).update(data).digest('hex');
    const entry = gitManifest.assets.find(file => file.url === spec.url), expected = entry?.sha;
    result.originalAssets.push({ url: spec.url, bytes: data.length, sha, expected, provenance: entry?.provenance, width: spec.maxWidth, height: spec.maxHeight });
    assert.equal(sha, expected, 'Control requires byte-identical original assets');
  }
  result.planSha256 = createHash('sha256').update(JSON.stringify(plan)).digest('hex');
  await page.waitForTimeout(1000); result.initial = await read();
  result.nativeMemory.push({ point: 'baseline', ...nativeMemory(true) });
  for (let cycle = 0; cycle < cycles; cycle++) {
    const prepared = await page.evaluate(index => window.__memoryStages.prepare(index), cycle);
    assert.equal(prepared.closed, false);
    if (mode !== 'draw-dispose') assert.equal(prepared.drawCalls, 0);
    const checkpoint = cycle === 0 || cycle % 10 === 9 || cycle === cycles - 1;
    if (checkpoint) result.nativeMemory.push({ point: 'prepared', cycle: cycle + 1, ...nativeMemory() });
    const closed = await page.evaluate(() => window.__memoryStages.release());
    assert.equal(closed.closed, true); assert.equal(closed.resources.bytes, 0); assert.equal(closed.resources.entries, 0);
    assert.equal(closed.resources.active, 0); assert.equal(closed.resources.scopes, 0); assert.equal(closed.resources.disposalFailures, 0);
    assert.equal(closed.canvas.width, 0); assert.equal(closed.canvas.height, 0);
    result.samples.push({ cycle: cycle + 1, prepared, closed });
    if (checkpoint) {
      const memory = { point: 'released', cycle: cycle + 1, ...nativeMemory(cycle === cycles - 1) }; result.nativeMemory.push(memory);
      console.log(JSON.stringify({ engine, mode, decoder, cycle: cycle + 1, pssMiB: memory.pssMiB, otherMiB: memory.inspector?.latest?.categories?.find(c => c.type === 'other')?.size / 1048576 }));
    }
  }
  for (const seconds of [...new Set([1, 5, idleSeconds].filter(seconds => seconds <= idleSeconds))].sort((a,b) => a-b)) {
    const previous = result.idle?.at(-1)?.seconds ?? 0;
    await page.waitForTimeout((seconds - previous) * 1000);
    (result.idle ??= []).push({ seconds, ...nativeMemory(seconds === idleSeconds) });
  }
  result.final = await read();
  assert.equal(result.final.viewport.width, 393); assert.equal(result.final.viewport.height, 744); assert.equal(result.final.viewport.dpr, 3);
  assert.equal(result.final.timeOrigin, result.initial.timeOrigin); assert.equal(result.navigations.length, 1);
  assert.equal(result.final.frames, cycles * 5);
  assert.equal(result.final.fetched, cycles * 3);
  assert.equal(result.final.decoded, mode === 'fetch-only' ? 0 : cycles * 3);
  assert.equal(result.final.confirmedImageDecodes, mode !== 'fetch-only' && decoder === 'blob-image' ? cycles * 3 : 0);
  assert.equal(result.final.drawCalls, mode === 'draw-dispose' ? cycles * 5 : 0);
  assert.deepEqual(result.errors, []); assert.deepEqual(result.missing, []); assert.deepEqual(result.blockedSchemes, []); assert.equal(result.crashes, 0);
  if (profile) { assert.equal(profile.snapshot().patched, true); assert.deepEqual(profile.snapshot().errors, []); }
  result.complete = true;
} catch (error) {
  result.failure = String(error?.stack || error); process.exitCode = 1;
  try { result.failedState = await page?.evaluate(() => window.__memoryStages.read()); } catch {}
}
finally {
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ engine, mode, decoder, complete: result.complete, finalPssMiB: result.idle?.at(-1)?.pssMiB, failure: result.failure ?? null, out }));
  await browser?.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
