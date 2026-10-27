import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { build } from 'esbuild';

const before = readFileSync(new URL('../../scripts/fixtures/bonus-rock-display-before-20261023.txt', import.meta.url), 'utf8');
const current = readFileSync(new URL('./BonusRockLayer.tsx', import.meta.url), 'utf8');
const blob = createHash('sha1').update(`blob ${Buffer.byteLength(before)}\0${before}`).digest('hex');
assert.equal(blob, '74ad7118985d768fb56020e69df669e5e64e516f');
async function compile(source) {
  return (await build({ stdin: { contents: source, loader: 'tsx', resolveDir: new URL('.', import.meta.url).pathname },
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', logLevel: 'silent',
    plugins: [{ name: 'controlled-react-lifecycle', setup(builder) {
      builder.onResolve({ filter: /^(react(?:\/jsx-runtime)?|\.\/renderWork)$/ }, args => ({ path: args.path, namespace: 'host' }));
      builder.onLoad({ filter: /.*/, namespace: 'host' }, args => ({ loader: 'js', contents: args.path === './renderWork'
        ? 'export const beginRockPaint=()=>undefined,endRockPaint=()=>{};'
        : 'export const memo=f=>f,useRef=v=>__hooks.ref(v),useEffect=(f,d)=>__hooks.effect(f,d),jsx=(t,p)=>({type:t,props:p});' }));
    } }] })).outputFiles[0].text;
}
// Density is an intentional new default. Compare the old drawing/lifetime at
// that same density; the immutable fixture above still exposes its display bug.
const reference = before.replace('Math.min(1.5,window.devicePixelRatio||1)', 'Math.min(1,window.devicePixelRatio||1)');
assert.notEqual(reference, before);
const [beforeCode, currentCode] = await Promise.all([compile(reference), compile(current)]);
function host(code = currentCode, dpr = 3) {
  let now = 0, refIndex = 0, effectIndex = 0, timerId = 0, queue = [], previousStyle = {}, previousAttributes = {};
  let mainContextAvailable = true, currentProps, width = 300, height = 150;
  const refs = [], slots = [], timers = new Map(), calls = [], draws = [], styles = {}, styleWrites = [], resizes = [];
  const style = new Proxy(styles, { set(target, key, value) { styleWrites.push([key, value]); target[key] = value; return true; } });
  const context = main => new Proxy({
    createRadialGradient() { return { addColorStop() {} }; },
    drawImage(image, ...args) {
      if (!main) return;
      draws.push({ width, height, css: [style.width, style.height], field: [currentProps.width, currentProps.height] });
      calls.push(['drawImage', image.width, image.height, ...args]);
    },
  }, { get(target, key) { return target[key] ?? ((...args) => { if (main) calls.push([key, ...args]); }); } });
  const mainContext = context(true);
  const main = { style,
    get width() { return width; }, set width(value) { width = value; resizes.push(['width', value]); },
    get height() { return height; }, set height(value) { height = value; resizes.push(['height', value]); },
    getContext() { return mainContextAvailable ? mainContext : null; },
  };
  const hooks = {
    ref(value) { const index = refIndex++; return refs[index] ??= { current: index === 0 ? main : value }; },
    effect(fn, deps) {
      const index = effectIndex++, previous = slots[index];
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) queue.push(() => {
        previous?.cleanup?.(); slots[index] = { deps, cleanup: fn() };
      });
    },
  };
  const scope = { module: { exports: {} }, __hooks: hooks, performance: { now: () => now },
    document: { createElement() { const c = { width: 300, height: 150, style: {} }; const g = context(false); c.getContext = () => g; return c; } },
    window: { devicePixelRatio: dpr, setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); } },
  };
  scope.exports = scope.module.exports; vm.runInNewContext(code, scope);
  return { main, calls, draws, timers, styleWrites, resizes,
    contextAvailable(value) { mainContextAvailable = value; },
    render(props, time = now) {
      now = time; currentProps = props; refIndex = effectIndex = 0; queue = [];
      const element = scope.module.exports.default(props), nextStyle = element.props.style;
      for (const [key, value] of Object.entries(nextStyle)) if (previousStyle[key] !== value) {
        style[key] = typeof value === 'number' && key !== 'zIndex' ? `${value}px` : value;
      }
      previousStyle = nextStyle;
      for (const key of ['width', 'height']) if (previousAttributes[key] !== element.props[key]) main[key] = element.props[key];
      previousAttributes = element.props;
      for (const fn of queue) fn();
    },
    warm() { let count = 0; while (timers.size) { assert.ok(++count <= 7); const [id, fn] = timers.entries().next().value; timers.delete(id); fn(); } return count; },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
  };
}
const empty = (width = 430, height = 825) => ({ width, height, rocks: [], effects: [] });
const rock = { id: 1, x: 160, y: 240, radius: 25, rotation: .4, seed: 2, hitMs: 110 };
const active = (width = 430, height = 825) => ({ ...empty(width, height), rocks: [{ ...rock }] });
const compact = h => { assert.deepEqual([h.main.width, h.main.height], [1, 1]); assert.deepEqual([h.main.style.width, h.main.style.height], ['1px', '1px']); };
function fullBeforeEveryDraw(h) {
  assert.ok(h.draws.length > 0);
  for (const draw of h.draws) {
    assert.deepEqual(draw.css, ['100%', '100%']);
    assert.deepEqual([draw.width, draw.height], draw.field.map(v => Math.round(v)));
  }
}

