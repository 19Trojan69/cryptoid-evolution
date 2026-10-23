// Actual React components in a synthetic localhost fixture; no game/API writes.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url).pathname;
const baseline = readFileSync(root + 'scripts/fixtures/bonus-rock-display-before-20261023.txt', 'utf8');
const source = readFileSync(root + 'src/pages/BonusRockLayer.tsx', 'utf8');
const require = createRequire(import.meta.url);
const playwright = require(process.env.CRYPTOID_PLAYWRIGHT_PACKAGE || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const engine = process.env.CRYPTOID_ROCK_ENGINE || 'chromium';
assert.ok(['chromium', 'webkit'].includes(engine));
assert.equal((source.match(/window\.setTimeout\(/g) || []).length, (baseline.match(/window\.setTimeout\(/g) || []).length);
assert.equal((source.match(/requestAnimationFrame|requestGameFrame/g) || []).length, 0);
const compiled = await build({ absWorkingDir: root, stdin: { resolveDir: root, loader: 'tsx', contents: `
 import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
 import Before from './src/pages/RockDisplayBefore';import Twin from './src/pages/RockDisplayTwin';import After from './src/pages/BonusRockLayer';
 let now=0;window.rockQaNow=()=>now;
 const hosts=['before','twin','after'].map(id=>document.getElementById(id));
 const roots=hosts.map(host=>createRoot(host));
 window.renderRocks=(width,height,rocks,effects,time)=>{now=time;hosts.forEach(host=>{host.style.width=width+'px';host.style.height=height+'px';});flushSync(()=>roots.forEach((root,index)=>root.render(React.createElement([Before,Twin,After][index],{width,height,rocks,effects}))));};
 window.removeRocks=()=>flushSync(()=>roots.forEach(root=>root.render(null)));
 ` }, bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'pinned-baseline-and-idle-clock', setup(builder) {
    builder.onResolve({ filter: /RockDisplay(?:Before|Twin)$/ }, args => ({ path: root + 'src/pages/' + args.path.split('/').at(-1) + '.tsx' }));
    builder.onLoad({ filter: /(?:RockDisplayBefore|RockDisplayTwin|BonusRockLayer)\.tsx$/ }, args => ({ loader: 'tsx',
      contents: (args.path.endsWith('BonusRockLayer.tsx') ? source : baseline).replaceAll('performance.now()', 'window.rockQaNow()') }));
    builder.onResolve({ filter: /^\.\/renderWork$/ }, () => ({ path: 'counter', namespace: 'audit' }));
    builder.onLoad({ filter: /.*/, namespace: 'audit' }, () => ({ loader: 'js', contents: 'export const beginRockPaint=()=>undefined,endRockPaint=()=>{};' }));
  } }] });
const html = '<!doctype html><style>html,body{margin:0;background:#07182b}section{position:absolute;left:0;top:0;pointer-events:none}.reference{position:absolute;inset:0;transform:translateZ(0);background:linear-gradient(#07182b,#12384f)}</style><div class="reference"></div><section id="before"></section><section id="twin"></section><section id="after"></section><script>' + compiled.outputFiles[0].text + '</script>';
const server = createServer((req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(html); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
const report = { engine, baselineBlob: '74ad7118985d768fb56020e69df669e5e64e516f', syntheticLocalhost: true,
  idleClockControlled: true, diagnosticTimingStubbed: true, actualDrawCode: true, cases: [], errors: [], pixelComparisons: 0, exactPixelComparisons: 0, invalidPixelControls: [], layers: [] };
try {
  browser = await playwright[engine].launch({ headless: true,
    ...(engine === 'chromium' ? { args: ['--disable-accelerated-2d-canvas'] } : {}),
    ...(process.env.CRYPTOID_BROWSER_EXECUTABLE ? { executablePath: process.env.CRYPTOID_BROWSER_EXECUTABLE } : {}),
  });
  report.version = browser.version();
  for (const dpr of [1, 1.5, 3]) {
    const context = await browser.newContext({ viewport: { width: 900, height: 950 }, deviceScaleFactor: dpr });
    const page = await context.newPage(); page.on('pageerror', error => report.errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port);
    const render = (w, h, rocks, effects, time) => page.evaluate(props => window.renderRocks(...props), [w, h, rocks, effects, time]);
    const dimensions = () => page.evaluate(() => [...document.querySelectorAll('section canvas')].map(c => ({
      pixels: [c.width, c.height], css: [c.style.width, c.style.height], box: [c.getBoundingClientRect().width, c.getBoundingClientRect().height],
    })));
    const layerSnapshot = async label => {
      if (engine !== 'webkit') return;
      try {
        const implementation = playwright._connection.toImpl(page), session = (implementation.delegate ?? implementation._delegate)._session;
        await session.send('LayerTree.enable'); const { root: document } = await session.send('DOM.getDocument');
        const fields = {};
        for (const id of ['before', 'twin', 'after']) {
          const { nodeId } = await session.send('DOM.querySelector', { nodeId: document.nodeId, selector: '#' + id + ' canvas' });
          fields[id] = (await session.send('LayerTree.layersForNode', { nodeId })).layers;
        }
        report.layers.push({ dpr, label, fields });
      } catch (error) { report.layers.push({ dpr, label, unsupported: String(error) }); }
    };
    const compare = async label => {
      const result = await page.evaluate(() => {
        const [before, twin, after] = document.querySelectorAll('section canvas');
        const get = c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        const a = get(before), b = get(twin), c = get(after);
        const same = (x, y) => x.length === y.length && x.every((value, index) => value === y[index]);
        return { controlSame: same(a, b), candidateSame: same(a, c), cssSame: before.style.cssText === after.style.cssText,
          beforePixels: [before.width, before.height], afterPixels: [after.width, after.height],
          beforeBox: [before.getBoundingClientRect().width, before.getBoundingClientRect().height],
          afterBox: [after.getBoundingClientRect().width, after.getBoundingClientRect().height] };
      });
      assert.equal(result.cssSame, true, label + ': active CSS');
      assert.deepEqual(result.afterPixels, result.beforePixels, label + ': raster dimensions');
      assert.deepEqual(result.afterBox, result.beforeBox, label + ': visible dimensions');
      report.pixelComparisons++;
      if (result.controlSame) { assert.equal(result.candidateSame, true, label + ': exact RGBA'); report.exactPixelComparisons++; }
      else report.invalidPixelControls.push({ dpr, label, ...result });
    };
    await render(430, 825, [], [], 0);
    const initial = await dimensions();
    assert.deepEqual(initial[0].box, [430, 825]); assert.deepEqual(initial[2].box, [1, 1]);
    assert.deepEqual(initial[2].pixels, [1, 1]);
    await layerSnapshot('initial-empty');
    let now = 0;
    for (const [w, h] of [[430, 825], [820, 900]]) for (let cycle = 0; cycle < 2; cycle++) {
      now += 6000;
      const rock = { id: 1, seed: cycle, x: w * .4, y: h * .4, radius: cycle ? 17 : 25, rotation: cycle * .4, hitMs: 110 };
      await render(w, h, [rock], [], now); await compare('first active frame');
      await render(w, h, [], [], now + 20);
      const cleared = await page.evaluate(() => { const c = document.querySelector('#after canvas'); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data.every(value => value === 0); });
      assert.equal(cleared, true, 'last rock frame cleared');
      await render(w, h, [rock], [], now + 1000); await compare('warm reuse');
      for (const final of [false, true]) for (const age of [0, 90, 240, 500, 740]) {
        await render(w, h, [], [{ id: 2, x: w * .55, y: h * .5, radius: rock.radius, seed: cycle, age, points: 25, final }], now + 1100 + age);
        await compare('dust/debris/' + final + '/' + age);
      }
      await render(w, h, [], [], now + 1900); await render(w, h, [], [], now + 3899);
      const warm = await dimensions(); assert.deepEqual(warm[2].box, [w, h], '1999ms retains original warm display');
      await render(w, h, [], [], now + 3900); const idle = await dimensions();
      assert.deepEqual(idle[2].pixels, [1, 1]); assert.deepEqual(idle[2].box, [1, 1]);
      assert.deepEqual(idle[0].box, [w, h], 'preceding component retains full-field empty display');
      await layerSnapshot('released-' + w + '-' + cycle);
      await render(w, h, [rock], [], now + 3910); await compare('first frame after release');
      report.cases.push({ dpr, width: w, height: h, cycle, initial, warm: warm[2], idle: idle[2] });
    }
    const detached = await page.evaluate(() => { const c = document.querySelector('#after canvas'); window.removeRocks(); return [c.width, c.height]; });
    assert.deepEqual(detached, [0, 0]); await context.close();
    console.log(JSON.stringify({ engine, dpr, cycles: report.cases.length, pixelComparisons: report.pixelComparisons, invalidPixelControls: report.invalidPixelControls.length }));
  }
  assert.deepEqual(report.errors, []); report.geometryAndLifecyclePassed = true;
  report.exactPixelAcceptance = report.invalidPixelControls.length === 0 && report.exactPixelComparisons === report.pixelComparisons;
  report.limitations = 'Native Linux browsers and a synthetic component fixture. LayerTree values are estimates, not resident RAM. No physical iPhone, game FPS, live-account or historical White Screen proof.';
} finally {
  await browser?.close(); await new Promise(resolve => server.close(resolve));
  if (process.env.CRYPTOID_ROCK_DISPLAY_REPORT) writeFileSync(process.env.CRYPTOID_ROCK_DISPLAY_REPORT, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ ...report, layers: report.layers.length, cases: report.cases.length }));
