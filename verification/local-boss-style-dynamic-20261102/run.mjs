import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, createReadStream, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, configuration } from '../boss2-forensics-20261028/fixture.mjs';
const require = createRequire(new URL('../boss2-forensics-20261028/package.json', import.meta.url));
const pw = require('playwright'), engine = process.argv[2];
assert.ok(['chromium', 'webkit'].includes(engine), 'One declared native browser engine');
const output = root + '/verification/local-boss-style-dynamic-20261102/results/' + engine;
const directory = resolve(output, '../site'); mkdirSync(output, { recursive: true });
const build = JSON.parse(readFileSync(directory + '/build-info.json', 'utf8'));
assert.equal(build.sourceCommit, execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim());
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  let file; try { file = resolve(directory, '.' + decodeURIComponent(path === '/' ? '/index.html' : path)); }
  catch { res.writeHead(400).end(); return; }
  if (!file.startsWith(directory + sep)) { res.writeHead(403).end(); return; }
  try { if (!statSync(file).isFile()) throw Error(); } catch { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
  createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const result = { version: 1, kind: 'standalone-dynamic-react-component-fidelity', complete: false, engine,
  ...build, playwrightVersion: require('playwright/package.json').version,
  actualHostOS: process.platform, modelsCompleted: [],
  remoteFontRequestPolicy: 'Remote Google fonts are blocked and not part of this component property comparison.',
  memoryBenefitMeasured: false, wholeGameStartupVerified: false, physicalPhoneAcceptanceEstablished: false };
let browser, page, fatal; const external = [], assets = [];
try {
  browser = await pw[engine].launch({ headless: true }); result.engineVersion = browser.version();
  const profile = configuration(engine === 'webkit' ? 'iphone' : 'android-phone', pw.devices);
  const context = await browser.newContext({ ...profile.context, viewport: { width: 430, height: 825 } });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (!['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) external.push(url.hostname);
    return route.abort();
  });
  page = await context.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', () => { fatal ||= 'uncaught-component-javascript-error'; });
  page.on('crash', () => { fatal ||= 'component-renderer-crash'; });
  page.on('response', response => { if (response.url().startsWith(origin + '/') && response.status() >= 400) assets.push(response.status()); });
  await page.goto(origin, { waitUntil: 'load' }); await page.waitForFunction(() => !!window.__localStyleDynamic);
  for (let id = 1; id <= 50; id++) {
    result.progress = await page.evaluate(id => window.__localStyleDynamic.runModel(id), id);
    result.modelsCompleted.push(id); assert.ok(!fatal, fatal);
  }
  assert.equal(result.progress.dynamicCases, 1800); assert.equal(result.progress.sameNodeChecks, 3500);
  assert.equal(result.progress.fallingCases, 50); assert.equal(result.progress.absentCases, 50);
  await page.evaluate(() => window.__localStyleDynamic.beginAnimationCheck());
  // External test wait: never a game timer, game-clock write or automatic Resume.
  await page.waitForTimeout(100);
  result.animationContinuity = await page.evaluate(() => window.__localStyleDynamic.checkAnimationUpdate());
  assert.ok(result.animationContinuity.retainedStartedAnimationChecks > 0);
  result.final = await page.evaluate(() => window.__localStyleDynamic.finish());
  assert.equal(result.final.rootsUnmounted, true); assert.equal(result.final.dynamicCases, 1801);
  assert.deepEqual(external, []); assert.deepEqual(assets, []); assert.ok(!fatal, fatal);
  result.complete = true;
} catch (error) {
  result.failure = { code: fatal || 'dynamic-component-fidelity-failed', message: String(error.message).slice(0, 4096) };
  process.exitCode = 1;
} finally {
  result.finishedAt = new Date().toISOString();
  writeFileSync(output + '/observation.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_DYNAMIC_COMPONENT_RESULT ' + JSON.stringify({ complete: result.complete, engine,
    completedModels: result.modelsCompleted.length, failure: result.failure, stats: result.final ?? result.progress,
    whiteScreenFixed: false }));
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
