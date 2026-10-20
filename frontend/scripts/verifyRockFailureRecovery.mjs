// Execute the real BonusRockLayer effects and timers, with controlled hooks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
const root = new URL('../', import.meta.url).pathname;
const baseline = 'b15306f2d22d2196275091c904d068829879efc7';
async function compile(before) {
  const source = before ? execFileSync('git', ['show', `${baseline}:frontend/src/pages/BonusRockLayer.tsx`], { cwd: root, encoding: 'utf8' })
    : fs.readFileSync(root + 'src/pages/BonusRockLayer.tsx', 'utf8');
  return (await build({ stdin: { contents: source, resolveDir: root + 'src/pages', loader: 'tsx' },
    jsx: 'automatic', bundle: true, write: false, format: 'cjs', platform: 'node', logLevel: 'silent',
    plugins: [{ name: 'controlled-effects', setup(builder) {
      builder.onResolve({ filter: /^(react(?:\/jsx-runtime)?|\.\/renderWork)$/ }, args => ({ path: args.path, namespace: 'host' }));
      builder.onLoad({ filter: /.*/, namespace: 'host' }, args => ({ contents: args.path === './renderWork'
        ? 'export const beginRockPaint=()=>undefined,endRockPaint=()=>{};'
        : 'export const memo=f=>f,useRef=v=>__hooks.ref(v),useEffect=(f,d)=>__hooks.effect(f,d),jsx=()=>null;', loader: 'js' }));
    } }] })).outputFiles[0].text;
}
const [beforeCode, afterCode] = await Promise.all([compile(true), compile(false)]);
function component(code, createCanvas) {
  const main = createCanvas(true), refs = [], slots = [], timers = new Map();
  let refIndex = 0, effectIndex = 0, timerId = 0, queue = [];
  const hooks = {
    ref(value) { const index = refIndex++; return refs[index] ??= { current: value === null ? main : value }; },
    effect(fn, deps) {
      const index = effectIndex++, previous = slots[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) queue.push(() => {
        previous?.cleanup?.(); slots[index] = { deps, cleanup: fn() };
      });
    },
  };
  const scope = { module: { exports: {} }, exports: {}, __hooks: hooks,
    document: { createElement: () => createCanvas(false) },
    window: { devicePixelRatio: 1.5, setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); } } };
  scope.exports = scope.module.exports; vm.runInNewContext(code, scope);
  return { main, timers,
    render(props) { refIndex = effectIndex = 0; queue = []; scope.module.exports.default(props); for (const fn of queue) fn(); },
    warm() { let steps = 0; while (timers.size) { assert.ok(++steps <= 7); const [id, fn] = timers.entries().next().value; timers.delete(id); fn(); } return steps; },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
  };
}
const props = age => ({ width: 430, height: 825,
  rocks: [{ x: 120, y: 100, rotation: .4, radius: 24, seed: 1, hitMs: 80 }],
  effects: [{ x: 230, y: 180, radius: 25, seed: 2, final: true, age, points: 120 },
    { x: 180, y: 260, radius: 15, seed: 4, final: false, age, points: 0 }],
});
let cases = 0;
for (const mode of ['null', 'context-throws', 'paint-throws']) {
  for (const [code, fixed] of [[beforeCode, false], [afterCode, true]]) {
    let failure = mode, mainDraws = 0; const surfaces = [];
    const create = main => {
      const c = { width: 300, height: 150, getContext() {
        if (!main && failure === 'null') return null;
        if (!main && failure === 'context-throws') throw Error('controlled context failure');
        return context;
      } };
      const context = new Proxy({ drawImage(image) { assert.ok(image && image.width * image.height > 0); if (main) mainDraws++; },
        createRadialGradient() { if (!main && failure === 'paint-throws') throw Error('controlled paint failure'); return { addColorStop() {} }; },
      }, { get: (target, key) => target[key] ?? (() => {}) });
      if (!main) surfaces.push(c); return c;
    };
    const layer = component(code, create);
    layer.render({ width: 430, height: 825, rocks: [], effects: [] });
    if (!fixed) { assert.throws(() => layer.warm()); assert.equal(surfaces.length, 1); assert.ok(surfaces[0].width > 0); }
    else {
      assert.equal(layer.warm(), 7, 'same bounded prewarm schedule');
      assert.ok(surfaces.every(c => c.width * c.height === 0));
      layer.render(props(125)); assert.equal(mainDraws, 0, 'unavailable images never reach drawImage');
      assert.ok(surfaces.every(c => c.width * c.height === 0));
      failure = '';
      layer.render(props(130)); assert.ok(mainDraws > 0, 'next draw recovers with unchanged texture generation');
    }
    layer.unmount(); assert.equal(layer.timers.size, 0); cases++;
  }
}
{
  const layer = component(afterCode, () => ({ width: 300, height: 150, getContext() { return null; } }));
  layer.render({ width: 430, height: 825, rocks: [], effects: [] });
  assert.equal(layer.timers.size, 1); layer.unmount(); assert.equal(layer.timers.size, 0); cases++;
}
const require = createRequire(import.meta.url);
const { createCanvas } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/@napi-rs/canvas');
const a = component(beforeCode, () => createCanvas(300, 150)), b = component(afterCode, () => createCanvas(300, 150));
let comparisons = 0;
for (const age of [0, 50, 125, 240, 500, 749, 800]) {
  const frame = props(age); a.render(frame); b.render(frame);
  const bytes = layer => Buffer.from(layer.main.getContext('2d').getImageData(0, 0, layer.main.width, layer.main.height).data);
  assert.ok(bytes(a).equals(bytes(b)), 'complete rock/effect layer RGBA at ' + age); comparisons++;
}
a.unmount(); b.unmount();
const report = { passed: true, baseline, controlledLifecycleCases: cases, exactFullLayerPixelComparisons: comparisons,
  limits: 'Actual TSX effect/timer callbacks with controlled hooks and CPU raster. Not physical React/WebKit/process-memory or crash-cause proof.' };
if (process.env.CRYPTOID_ROCK_FIX_REPORT) fs.writeFileSync(process.env.CRYPTOID_ROCK_FIX_REPORT, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
