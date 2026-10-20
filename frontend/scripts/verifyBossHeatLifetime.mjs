// Real renderer and original atlases, plus controlled unavailable/throwing
// contexts. This is not a WebKit/iPhone memory or crash-cause measurement.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url).pathname;
const base = 'f34456a11b7faa64365fadd57dbbcd569f4eca28';
const beforeSource = execFileSync('git', ['show', `${base}:frontend/src/pages/bossWeaponRenderer.ts`], { cwd: root, encoding: 'utf8' });
const afterSource = fs.readFileSync(root + 'src/pages/bossWeaponRenderer.ts', 'utf8');
async function runtime(source) {
  const bundle = await build({ absWorkingDir: root, stdin: {
    contents: source + "\nexport {createSectorBoss,moveSectorBoss} from './sectorBoss.ts';",
    resolveDir: root + 'src/pages', loader: 'ts' }, bundle: true, write: false,
    platform: 'node', format: 'cjs', logLevel: 'silent' });
  const scope = { module: { exports: {} }, exports: {}, console };
  scope.exports = scope.module.exports;
  vm.runInNewContext(bundle.outputFiles[0].text, scope);
  return scope.module.exports;
}
const before = await runtime(beforeSource), after = await runtime(afterSource);
function host(mode = 'healthy') {
  const surfaces = [];
  let creations = 0;
  const make = (width, height, main = false) => {
    const context = { depth: 0, draws: 0,
      save() { this.depth++; }, restore() { this.depth--; },
      drawImage(image) { assert.ok(image.width === undefined || image.width * image.height > 0, 'no draw from a released surface'); this.draws++; },
      createLinearGradient() { if (mode === 'throw-paint' && !main && creations > 1) throw Error('controlled raster failure'); return { addColorStop() {} }; },
    };
    const canvas = { width, height, context, getContext() {
      if (!main && mode === 'null-heat' && surfaces[0] !== this) return null;
      if (!main && mode === 'throw-context' && surfaces[0] !== this) throw Error('controlled context failure');
      return new Proxy(context, { get: (target, key) => target[key] ?? (() => {}) });
    } };
    if (!main) { creations++; surfaces.push(canvas); }
    return canvas;
  };
  const main = make(600, 1200, true);
  return { main, make, surfaces };
}
const boss = after.createSectorBoss(70, 430, 96, 825);
boss.turrets = boss.turrets.map(gun => ({ ...gun, health: gun.maxHealth * .5 }));
const image = { width: 1000, height: 1000 };
const attempts = 2000;
function nullCase(runtime, candidate) {
  const h = host('null-heat');
  for (let i = 0; i < attempts; i++) {
    const result = runtime.drawBossWeapons(h.main, boss, image, false, h.make);
    assert.equal(result, !candidate, 'a failed heat draw must not report success');
    assert.equal(h.main.context.depth, 0, 'main Canvas state is balanced on each failed draw');
    if (candidate) assert.ok(h.surfaces.slice(1).every(canvas => canvas.width * canvas.height === 0));
  }
  const awaitingGC = h.surfaces.slice(1).filter(canvas => canvas.width * canvas.height > 0).length;
  assert.equal(awaitingGC, candidate ? 0 : attempts * boss.turrets.length);
  runtime.disposeBossWeapons(h.main);
  assert.equal(h.main.width * h.main.height, 0);
  assert.equal(h.surfaces[0].width * h.surfaces[0].height, 0);
  return { attempts, failedHeatSurfacesNotExplicitlyReleased: awaitingGC };
}
const negativeControl = nullCase(before, false), corrected = nullCase(after, true);
for (const mode of ['throw-context', 'throw-paint']) {
  const h = host(mode);
  assert.throws(() => after.drawBossWeapons(h.main, boss, image, false, h.make), /controlled/);
  assert.equal(h.main.context.depth, 0, 'exception preserves the original exception and balances main state');
  assert.ok(h.surfaces.slice(1).every(canvas => canvas.width * canvas.height === 0));
  after.disposeBossWeapons(h.main);
}
const retry = host('null-heat');
assert.equal(after.drawBossWeapons(retry.main, boss, image, false, retry.make), false);
const ready = host();
assert.equal(after.drawBossWeapons(retry.main, boss, image, false, ready.make), true);
after.disposeBossWeapons(retry.main);
assert.ok([...retry.surfaces, ...ready.surfaces].every(canvas => canvas.width * canvas.height === 0), 'recovery/unmount releases all owned surfaces');

