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
import { chromiumMemoryProfile } from './fixture/chromiumMemory.mjs';

const directory = new URL('.', import.meta.url).pathname, root = resolve(directory, '..'), frontend = resolve(root, 'frontend');
const require = createRequire(frontend + '/package.json'), { build } = require('esbuild');
const engine = process.env.CRYPTOID_TEST_ENGINE || 'chromium';
const mode = process.env.CRYPTOID_MEMORY_STAGE, decoder = process.env.CRYPTOID_TEXTURE_DECODER || 'blob-image';
const cycles = Number(process.env.CRYPTOID_SCENE_CYCLES || 100), idleSeconds = Number(process.env.CRYPTOID_PROFILE_IDLE_SECONDS || 20);
const tag = process.env.CRYPTOID_NATIVE_OUTPUT_TAG;
const sequence = process.env.CRYPTOID_BOSS_SEQUENCE || 'all', singleBossId = Number(process.env.CRYPTOID_SINGLE_BOSS_ID || 4);
const pssLimitMiB = Number(process.env.CRYPTOID_NATIVE_PSS_LIMIT_MIB || 2048);
const startedAt = performance.now();
const allocationProfile = process.env.CRYPTOID_ALLOCATION_PROFILE || '';
const explicitDecode = process.env.CRYPTOID_EXPLICIT_IMAGE_DECODE !== '0';
assert.ok(!allocationProfile || (engine === 'chromium' && allocationProfile === 'chromium') || (engine === 'webkit' && ['glibc', 'heaptrack'].includes(allocationProfile)));
assert.ok(explicitDecode || mode === 'draw-dispose', 'Onload-only must draw; it cannot stand in for explicit decode-only');
assert.ok(['chromium', 'webkit'].includes(engine));
assert.ok(['fetch-only', 'decode-only', 'prepare-only', 'draw-dispose'].includes(mode));
assert.ok(['blob-image', 'bitmap', 'image'].includes(decoder));
assert.ok(Number.isSafeInteger(cycles) && cycles >= 1 && cycles <= 1000);
assert.ok(Number.isSafeInteger(idleSeconds) && idleSeconds >= 1 && idleSeconds <= 30);
assert.ok(['all', 'single'].includes(sequence));
assert.ok(Number.isSafeInteger(singleBossId) && singleBossId >= 1 && singleBossId <= 50);
assert.ok(Number.isFinite(pssLimitMiB) && pssLimitMiB >= 256 && pssLimitMiB <= 4096);
assert.ok(tag && /^[a-z0-9-]{1,40}$/.test(tag), 'Unique output tag required');
const artifacts = resolve(root, 'verification/rebuild'); mkdirSync(artifacts, { recursive: true });
const out = resolve(artifacts, `stages-${engine}-${decoder}-${mode}-${sequence === 'single' ? 'single' + singleBossId : 'all'}${explicitDecode ? '' : '-onload-draw'}-${cycles}-${tag}.json`);
// Reserve exclusively before launching so failed/parallel runs cannot overwrite
// earlier evidence, including an earlier incomplete result with the same tag.
closeSync(openSync(out, 'wx'));
const result = { engine, mode, decoder, cycles, idleSeconds, tag, sequence, singleBossId: sequence === 'single' ? singleBossId : null,
  sourceCommit: '4681d224d3aa3d87e96611485666dc8c8bbaaafc', pssLimitMiB, allocationProfile,
  historicalWhiteScreenFixed: false, decoderAccepted: false, viewport: { width: 393, height: 744, deviceScaleFactor: 3 },
  explicitImageDecode: explicitDecode, forcedGC: false, pixelReadback: false, originalAssets: [], samples: [], nativeMemory: [],
  errors: [], missing: [], failedRequests: [], blockedSchemes: [], crashes: 0, navigations: [], complete: false };
result.controlSourcesSha256 = Object.fromEntries(['verify-memory-stages.mjs', 'fixture/memoryStages.ts', 'fixture/memoryAssetManifest.json',
  'browser/renderer.ts', 'browser/textures.ts', 'fixture/nativeProfile.mjs', 'fixture/chromiumMemory.mjs', 'fixture/mallinfoObserver.c'].map(path =>
  [path, createHash('sha256').update(readFileSync(resolve(directory, path))).digest('hex')]));
const profile = engine === 'webkit' ? armNativeProfile(require) : null;
const playwright = process.env.CRYPTOID_PLAYWRIGHT_PATH ? require(process.env.CRYPTOID_PLAYWRIGHT_PATH)
  : engine === 'webkit' ? require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright')
  : require(resolve(root, 'verification/browser-tools/node_modules/playwright'));
