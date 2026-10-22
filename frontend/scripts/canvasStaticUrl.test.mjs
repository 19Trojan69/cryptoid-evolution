import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { staticHullAsset } from '../src/pages/staticHullAssets.ts';
import { canvasStaticUrlHost, documentURL } from './canvasStaticUrlHost.mjs';

const hull = { sprite: 0, stage: 1, color: 'gold' };
const url = staticHullAsset(hull.sprite, hull.color, hull.stage).url;
const effect = (h = hull, id = 1) => ({ id, kind: 'explosion', x: 215, y: 240,
  debrisSize: 50, sprite: h.sprite, shipStage: h.stage, debrisColor: h.color });
const debris = { props: { children: [{ props: { style: {
  clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)', transformOrigin: '50% 50%',
  '--fragment-x': '-70px', '--fragment-y': '80px', '--fragment-spin': '120deg', '--fragment-delay': '44ms',
} } }] } };

test('negative control: released CanvasImpact refuses the real relative PNG despite prepared resources and no recorded failure', async () => {
  const f = await canvasStaticUrlHost({ before: true }), plan = await f.prepare(hull);
  const view = f.mount(effect(), debris);
  await f.waitFor(() => f.stats().textureEntries === 2 && f.requests.every(i => !i.onload));
  assert.equal(f.stats().sourceImages, 1); assert.equal(f.stats().registeredEffects, 0);
  assert.equal(f.stats().failures.length, 0); assert.equal(f.fallback(view), true);
  const request = f.requests.find(i => i.requested === url);
  assert.equal(request.src, new URL(url, documentURL).href); assert.notEqual(request.src, url);
  plan.release(); f.close();
});

test('actual prepared-hull hook → root-relative PNG → reflected absolute image URL → Canvas registration and drawing', async () => {
  const f = await canvasStaticUrlHost(), plan = await f.prepare(hull), view = f.mount(effect(), debris);
  await f.waitFor(() => f.stats().registeredEffects === 1);
  assert.equal(f.fallback(view), false); f.tick(100);
  assert.equal(f.stats().draws, 1); assert.equal(f.stats().fragmentDraws, 1);
  assert.ok(f.snapshot().pixels.some((value, i) => i % 4 === 3 && value > 0));
  assert.equal(f.stats().failures.length, 0); plan.release(); f.close();
});

test('cold actual hook retains the original display until ready, then uses the static PNG in Canvas', async () => {
  const f = await canvasStaticUrlHost(); f.setHold(() => true);
  const view = f.mount(effect(), debris);
  assert.equal(f.fallback(view), true); assert.equal(f.stats().registeredEffects, 0);
  await f.waitFor(() => f.held.some(i => i.requested === url));
  f.setHold(() => false); await f.releaseHeld();
  await f.waitFor(() => f.stats().registeredEffects === 1 && f.requests.filter(i => i.requested === url).length === 2);
  assert.equal(f.fallback(view), false); assert.equal(f.api.paintedShipResourceStats().pending, 0);
  f.tick(100); assert.ok(f.stats().draws > 0); f.close();
});

test('relative, absolute, query/fragment and historical Blob address controls all activate the actual renderer', async () => {
  for (const address of [url, url.slice(1), new URL(url, documentURL).href, url + '?v=1#hull', 'blob:hull']) {
    const f = await canvasStaticUrlHost({ hookURL: address });
    if (address === 'blob:hull') f.addBlob(address, fs.readFileSync(new URL('../public' + url, import.meta.url)));
    const view = f.mount(effect(), debris); await f.waitFor(() => f.stats().registeredEffects === 1);
    assert.equal(f.fallback(view), false, address); f.tick(100);
    assert.ok(f.stats().draws > 0); assert.equal(f.stats().failures.length, 0); f.close();
  }
});

