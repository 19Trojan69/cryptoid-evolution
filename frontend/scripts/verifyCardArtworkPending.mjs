// Run actual baseline/candidate loaders with delayed images and original assets.
// Controlled resource counts and CPU pixels are not iPhone/WebKit memory results.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url).pathname;
const baseline = '23b9f83f2639ba836eea0e94e45ba310c9ab97d0';
const files = ['bossArtwork.ts', 'shipArtwork.ts'];
async function compile(before) {
  const result = await build({ absWorkingDir: root, stdin: {
    contents: "export {loadBossArtwork} from './bossArtwork';export {loadShipArtwork} from './shipArtwork';",
    resolveDir: root + 'src/pages', loader: 'ts',
  }, bundle: true, write: false, platform: 'node', format: 'cjs', logLevel: 'silent',
  plugins: [{ name: 'card-versions', setup(builder) {
    builder.onLoad({ filter: /\/(bossArtwork|shipArtwork)\.ts$/ }, args => {
      const name = args.path.split('/').at(-1); assert.ok(files.includes(name));
      const contents = before
        ? execFileSync('git', ['show', `${baseline}:frontend/src/pages/${name}`], { cwd: root, encoding: 'utf8' })
        : fs.readFileSync(args.path, 'utf8');
      return { contents, loader: 'ts' };
    });
  } }], });
  return result.outputFiles[0].text;
}
const [beforeCode, afterCode] = await Promise.all([compile(true), compile(false)]);
function execute(code, globals) {
  const scope = { module: { exports: {} }, console, ...globals };
  scope.exports = scope.module.exports; vm.runInNewContext(code, scope); return scope.module.exports;
}
const ship = n => `/ships/evolution/ship_${String((n - 1) % 20 + 1).padStart(2, '0')}_stage_${n > 20 ? 2 : 1}.png`;
function host(code) {
  const h = { images: [], surfaces: [], mode: 'healthy' };
  const document = { createElement(tag) {
    assert.equal(tag, 'canvas');
    const canvas = { width: 300, height: 150, dataset: {}, getContext() { return context; } };
    const context = new Proxy({
      drawImage() {},
      getImageData(x, y, w, height) {
        if (h.mode === 'readback-throws') throw new Error('controlled readback failure');
        const data = new Uint8ClampedArray(w * height * 4); data.fill(255); return { data };
      },
      createLinearGradient() { return { addColorStop() {} }; },
      createRadialGradient() { return { addColorStop() {} }; },
    }, { get: (target, key) => target[key] ?? (() => {}) });
    h.surfaces.push(canvas); return canvas;
  } };
  class Image {
    constructor() { this.width = this.naturalWidth = 64; this.height = this.naturalHeight = 96; h.images.push(this); }
    set src(url) { this.url = url; }
  }
  h.api = execute(code, { document, Image });
  h.finish = failUrl => {
    for (const image of h.images) if (!image.finished) {
      image.finished = true;
      if (image.url === failUrl) image.onerror(); else image.onload();
    }
  };
  h.call = (kind, n, variant) => kind === 'boss'
    ? h.api.loadBossArtwork(n, variant ?? 256)
    : h.api.loadShipArtwork(ship(n), variant);
  return h;
}

