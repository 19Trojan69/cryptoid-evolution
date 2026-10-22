import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { allPlayerColors, playerSkins } from '../src/pages/shipFleet.ts';
import { staticHullAsset } from '../src/pages/staticHullAssets.ts';
import { preparedHullPlan } from '../src/pages/hullSourcePlan.ts';
import { paintedHullBytes, paintedHullColors } from '../src/generated/paintedHullManifest.ts';
import { staticHullHost, until } from './staticHullHost.mjs';
import { Host } from './canvasHookHost.mjs';

const publicRoot = new URL('../public/', import.meta.url).pathname;
const selected = { sprite: 0, color: 'gold', stage: 1 };
const prepare = async (f, hull = selected) => {
  const plan = f.api.retainPreparedHulls([hull]);
  assert.deepEqual([...await plan.settled], [true]);
  return { plan, url: f.api.__qaTouchHull(hull) };
};

test('all current and saved legacy colours, twenty hulls and three stages have generated PNGs', () => {
  assert.deepEqual(paintedHullColors, allPlayerColors.map(c => c.id));
  assert.equal(paintedHullBytes.length, 1740);
  const urls = new Set();
  for (let sprite = 0; sprite < playerSkins.length; sprite++) for (const stage of [1, 2, 3]) for (const color of allPlayerColors) {
    const asset = staticHullAsset(sprite, color.id, stage);
    assert.ok(asset); assert.equal(fs.statSync(publicRoot + asset.url.slice(1)).size, asset.bytes); urls.add(asset.url);
  }
  assert.equal(urls.size, 1740);
  for (const args of [[-1, 'gold', 1], [20, 'gold', 1], [0.5, 'gold', 1], [0, 'missing', 1], [0, 'gold', 0], [0, 'gold', 4]]) {
    assert.equal(staticHullAsset(...args), undefined);
  }
});

test('all 1740 static PNGs equal the actual preceding runtime encoder output byte for byte', async () => {
  const f = await staticHullHost({ before: true });
  let compared = 0;
  for (let sprite = 0; sprite < playerSkins.length; sprite++) for (const stage of [1, 2, 3]) for (const color of allPlayerColors) {
    const hull = { sprite, stage, color: color.id }, { plan } = await prepare(f, hull);
    const asset = staticHullAsset(sprite, color.id, stage), actual = fs.readFileSync(publicRoot + asset.url.slice(1));
    assert.ok(f.png().equals(actual), `native encoder pixels/PNG differ for ${sprite}:${stage}:${color.id}`);
    compared++; plan.release();
  }
  assert.equal(compared, 1740); assert.equal(f.counters.encodes, 1740);
  assert.equal(f.counters.liveCanvasBytes, 0); assert.equal(f.api.paintedShipResourceStats().retainCount, 0);
  console.log(JSON.stringify({ comparedPNG: compared, baselineEncodingJobs: f.counters.encodes, limits: 'Native Skia equality; not an iPhone colour-management or memory measurement.' }));
});

test('a cold static hull loads individually without Canvas, readback, PNG encoding or Blob allocation', async () => {
  const f = await staticHullHost(), { plan, url } = await prepare(f);
  assert.equal(url, staticHullAsset(0, 'gold', 1).url);
  assert.equal(f.requested.size, 1); assert.equal(f.counters.images, 1);
  assert.equal(f.counters.canvases, 0); assert.equal(f.counters.readbacks, 0);
  assert.equal(f.counters.encodes, 0); assert.equal(f.counters.objectURLs, 0);
  plan.release(); assert.equal(f.api.paintedShipResourceStats().retainCount, 0);
});

