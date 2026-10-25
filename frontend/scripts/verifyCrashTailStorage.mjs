// Local native-browser A/B check. Synthetic clocks and state measure recorder
// I/O, not game balance, physical iPhone memory or the historical crash cause.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const playwright = require(process.env.CRYPTOID_PLAYWRIGHT_PATH || (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright' : 'playwright'));
const root = new URL('../', import.meta.url).pathname;
const beforePath = process.argv[2];
assert.ok(beforePath, 'provide the retained original crashTail.ts');
const sources = { before: readFileSync(beforePath, 'utf8'), after: readFileSync(root + 'src/pages/crashTail.ts', 'utf8') };
const bundles = {};
for (const [name, source] of Object.entries(sources)) {
  const harness = `
${source}
let reads=0,writes=0,clock=0,wall=1000000;
const storage=name=>({getItem(key){reads++;return window[name].getItem(key);},setItem(key,value){writes++;window[name].setItem(key,value);}});
const host={localStorage:storage('localStorage'),sessionStorage:storage('sessionStorage'),performance:{timeOrigin:999000}};
window.run=()=>{
 const tail=createCrashTail(true,()=>host,{id:'synthetic-native-soak',build:{sourceCommit:'a'.repeat(40)},now:()=>clock,wallNow:()=>wall});
 const context={sector:40,phase:'ATTACK_CYCLE',encounter:'boss-fight',status:'playing',liveTurrets:3};
 const started=performance.now();
 for(let n=0;n<36000;n++) {clock=n*1000/60;wall=1000000+clock;tail.frame(context);}
 const frameReads=reads,frameWrites=writes,elapsedMs=performance.now()-started;
 clock+=17;wall+=17;tail.frame({...context,liveTurrets:2});
 clock+=1;wall+=1;tail.record('request',{operation:'failure',endpoint:'checkpoint',httpStatus:503});
 const capture=readCrashTails(host);
 return {frameReads,frameWrites,elapsedMs,capture};
};
window.recover=()=>readCrashTails(host);
window.ready=true;`;
  const result = await build({ stdin: { contents: harness, resolveDir: root + 'src/pages', sourcefile: name + '.ts', loader: 'ts' },
    bundle: true, write: false, format: 'iife', platform: 'browser', logLevel: 'silent' });
  bundles[name] = result.outputFiles[0].contents;
}
const server = createServer((req, res) => {
  const mode = req.url.startsWith('/before') ? 'before' : 'after';
  res.setHeader('Cache-Control', 'no-store');
  if (req.url.endsWith('.js')) { res.setHeader('Content-Type', 'application/javascript'); res.end(bundles[mode]); }
  else { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><body><script src="/' + mode + '.js"></script>'); }
});
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
const engine = process.env.CRYPTOID_TEST_ENGINE || 'chromium';
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
  const cases = {};
  for (const mode of ['before', 'after']) {
    const context = await browser.newContext({ viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
    await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin + '/' + mode); await page.waitForFunction(() => window.ready);
    cases[mode] = await page.evaluate(() => window.run());
    await page.reload(); await page.waitForFunction(() => window.ready);
    assert.deepEqual(await page.evaluate(() => window.recover()), cases[mode].capture, 'same evidence survives a fresh document without finish/unload');
    assert.equal(cases[mode].capture.sessions[0].head.data.liveTurrets, 2);
    assert.equal(cases[mode].capture.sessions[0].errors.at(-1).data.httpStatus, 503);
    assert.deepEqual(errors, []);
    await context.close();
  }
  assert.deepEqual(cases.after.capture, cases.before.capture, 'all retained evidence must be identical');
  assert.equal(cases.after.frameWrites, cases.before.frameWrites, 'snapshot cadence and writes must be identical');
  assert.ok(cases.after.frameReads < cases.before.frameReads / 10, 'ownership reads must leave the per-frame path');
  const { before, after } = cases;
  const result = { passed: true, engine, version: browser.version(), syntheticFramesPerCase: 36000,
    before: { reads: before.frameReads, writes: before.frameWrites, elapsedMs: before.elapsedMs },
    after: { reads: after.frameReads, writes: after.frameWrites, elapsedMs: after.elapsedMs },
    identicalRecoveredEvidence: true, criticalStatePreserved: true,
    limits: 'Actual local browser Storage and current recorder. Ten minutes of synthetic frame callbacks run as a synchronous workload. Timing is diagnostic-work timing, not game FPS, native/iPhone memory, a natural White Screen reproduction, or proof of its cause.' };
  if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
