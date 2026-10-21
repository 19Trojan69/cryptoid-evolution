import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { hullSourcePlan, preparedHullPlan } from '../src/pages/hullSourcePlan.ts';

// Execute the real painting, encoding and cache path. Native raster QA is not
// Safari/iPhone memory measurement. Browser Image load/decode can be held apart.
const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require(process.env.CRYPTOID_NATIVE_CANVAS_MODULE || '@napi-rs/canvas');
const root = new URL('../', import.meta.url).pathname;
const official = '51e59c3373a8dd4ba4985d5a9559acdcf2d6755a';
const sourceAt = ref => ref
  ? execFileSync('git', ['show', `${ref}:frontend/src/pages/paintedShip.ts`], { cwd: root, encoding: 'utf8' })
  : fs.readFileSync(root + 'src/pages/paintedShip.ts', 'utf8');
const candidate = process.env.CRYPTOID_PAINTED_SOURCE_REF;
const turn = () => new Promise(resolve => setImmediate(resolve));
async function until(check) {
  for (let i = 0; i < 2000; i++) { if (check()) return; await turn(); }
  assert.fail('controlled image pipeline did not reach the expected stage');
}
async function fixture(ref = candidate, { holdSources = false } = {}) {
  const bundle = await build({ absWorkingDir: root,
    stdin: { contents: sourceAt(ref) + '\nexport const __qaTouchHull = hull => cache.get(`${hull.sprite}:${hull.stage ?? 1}:${hull.color}`);', resolveDir: root + 'src/pages', loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'cjs', logLevel: 'silent',
    plugins: [{ name: 'painting-host', setup(b) {
      b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'host' }));
      b.onLoad({ filter: /.*/, namespace: 'host' }, () => ({ loader: 'js',
        contents: 'export const useState=()=>{};export const useEffect=()=>{};' }));
    } }],
  });
  const canvases = [], encodes = [], sources = [], painted = [], urls = new Map(), revoked = [];
  const errors = [];
  let serial = 0;
  class Image {
    onload = null; onerror = null; native = null;
    get naturalWidth() { return this.native?.width ?? 0; }
    get naturalHeight() { return this.native?.height ?? 0; }
    set src(url) {
      this.url = url;
      if (url.startsWith('blob:')) { painted.push(this); return; }
      sources.push(this);
      if (!holdSources) void this.loadSource().catch(error => { errors.push(error); this.onerror?.(); });
    }
    async loadSource() { this.native = await loadImage(fs.readFileSync(root + 'public' + this.url)); this.onload?.(); }
    decode() { return new Promise((resolve, reject) => { this.finishDecode = resolve; this.failDecode = reject; }); }
    async load() { this.native = await loadImage(Buffer.from(await urls.get(this.url).arrayBuffer())); this.onload?.(); }
  }
  const makeCanvas = () => {
    const native = createCanvas(1, 1); let width = 0, height = 0;
    const context = native.getContext('2d');
    const canvas = {
      get width() { return width; }, set width(value) { width = value; native.width = Math.max(1, value); },
      get height() { return height; }, set height(value) { height = value; native.height = Math.max(1, value); },
      getContext() { return new Proxy(context, { get(target, key) {
        if (key === 'drawImage') return (image, ...args) => target.drawImage(image.native ?? image, ...args);
        const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
      }, set(target, key, value) { target[key] = value; return true; } }); },
      toBlob(callback, type) {
        assert.equal(type, 'image/png');
        const pixels = Buffer.from(context.getImageData(0, 0, width, height).data);
        const blob = new Blob([native.toBuffer('image/png')], { type });
        encodes.push({ canvas, pixels, blob, finish: () => callback(blob), fail: () => callback(null) });
      },
    };
    canvases.push(canvas); return canvas;
  };
  const scope = { console, Image, Uint8ClampedArray, Blob, performance,
    URL: { createObjectURL(blob) { const url = 'blob:paint-' + ++serial; urls.set(url, blob); return url; },
      revokeObjectURL(url) { revoked.push(url); urls.delete(url); } },
    window: { setTimeout: callback => setImmediate(callback), location: { hostname: 'localhost' },
      localStorage: { getItem: () => null } },
    document: { createElement: makeCanvas }, exports: {}, module: { exports: {} },
  };
  scope.module.exports = scope.exports; vm.runInNewContext(bundle.outputFiles[0].text, scope);
  return { api: scope.module.exports, canvases, encodes, sources, painted, revoked, urls, errors,
    liveBytes: () => canvases.reduce((bytes, c) => bytes + c.width * c.height * 4, 0) };
}
const hull = { sprite: 0, color: 'gold', stage: 1 };
async function finishAllPaints(f) {
  const encodes = f.finishedEncodes ??= new Set(), loaded = f.loadedPaints ??= new Set();
  for (let tick = 0; tick < 10000; tick++) {
    for (const e of f.encodes) if (!encodes.has(e)) { encodes.add(e); e.finish(); }
    for (const image of f.painted) {
      if (!loaded.has(image)) { loaded.add(image); await image.load(); }
      if (image.finishDecode) image.finishDecode();
    }
    await turn();
    if (f.api.paintedShipResourceStats().pending === 0) return;
  }
  assert.fail('painting queue did not settle');
}
test('level transition audit: release-before-retain discards six already prepared next-level hulls', async () => {
  const f = await fixture();
  const oldPlan = preparedHullPlan(18, 'normal', 0, 0, 0, 2);
  const nextPlan = preparedHullPlan(19, 'normal', 0, 0, 0, 2);
  const old = f.api.retainPreparedHulls(oldPlan); await finishAllPaints(f); await old.settled;
  const future = nextPlan.slice(0,6).map(h => f.api.__qaTouchHull(h));
  assert.ok(future.every(Boolean), 'all six next-level hulls were fully prepared');
  // Mounted current ships repeatedly read their styles after prewarming ends.
  for (const h of oldPlan.slice(0,6)) assert.ok(f.api.__qaTouchHull(h));
  old.release();
  assert.equal(future.filter(url => f.revoked.includes(url)).length, 6);
  const before = f.encodes.length;
  const next = f.api.retainPreparedHulls(nextPlan); await finishAllPaints(f); await next.settled;
  assert.equal(f.encodes.length - before, 12, 'six repeat paints plus six genuinely new ones');
  next.release();
  assert.equal(f.liveBytes(), 0); assert.equal(f.api.paintedShipResourceStats().retainCount,0);
});
test('level transition audit: retain-before-release preserves prepared pixels and only paints six new hulls', async () => {
  const f = await fixture();
  const oldPlan = preparedHullPlan(18, 'normal', 0, 0, 0, 2);
  const nextPlan = preparedHullPlan(19, 'normal', 0, 0, 0, 2);
  const old = f.api.retainPreparedHulls(oldPlan); await finishAllPaints(f); await old.settled;
  const future = nextPlan.slice(0,6).map(h => f.api.__qaTouchHull(h));
  for(const h of oldPlan.slice(0,6)) f.api.__qaTouchHull(h);
  const before = f.encodes.length;
  const next = f.api.retainPreparedHulls(nextPlan); old.release();
  await finishAllPaints(f); await next.settled;
  assert.equal(future.filter(url => f.revoked.includes(url)).length, 0);
  assert.equal(f.encodes.length - before, 6);
  nextPlan.slice(0,6).forEach((h,i)=>assert.equal(f.api.__qaTouchHull(h),future[i]));
  next.release();
  assert.equal(f.liveBytes(),0); assert.equal(f.api.paintedShipResourceStats().retainCount,0);
});
async function encoded(f, selected = hull) {
  const previous = f.encodes.length;
  const preparation = f.api.retainPreparedHulls([selected]);
  await until(() => f.encodes.length > previous);
  return { preparation, encode: f.encodes.at(-1) };
}

