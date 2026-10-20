import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

// Execute the real painting, encoding and cache path. Native raster QA is not
// Safari/iPhone memory measurement. Browser Image load/decode can be held apart.
const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require(process.env.CRYPTOID_NATIVE_CANVAS_MODULE || '@napi-rs/canvas');
const root = new URL('../', import.meta.url).pathname;
const official = 'a889d22cc9c1142f51773e073c41b0a7c8aa13d8';
const sourceAt = ref => ref
  ? execFileSync('git', ['show', `${ref}:frontend/src/pages/paintedShip.ts`], { cwd: root, encoding: 'utf8' })
  : fs.readFileSync(root + 'src/pages/paintedShip.ts', 'utf8');
const candidate = process.env.CRYPTOID_PAINTED_SOURCE_REF;
const turn = () => new Promise(resolve => setImmediate(resolve));
async function until(check) {
  for (let i = 0; i < 2000; i++) { if (check()) return; await turn(); }
  assert.fail('controlled image pipeline did not reach the expected stage');
}
async function fixture(ref = candidate) {
  const bundle = await build({ absWorkingDir: root,
    stdin: { contents: sourceAt(ref), resolveDir: root + 'src/pages', loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'cjs', logLevel: 'silent',
    plugins: [{ name: 'painting-host', setup(b) {
      b.onResolve({ filter: /^react$/ }, () => ({ path: 'hooks', namespace: 'host' }));
      b.onLoad({ filter: /.*/, namespace: 'host' }, () => ({ loader: 'js',
        contents: 'export const useState=()=>{};export const useEffect=()=>{};' }));
    } }],
  });
  const canvases = [], encodes = [], painted = [], urls = new Map(), revoked = [];
  const errors = [];
  let serial = 0;
  class Image {
    onload = null; onerror = null; native = null;
    get naturalWidth() { return this.native?.width ?? 0; }
    get naturalHeight() { return this.native?.height ?? 0; }
    set src(url) {
      this.url = url;
      if (url.startsWith('blob:')) { painted.push(this); return; }
      void loadImage(fs.readFileSync(root + 'public' + url)).then(image => {
        this.native = image; this.onload?.();
      }).catch(error => { errors.push(error); this.onerror?.(); });
    }
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
  return { api: scope.module.exports, canvases, encodes, painted, revoked, urls, errors,
    liveBytes: () => canvases.reduce((bytes, c) => bytes + c.width * c.height * 4, 0) };
}
const hull = { sprite: 0, color: 'gold', stage: 1 };
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

test('repeated preparation and cancellation leave bounded caches without working canvases or pins', async () => {
  const f = await fixture();
  for (let i = 0; i < 60; i++) {
    const selected = { sprite: i % 20, stage: Math.floor(i / 20) + 1, color: 'gold' };
    const { preparation, encode } = await encoded(f, selected);
    if (i % 2) preparation.release(); // Unmount while its encoder is pending.
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
});