test('decoded readiness and the full encoded-plus-decoded estimate are retained', async () => {
  const f = await staticHullHost({ holdDecode: true }), plan = f.api.retainPreparedHulls([selected]);
  await until(() => f.decodes.length === 1);
  assert.equal(f.api.__qaTouchHull(selected), undefined);
  f.decodes.shift().resolve(); assert.deepEqual([...await plan.settled], [true]);
  const asset = staticHullAsset(0, 'gold', 1), image = await loadImage(fs.readFileSync(publicRoot + asset.url.slice(1)));
  assert.equal(f.api.paintedShipResourceStats().estimatedBytes, asset.bytes + image.width * image.height * 4);
  assert.equal(image.width, 282); assert.equal(image.height, 282); plan.release();
});

test('load/decode failures remain retryable without publishing an incomplete image', async () => {
  for (const failure of ['failLoad', 'failDecode']) {
    const f = await staticHullHost({ [failure]: 1 }), plan = f.api.retainPreparedHulls([selected]);
    assert.deepEqual([...await plan.settled], [false]); plan.release();
    assert.equal(f.api.__qaTouchHull(selected), undefined); assert.equal(f.api.paintedShipResourceStats().pending, 0);
    const retry = await prepare(f); assert.equal(retry.url, staticHullAsset(0, 'gold', 1).url); retry.plan.release();
    assert.equal(f.counters.objectURLs, 0); assert.equal(f.counters.canvases, 0);
  }
});

test('obsolete delayed loads and decodes cancel; a still mounted consumer protects the same request', async () => {
  for (const stage of ['load', 'decode']) {
    const f = await staticHullHost({ holdLoads: stage === 'load', holdDecode: stage === 'decode' });
    const plan = f.api.retainPreparedHulls([selected]);
    await until(() => stage === 'load' ? f.loads.length : f.decodes.length);
    plan.release();
    if (stage === 'load') await f.loads.shift().load(); else f.decodes.shift().resolve();
    assert.deepEqual([...await plan.settled], [false]);
    assert.equal(f.api.paintedShipResourceStats().pending, 0); assert.equal(f.api.__qaTouchHull(selected), undefined);
  }
  const f = await staticHullHost({ holdDecode: true });
  const first = f.api.retainPreparedHulls([selected]), second = f.api.retainPreparedHulls([selected]);
  await until(() => f.decodes.length === 1); first.release(); f.decodes.shift().resolve();
  assert.deepEqual([...await second.settled], [true]); assert.equal(f.counters.images, 1);
  second.release(); assert.equal(f.api.paintedShipResourceStats().retainCount, 0);
});

test('cache eviction and route remount reuse a stable URL instead of minting another image identity', async () => {
  const results = [];
  for (const before of [true, false]) {
    const f = await staticHullHost({ before });
    const first = await prepare(f); first.plan.release();
    for (let sprite = 1; sprite < 10; sprite++) { const next = await prepare(f, { ...selected, sprite }); next.plan.release(); }
    assert.equal(f.api.__qaTouchHull(selected), undefined);
    const again = await prepare(f); assert.equal(again.url === first.url, !before); again.plan.release();
    results.push({ before, encodes: f.counters.encodes, objectURLs: f.counters.objectURLs });
  }
  assert.ok(results[0].encodes > 0); assert.equal(results[1].encodes, 0); assert.equal(results[1].objectURLs, 0);
  console.log(JSON.stringify({ stableURLControl: results }));
});