test('painting surface is needed through encoding, then released before image load and decode finish', async () => {
  const f = await fixture();
  const { preparation, encode } = await encoded(f);
  const bytes = encode.canvas.width * encode.canvas.height * 4;
  assert.ok(bytes > 0, 'encoder retains its complete source until callback');
  assert.equal(f.api.paintedShipResourceStats().painted, 0);
  encode.finish(); await until(() => f.painted.length === 1);
  assert.equal(f.liveBytes(), 0, 'no painting surface remains while the encoded image waits to load');
  assert.equal(f.api.paintedShipResourceStats().painted, 0, 'an unready image is not exposed');
  await f.painted[0].load(); await until(() => f.painted[0].finishDecode);
  assert.equal(f.liveBytes(), 0, 'decode also retains no painting surface');
  f.painted[0].finishDecode(); assert.deepEqual([...await preparation.settled], [true]);
  const stats = f.api.paintedShipResourceStats();
  assert.equal(stats.estimatedBytes, bytes + encode.blob.size, 'cache still accounts for full decoded image dimensions');
  assert.equal(stats.pending, 0); preparation.release();
  assert.equal(f.api.paintedShipResourceStats().retainCount, 0);
  assert.equal(f.errors.length, 0);
});

test('official PNG output is exactly preserved after the earlier surface release', async () => {
  for (const selected of [hull, { sprite: 7, color: 'silver', stage: 2 }, { sprite: 19, color: 'copper', stage: 3 }]) {
    const before = await fixture(official), after = await fixture();
    const control = await encoded(before, selected), changed = await encoded(after, selected);
    assert.ok(control.encode.pixels.equals(changed.encode.pixels), 'identical painted RGBA before encoding');
    control.encode.finish(); changed.encode.finish();
    await until(() => before.painted.length && after.painted.length);
    assert.equal(after.liveBytes(), 0);
    await Promise.all([before.painted[0].load(), after.painted[0].load()]);
    await until(() => before.painted[0].finishDecode && after.painted[0].finishDecode);
    const rgba = image => { const c = createCanvas(image.width, image.height); const g = c.getContext('2d'); g.drawImage(image, 0, 0); return Buffer.from(g.getImageData(0, 0, c.width, c.height).data); };
    assert.ok(rgba(before.painted[0].native).equals(rgba(after.painted[0].native)), 'exact decoded PNG RGBA equality');
    before.painted[0].finishDecode(); after.painted[0].finishDecode();
    await Promise.all([control.preparation.settled, changed.preparation.settled]);
    assert.equal(before.api.paintedShipResourceStats().estimatedBytes, after.api.paintedShipResourceStats().estimatedBytes);
    control.preparation.release(); changed.preparation.release();
  }
});

