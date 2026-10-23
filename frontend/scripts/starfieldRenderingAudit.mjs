import { build } from 'esbuild';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFileSync, writeFileSync } from 'node:fs';
import { prepareStarfieldFixture, auditNodeModules, nativeBrowserTools } from './starfieldAuditFixture.mjs';
import { createRequire } from 'node:module';
const root = prepareStarfieldFixture();
const require = createRequire(import.meta.url);
const { current, launchBrowser } = nativeBrowserTools(import.meta.url);
const css = readFileSync(root + 'full-scene-global.css', 'utf8');
const variant = 'safe-clip';
const candidate = 'Original SVGs clipped only with a measured full-sway margin';
const paused = true; // Hold random flares out of deterministic raster comparisons.
const entry = `import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
import Starfield from './full-scene-source/frontend/src/pages/Starfield';
import NestedStarfield from './candidate-source/Starfield-safe-clip';
import {startCssFramePacing} from './full-scene-source/frontend/src/lib/cssFramePacing';
startCssFramePacing(document.body);const root=createRoot(document.getElementById('root'));
window.__starsSet=(sector,nebula,nested=false,paused=${paused})=>{const Scene=nested?NestedStarfield:Starfield;flushSync(()=>root.render(<div className="game-shell"><div className="game-field"><Scene sector={sector} player={{x:.5,y:.5}} paused={paused} showNebula={nebula}/></div></div>));};window.__starsSet(1,false);`;
const compiled = await build({ stdin: { contents: entry, resolveDir: root, loader: 'tsx' }, bundle: true, write: false,
  nodePaths: [auditNodeModules], format: 'iife', platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' } });
const script = compiled.outputFiles[0].contents;
const server = createServer((req, res) => {
  if (req.url === '/app.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(script); return; }
  if (req.url === '/base.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); return; }
  res.setHeader('Content-Type', 'text/html');
  res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/base.css"><style id="candidate"></style></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = 'http://127.0.0.1:' + server.address().port;
const report = { localOnly: true, candidate, sourceCommit: '19de3e692f75a1c3e2eddf3438acc937c9dcac19', results: [] };
async function differences(a, b) {
  if (a.equals(b)) return { pixels: 0, channels: 0, max: 0 };
  const { createCanvas, loadImage } = require('@napi-rs/canvas');
  const images = await Promise.all([loadImage(a), loadImage(b)]);
  const data = images.map(im => { const c = createCanvas(im.width, im.height); const ctx = c.getContext('2d'); ctx.drawImage(im, 0, 0); const pixels = ctx.getImageData(0, 0, im.width, im.height).data; c.width = c.height = 0; return pixels; });
  let pixels = 0, channels = 0, max = 0;
  for (let i = 0; i < data[0].length; i += 4) { let changed = false;
    for (let j = 0; j < 4; j++) { const diff = Math.abs(data[0][i+j] - data[1][i+j]); if (diff) { channels++; changed = true; max = Math.max(max, diff); } }
    if (changed) pixels++;
  }
  return { pixels, channels, max };
}
async function layers(session) {
  await session.send('LayerTree.enable');
  const { root } = await session.send('DOM.getDocument');
  const { nodeIds } = await session.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: '.starfield-stars,.starfield-viewport' });
  const { layers } = await session.send('LayerTree.layersForNode', { nodeId: root.nodeId });
  const stars = layers.filter(l => nodeIds.includes(l.nodeId));
  return { totalBytes: layers.reduce((n,l) => n+l.memory, 0), count: layers.length,
    starsBytes: stars.reduce((n,l) => n+l.memory, 0), stars };
}
try {
  for (const engine of (process.env.STARFIELD_ENGINES || 'webkit,chromium').split(',')) {
    const browser = await launchBrowser(engine);
    try {
      for (const viewport of [{width:430,height:825,dpr:3},{width:1024,height:768,dpr:2},{width:1440,height:900,dpr:1}]) {
        if (process.env.STARFIELD_WIDTH && viewport.width !== Number(process.env.STARFIELD_WIDTH)) continue;
        const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.dpr });
        const page = await context.newPage(); const errors=[];page.on('pageerror', e => errors.push(e.message));
        await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
        await page.goto(origin, { waitUntil: 'load' }); await page.waitForFunction(() => !!window.__starsSet);
        const session = engine === 'webkit' ? current._connection.toImpl(page).delegate._session : null;
        for (const sector of [1,70]) for (const nebula of [false,true]) for (const time of [0,26000,42000]) {
          if (process.env.STARFIELD_FIRST === '1' && (sector !== 1 || nebula || time !== 0)) continue;
          await page.evaluate(({sector,nebula,time}) => {
            document.getElementById('candidate').textContent=''; window.__starsSet(sector,nebula);
            for (const a of document.getAnimations()) { a.pause(); a.currentTime=time; }
          }, {sector,nebula,time});
          await page.waitForTimeout(40); const before = await page.screenshot();
          const originalLayers = session && sector===1 && !nebula && time===0 ? await layers(session) : null;
          await page.evaluate(({sector,nebula,time}) => {
            window.__starsSet(sector,nebula,true);
            for (const a of document.getAnimations()) { a.pause(); a.currentTime=time; }
          }, {sector,nebula,time});
          // Wait for the measured clipping state, not just a fixed delay: a
          // still-unmeasured candidate would make a misleading equal control.
          await page.waitForFunction(() => {
            const stars = [...document.querySelectorAll('.starfield-stars')];
            return stars.length === 2 && stars.every(s => getComputedStyle(s).overflow === 'hidden');
          }, undefined, { timeout: 5000 });
          await page.waitForTimeout(80); const after = await page.screenshot();
          const candidateLayers = originalLayers ? await layers(session) : null;
          const diff = await differences(before,after);
          if (errors.length) throw new Error(JSON.stringify(errors));
          report.results.push({engine,viewport,sector,nebula,time,diff,originalLayers,candidateLayers,errors:[...errors]});
          if (diff.pixels && !(report.failureImages || []).some(p => p.includes('-'+engine+'-'+viewport.width))) {
            const prefix = root+'starfield-'+variant+'-'+engine+'-'+viewport.width;
            writeFileSync(prefix+'-before.png',before);writeFileSync(prefix+'-after.png',after); (report.failureImages ||= []).push(prefix);
          }
          if (diff.pixels && process.env.STARFIELD_FAIL_FAST === '1') throw new Error('Visible pixel difference: '+JSON.stringify({engine,viewport,sector,nebula,time,diff}));
        }
        await context.close();
        console.log(JSON.stringify({engine,viewport,cases:report.results.filter(r=>r.engine===engine&&r.viewport.width===viewport.width).length,changed:report.results.filter(r=>r.engine===engine&&r.viewport.width===viewport.width&&r.diff.pixels).length}));
      }
    } finally { await browser.close(); }
  }
} catch (error) { report.failure=String(error);process.exitCode=1; }
finally { server.close();writeFileSync(root+'starfield-'+variant+'-results.json',JSON.stringify(report,null,2)); }
