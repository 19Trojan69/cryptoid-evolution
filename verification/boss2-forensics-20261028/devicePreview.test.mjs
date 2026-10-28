import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { deviceController, deviceSeed, deviceHtml } from './devicePreviewTransform.mjs';
import { baselineController, root, instrumentController } from './fixture.mjs';
import { DEVICE_OPTIONS_KEY, DEVICE_RUNS_KEY, readDeviceOptions, readDeviceRuns, recordDeviceRun } from './devicePreviewAuth.mjs';
import { createHash } from 'node:crypto';

test('device build reverses exactly to the already tested controller and release fingerprint', () => {
  const source = readFileSync(root + '/frontend/src/pages/GamePage.tsx', 'utf8');
  assert.equal(deviceController(source).replace(deviceSeed + '\n', ''), instrumentController(source));
  assert.equal(createHash('sha256').update(baselineController(source)).digest('hex'), '625fecc2cb959e4ed4ba690f7867d0a07b247b9a136a8ce308afecaf6dcd94fa');
  assert.throws(() => deviceController(source.replace('  const levelLabel =', '  const changedLevel =')));
});
test('actual seed starts the two disclosed scenes without account/save API or clock changes', () => {
  for (const scene of ['reactor', 'turrets']) for (const protection of [false, true]) {
    let layout, updates = 0, creations = 0;
    const state = { status: 'playing' }, host = { __deviceBossOptions: { scene, protection } };
    const impact = { current: 0 };
    const code = deviceSeed.replaceAll('(window as any)', 'window');
    runInNewContext(code, { window: host, useRef: value => ({ current: value }), useLayoutEffect: cb => { layout = cb; },useEffect:()=>{},
      stateRef: { current: state }, fieldRef: { current: { clientWidth: 430, clientHeight: 825 } }, visibleTopRef: { current: 96 },
      createSectorBoss: (...args) => { creations++; assert.deepEqual([...args], [20,430,96,825]); return { turrets: [{ health: 10 }], health: 100, maxHealth: 100 }; },
      impactCooldownRef: impact, setGame: () => updates++ });
    layout(); layout();
    assert.equal(creations, 1); assert.equal(updates, 1); assert.equal(state.sector, 20);
    assert.equal(state.encounter, 'boss-intro'); assert.equal(state.status, 'playing');
    assert.equal(state.boss.health, scene === 'reactor' ? 50 : 100);
    assert.equal(state.boss.turrets[0].health, scene === 'reactor' ? 0 : 10);
    assert.equal(impact.current, protection ? 1e9 : 0);
  }
});
test('only approved option scalars and 16 technical run conditions survive storage', () => {
  const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key,value) => values.set(key,value) };
  storage.setItem(DEVICE_OPTIONS_KEY, JSON.stringify({ scene: 'bad', diagnostics: false, protection: false, token: 'private' }));
  assert.deepEqual(readDeviceOptions(storage), { scene:'reactor',diagnostics:false,protection:false });
  for (let at=0;at<20;at++) recordDeviceRun(storage,{scene:'turrets',diagnostics:true,protection:false},at);
  assert.equal(readDeviceRuns(storage).length,16); assert.equal(readDeviceRuns(storage)[0].at,4);
  storage.setItem(DEVICE_RUNS_KEY, JSON.stringify([{at:1,scene:'reactor',diagnostics:true,protection:true,token:'private'}]));
  assert.equal(JSON.stringify(readDeviceRuns(storage)).includes('private'),false);
  assert.doesNotThrow(() => readDeviceOptions({ getItem(){throw Error('denied');} }));
});
test('HTML preserves the real startup guard while retiring real Pi authentication', () => {
  const source=readFileSync(root+'/frontend/index.html','utf8'),html=deviceHtml(source);
  assert.ok(html.includes('id="cryptoid-startup-recovery"')); assert.ok(html.includes('Pi.init({ version: "2.0" });'));
  assert.ok(html.includes('src="/device-preview-sdk.js"')); assert.ok(!html.includes('https://sdk.minepi.com'));
  assert.ok(html.includes('appNetwork: "testnet"')); assert.ok(html.includes('backendURL: "/api"'));
});
test('actual client transport denies every account/payment/write path without a network adapter', async () => {
  const source=readFileSync(new URL('./devicePreviewTransport.mjs',import.meta.url),'utf8');
  const start=source.indexOf('export async function deviceReply'),end=source.indexOf('export const axiosClient');
  class Headers {};
  class ErrorWithResponse extends Error { constructor(message,code,config,request,response){super(message);this.response=response;} }
  const fn=runInNewContext(source.slice(start,end).replace('export async function','async function')+';deviceReply', {AxiosError:ErrorWithResponse,AxiosHeaders:Headers});
  assert.deepEqual(JSON.parse(JSON.stringify((await fn({method:'get',url:'/hangar/catalog'})).data)),{offers:[]});
  for(const method of ['get','post','put','patch','delete'])for(const url of ['/user/signin','/user/me','/payments/create','/payments/complete','/hangar/start','/progress/checkpoint','/admin/start','https://production.invalid/api'])
    await assert.rejects(fn({method,url}),error=>error.response.status===403);
});
test('build-only boundary keeps real entry/API outside the preview and production abort precedes build', () => {
  const source=readFileSync(new URL('./buildDevicePreview.mjs',import.meta.url),'utf8');
  assert.ok(source.indexOf("assert.equal(process.env.VERCEL_ENV, 'preview'")<source.indexOf('await build('));
  assert.ok(source.includes("sourceGameEditedByBuilder: false"));
  const transport=readFileSync(new URL('./devicePreviewTransport.mjs',import.meta.url),'utf8');
  assert.ok(transport.includes('adapter: deviceReply'));assert.ok(!/\b(fetch|XMLHttpRequest)\s*\(/.test(transport));
  const app=readFileSync(new URL('./devicePreviewApp.jsx',import.meta.url),'utf8');
  assert.ok(app.includes("if (location.pathname !== '/') history.replaceState(null, '', '/')"));
  assert.ok(!/setInterval|requestAnimationFrame|__cryptoidTraceSink/.test(app));
});