test('failed encoding, image load and decode release surfaces and revoke failed output', async () => {
  for (const failure of ['encode', 'load', 'decode']) {
    const f = await fixture(), { preparation, encode } = await encoded(f);
    if (failure === 'encode') encode.fail();
    else {
      encode.finish(); await until(() => f.painted.length);
      assert.equal(f.liveBytes(), 0);
      if (failure === 'load') f.painted[0].onerror();
      else { await f.painted[0].load(); await until(() => f.painted[0].failDecode); f.painted[0].failDecode(new Error('controlled decode failure')); }
    }
    assert.deepEqual([...await preparation.settled], [false]); preparation.release();
    assert.equal(f.liveBytes(), 0);
    assert.equal(f.api.paintedShipResourceStats().painted, 0);
    assert.equal(f.api.paintedShipResourceStats().pending, 0);
    assert.equal(f.api.paintedShipResourceStats().retainCount, 0);
    assert.equal(f.urls.size, 0);
    assert.equal(f.revoked.length, failure === 'encode' ? 0 : 1);
  }
});

test('repeated live preparation leaves bounded caches without working canvases or pins', async () => {
  const f = await fixture();
  for (let i = 0; i < 60; i++) {
    const selected = { sprite: i % 20, stage: Math.floor(i / 20) + 1, color: 'gold' };
    const { preparation, encode } = await encoded(f, selected);
    encode.finish(); await until(() => f.painted.length > i);
    assert.equal(f.liveBytes(), 0);
    const image = f.painted[i]; await image.load(); await until(() => image.finishDecode);
    image.finishDecode(); await preparation.settled; preparation.release();
    const stats = f.api.paintedShipResourceStats();
    assert.equal(stats.retainCount, 0); assert.equal(stats.pending, 0);
    assert.ok(stats.painted <= 48); assert.ok(stats.sources <= 8);
    assert.ok(stats.estimatedBytes <= 24 * 1024 * 1024);
    assert.equal(f.liveBytes(), 0);
  }
  assert.equal(f.revoked.length, 60 - f.api.paintedShipResourceStats().painted);
  if (!candidate) assert.equal(f.api.paintedShipResourceStats().painted, 6, 'normal-memory release retains six unused recent variants only');
});

test('cancellation during a delayed source response prevents obsolete painting and allows a fresh request', async () => {
  const f = await fixture(candidate, { holdSources: true });
  const preparation = f.api.retainPreparedHulls([hull]);
  await until(() => f.sources.length === 1);
  preparation.release(); await f.sources[0].loadSource();
  await until(() => f.encodes.length || !f.api.paintedShipResourceStats().pending);
  assert.equal(f.encodes.length, 0, 'unmounted hull must not start material work after its late image arrives');
  assert.deepEqual([...await preparation.settled], [false]);
  assert.equal(f.liveBytes(), 0);
  const fresh = await encoded(f);
  fresh.encode.finish(); await until(() => f.painted.length);
  await f.painted[0].load(); await until(() => f.painted[0].finishDecode);
  f.painted[0].finishDecode(); assert.deepEqual([...await fresh.preparation.settled], [true]);
  fresh.preparation.release();
});

