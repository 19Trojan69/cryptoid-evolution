// Automated local renderer isolation. No Pi login, purchases, saves, live API,
// iPhone analytics-log dependency, production test hook, or injected process kill.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const playwright = require(process.env.CRYPTOID_PLAYWRIGHT_PATH || (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright' : 'playwright'));
const root = new URL('../', import.meta.url).pathname;
const bundle = await build({ entryPoints: [root + 'scripts/fixtures/boss-resource-soak.tsx'], bundle: true,
  write: false, outfile: 'boss-soak.js', platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent' });
const css = ['src/index.css', 'src/pages/hullArrival.css', 'src/pages/combatVariety.css', 'src/pages/bossExplosionBudget.css']
  .map(path => readFileSync(root + path, 'utf8')).join('\n') + '\n' + (bundle.outputFiles.find(file => file.path.endsWith('.css'))?.text || '');
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('Cache-Control', 'no-store');
  if (path === '/soak.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(bundle.outputFiles.find(file => file.path.endsWith('.js')).contents); }
  else if (path === '/style.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); }
  else if (path.startsWith('/ships/')) {
    const file = resolve(root, 'public', '.' + path);
    if (!file.startsWith(root + 'public/')) { res.writeHead(403); res.end(); return; }
    try { const bytes = readFileSync(file); res.setHeader('Content-Type', path.endsWith('.webp') ? 'image/webp' : 'image/png'); res.end(bytes); }
    catch { res.writeHead(404); res.end(); }
  } else if (path === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body style="margin:0;background:#071622"><div class="game-shell" style="width:430px;height:825px"><div id="root" style="position:relative;width:430px;height:825px"></div></div><script src="/soak.js"></script></body></html>');
  } else { res.writeHead(404); res.end(); }
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const engine = process.env.CRYPTOID_TEST_ENGINE || 'webkit';
const options = { headless: true, timeout: 20000 };
if (engine === 'chromium' && process.env.CRYPTOID_CHROMIUM) options.executablePath = process.env.CRYPTOID_CHROMIUM;
if (engine === 'webkit' && (process.env.CRYPTOID_WEBKIT_BASE || process.env.CRYPTOID_WEBKIT_LIBS)) {
  const base = process.env.CRYPTOID_WEBKIT_BASE || '/root/.cache/ms-playwright/webkit-2336/minibrowser-wpe';
  options.executablePath = base + '/bin/MiniBrowser';
  options.env = { ...process.env, WEBKIT_EXEC_PATH: base + '/bin',
    WEBKIT_INJECTED_BUNDLE_PATH: base + '/lib', WEBKIT_INSPECTOR_RESOURCES_PATH: base + '/share',
    LD_LIBRARY_PATH: base + '/lib:' + base + '/sys/lib:' + process.env.CRYPTOID_WEBKIT_LIBS };
}
let browser;
try {
  browser = await playwright[engine].launch(options);
  const cases = [], cycles = Number(process.env.CRYPTOID_SOAK_CYCLES || 36);
  for (const diagnostics of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
    await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    const page = await context.newPage(), errors = [], failures = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400 && response.url().includes('/ships/')) failures.push(response.url()); });
    page.on('console', message => { if (message.text().startsWith('SOAK ')) console.log(JSON.stringify({ engine, ...JSON.parse(message.text().slice(5)) })); });
    await page.goto(origin); await page.waitForFunction(() => window.bossSoakReady);
    let deadline;
    let result;
    try {
      result = await Promise.race([page.evaluate(args => window.runBossSoak(args), { cycles, diagnostics }),
        new Promise((_, reject) => { deadline = setTimeout(() => reject(Error('Boss/card soak exceeded its local test deadline')), cycles * 5000 + 30000); })]);
    } finally { clearTimeout(deadline); }
    cases.push({ ...result, errors, imageFailures: failures });
    if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify({ passed: false, engine, stage: 'arm-completed', cases }, null, 2) + '\n');
    assert.deepEqual(errors, []); assert.deepEqual(failures, []);
    assert.equal(result.checks.length, cycles);
    assert.equal(result.resources['boss-canvas-first-draw'], cycles);
    assert.equal(result.resources['boss-canvas-release'], cycles);
    assert.equal(result.resources['boss-texture-error'] || 0, 0);
    assert.ok(result.checks.slice(2).every(check => check.sharedArtworkBytes === result.checks[2].sharedArtworkBytes), 'three shared card results must plateau after warmup');
    await context.close();
  }
  const result = { passed: true, engine, version: browser.version(), cases,
    limits: 'Local native browser with actual React boss renderer, reward portraits, original boss 2/3/4 assets, CSS and recorder. Synthetic damage/aim and 1.8-second encounters isolate resource retirement, including the unchanged shared card cache. Canvas byte counts are dimension estimates. This is not a full game, native/process/GPU memory measurement or a physical iPhone reproduction.' };
  if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, engine, cyclesPerCase: cycles, cases: cases.length }));
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