const results = []; let cases = 0;
for (const kind of ['boss', 'ship']) {
  const limit = kind === 'boss' ? 8 : 20, unique = limit + 1;
  for (const [code, fixed] of [[beforeCode, false], [afterCode, true]]) {
    const h = host(code), tasks = [];
    for (let n = 1; n <= unique; n++) tasks.push(h.call(kind, n));
    assert.equal(h.call(kind, unique), tasks.at(-1), 'an unevicted pending task is already shared');
    const again = h.call(kind, 1); tasks.push(again);
    assert.equal(again === tasks[0], fixed, 'share unfinished work after result-cache eviction');
    const imageObjectsBeforeReload = h.images.length;
    assert.equal(imageObjectsBeforeReload, kind === 'boss' ? unique * 2 + Number(!fixed) : unique + Number(!fixed));
    h.finish(); const outputs = await Promise.all(tasks);
    assert.equal(outputs[0] === outputs.at(-1), fixed, 'callers receive the same completed canvas');
    const jobs = new Set(outputs).size;
    assert.equal(jobs, unique + Number(!fixed));
    // No second completed cache may preserve an evicted task forever.
    const newFirst = h.call(kind, 1); assert.notEqual(newFirst, tasks[0]);
    h.finish(); await newFirst;
    results.push({ kind, fixed, uniqueKeys: unique, completedJobs: jobs, imageObjectsBeforeReload });
    cases++;
  }
  // Three passes through more keys than the result-cache capacity, with every
  // image still loading. Only one task per key should survive the churn.
  for (const [code, fixed] of [[beforeCode, false], [afterCode, true]]) {
    const h = host(code), tasks = [];
    for (let pass = 0; pass < 3; pass++) for (let n = 1; n <= unique; n++) tasks.push(h.call(kind, n));
    h.finish(); const outputs = await Promise.all(tasks);
    const jobs = new Set(outputs).size; assert.equal(jobs, fixed ? unique : unique * 3);
    results.push({ kind, fixed, passes: 3, uniqueKeys: unique, completedJobs: jobs }); cases++;
  }
  // Preserve the existing result-cache capacity and hits after all tasks settle.
  {
    const h = host(afterCode); let first;
    for (let n = 1; n <= limit; n++) {
      const task = h.call(kind, n); if (n === 1) first = task; h.finish(); await task;
    }
    assert.equal(h.call(kind, 1), first, 'completed entry remains cached within the original capacity');
    const extra = h.call(kind, unique); h.finish(); await extra;
    const reload = h.call(kind, 1); assert.notEqual(reload, first, 'original result-cache limit remains unchanged');
    h.finish(); await reload; cases++;
  }
  // A failed image is removed from both pending and result lookup, including
  // when its result entry was already evicted. All consumers share the failure.
  for (const evict of [false, true]) {
    const h = host(afterCode), first = h.call(kind, 1), others = [];
    if (evict) for (let n = 2; n <= unique; n++) others.push(h.call(kind, n));
    const again = h.call(kind, 1); assert.equal(again, first);
    const settled = Promise.allSettled([first, again, ...others]);
    h.finish(kind === 'boss' ? '/ships/bosses/evolved/boss-01-hull.webp' : ship(1));
    const outcomes = await settled;
    assert.equal(outcomes[0].status, 'rejected'); assert.equal(outcomes[1].status, 'rejected');
    assert.ok(outcomes.slice(2).every(outcome => outcome.status === 'fulfilled'));
    const retry = h.call(kind, 1); assert.notEqual(retry, first);
    h.finish(); await retry; assert.equal(h.call(kind, 1), retry); cases++;
  }
  // Painting failures also settle/remove the pending task, release working
  // surfaces, and permit the next healthy request to retry.
  {
    const h = host(afterCode); h.mode = 'readback-throws';
    const task = h.call(kind, 1), rejected = assert.rejects(task, /controlled readback/);
    h.finish(); await rejected;
    assert.ok(h.surfaces.every(canvas => canvas.width === 0 && canvas.height === 0));
    h.mode = 'healthy'; const retry = h.call(kind, 1); assert.notEqual(retry, task);
    h.finish(); await retry; cases++;
  }
  // Resolution/paint are part of the key; sharing must not merge distinct art.
  {
    const h = host(afterCode);
    const a = h.call(kind, 1, kind === 'boss' ? 256 : 'grey');
    const b = h.call(kind, 1, kind === 'boss' ? 1200 : 'violet');
    assert.notEqual(a, b); h.finish(); const [one, two] = await Promise.all([a, b]);
    assert.notEqual(one, two); cases++;
  }
}

// Pixel comparisons use original assets and the unchanged real compositors.
const require = createRequire(import.meta.url);
const nativePath = process.env.CRYPTOID_NATIVE_CANVAS_MODULE
  || (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/@napi-rs/canvas' : '@napi-rs/canvas');
const { createCanvas, Image: NativeImage } = require(nativePath);
function native(code) {
  const surfaces = [];
  const document = { createElement() {
    const canvas = createCanvas(300, 150); canvas.dataset = {};
    for (const key of ['width', 'height']) {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(canvas), key);
      let logical = key === 'width' ? 300 : 150;
      Object.defineProperty(canvas, key, { get: () => logical, set(value) { logical = value; descriptor.set.call(canvas, Math.max(1, value)); } });
    }
    surfaces.push(canvas); return canvas;
  } };
  class Image extends NativeImage { set src(value) { super.src = fs.readFileSync(root + 'public' + value); } }
  return { api: execute(code, { document, Image }), surfaces };
}
const a = native(beforeCode), b = native(afterCode); let pixels = 0;
function equal(expected, actual, label) {
  assert.equal(actual.width, expected.width, label + ' width'); assert.equal(actual.height, expected.height, label + ' height');
  assert.deepEqual({ ...actual.dataset }, { ...expected.dataset }, label + ' metadata');
  const data = canvas => Buffer.from(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data);
  assert.ok(data(expected).equals(data(actual)), label + ' exact RGBA'); pixels++;
  for (const h of [a, b]) for (const canvas of h.surfaces.splice(0)) canvas.width = canvas.height = 0;
}
for (let id = 1; id <= 50; id++) equal(await a.api.loadBossArtwork(id), await b.api.loadBossArtwork(id), 'boss ' + id);
const ships = fs.readdirSync(root + 'public/ships/evolution').filter(name => /^ship_\d+_stage_[123]\.png$/.test(name));
assert.equal(ships.length, 60);
for (const name of ships) equal(await a.api.loadShipArtwork('/ships/evolution/' + name), await b.api.loadShipArtwork('/ships/evolution/' + name), name);
console.log(JSON.stringify({ baseline, controlledCases: cases, cases: results, exactRgbaComparisons: pixels,
  limits: 'Actual source under controlled delayed-image/failure hosts and native CPU raster; no iPhone/WebKit/process-memory, permanent-leak or Whitescreen-cause proof.' }, null, 2));