test('cancellation during encoding skips the obsolete replacement load', async () => {
  const f = await fixture(), { preparation, encode } = await encoded(f);
  preparation.release(); encode.finish();
  await until(() => f.painted.length || !f.api.paintedShipResourceStats().pending);
  assert.equal(f.painted.length, 0, 'unmounted output does not start an image load/decode');
  assert.deepEqual([...await preparation.settled], [false]);
  assert.equal(f.liveBytes(), 0); assert.equal(f.urls.size, 0);
  assert.equal(f.api.paintedShipResourceStats().painted, 0);
});

test('cancellation during replacement image loading skips decode and revokes the output', async () => {
  const f = await fixture(), { preparation, encode } = await encoded(f);
  encode.finish(); await until(() => f.painted.length);
  preparation.release(); await f.painted[0].load();
  await until(() => f.painted[0].finishDecode || !f.api.paintedShipResourceStats().pending);
  assert.equal(f.painted[0].finishDecode, undefined, 'unmounted image does not request a further decode');
  assert.deepEqual([...await preparation.settled], [false]);
  assert.equal(f.urls.size, 0); assert.equal(f.revoked.length, 1);
});

test('cancellation during decode does not populate the cache with obsolete output', async () => {
  const f = await fixture(), { preparation, encode } = await encoded(f);
  encode.finish(); await until(() => f.painted.length);
  await f.painted[0].load(); await until(() => f.painted[0].finishDecode);
  preparation.release(); f.painted[0].finishDecode();
  assert.deepEqual([...await preparation.settled], [false]);
  assert.equal(f.api.paintedShipResourceStats().painted, 0);
  assert.equal(f.urls.size, 0); assert.equal(f.revoked.length, 1);
});

test('a second current consumer keeps a shared hull preparation alive', async () => {
  const f = await fixture(candidate, { holdSources: true });
  const first = f.api.retainPreparedHulls([hull]);
  await until(() => f.sources.length === 1);
  const second = f.api.retainPreparedHulls([hull]); first.release();
  await f.sources[0].loadSource(); await until(() => f.encodes.length);
  f.encodes[0].finish(); await until(() => f.painted.length);
  await f.painted[0].load(); await until(() => f.painted[0].finishDecode);
  f.painted[0].finishDecode();
  assert.deepEqual([...await second.settled], [true]);
  assert.equal(f.sources.length, 1); assert.equal(f.encodes.length, 1);
  assert.equal(f.api.paintedShipResourceStats().retainCount, 1);
  second.release(); assert.equal(f.api.paintedShipResourceStats().retainCount, 0);
});

test('delayed source requests remain shared across real block plans and cache eviction', async () => {
  const f = await fixture(candidate, { holdSources: true });
  const requested = new Set();
  for (let repeat = 0; repeat < 3; repeat++) for (let sector = 1; sector <= 9; sector++) {
    const plan = hullSourcePlan(sector, 'normal', 0, 0);
    plan.forEach(url => requested.add(url)); f.api.preloadHullSources(plan);
    assert.ok(f.api.paintedShipResourceStats().sources <= 8);
  }
  assert.equal(f.sources.length, requested.size, 'each unresolved URL owns only one Image even after leaving the eight-entry cache');
  // Failure must retire deduplication too, allowing an ordinary retry.
  for (const image of f.sources) image.onerror(); await turn();
  const count = f.sources.length;
  f.api.preloadHullSources([f.sources[0].url]);
  assert.equal(f.sources.length, count + 1, 'a failed request can be retried');
  f.sources.at(-1).onerror(); await turn();
});

test('successful source requests leave only the existing bounded ready cache', async () => {
  const f = await fixture(candidate, { holdSources: true });
  const urls = Array.from({ length: 20 }, (_, i) => `/ships/evolution/ship_${String(i + 1).padStart(2, '0')}_stage_1.png`);
  for (let i = 0; i < urls.length; i += 7) f.api.preloadHullSources(urls.slice(i, i + 7));
  assert.equal(f.sources.length, 20);
  for (const image of f.sources) await image.loadSource(); await turn();
  assert.equal(f.api.paintedShipResourceStats().sources, 8);
  f.api.preloadHullSources([urls.at(-1)]);
  assert.equal(f.sources.length, 20, 'ready recent sources remain cached');
  f.api.preloadHullSources([urls[0]]);
  assert.equal(f.sources.length, 21, 'resolved evicted sources are not held in a second completed-image cache');
  await f.sources.at(-1).loadSource(); await turn(); assert.equal(f.liveBytes(), 0);
});