test('a changed hull address cannot display the previous ready hull while the new image is delayed', async () => {
  const next = staticHullAsset(1, 'cyan', 2).url;
  const f = await canvasStaticUrlHost({ hookURL: url }), view = f.mount(effect(), debris);
  await f.waitFor(() => f.stats().registeredEffects === 1);
  f.setHold(address => address === next); f.setURL(next);
  assert.equal(f.stats().registeredEffects, 0); assert.equal(f.fallback(view), true);
  await f.waitFor(() => f.held.length === 1); f.setHold(() => false); await f.releaseHeld();
  await f.waitFor(() => f.stats().registeredEffects === 1); assert.equal(f.fallback(view), false); f.close();
});

test('an unavailable hull retains the CSS display, records the failure and retries on remount', async () => {
  const f = await canvasStaticUrlHost(), plan = await f.prepare(hull);
  f.setFailure(address => address === url);
  const view = f.mount(effect(), debris); await f.waitFor(() => f.stats().failures.length === 1);
  assert.equal(f.fallback(view), true); assert.equal(f.stats().registeredEffects, 0); f.unmount(view);
  f.setFailure(() => false); const retry = f.mount(effect(hull, 2), debris);
  await f.waitFor(() => f.stats().registeredEffects === 1); assert.equal(f.fallback(retry), false);
  plan.release(); f.close();
});

test('late image completion after unmount cannot register an effect or update its hook', async () => {
  const f = await canvasStaticUrlHost(), plan = await f.prepare(hull); f.setHold(address => address === url);
  const view = f.mount(effect(), debris); await f.waitFor(() => f.held.length === 1);
  f.unmount(view); view.dirty = false; f.setHold(() => false); await f.releaseHeld();
  assert.equal(view.dirty, false); assert.equal(f.stats().registeredEffects, 0); assert.equal(f.frames.size, 0);
  plan.release(); f.close();
});

test('a cleared resource generation rejects late completions and cannot revive the failed layer', async () => {
  const f = await canvasStaticUrlHost(), plan = await f.prepare(hull); f.setHold(() => true);
  const view = f.mount(effect(), debris); await f.waitFor(() => f.held.length === 3);
  f.loseContext(); f.setHold(() => false); await f.releaseHeld();
  await f.waitFor(() => f.stats().failures.length >= 1);
  assert.equal(f.fallback(view), true); assert.equal(f.stats().registeredEffects, 0); assert.equal(f.stats().cacheBytes, 0);
  plan.release(); f.close();
});

test('correctly activated static effects retain pause/resume and context-loss fallback', async () => {
  const f = await canvasStaticUrlHost(), plan = await f.prepare(hull), view = f.mount(effect(), debris);
  await f.waitFor(() => f.stats().registeredEffects === 1); f.tick(100); const draws = f.stats().draws;
  f.setPaused(true); f.tick(120); f.tick(5120); assert.equal(f.stats().draws, draws);
  f.setPaused(false); f.tick(5140); assert.equal(f.stats().draws, draws + 1);
  f.loseContext(); assert.equal(f.fallback(view), true); assert.equal(f.stats().registeredEffects, 0);
  assert.equal(f.stats().cacheBytes, 0); assert.equal(f.stats().activeDrawFrame, false); plan.release(); f.close();
});

test('a missing optional surface leaves the original display in place', async () => {
  const f = await canvasStaticUrlHost({ enabled: false }), plan = await f.prepare(hull), view = f.mount(effect(), debris);
  assert.equal(f.fallback(view), true); assert.equal(f.stats().registeredEffects, 0);
  assert.equal(f.stats().sourceImages, 0); plan.release(); f.close();
});

test('render-scale changes cannot reuse a ready bundle with the previous scale', async () => {
  const f = await canvasStaticUrlHost({ scale: 1 }), plan = await f.prepare(hull), view = f.mount(effect(), debris);
  await f.waitFor(() => f.stats().registeredEffects === 1);
  f.setHold(address => address.startsWith('blob:')); f.setScale(3);
  assert.equal(f.fallback(view), true); assert.equal(f.stats().registeredEffects, 0);
  await f.waitFor(() => f.held.length === 2); f.setHold(() => false); await f.releaseHeld();
  await f.waitFor(() => f.stats().registeredEffects === 1);
  assert.equal(f.fallback(view), false); assert.equal(f.stats().failures.length, 0); plan.release(); f.close();
});