test('an initially empty canvas has one-pixel display bounds; the preceding source exposes the defect', () => {
  const original = host(beforeCode), fixed = host();
  original.render(empty(), 0); fixed.render(empty(), 0);
  assert.deepEqual([original.main.width, original.main.height], [1, 1]);
  assert.throws(() => compact(original)); compact(fixed);
  assert.equal(fixed.draws.length, 0); assert.equal(fixed.timers.size, original.timers.size); assert.equal(fixed.timers.size, 1);
  assert.equal(fixed.warm(), 7); fixed.unmount(); original.unmount();
});
test('first active drawing restores the full display and new standard raster before painting', () => {
  const original = host(beforeCode), fixed = host();
  original.render(empty()); fixed.render(empty()); original.render(active(), 100); fixed.render(active(), 100);
  fullBeforeEveryDraw(fixed); assert.deepEqual(fixed.calls, original.calls);
  assert.deepEqual([fixed.main.width, fixed.main.height], [430, 825]);
  original.unmount(); fixed.unmount();
});
test('short empty gaps retain warm bounds and the existing two-second grace is exact', () => {
  const fixed = host(), original = host(beforeCode);
  for (const h of [fixed, original]) {
    h.render(active(), 0); h.render(empty(), 100); h.render(empty(), 2099);
    assert.deepEqual([h.main.width, h.main.height], [430, 825]);
    assert.deepEqual([h.main.style.width, h.main.style.height], ['100%', '100%']);
    h.render(empty(), 2100);
  }
  compact(fixed); assert.throws(() => compact(original));
  fixed.unmount(); original.unmount();
});
test('regrowth after idle release uses a changed field size on its first visible frame', () => {
  const h = host(); h.render(active(), 0); h.render(empty(), 10); h.render(empty(), 2010); compact(h);
  h.draws.length = 0; h.render(active(820, 900), 2020); fullBeforeEveryDraw(h);
  assert.deepEqual([h.main.width, h.main.height], [820, 900]); h.unmount();
});
test('effect-only dust, debris and points keep the original complete draw operations', () => {
  const original = host(beforeCode), fixed = host();
  original.render(empty()); fixed.render(empty());
  for (const age of [0, 90, 240, 500, 740]) {
    const props = { ...empty(), effects: [{ id: 2, x: 190, y: 360, radius: 25, seed: 3, age, points: 25, final: true }] };
    original.render(props, age + 10); fixed.render(props, age + 10);
  }
  fullBeforeEveryDraw(fixed); assert.deepEqual(fixed.calls, original.calls);
  original.unmount(); fixed.unmount();
});
test('stable active and released scenes add no repeated display-size writes or canvas resizes', () => {
  const h = host(); h.render(active(), 0); h.styleWrites.length = h.resizes.length = 0;
  for (let time = 1; time <= 100; time++) h.render(active(), time);
  assert.deepEqual(h.styleWrites, []); assert.deepEqual(h.resizes, []);
  h.render(empty(), 110); h.render(empty(), 2110); compact(h); h.styleWrites.length = h.resizes.length = 0;
  for (let time = 2111; time <= 2210; time++) h.render(empty(), time);
  assert.deepEqual(h.styleWrites, []); assert.deepEqual(h.resizes, []); h.unmount();
});
test('paused/no-update gaps add no release timer; the next existing update releases display bounds', () => {
  const h = host(); h.render(active(), 0); h.render(empty(), 50); h.warm();
  assert.equal(h.timers.size, 0); assert.deepEqual([h.main.style.width, h.main.style.height], ['100%', '100%']);
  h.render(empty(320, 700), 10000); compact(h); assert.equal(h.timers.size, 0); h.unmount();
});
test('an unavailable main context can recover and unmount still clears the original prewarm timer and surface', () => {
  const h = host(); h.contextAvailable(false); h.render(active(), 0); assert.equal(h.draws.length, 0);
  h.contextAvailable(true); h.render(active(), 10); fullBeforeEveryDraw(h);
  assert.equal(h.timers.size, 1); h.unmount(); assert.equal(h.timers.size, 0);
  assert.deepEqual([h.main.width, h.main.height], [0, 0]);
});
