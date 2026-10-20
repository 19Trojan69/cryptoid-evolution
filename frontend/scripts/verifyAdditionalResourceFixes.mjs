// Actual baseline/candidate modules in controlled failure and native raster hosts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url).pathname;
const baseline = 'b15306f2d22d2196275091c904d068829879efc7';
const changed = ['bossWeaponRenderer.ts', 'bossWeaponTextures.ts', 'bossArtwork.ts', 'shipArtwork.ts', 'BonusRockLayer.tsx'];
async function compile(before) {
  const source = file => before
    ? execFileSync('git', ['show', `${baseline}:frontend/src/pages/${file}`], { cwd: root, encoding: 'utf8' })
    : fs.readFileSync(root + 'src/pages/' + file, 'utf8');
  const result = await build({ absWorkingDir: root, stdin: { contents: `
export {loadBossArtwork} from './bossArtwork.ts';
export {loadShipArtwork} from './shipArtwork.ts';
export {drawBossWeapons,disposeBossWeapons} from './bossWeaponRenderer.ts';
export {createSectorBoss} from './sectorBoss.ts';
export {preloadBossWeapons} from './bossWeaponTextures.ts';
export {allPlayerColors} from './shipFleet.ts';
export {rockTexture} from './BonusRockLayer.tsx';`, resolveDir: root + 'src/pages', loader: 'ts' },
    bundle: true, write: false, platform: 'node', format: 'cjs', logLevel: 'silent',
    plugins: [{ name: 'versions', setup(builder) {
      builder.onLoad({ filter: /\/(bossWeaponRenderer|bossWeaponTextures|bossArtwork|shipArtwork|BonusRockLayer)\.tsx?$/ }, args => {
        const name = args.path.split('/').at(-1); assert.ok(changed.includes(name));
        let contents = source(name);
        if (name === 'BonusRockLayer.tsx') contents = contents.slice(contents.indexOf('const textures ='), contents.indexOf('const BonusRockLayer =')) + '\nexport {rockTexture};';
        return { contents, loader: 'ts' };
      });
    } }] });
  return result.outputFiles[0].text;
}
const [beforeCode, afterCode] = await Promise.all([compile(true), compile(false)]);
function execute(code, globals) {
  const scope = { module: { exports: {} }, exports: {}, console, ...globals };
  scope.exports = scope.module.exports; vm.runInNewContext(code, scope); return scope.module.exports;
}
function host(code, initialMode = 'healthy', deferred = false) {
  const h = { surfaces: [], images: [], mode: initialMode, error: Error('controlled raster failure') };
  h.document = { createElement(tag) {
    assert.equal(tag, 'canvas'); const index = h.surfaces.length + 1;
    const c = { width: 300, height: 150, dataset: {}, getContext() {
      if (h.mode === 'base-context-throws' && index === 2 || h.mode === 'rock-context-throws') throw h.error;
      if (h.mode === 'base-null' && index === 2 || h.mode === 'boss-combined-null' && index === 3 ||
          h.mode === 'boss-output-null' && index === 4 || h.mode === 'ship-source-null' && index === 1 ||
          h.mode === 'ship-output-null' && index === 2 || h.mode === 'boss-guns-null' && index === 1 ||
          h.mode === 'rock-null') return null;
      return context;
    } };
    const context = new Proxy({
      setTransform() { if (h.mode === 'base-transform-throws' && index === 2) throw h.error; },
      drawImage(image) {
        assert.ok(image.width * image.height > 0, 'never draw a released surface');
        if (h.mode === 'base-draw-throws' && index === 2 || h.mode === 'boss-output-throws' && index === 4 ||
            h.mode === 'ship-output-throws' && index === 2 || h.mode === 'ship-source-throws' && index === 1) throw h.error;
      },
      getImageData(x, y, w, height) {
        if (h.mode === 'readback-throws') throw h.error;
        const data = new Uint8ClampedArray(w * height * 4); if (h.mode !== 'empty') data.fill(255); return { data };
      },
      createRadialGradient() { if (h.mode === 'rock-paint-throws') throw h.error; return { addColorStop() {} }; },
      createLinearGradient() { return { addColorStop() {} }; },
    }, { get: (target, key) => target[key] ?? (() => {}) });
    h.surfaces.push(c); return c;
  } };
  class Image {
    constructor() { this.width = this.naturalWidth = 64; this.height = this.naturalHeight = 96; h.images.push(this); }
    set src(value) { this.url = value; if (!deferred) queueMicrotask(() => this.onload?.()); }
  }
  h.api = execute(code, { document: h.document, Image });
  h.nonzero = () => h.surfaces.filter(c => c.width * c.height > 0);
  return h;
}
let cases = 0;
const negative = {};
for (const mode of ['base-context-throws', 'base-transform-throws', 'base-draw-throws', 'base-null']) {
  for (const [code, fixed] of [[beforeCode, false], [afterCode, true]]) {
    const h = host(code, mode), main = h.document.createElement('canvas'); main.width = 600; main.height = 1200;
    const boss = h.api.createSectorBoss(70, 430, 96, 825);
    if (mode === 'base-null') assert.equal(h.api.drawBossWeapons(main, boss, { width: 1000, height: 1000 }, true), false);
    else assert.throws(() => h.api.drawBossWeapons(main, boss, { width: 1000, height: 1000 }, true), error => error === h.error);
    if (fixed) {
      assert.ok(h.surfaces.slice(1).every(c => c.width * c.height === 0));
      h.mode = 'healthy'; assert.equal(h.api.drawBossWeapons(main, boss, { width: 1000, height: 1000 }, true), true);
    }
    h.api.disposeBossWeapons(main);
    assert.equal(h.nonzero().length, fixed || mode === 'base-null' ? 0 : 1);
    if (!fixed) negative[mode] = h.nonzero().length;
    cases++;
  }
}
for (const [kind, modes] of [
  ['boss', ['healthy', 'boss-combined-null', 'boss-output-null', 'boss-output-throws', 'readback-throws', 'empty', 'boss-guns-null']],
  ['ship', ['healthy', 'ship-source-null', 'ship-output-null', 'ship-output-throws', 'ship-source-throws', 'readback-throws', 'empty']],
]) for (const mode of modes) {
  for (const [code, fixed] of [[beforeCode, false], [afterCode, true]]) {
    const h = host(code, mode);
    const load = () => kind === 'boss' ? h.api.loadBossArtwork(7, 256) : h.api.loadShipArtwork('/ships/ship_01_stage1.png');
    if (mode === 'healthy' || !fixed && mode === 'boss-guns-null') {
      const output = await load(); assert.ok(output.width * output.height > 0);
      const extras = h.nonzero().filter(c => c !== output);
      assert.equal(extras.length, !fixed && kind === 'boss' && mode === 'healthy' ? 1 : 0);
    } else {
      await assert.rejects(load(), /Canvas unavailable|controlled raster|Empty/);
      if (fixed) {
        assert.equal(h.nonzero().length, 0, kind + ' ' + mode);
        // Rejected entries must be removed so the same artwork can retry.
        h.mode = 'healthy'; const output = await load();
        assert.equal(h.nonzero().length, 1); assert.equal(h.nonzero()[0], output);
      } else assert.ok(h.nonzero().length > 0);
    }
    cases++;
  }
}
for (const mode of ['rock-null', 'rock-context-throws', 'rock-paint-throws']) {
  for (const [code, fixed] of [[beforeCode, false], [afterCode, true]]) {
    const h = host(code, mode);
    if (fixed) {
      assert.equal(h.api.rockTexture(0), null); assert.equal(h.nonzero().length, 0);
      h.mode = 'healthy'; const output = h.api.rockTexture(0); assert.ok(output);
      assert.equal(h.api.rockTexture(7), output, 'healthy texture retained and reused');
      assert.equal(h.nonzero().length, 1);
    } else { assert.throws(() => h.api.rockTexture(0)); assert.equal(h.nonzero().length, 1); }
    cases++;
  }
}
const config = id => ({ id, weaponImage: `/boss-${id}.webp` });
for (const [code, fixed] of [[beforeCode, false], [afterCode, true]]) {
  const h = host(code, 'healthy', true);
  const tasks = [1, 2, 3, 1].map(id => h.api.preloadBossWeapons(config(id)));
  assert.equal(tasks[0] === tasks[3], fixed); assert.equal(h.images.length, fixed ? 3 : 4);
  for (const image of h.images) image.onload(); await Promise.all(tasks);
  const next = h.api.preloadBossWeapons(config(4)); h.images.at(-1).onload(); await next;
  const evicted = h.api.preloadBossWeapons(config(1));
  assert.notEqual(evicted, tasks[0], 'completed cache remains bounded'); h.images.at(-1).onload(); await evicted;
  const failure = h.api.preloadBossWeapons(config(5)); const rejects = assert.rejects(failure, /Boss weapon/);
  h.images.at(-1).onerror(); await rejects;
  const retry = h.api.preloadBossWeapons(config(5)); assert.notEqual(retry, failure);
  h.images.at(-1).onload(); await retry; cases++;
}