test('reloaded sources with known visual centers allocate no second readback canvas', async () => {
  const f = await fixture(candidate, { holdSources: true });
  const urls = Array.from({ length: 9 }, (_, i) => `/ships/evolution/ship_${String(i + 1).padStart(2, '0')}_stage_1.png`);
  for (const url of urls) { f.api.preloadHullSources([url]); await f.sources.at(-1).loadSource(); await turn(); }
  assert.equal(f.canvases.length, 9, 'each unknown center is measured once');
  const before = f.canvases.length;
  f.api.preloadHullSources([urls[0]]);
  assert.equal(f.sources.length, 10, 'the first source really left the eight-entry cache');
  await f.sources.at(-1).loadSource(); await turn();
  assert.equal(f.canvases.length, before, 'a known center does not allocate another 240x240 surface');
  assert.equal(f.liveBytes(), 0);
  assert.equal(f.errors.length, 0);
});

test('a remount between cancellation and finally receives a fresh preparation', async () => {
  const f = await fixture(candidate, { holdSources: true });
  const first = f.api.retainPreparedHulls([hull]);
  await until(() => f.sources.length);
  first.release(); let replacement;
  const loaded = f.sources[0].onload;
  f.sources[0].onload = () => {
    loaded(); queueMicrotask(() => { replacement = f.api.retainPreparedHulls([hull]); });
  };
  await f.sources[0].loadSource(); await until(() => replacement && f.encodes.length);
  assert.deepEqual([...await first.settled], [false]);
  f.encodes[0].finish(); await until(() => f.painted.length);
  await f.painted[0].load(); await until(() => f.painted[0].finishDecode);
  f.painted[0].finishDecode(); assert.deepEqual([...await replacement.settled], [true]);
  replacement.release(); assert.equal(f.api.paintedShipResourceStats().pending, 0);
});

test('rapid preparation-plan changes cover all 500 sectors and 50 bosses behind a delayed first image', async () => {
  const f = await fixture(candidate, { holdSources: true });
  const all = []; let current, lastPlan;
  const change = async (sector, encounter, offset = 0, wave = 0, group = 0) => {
    current?.release(); lastPlan = preparedHullPlan(sector, encounter, offset, wave, group, 2);
    current = f.api.retainPreparedHulls(lastPlan); all.push(current);
    await turn(); // Let the real serial queue start, while its first image stays delayed.
  };
  for (let sector = 1; sector <= 500; sector++) {
    if (sector % 10) { await change(sector, 'normal'); await change(sector, 'normal', 6); }
    else {
      await change(sector, 'boss-intro'); await change(sector, 'boss-fight', 0, 1);
      await change(sector, 'bonus'); await change(sector, 'bonus', 0, 0, 1);
    }
  }
  assert.equal(all.length, 1100);
  assert.equal(f.encodes.length, 0, 'source delay has not spawned painting canvases');
  const handledSources = new Set(), handledEncodes = new Set(), handledImages = new Set(), handledDecodes = new Set();
  let finished = false;
  const completed = Promise.all(all.map(preparation => preparation.settled)).then(() => { finished = true; });
  for (let round = 0; round < 2000 && !finished; round++) {
    for (const image of f.sources) if (!handledSources.has(image)) { handledSources.add(image); await image.loadSource(); }
    for (const encode of f.encodes) if (!handledEncodes.has(encode)) { handledEncodes.add(encode); encode.finish(); }
    await turn();
    for (const image of f.painted) if (!handledImages.has(image)) { handledImages.add(image); await image.load(); }
    await turn();
    for (const image of f.painted) if (image.finishDecode && !handledDecodes.has(image)) { handledDecodes.add(image); image.finishDecode(); }
    await turn();
  }
  assert.equal(finished, true, 'all obsolete queued jobs settle once the held source returns'); await completed;
  assert.ok([...await current.settled].every(Boolean), 'latest scene still gets every required hull');
  const latestKeys = new Set(lastPlan.map(h => `${h.sprite}:${h.stage ?? 1}:${h.color}`));
  assert.equal(f.encodes.length, latestKeys.size, 'only variants required by the final scene do material work');
  assert.equal(f.api.paintedShipResourceStats().pending, 0);
  current.release(); assert.equal(f.api.paintedShipResourceStats().retainCount, 0);
  assert.equal(f.liveBytes(), 0); assert.equal(f.errors.length, 0);
});
