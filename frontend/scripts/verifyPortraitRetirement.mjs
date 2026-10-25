// Compare actual React portraits against a retained source directory. No live API.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve, basename } from 'node:path';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url).pathname;
const beforeDirectory = resolve(process.argv[2] || '');
assert.ok(process.argv[2], 'provide the original src/pages directory');
const require = createRequire(import.meta.url);
const playwright = require(process.env.CRYPTOID_PLAYWRIGHT_PATH || (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright' : 'playwright'));
const bundles = {};
for (const variant of ['before', 'after']) {
  const result = await build({ entryPoints: [root + 'scripts/fixtures/portrait-retirement.tsx'], bundle: true,
    write: false, outfile: 'portrait-test.js', format: 'iife', platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent',
    plugins: variant === 'before' ? [{ name: 'original-portrait-control', setup(builder) {
      builder.onLoad({ filter: /\/(BossPortrait|ShipPortrait|GalaxyBossArt)\.tsx$/ }, args => ({
        contents: readFileSync(resolve(beforeDirectory, basename(args.path)), 'utf8'), loader: 'tsx', resolveDir: root + 'src/pages',
      }));
    } }] : [] });
  bundles[variant] = result.outputFiles.find(file => file.path.endsWith('.js'))?.contents || result.outputFiles[0].contents;
}
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('Cache-Control', 'no-store');
  if (path.endsWith('.js')) { res.setHeader('Content-Type', 'application/javascript'); res.end(bundles[path.includes('before') ? 'before' : 'after']); }
  else if (path.startsWith('/ships/')) {
    const file = resolve(root, 'public', '.' + path);
    if (!file.startsWith(root + 'public/')) { res.writeHead(403); res.end(); return; }
    try { res.setHeader('Content-Type', 'image/png'); res.end(readFileSync(file)); }
    catch { res.writeHead(404); res.end(); }
  } else { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><div id="root" style="width:430px;height:825px"></div><script src="' + path + '.js"></script>'); }
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const engine = process.env.CRYPTOID_TEST_ENGINE || 'chromium';
const options = { headless: true, timeout: 20000 };
if (engine === 'chromium' && process.env.CRYPTOID_CHROMIUM) options.executablePath = process.env.CRYPTOID_CHROMIUM;
if (engine === 'webkit' && (process.env.CRYPTOID_WEBKIT_BASE || process.env.CRYPTOID_WEBKIT_LIBS)) {
  const base = process.env.CRYPTOID_WEBKIT_BASE || '/root/.cache/ms-playwright/webkit-2336/minibrowser-wpe';
  options.executablePath = base + '/bin/MiniBrowser';
  options.env = { ...process.env, WEBKIT_EXEC_PATH: base + '/bin', WEBKIT_INJECTED_BUNDLE_PATH: base + '/lib',
    WEBKIT_INSPECTOR_RESOURCES_PATH: base + '/share', LD_LIBRARY_PATH: base + '/lib:' + base + '/sys/lib:' + process.env.CRYPTOID_WEBKIT_LIBS };
}
const digest = png => createHash('sha256').update(Buffer.from(png.split(',')[1], 'base64')).digest('hex');
let browser;
try {
  browser = await playwright[engine].launch(options);
  const cases = {};
  for (const variant of ['before', 'after']) {
    const context = await browser.newContext({ viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
    await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    const page = await context.newPage(), errors = [], failures = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
    await page.goto(origin + '/' + variant); await page.waitForFunction(() => window.portraitTest);
    const snapshots = [];
    for (const kind of ['boss', 'ship', 'galaxy']) for (const silhouette of [false, true]) {
      await page.evaluate(args => window.portraitTest.mount(args), { kind, id: 2, silhouette });
      await page.waitForFunction(() => document.querySelector('[data-ready="true"]'));
      const pixels = await page.evaluate(() => window.portraitTest.capture());
      assert.equal(pixels.ready, 'true'); assert.ok(pixels.width > 0 && pixels.height > 0);
      await page.evaluate(() => window.portraitTest.unmount());
      const retired = await page.evaluate(() => window.portraitTest.retired());
      const shared = await page.evaluate(() => window.portraitTest.shared());
      assert.deepEqual([shared.width, shared.height], [pixels.sharedWidth, pixels.sharedHeight], 'view cleanup must preserve the shared result');
      if (variant === 'after') assert.ok(retired.every(canvas => canvas.width === 0 && canvas.height === 0));
      else assert.ok(retired.some(canvas => canvas.width > 0 && canvas.height > 0), 'negative control must expose retained backing stores');
      snapshots.push({ kind, silhouette, width: pixels.width, height: pixels.height, sha256: digest(pixels.pixels), sharedSha256: digest(shared.pixels), retired });
    }
    // An unfinished image request completes after unmount. Its callback must not
    // revive the retired view; the shared loader must still complete successfully.
    for (const kind of ['boss', 'ship', 'galaxy']) {
      let release, observed, deadline;
      const gate = new Promise(resolve => { release = resolve; });
      const requested = new Promise(resolve => { observed = resolve; });
      await page.route('**/ships/**', async route => { observed(); await gate; await route.continue(); });
      try {
        await page.evaluate(args => window.portraitTest.mount(args), { kind, id: 3 });
        // Boss 3's hull and ship 2 have not been used in this context. Galaxy
        // shares the decoded boss but prepares its own small artwork.
        if (kind !== 'galaxy') await Promise.race([requested, new Promise((_, reject) => { deadline = setTimeout(() => reject(Error('held asset was not requested')), 10000); })]);
        clearTimeout(deadline);
        await page.evaluate(() => window.portraitTest.unmount()); release();
        await page.evaluate(() => window.portraitTest.settle());
        if (variant === 'after') assert.ok((await page.evaluate(() => window.portraitTest.retired())).every(canvas => canvas.width === 0 && canvas.height === 0));
      } finally { clearTimeout(deadline); release(); await page.unroute('**/ships/**'); }
    }
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
    cases[variant] = { snapshots, retired: await page.evaluate(() => window.portraitTest.retired()), errors, imageFailures: failures };
    await context.close();
  }
  assert.deepEqual(cases.before.snapshots.map(({ retired, ...pixels }) => pixels), cases.after.snapshots.map(({ retired, ...pixels }) => pixels), 'native rendered pixels and shared artwork must match exactly');
  const bytes = rows => rows.reduce((sum, canvas) => sum + canvas.width * canvas.height * 4, 0);
  const result = { passed: true, engine, version: browser.version(), pixelPairs: cases.after.snapshots.length,
    controlledRetiredViewBytesBefore: bytes(cases.before.retired), controlledRetiredViewBytesAfter: bytes(cases.after.retired), cases,
    limits: 'Actual React effects, original artwork and native canvas. Detached view elements are deliberately held to expose deferred-GC backing stores. Pixel byte counts are canvas dimensions, not native/process/GPU memory or proof of the historical iPhone White Screen cause.' };
  if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, engine, pixelPairs: result.pixelPairs, retiredViewBytesBefore: result.controlledRetiredViewBytesBefore, retiredViewBytesAfter: result.controlledRetiredViewBytesAfter }));
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
