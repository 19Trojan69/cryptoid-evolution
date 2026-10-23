import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { createCanvas, loadImage } from '@napi-rs/canvas';

// Local A/B acceptance only. The control is the exact published loader; the
// candidate uses the actual edited loader. No account/API/game state is used.
const require = createRequire(import.meta.url);
const { webkit } = require(process.env.CRYPTOID_PLAYWRIGHT_PATH
  || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const frontend = new URL('../', import.meta.url).pathname;
const baseline = readFileSync(new URL('./fixtures/paintedShip-decode-control-20261022.txt', import.meta.url), 'utf8');
assert.equal(createHash('sha256').update(baseline).digest('hex'),
  'da8970c152424cf7690d19b7ef472a624f8fdf18bd8f96483866f4566e8855cf', 'exact published control, portable to shallow clones');
const entry = `
import React, { useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import PaintedShip from './src/pages/PaintedShip.tsx';
import { usePreparedGameHulls } from './src/pages/usePreparedGameHulls';
import { retainPreparedHulls, paintedShipResourceStats } from './src/pages/paintedShip';
import { preparedHullPlan } from './src/pages/hullSourcePlan';
import { createFullSessionRecorder } from './src/pages/fullSessionRecorder';
import { settleFullSessionWrites, readFullSessionStatus } from './src/pages/fullSessionStore';
import { observeSessionDiagnostics } from './src/lib/sessionDiagnosticEvents';
window.signals=[];window.commits=[];window.frames=[];window.decodeCalls=0;window.heldDecodeCalls=0;
observeSessionDiagnostics((kind,data)=>window.signals.push({kind,data}));
const original=HTMLImageElement.prototype.decode;
HTMLImageElement.prototype.decode=function(...args){
  window.decodeCalls++;
  if(window.holdDecode && this.src.endsWith('ship_18_stage_1_anthracite.png')){
    window.heldDecodeCalls++;return new Promise(()=>{});
  }
  return original.apply(this,args);
};
function Ship({hull}){return <div className="tile ship-visual"><PaintedShip {...hull}/><span className="exhaust"/></div>;}
function Harness({sector,offset,shown=0,single=false}){
  usePreparedGameHulls(sector,'normal',offset,0,0,2);
  useLayoutEffect(()=>{window.commits.push({sector,offset,shown,ready:[...document.querySelectorAll('[data-hull-ready]')].map(x=>x.dataset.hullReady)});});
  const hulls=single?[{sprite:17,stage:1,color:'anthracite'}]:preparedHullPlan(sector,'normal',offset,0,0,2).slice(0,shown);
  return <main>{hulls.map((h,i)=><Ship key={i+':'+h.sprite+':'+h.color} hull={h}/>)}</main>;
}
const root=createRoot(document.getElementById('root'));
window.advance=props=>root.render(<Harness {...props}/>);
window.begin=async()=>{window.recorder=createFullSessionRecorder(true,()=>window,{build:{sourceCommit:'d783b01e14336367cc70c3f5c010738cdf7388df',sourceTree:'598bbf587b9a09abca8154cffe0501b77fb7301f',workingTreeDirty:true}});window.recorder.start();await settleFullSessionWrites();};
window.finish=async()=>{root.unmount();window.recorder.finish();await settleFullSessionWrites();return {stats:paintedShipResourceStats(),status:readFullSessionStatus(window)};};
window.single=()=>retainPreparedHulls([{sprite:17,stage:1,color:'anthracite'}]).settled;
window.measureFrames=()=>new Promise(resolve=>{let n=0,last;const gaps=[];function tick(at){if(last)gaps.push(at-last);last=at;if(++n<12)requestAnimationFrame(tick);else resolve(gaps);}requestAnimationFrame(tick);});
window.stats=()=>({images:paintedShipResourceStats(),decodeCalls:window.decodeCalls,heldDecodeCalls:window.heldDecodeCalls});
window.ready=true;
`;
const bundles = {};
for (const control of [true, false]) {
  const compiled = await build({ absWorkingDir: frontend, resolveExtensions:['.ts','.tsx','.mjs','.js','.json'], stdin: { contents: entry, sourcefile: 'hull-load-acceptance.tsx',
    resolveDir: frontend, loader: 'tsx' }, jsx:'automatic', bundle: true, write: false, format: 'iife', platform: 'browser',
    loader: { '.css': 'empty' }, logLevel: 'silent', plugins: control ? [{ name: 'exact-published-loader', setup(b) {
      b.onLoad({ filter: /\/pages\/paintedShip\.ts$/ }, () => ({ contents: baseline, loader: 'ts' }));
    } }] : [] });
  bundles[control ? '/control.js' : '/candidate.js'] = compiled.outputFiles[0].contents;
}
const imageRequests = [];
const server = createServer((req, res) => {
  res.setHeader('Cache-Control', 'public,max-age=3600');
  if (bundles[req.url]) { res.setHeader('Content-Type', 'application/javascript'); res.end(bundles[req.url]); return; }
  if (req.url.startsWith('/ships/')) {
    const path = resolve(frontend, 'public', '.' + new URL(req.url, 'http://localhost').pathname);
    if (!path.startsWith(frontend + 'public/')) { res.writeHead(403); res.end(); return; }
    try { imageRequests.push(req.url); res.setHeader('Content-Type', 'image/png'); res.end(readFileSync(path)); }
    catch { res.writeHead(404); res.end(); } return;
  }
  const mode = req.url === '/control' ? 'control' : 'candidate';
  res.setHeader('Content-Type', 'text/html');
  res.end('<!doctype html><html><head><style>html,body{margin:0;background:#102033}main{display:grid;grid-template-columns:repeat(3,120px);gap:10px;padding:10px}.tile{width:120px;height:130px}.material-hull{display:block;width:120px;height:120px}.exhaust{display:block;background:#ffcc55;width:12px;height:10px;margin:auto}'
    + readFileSync(frontend + 'src/pages/hullArrival.css', 'utf8') + '</style></head><body><div id="root"></div><script src="/' + mode + '.js"></script></body></html>');
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const base = process.env.CRYPTOID_WEBKIT_BASE || '/root/.cache/ms-playwright/webkit-2336/minibrowser-wpe';
const libs = process.env.CRYPTOID_WEBKIT_LIBS || '/tmp/cryptoid-webkit-libs/usr/lib/x86_64-linux-gnu';
const plans = [{sector:33,offset:0},{sector:34,offset:0},{sector:34,offset:6},{sector:35,offset:0},
  {sector:36,offset:0},{sector:53,offset:0},{sector:54,offset:0},{sector:54,offset:6},{sector:55,offset:0}];
const screenshots = new Map(), errors = [], failures = [], checks = [];
let browser;
try {
  browser = await webkit.launch({ headless:true, executablePath:base+'/bin/MiniBrowser', env:{...process.env,
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS:'1', WEBKIT_EXEC_PATH:base+'/bin', WEBKIT_INJECTED_BUNDLE_PATH:base+'/lib',
    WEBKIT_INSPECTOR_RESOURCES_PATH:base+'/share', LD_LIBRARY_PATH:base+'/lib:'+base+'/sys/lib:'+libs,
    GST_PLUGIN_SYSTEM_PATH:libs+'/gstreamer-1.0'} });
  for (const mode of ['control','candidate']) {
    const context = await browser.newContext({viewport:{width:430,height:825},deviceScaleFactor:3});
    await context.route('**/*', r => r.request().url().startsWith(origin) ? r.continue() : r.abort());
    const page = await context.newPage();page.on('pageerror', e=>errors.push(e.message));
    page.on('response', r=>{if(r.status()>=400)failures.push(r.status());});
    await page.goto(origin+'/'+mode);await page.waitForFunction(()=>window.ready);await page.evaluate(()=>window.begin());
    const stages=[];
    for (const props of plans) {
      const count=await page.evaluate(()=>window.signals.length);
      await page.evaluate(props=>window.advance({...props,shown:0}),props);
      await page.waitForFunction(({count,sector})=>window.signals.slice(count).some(x=>x.data.operation==='hull-plan-settled'&&x.data.sector===sector),{count,sector:props.sector});
      const settled=await page.evaluate(count=>window.signals.slice(count).find(x=>x.data.operation==='hull-plan-settled').data,count);
      assert.equal(settled.prepared,12);assert.equal(settled.readinessFailures,0);
      await page.evaluate(props=>window.advance({...props,shown:6}),props);
      await page.waitForFunction(()=>document.querySelectorAll('[data-hull-ready="true"]').length===6,null,{timeout:5000})
        .catch(async error=>{console.error(JSON.stringify({mode,props,errors,html:await page.locator('#root').innerHTML(),stats:await page.evaluate(()=>window.stats())}));throw error;});
      const display=await page.evaluate(()=>({backgrounds:[...document.querySelectorAll('.material-hull')].map(x=>getComputedStyle(x).backgroundImage),
        flames:[...document.querySelectorAll('.exhaust')].map(x=>getComputedStyle(x).visibility),commit:window.commits.at(-1)}));
      assert.ok(display.backgrounds.every(x=>x.includes('/ships/painted/')));assert.ok(display.flames.every(x=>x==='visible'));
      assert.ok(display.commit.ready.every(x=>x==='true'),'all prewarmed hulls ready at the first verified mount');
      await page.evaluate(()=>window.measureFrames());
      const png=await page.screenshot();
      const image=await loadImage(png),canvas=createCanvas(image.width,image.height);canvas.getContext('2d').drawImage(image,0,0);
      const pixels=Buffer.from(canvas.getContext('2d').getImageData(0,0,image.width,image.height).data);
      const signature=props.sector+':'+props.offset;
      if(mode==='control')screenshots.set(signature,pixels);else assert.ok(pixels.equals(screenshots.get(signature)),signature+' actual PaintedShip pixels match published loader');
      canvas.width=canvas.height=0;
      stages.push({...props,prepared:settled.prepared,visibleHulls:6,flamesVisible:true});
      if(process.argv[2] && mode==='candidate' && props.sector===35){mkdirSync(resolve(process.argv[2],'..'),{recursive:true});writeFileSync(process.argv[2].replace(/\.json$/, '-sector35.png'),png);}
    }
    const stats=await page.evaluate(()=>window.stats());
    assert.equal(stats.images.pending,0);
    assert.equal(mode==='candidate'?stats.decodeCalls===0:stats.decodeCalls>0,true);
    const finish=await page.evaluate(()=>window.finish());assert.equal(finish.stats.retainCount,0);assert.ok(finish.stats.painted<=6);
    assert.equal(finish.status.state,'closed');checks.push({mode,stages,stats,cleanupPins:finish.stats.retainCount});await context.close();
  }
  const held=[];
  for (const mode of ['control','candidate']) {
    const context=await browser.newContext({viewport:{width:430,height:825},deviceScaleFactor:3});
    await context.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
    const page=await context.newPage();await page.goto(origin+'/'+mode);await page.waitForFunction(()=>window.ready);
    await page.evaluate(()=>{window.holdDecode=true;window.testDone=false;window.single().then(x=>{window.testDone=x.every(Boolean);});});
    if(mode==='control') {await page.waitForFunction(()=>window.heldDecodeCalls===1);assert.equal(await page.evaluate(()=>window.testDone),false);}
    else {await page.waitForFunction(()=>window.testDone);assert.equal(await page.evaluate(()=>window.decodeCalls),0);}
    held.push({mode,...await page.evaluate(()=>({ready:window.testDone,decodeCalls:window.decodeCalls,heldDecodeCalls:window.heldDecodeCalls}))});
    await context.close();
  }
  // Cold source + variant requests deliberately held: the existing flame guard
  // must hide exhaust until a hull source loads; release restores the real PNG.
  const context=await browser.newContext({viewport:{width:430,height:825},deviceScaleFactor:3});
  const heldRoutes=[];let hold=true,sourceBlocked;
  const blockedSource=new Promise(resolve=>{sourceBlocked=resolve;});
  await context.route('**/*',r=>{
    if(!r.request().url().startsWith(origin))return r.abort();
    if(hold&&/\/ship_18_stage_1(?:_anthracite)?\.png$/.test(r.request().url())){heldRoutes.push(r);sourceBlocked();return;}
    return r.continue();
  });
  const cold=await context.newPage();await cold.goto(origin+'/candidate');await cold.waitForFunction(()=>window.ready);
  await cold.evaluate(()=>window.advance({sector:35,offset:0,shown:1,single:true}));
  await blockedSource;assert.ok(heldRoutes.length>0);
  await cold.waitForFunction(()=>document.querySelector('[data-hull-ready="false"]'));
  assert.equal(await cold.locator('.exhaust').evaluate(x=>getComputedStyle(x).visibility),'hidden');
  hold=false;await Promise.all(heldRoutes.map(r=>r.continue()));
  await cold.waitForFunction(()=>document.querySelector('[data-hull-ready="true"]'));
  assert.equal(await cold.locator('.exhaust').evaluate(x=>getComputedStyle(x).visibility),'visible');
  await context.close();assert.equal(errors.length,0);assert.equal(failures.length,0);
  const result={engine:'WebKit',version:browser.version(),viewport:'430x825',dpr:3,checks,heldDecodeControl:held,
    renderedPixelPairs:screenshots.size,delayedSourceFlameGuard:true,pageErrors:errors.length,imageHttpErrors:failures.length,
    imageRequests:imageRequests.length,sourceHash:createHash('sha256').update(baseline).digest('hex'),
    limits:'Local Linux WebKit, actual React/PaintedShip/cache/handoff and original PNGs. Equal verified rendered pixels and injected held-decode control; not physical PiBrowser, natural crash reproduction, native-memory or guaranteed first-paint latency proof.'};
  if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
} finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