let browser, server, page, chromeAllocations;
const allocatorLog = out.replace(/\.json$/, '.malloc.jsonl');
const heaptrackRaw = out.replace(/\.json$/, '.heaptrack.raw'), heaptrackStop = out.replace(/\.json$/, '.heaptrack-stop');
function glibcSnapshot() {
  if (!['glibc', 'heaptrack'].includes(allocationProfile)) return null;
  const rows = readFileSync(allocatorLog, 'utf8').split('\n').filter(Boolean).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  return { samples: rows.length, latestByRole: Object.fromEntries(rows.map(row => [row.role, row])) };
}
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
  assert.ok(totals.readable > 0, 'Native process memory must be readable');
  return { elapsedSeconds: (performance.now() - startedAt) / 1000, monotonicMs: Number(process.hrtime.bigint() / 1000000n),
    ...totals, inspector: profile?.snapshot() ?? null, glibc: glibcSnapshot() };
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
  const browserCache = process.env.CRYPTOID_BROWSER_CACHE || (existsSync('/root/.cache/ms-playwright/webkit-2336')
    ? '/root/.cache/ms-playwright' : resolve(root, 'verification/native-browsers'));
  if (engine === 'chromium' && (process.env.CRYPTOID_BROWSER_CACHE || !existsSync('/root/.cache/ms-playwright/chromium_headless_shell-1194')))
    options.executablePath = resolve(browserCache, 'chromium_headless_shell-1194/chrome-linux/headless_shell');
  if (engine === 'webkit') {
    const base = resolve(browserCache, 'webkit-2336/minibrowser-wpe'), libs = resolve(root, 'verification/webkit-libs/usr/lib/x86_64-linux-gnu');
    options.executablePath = base + '/bin/MiniBrowser';
    options.env = { ...process.env, WEBKIT_EXEC_PATH: base + '/bin', WEBKIT_INJECTED_BUNDLE_PATH: base + '/lib', WEBKIT_INSPECTOR_RESOURCES_PATH: base + '/share',
      LD_LIBRARY_PATH: `${base}/lib:${base}/sys/lib:${libs}`, GST_PLUGIN_SYSTEM_PATH_1_0: libs + '/gstreamer-1.0',
      GST_PLUGIN_SCANNER: libs + '/gstreamer1.0/gstreamer-1.0/gst-plugin-scanner', GST_REGISTRY_1_0: resolve(root, 'verification/webkit-native-audio-registry.bin') };
    if (allocationProfile === 'glibc' || allocationProfile === 'heaptrack') {
      const observer = resolve(artifacts, 'mallinfoObserver.so'); assert.ok(existsSync(observer), 'Compile the local observer before this control');
      closeSync(openSync(allocatorLog, 'wx'));
      options.env.LD_PRELOAD = observer; options.env.CRYPTOID_MALLINFO_FILE = allocatorLog;
      result.allocatorObserverSha256 = createHash('sha256').update(readFileSync(observer)).digest('hex');
      if (allocationProfile === 'heaptrack') {
        const toolsRoot = resolve(artifacts, 'heaptrack-tools'), library = resolve(toolsRoot, 'usr/lib/heaptrack/libheaptrack_preload.so');
        assert.ok(existsSync(library)); closeSync(openSync(heaptrackRaw, 'wx'));
        const wrapperDirectory = out.replace(/\.json$/, '-processes'); mkdirSync(wrapperDirectory);
        const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
        for (const name of ['MiniBrowser', 'WPENetworkProcess', 'WPEGPUProcess']) {
          const { symlinkSync } = await import('node:fs'); symlinkSync(base + '/bin/' + name, resolve(wrapperDirectory, name));
        }
        writeFileSync(resolve(wrapperDirectory, 'WPEWebProcess'), '#!/bin/sh\n'
          + 'export LD_PRELOAD=' + quote(library + ':' + observer) + '\n'
          + 'export LD_LIBRARY_PATH=' + quote(resolve(toolsRoot, 'usr/lib/x86_64-linux-gnu') + ':') + '"$LD_LIBRARY_PATH"\n'
          + 'export DUMP_HEAPTRACK_OUTPUT=' + quote(heaptrackRaw) + '\n'
          + 'export CRYPTOID_HEAPTRACK_STOP_FILE=' + quote(heaptrackStop) + '\n'
          + 'exec ' + quote(base + '/bin/WPEWebProcess') + ' "$@"\n', { mode: 0o700 });
        delete options.env.LD_PRELOAD; options.env.WEBKIT_EXEC_PATH = wrapperDirectory;
        result.heaptrackLibrarySha256 = createHash('sha256').update(readFileSync(library)).digest('hex');
      }
    }
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
  await page.goto(origin + `/?mode=${mode}&decoder=${decoder}&sequence=${sequence}&boss=${singleBossId}&explicitDecode=${explicitDecode ? '1' : '0'}`, { waitUntil: 'load' });
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
  if (allocationProfile === 'chromium') chromeAllocations = await chromiumMemoryProfile(browser,
    { allowPartial: process.env.CRYPTOID_ALLOW_PARTIAL_NATIVE_PROFILE === '1' });
  await page.waitForTimeout(1000); await chromeAllocations?.capture('baseline'); result.initial = await read();
  result.nativeMemory.push({ point: 'baseline', ...nativeMemory(true) });
  for (let cycle = 0; cycle < cycles; cycle++) {
    const prepared = await page.evaluate(index => window.__memoryStages.prepare(index), cycle);
    assert.equal(prepared.closed, false);
    assert.equal(prepared.bossId, sequence === 'single' ? singleBossId : cycle % 50 + 1);
    if (mode !== 'draw-dispose') assert.equal(prepared.drawCalls, 0);
    const checkpoint = cycle === 0 || cycle % 10 === 9 || cycle === cycles - 1;
    if (checkpoint) result.nativeMemory.push({ point: 'prepared', cycle: cycle + 1, ...nativeMemory() });
    const closed = await page.evaluate(() => window.__memoryStages.release());
    assert.equal(closed.closed, true); assert.equal(closed.resources.bytes, 0); assert.equal(closed.resources.entries, 0);
    assert.equal(closed.resources.active, 0); assert.equal(closed.resources.scopes, 0); assert.equal(closed.resources.disposalFailures, 0);
    assert.equal(closed.canvas.width, 0); assert.equal(closed.canvas.height, 0);
    result.samples.push({ cycle: cycle + 1, prepared, closed });
    if (checkpoint) {
      const memory = { point: 'released', cycle: cycle + 1, ...nativeMemory(cycle % 50 === 49 || cycle === cycles - 1) }; result.nativeMemory.push(memory);
      console.log(JSON.stringify({ engine, mode, decoder, cycle: cycle + 1, pssMiB: memory.pssMiB, otherMiB: memory.inspector?.latest?.categories?.find(c => c.type === 'other')?.size / 1048576 }));
      assert.ok(memory.pssMiB < pssLimitMiB, 'Native control memory ceiling exceeded; no bounded-memory acceptance');
      if (cycle % 50 === 49 || cycle === cycles - 1) await chromeAllocations?.capture('released-' + (cycle + 1));
    }
  }
  for (const seconds of [...new Set([1, 5, idleSeconds].filter(seconds => seconds <= idleSeconds))].sort((a,b) => a-b)) {
    const previous = result.idle?.at(-1)?.seconds ?? 0;
    await page.waitForTimeout((seconds - previous) * 1000);
    (result.idle ??= []).push({ seconds, ...nativeMemory(seconds === idleSeconds) });
  }
  await chromeAllocations?.capture('idle-' + idleSeconds);
  if (chromeAllocations) { result.chromiumAllocations = await chromeAllocations.finish(); chromeAllocations = null;
  }
  if (['glibc', 'heaptrack'].includes(allocationProfile)) assert.ok(glibcSnapshot().latestByRole.WPEWebProcess, 'Native WPE allocator observer produced no web-process samples');
  if (allocationProfile === 'heaptrack') {
    closeSync(openSync(heaptrackStop, 'wx'));
    for (let attempt = 0; attempt < 10 && !glibcSnapshot().latestByRole.WPEWebProcess.heaptrackStopped; attempt++) await page.waitForTimeout(500);
    assert.equal(glibcSnapshot().latestByRole.WPEWebProcess.heaptrackStopped, true, 'Stop native profiling at closed idle, before browser teardown');
    result.heaptrackStoppedBeforeBrowserClose = true;
  }
  result.final = await read();
  assert.equal(result.final.viewport.width, 393); assert.equal(result.final.viewport.height, 744); assert.equal(result.final.viewport.dpr, 3);
  assert.equal(result.final.timeOrigin, result.initial.timeOrigin); assert.equal(result.navigations.length, 1);
  assert.equal(result.final.frames, cycles * 5);
  result.uniqueBossModels = new Set(result.samples.map(sample => sample.prepared.bossId)).size;
  assert.equal(result.uniqueBossModels, sequence === 'single' ? 1 : Math.min(50, cycles));
  assert.equal(result.final.fetched, cycles * 3);
  assert.equal(result.final.decoded, mode === 'fetch-only' ? 0 : cycles * 3);
  assert.equal(result.final.confirmedImageDecodes, explicitDecode && mode !== 'fetch-only' && decoder !== 'bitmap' ? cycles * 3 : 0);
  assert.equal(result.final.drawCalls, mode === 'draw-dispose' ? cycles * 5 : 0);
  assert.deepEqual(result.errors, []); assert.deepEqual(result.missing, []); assert.deepEqual(result.blockedSchemes, []); assert.equal(result.crashes, 0);
  if (profile) { assert.equal(profile.snapshot().patched, true); assert.deepEqual(profile.snapshot().errors, []); }
  result.functionalComplete = true;
  if (result.chromiumAllocations) assert.deepEqual(result.chromiumAllocations.errors, [], 'Partial provider dumps are not complete allocator acceptance');
  result.complete = true;
} catch (error) {
  result.failure = String(error?.stack || error); process.exitCode = 1;
  try { result.failedState = await page?.evaluate(() => window.__memoryStages.read()); } catch {}
}
finally {
  if (chromeAllocations) { try { result.chromiumAllocations = await chromeAllocations.finish(); } catch (error) { result.allocatorFailure = String(error); } }
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ engine, mode, decoder, complete: result.complete, finalPssMiB: result.idle?.at(-1)?.pssMiB, failure: result.failure ?? null, out }));
  await browser?.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