// Native RGBA comparisons cover every original boss, three backing ratios,
// recoil, all heat levels, destruction and frozen output.
const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/@napi-rs/canvas');
function nativeHost() {
  const surfaces = [];
  const make = (width, height) => {
    const canvas = createCanvas(Math.max(1, width), Math.max(1, height));
    for (const key of ['width', 'height']) {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(canvas), key);
      let logical = key === 'width' ? width : height;
      Object.defineProperty(canvas, key, { get: () => logical, set(value) { logical = value; descriptor.set.call(canvas, Math.max(1, value)); } });
    }
    surfaces.push(canvas); return canvas;
  };
  return { make, surfaces };
}
let comparisons = 0;
for (let id = 1; id <= 50; id++) {
  const original = after.moveSectorBoss(after.createSectorBoss(id * 10, 430, 96, 825), 10000, 430, 825);
  const atlas = await loadImage(fs.readFileSync(root + 'public' + original.config.weaponImage));
  for (const ratio of [1, 1.5, 2]) {
    const size = after.weaponCanvasSize(original), a = nativeHost(), b = nativeHost();
    const mainA = a.make(Math.ceil(size.width * ratio), Math.ceil(size.height * ratio));
    const mainB = b.make(mainA.width, mainA.height);
    for (const heat of [0, 1, 2, 3, 4, 5, 6, 7, 8, 'destroyed', 'frozen']) {
      const frame = { ...original, weaponClock: 10050, turrets: original.turrets.map((gun, index) => ({ ...gun,
        health: heat === 'destroyed' ? 0 : gun.maxHealth * (1 - (typeof heat === 'number' ? heat : 0) / 8),
        a: .25 + index * .1, lastFired: 10000, firedBarrels: [0] })) };
      // Heat 8 must still have a live turret to exercise the hottest artwork.
      if (heat === 8) frame.turrets.forEach(gun => { gun.health = gun.maxHealth * .01; });
      assert.equal(before.drawBossWeapons(mainA, frame, atlas, heat === 'frozen', a.make), true);
      assert.equal(after.drawBossWeapons(mainB, frame, atlas, heat === 'frozen', b.make), true);
      const expected = Buffer.from(mainA.getContext('2d').getImageData(0, 0, mainA.width, mainA.height).data);
      const actual = Buffer.from(mainB.getContext('2d').getImageData(0, 0, mainB.width, mainB.height).data);
      assert.ok(expected.equals(actual), `exact RGBA for boss ${id}, ratio ${ratio}, heat ${heat}`);
      comparisons++;
    }
    before.disposeBossWeapons(mainA); after.disposeBossWeapons(mainB);
    assert.ok(b.surfaces.every(canvas => canvas.width * canvas.height === 0));
  }
}
const report = { passed: true, base, negativeControl, corrected, exceptionCases: 2, retryAfterNull: true,
  bosses: 50, backingRatios: [1, 1.5, 2], heatLevels: 9, exactPixelComparisons: comparisons,
  limits: 'Controlled null/exception injection and native CPU raster. Baseline surfaces may be reclaimed by real browser garbage collection; counts show missing explicit release, not permanent device retention. No WebKit/GPU/process memory, physical iPhone FPS or proof of the Whitescreen cause.' };
if (process.env.CRYPTOID_BOSS_HEAT_REPORT) fs.writeFileSync(process.env.CRYPTOID_BOSS_HEAT_REPORT, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