// Real input artwork and CPU raster, with the same 1200px boss-card resolution.
const require = createRequire(import.meta.url);
const { createCanvas, Image: NativeImage } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/@napi-rs/canvas');
function native(code) {
  const surfaces = [];
  const document = { createElement() {
    const c = createCanvas(300, 150); c.dataset = {};
    for (const key of ['width', 'height']) {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(c), key);
      let logical = key === 'width' ? 300 : 150;
      Object.defineProperty(c, key, { get: () => logical, set(value) { logical = value; descriptor.set.call(c, Math.max(1, value)); } });
    }
    surfaces.push(c); return c;
  } };
  class Image extends NativeImage { set src(value) { super.src = fs.readFileSync(root + 'public' + value); } }
  return { api: execute(code, { document, Image }), surfaces };
}
const a = native(beforeCode), b = native(afterCode);
let pixels = 0;
function equal(expected, actual, label) {
  assert.equal(actual.width, expected.width, label + ' width'); assert.equal(actual.height, expected.height, label + ' height');
  assert.deepEqual({ ...actual.dataset }, { ...expected.dataset }, label + ' metadata');
  const data = c => Buffer.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data);
  assert.ok(data(expected).equals(data(actual)), label + ' exact RGBA'); pixels++;
}
for (let id = 1; id <= 50; id++) {
  equal(await a.api.loadBossArtwork(id), await b.api.loadBossArtwork(id), 'boss card ' + id);
  // Retire the controlled host's tracked native surfaces between comparisons.
  for (const h of [a, b]) for (const c of h.surfaces.splice(0)) c.width = c.height = 0;
}
const ships = fs.readdirSync(root + 'public/ships/evolution').filter(name => /^ship_\d+_stage_[123]\.png$/.test(name));
assert.equal(ships.length, 60);
for (const name of ships) {
  equal(await a.api.loadShipArtwork('/ships/evolution/' + name), await b.api.loadShipArtwork('/ships/evolution/' + name), name);
  for (const h of [a, b]) for (const c of h.surfaces.splice(0)) c.width = c.height = 0;
}
for (const {id} of a.api.allPlayerColors) {
  equal(await a.api.loadShipArtwork('/ships/evolution/' + ships[0], id), await b.api.loadShipArtwork('/ships/evolution/' + ships[0], id), 'paint ' + id);
  for (const h of [a, b]) for (const c of h.surfaces.splice(0)) c.width = c.height = 0;
}
for (let seed = 0; seed < 7; seed++) equal(a.api.rockTexture(seed), b.api.rockTexture(seed), 'rock ' + seed);
const report = { passed: true, baseline, controlledCasesIncludingNegativeControls: cases,
  baselineUnreleasedBaseSurfaces: negative, bossCards: 50, shipCards: ships.length, paintComparisons: a.api.allPlayerColors.length, rockTextures: 7,
  exactPixelComparisons: pixels,
  limits: 'Controlled Canvas/Image failure injection and native CPU raster. No physical WebKit, audible output, GPU/process memory, permanent leak or Whitescreen-cause proof.' };
if (process.env.CRYPTOID_RESOURCE_FIX_REPORT) fs.writeFileSync(process.env.CRYPTOID_RESOURCE_FIX_REPORT, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