test('500 levels plus escort and bonus preparation stay bounded without runtime painting', async () => {
  const f = await staticHullHost(); let previous = null, plans = 0;
  for (let sector = 1; sector <= 500; sector++) {
    const encounters = sector % 10 ? [['normal', 0, 0, 0], ['normal', 6, 0, 0]]
      : [['boss-intro', 0, 0, 0], ['boss-fight', 0, 1, 0], ['bonus', 0, 0, 0], ['bonus', 0, 0, 1]];
    for (const [encounter, offset, wave, bonus] of encounters) {
      const next = f.api.retainPreparedHulls(preparedHullPlan(sector, encounter, offset, wave, bonus, 2));
      previous?.release(); previous = next;
      assert.ok((await next.settled).every(Boolean), `all requested hulls ready in ${sector}:${encounter}`); plans++;
      const stats = f.api.paintedShipResourceStats();
      assert.ok(stats.retainCount <= 12); assert.ok(stats.painted <= 24); assert.ok(stats.estimatedBytes <= 12 * 1024 * 1024);
      assert.equal(stats.pending, 0);
    }
  }
  previous.release(); const stats = f.api.paintedShipResourceStats();
  assert.equal(plans, 1100); assert.equal(stats.retainCount, 0); assert.ok(stats.painted <= 6);
  assert.equal(f.counters.canvases, 0); assert.equal(f.counters.readbacks, 0);
  assert.equal(f.counters.encodes, 0); assert.equal(f.counters.objectURLs, 0);
  assert.ok(f.requested.size <= 1740);
  console.log(JSON.stringify({ plans, requestedVariants: f.requested.size, readinessRequests: f.counters.images, ...f.counters }));
});

test('static hull PNGs remain ordinary Canvas image sources for original debris clipping', async () => {
  for (const h of [selected, { sprite: 7, stage: 2, color: 'cyan' }, { sprite: 19, stage: 3, color: 'pink' }]) {
    const asset = staticHullAsset(h.sprite, h.color, h.stage), image = await loadImage(fs.readFileSync(publicRoot + asset.url.slice(1)));
    const canvas = createCanvas(90, 90);
    try {
      const c = canvas.getContext('2d'); c.beginPath(); c.moveTo(0, 0); c.lineTo(90, 15); c.lineTo(40, 90); c.closePath(); c.clip();
      c.drawImage(image, 0, 0, 90, 90);
      assert.ok(c.getImageData(0, 0, 90, 90).data.some((value, i) => i % 4 === 3 && value > 0));
    } finally { canvas.width = canvas.height = 0; }
  }
});

test('the actual style hook keeps the original source until decoded and preserves every style except the image URL', async () => {
  const f = await staticHullHost({ holdDecode: true });
  const probe = new Host(() => {
    f.setHooks(globalThis.__hookHost);
    return f.api.usePaintedShipStyle(0, 'gold', 1);
  }, {});
  const source = '/ships/evolution/ship_01_stage_1.png';
  const original = { backgroundImage: `url(${source})`, '--ship-surface-mask': `url(${source})`, backgroundPosition: 'center', backgroundSize: '100% 100%', filter: 'none' };
  assert.deepEqual({ ...probe.render() }, original); probe.passive();
  await until(() => f.decodes.length === 1);
  assert.deepEqual({ ...probe.render() }, original);
  f.decodes.shift().resolve(); await until(() => probe.dirty);
  const url = staticHullAsset(0, 'gold', 1).url;
  assert.deepEqual({ ...probe.render() }, { ...original, backgroundImage: `url(${url})`, '--ship-surface-mask': `url(${url})` });
  probe.unmount(); assert.equal(f.api.paintedShipResourceStats().retainCount, 0);
});

test('the actual hook retains the original visible fallback on unavailable PNG, then retries on remount', async () => {
  const f = await staticHullHost({ failLoad: 1 });
  const component = () => { f.setHooks(globalThis.__hookHost); return f.api.usePaintedShipStyle(0, 'gold', 1); };
  const first = new Host(component, {}); first.render(); first.passive();
  await until(() => f.api.paintedShipResourceStats().pending === 0);
  assert.equal(first.render().backgroundImage, 'url(/ships/evolution/ship_01_stage_1.png)'); first.unmount();
  const retry = new Host(component, {}); retry.render(); retry.passive();
  await until(() => retry.dirty); assert.equal(retry.render().backgroundImage, `url(${staticHullAsset(0, 'gold', 1).url})`);
  retry.unmount(); assert.equal(f.api.paintedShipResourceStats().retainCount, 0);
});
