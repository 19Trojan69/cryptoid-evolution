// Local source-pixel/sampling attribution only. Original asset bytes, texture
// loader and renderer are unchanged. This readback probe is NOT a memory run.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, openSync, closeSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve, extname } from 'node:path';
const directory = new URL('.', import.meta.url).pathname, root = resolve(directory, '..');
const require = createRequire(resolve(root, 'frontend/package.json'));
const engine = process.env.CRYPTOID_TEST_ENGINE || 'chromium', tag = process.env.CRYPTOID_NATIVE_OUTPUT_TAG;
assert.ok(['chromium', 'webkit'].includes(engine)); assert.ok(tag && /^[a-z0-9-]{1,40}$/.test(tag));
const artifacts = resolve(root, 'verification/rebuild'); mkdirSync(artifacts, { recursive: true });
const out = resolve(artifacts, `source-pixels-${engine}-${tag}.json`); closeSync(openSync(out, 'wx'));
const result = { engine, tag, sourceCommit: '4681d224d3aa3d87e96611485666dc8c8bbaaafc', memoryAcceptance: false,
  historicalWhiteScreenFixed: false, forcedGC: false, pixelReadback: true, originalAssets: [], comparisons: [], errors: [], complete: false };
result.probeSha256 = createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');
const candidates = process.env.CRYPTOID_PIXEL_CANDIDATES === '1'; result.candidates = candidates;
// A single source-derived diagnostic: Chromium's traced lazy-image path uses
// medium-quality native prefiltering at its cached mip dimensions. Do not adopt
// this constructor path, change runtime sampling, or treat it as accepted art.
const nativeMip = process.env.CRYPTOID_PIXEL_NATIVE_MIP === '1'; result.nativeMip = nativeMip;
const traceSampling = process.env.CRYPTOID_PIXEL_TRACE === '1'; result.traceSampling = traceSampling;
assert.ok(!traceSampling || engine === 'chromium', 'Native sampling traces require Chromium');
let browser, server, tracing;
try {
  const { build } = require('esbuild');
  const bundle = await build({ stdin: { contents: "export {loadTexture} from './browser/textures.ts'", resolveDir: directory, loader: 'ts' },
    bundle: true, write: false, format: 'iife', platform: 'browser', globalName: 'textureProbe', logLevel: 'silent' });
  const js = bundle.outputFiles[0].text;
  const manifest = JSON.parse(readFileSync(resolve(directory, 'fixture/memoryAssetManifest.json'), 'utf8'));
  const specs = [
    { url: manifest.assets.find(a => a.provenance === 'local-generated-released-catalog').url, maxWidth: 282, maxHeight: 282, maxEncodedBytes: 512000 },
    { url: '/ships/bosses/evolved/boss-04-hull.webp', maxWidth: 1000, maxHeight: 375, maxEncodedBytes: 79186 },
    { url: '/ships/bosses/evolved/boss-04-guns.webp', maxWidth: 2048, maxHeight: 966, maxEncodedBytes: 46594 },
  ];
  for (const spec of specs) {
    const data = readFileSync(resolve(root, 'frontend/public' + spec.url));
    const sha = createHash('sha1').update(Buffer.from(`blob ${data.length}\0`)).update(data).digest('hex');
    assert.equal(sha, manifest.assets.find(a => a.url === spec.url).sha); result.originalAssets.push({ url: spec.url, sha, bytes: data.length });
  }
  server = createServer((req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/probe.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(js); return; }
    if (specs.some(spec => spec.url === path)) { res.setHeader('Content-Type', extname(path) === '.webp' ? 'image/webp' : 'image/png'); res.end(readFileSync(resolve(root, 'frontend/public' + path))); return; }
    if (path === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; img-src 'self' blob:; connect-src 'self'");
      res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script src="/probe.js"></script></body></html>'); return;
    }
    res.writeHead(path === '/favicon.ico' ? 204 : 404); res.end();
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const playwright = engine === 'webkit' ? require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright')
    : require(resolve(root, 'verification/browser-tools/node_modules/playwright'));
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
  }
  browser = await playwright[engine].launch(options); result.version = browser.version();
  if (traceSampling) {
    const session = await browser.newBrowserCDPSession(), events = []; let truncated = false;
    session.on('Tracing.dataCollected', ({ value }) => {
      for (const event of value) if (event.cat?.includes('cc.debug') || event.cat?.includes('blink.user_timing')) {
        if (events.length >= 12000) { truncated = true; continue; }
        events.push({ name: event.name, phase: event.ph, timestampUs: event.ts, args: event.args });
      }
    });
    await session.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: {
      recordMode: 'recordUntilFull', traceBufferSizeInKb: 8192, enableSampling: false,
      includedCategories: ['disabled-by-default-cc.debug', 'blink.user_timing'], excludedCategories: ['*'],
    } });
    tracing = { async finish() {
      const complete = new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Sampling trace completion timed out')), 10000);
        session.once('Tracing.tracingComplete', () => { clearTimeout(timer); resolve(); }); });
      await session.send('Tracing.end'); await complete; await session.detach();
      return { events, truncated, forcedGC: false, memoryDumpRequested: false };
    } };
  }
  const context = await browser.newContext({ viewport: { width: 393, height: 744 }, deviceScaleFactor: 3 });
  const page = await context.newPage(); page.on('pageerror', error => result.errors.push(String(error))); page.setDefaultTimeout(20000);
  await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'load' });
  result.comparisons = await page.evaluate(async ({ specs, candidates, traceSampling, nativeMip }) => {
    const compare = (a, b) => {
      let channels = 0, maxDelta = 0, absoluteError = 0;
      for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d) channels++; maxDelta = Math.max(maxDelta, d); absoluteError += d; }
      return { channels, maxDelta, absoluteError, comparedChannels: a.length };
    };
    const rows = [];
    for (const spec of specs) for (const scale of [.5, .25, 1]) {
      const frames = [];
      const variants = ['image', 'image', 'blob-image', 'bitmap', ...(candidates ? ['bitmap-canvas', 'bitmap-resized-low', 'bitmap-resized-high'] : []), ...(nativeMip ? ['bitmap-resized-medium'] : [])];
      for (const decoder of variants) {
        const marker = `pixel-probe:${rows.length}:${frames.length}:${decoder}`;
        const controller = new AbortController();
        let release = () => {}, source;
        const canvas = document.createElement('canvas'); canvas.width = Math.ceil(spec.maxWidth * scale); canvas.height = Math.ceil(spec.maxHeight * scale);
        try {
          if (decoder.startsWith('bitmap-resized-')) {
            const blob = await (await fetch(spec.url)).blob();
            source = await createImageBitmap(blob, { resizeWidth: canvas.width, resizeHeight: canvas.height,
              resizeQuality: decoder.slice('bitmap-resized-'.length) });
            release = () => source.close();
          } else {
            const texture = await textureProbe.loadTexture(spec, controller.signal, decoder === 'bitmap-canvas' ? 'bitmap' : decoder);
            source = texture.value.source; release = texture.dispose;
            if (decoder === 'bitmap-canvas') {
              const carrier = document.createElement('canvas'); carrier.width = texture.value.width; carrier.height = texture.value.height;
              const painter = carrier.getContext('2d'); if (!painter) throw new Error('Full-resolution carrier unavailable');
              try { painter.drawImage(source, 0, 0); } catch (error) { carrier.width = carrier.height = 0; throw error; }
              texture.dispose(); source = carrier; release = () => { carrier.width = carrier.height = 0; };
            }
          }
          const context = canvas.getContext('2d'); if (!context) throw new Error('Source pixel context unavailable');
          if (traceSampling) performance.mark(marker + ':draw-start');
          context.imageSmoothingQuality = 'low'; context.drawImage(source, 0, 0, canvas.width, canvas.height);
          frames.push(context.getImageData(0, 0, canvas.width, canvas.height).data);
          if (traceSampling) performance.mark(marker + ':draw-end');
        } finally { release(); controller.abort(); canvas.width = canvas.height = 0; }
      }
      rows.push({ url: spec.url, scale, independentImageControl: compare(frames[1], frames[0]),
        blobVsImage: compare(frames[2], frames[0]), bitmapVsImage: compare(frames[3], frames[0]),
        candidates: variants.slice(4).map((name, index) => ({ name, ...compare(frames[index + 4], frames[0]) })) });
    }
    return rows;
  }, { specs, candidates, traceSampling, nativeMip });
  if (tracing) { result.nativeSampling = await tracing.finish(); tracing = null;
    assert.equal(result.nativeSampling.truncated, false);
    assert.ok(result.nativeSampling.events.some(event => event.name.includes('SoftwareImageDecodeCache::')), 'Native decode-cache trace missing');
    assert.ok(result.nativeSampling.events.some(event => event.name.startsWith('pixel-probe:')), 'Native probe markers missing');
  }
  for (const row of result.comparisons) assert.equal(row.independentImageControl.channels, 0, 'Independent reference must be deterministic');
  assert.deepEqual(result.errors, []); result.complete = true;
} catch (error) { result.failure = String(error?.stack || error); process.exitCode = 1; }
finally {
  if (tracing) { try { result.nativeSampling = await tracing.finish(); } catch (error) { result.traceFailure = String(error); } }
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ engine, complete: result.complete, comparisons: result.comparisons, failure: result.failure ?? null, out }));
  await browser?.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