test('a null drawing context falls back without retaining registered effects or a frame chain', async () => {
  const f = await canvasStaticUrlHost(), plan = await f.prepare(hull), view = f.mount(effect(), debris);
  await f.waitFor(() => f.stats().registeredEffects === 1); f.surface.contextAvailable = false; f.tick(100);
  assert.equal(f.fallback(view), true); assert.equal(f.stats().registeredEffects, 0);
  assert.equal(f.stats().cacheBytes, 0); assert.equal(f.stats().activeDrawFrame, false);
  assert.equal(f.stats().failures.length, 1); plan.release(); f.close();
});

test('two mounted effects share the same image/textures and retain resources until both owners leave', async () => {
  const f = await canvasStaticUrlHost(), plan = await f.prepare(hull);
  const first = f.mount(effect(hull, 1), debris), second = f.mount(effect(hull, 2), debris);
  await f.waitFor(() => f.stats().registeredEffects === 2);
  assert.equal(f.stats().sourceImages, 1); assert.equal(f.stats().textureEntries, 2); f.unmount(first);
  assert.equal(f.stats().registeredEffects, 1); assert.equal(f.stats().retainedHullUsers, 1);
  assert.equal(f.fallback(second), false); f.tick(100); assert.equal(f.stats().draws, 1);
  plan.release(); f.close();
});

test('1000 warm static-hull impacts register once, reuse the existing resources and completely release', async () => {
  const f = await canvasStaticUrlHost(), plan = await f.prepare(hull);
  const first = f.mount(effect(), debris); await f.waitFor(() => f.stats().registeredEffects === 1); f.unmount(first);
  const requests = f.requests.length, writes = f.surface.writes;
  for (let id = 2; id <= 1001; id++) {
    const view = f.mount(effect(hull, id), debris); await f.waitFor(() => f.stats().registeredEffects === 1);
    assert.equal(f.fallback(view), false); f.unmount(view);
  }
  assert.equal(f.requests.length, requests); assert.equal(f.surface.writes, writes);
  assert.equal(f.stats().sourceImages, 1); assert.equal(f.stats().textureEntries, 2);
  assert.equal(f.stats().retainedHullUsers, 0); assert.equal(f.stats().registeredEffects, 0);
  assert.equal(f.frames.size, 0); assert.equal(f.timers.size, 1); plan.release(); f.close();
});

test('native raster output matches released working absolute-URL control at original effect ages and render scales', async () => {
  let comparisons = 0;
  for (const scale of [1, 1.5, 3]) for (const selected of [hull, { sprite: 7, stage: 2, color: 'cyan' }, { sprite: 19, stage: 3, color: 'pink' }]) {
    const address = staticHullAsset(selected.sprite, selected.color, selected.stage).url;
    const control = await canvasStaticUrlHost({ before: true, hookURL: new URL(address, documentURL).href, scale });
    const candidate = await canvasStaticUrlHost({ scale });
    const plan = await candidate.prepare(selected);
    control.mount(effect(selected), debris); candidate.mount(effect(selected), debris);
    await control.waitFor(() => control.stats().registeredEffects === 1);
    await candidate.waitFor(() => candidate.stats().registeredEffects === 1);
    for (const age of [0, 120, 500, 1000, 1600, 2160]) {
      control.tick(100 + age); candidate.tick(100 + age);
      assert.deepEqual(candidate.snapshot(), control.snapshot(), `exact native RGBA at ${selected.sprite}:${selected.stage}, scale ${scale}, age ${age}`);
      comparisons++;
    }
    plan.release(); candidate.close(); control.close();
  }
  assert.equal(comparisons, 54);
  console.log(JSON.stringify({ exactNativeRasterComparisons: comparisons, limits: 'Native Skia and actual hooks/resources; not Safari/PiBrowser pixels, native memory or proof of the White Screen cause.' }));
});
