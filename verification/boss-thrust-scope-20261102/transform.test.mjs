import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { thrustSource, restoreThrustScope, thrustConfig, thrustProof } from './transform.mjs';
import { verifyThrustFidelity } from './fidelity.mjs';
import { bossManifest } from '../../frontend/src/pages/bossManifest.ts';
import { BOSS_ENTRY_MS } from '../../frontend/src/pages/sectorBoss.ts';
import * as realism from '../../frontend/src/pages/shipRealism.ts';
const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const React = require('react'), ts = require('typescript'), jsx = require('react/jsx-runtime');
const source = readFileSync(new URL('../../frontend/src/pages/BossHullView.tsx', import.meta.url), 'utf8');
const children = Object.fromEntries(['BossWeaponsView', 'BossReactorView', 'BossHealthView', 'HullDamage'].map(name =>
  [name, { __esModule: true, default: Object.assign(() => null, { displayName: name }) }]));
function load(text) {
  const exports = {};
  const code = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, require: name => {
    if (name === 'react') return React; if (name === 'react/jsx-runtime') return jsx;
    if (name === './sectorBoss') return { BOSS_ENTRY_MS }; if (name === './shipRealism') return realism;
    assert.ok(children[name.slice(2)], name); return children[name.slice(2)];
  } });
  return exports.default.type;
}
const original = load(source), leaf = load(thrustSource(source, 'leaf'));
const clean = value => JSON.parse(JSON.stringify(value, (key, value) =>
  typeof value === 'symbol' ? String(value) : typeof value === 'function' ? value.displayName ?? value.name : value));
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; };
function visit(node, callback) {
  if (Array.isArray(node)) return node.forEach(child => visit(child, callback));
  if (!node?.props) return; callback(node); visit(node.props.children, callback);
}
test('control is byte-identical; only the exact existing expression changes scope and restores completely', () => {
  assert.equal(thrustSource(source, 'control'), source);
  assert.equal(restoreThrustScope(thrustSource(source, 'leaf')), source);
  assert.throws(() => thrustSource(source + '\n', 'leaf')); assert.throws(() => thrustSource(source, 'other'));
  assert.equal(thrustProof(source, 'leaf').newTimersOrFrames, false);
  const css = readFileSync(new URL('../../frontend/src/index.css', import.meta.url), 'utf8');
  assert.equal((css.match(/var\(--boss-thrust[,)]/g) || []).length, 1);
  assert.match(css, /\.sector-boss \.boss-engine-flame[^\n]+height: var\(--boss-thrust, 12px\)/);
});
test('actual original/transformed JSX preserves every other node/prop and exact engine value over all 50 boss geometries and motion/entry/health states', () => {
  let cases = 0;
  for (const config of bossManifest) for (const [thrust, elapsed] of [[undefined, 0], [.15, BOSS_ENTRY_MS - 1], [.75, BOSS_ENTRY_MS], [1, 60000]])
    for (const health of [100, 50, 20]) {
      const model = freeze({ config, x: 213, y: 145, width: 321, height: 321 / config.aspectRatio * config.heightScale,
        health, maxHealth: 100, elapsed, lastDamageAt: -10000,
        visualMotion: thrust === undefined ? undefined : { thrust }, turrets: [], hullFires: [] });
      const props = freeze({ boss: model, ready: true, light: .25, now: 20000, fallDurationMs: 5000, title: 'Boss' });
      const before = clean(original(props)), after = clean(leaf(props)), value = before.props.style['--boss-thrust'];
      assert.equal(after.props.style['--boss-thrust'], undefined); let engines = 0;
      visit(after, node => {
        if (node.props.className !== 'boss-engine-flame ship-thruster') return;
        engines++; assert.equal(node.props.style['--boss-thrust'], value); delete node.props.style['--boss-thrust'];
      });
      assert.equal(engines, config.engineAnchors.length); after.props.style['--boss-thrust'] = value;
      assert.deepEqual(after, before); cases++;
    }
  assert.equal(cases, 600);
});
test('falling and absent boss paths retain their complete existing trees without engine declarations', () => {
  assert.equal(original({ boss: null }), null); assert.equal(leaf({ boss: null }), null);
  for (const config of bossManifest) {
    const props = freeze({ boss: null, fall: { id: 1, x: 20, y: 30, bossShipWidth: 210, bossHeight: 140,
      bossImage: config.image, bossModel: { config }, fireSites: config.fireSites, fallDistance: 177 },
      ready: true, light: .2, now: 20000, fallDurationMs: 5123, title: 'Boss' });
    assert.deepEqual(clean(leaf(props)), clean(original(props)));
  }
});
test('one isolated condition excludes old controls, active observers and long fidelity mutations', () => {
  assert.equal(thrustConfig({}), null);
  const env = { CRYPTOID_THRUST_SCOPE: 'leaf', CRYPTOID_SOAK_CONDITION: 'original', CRYPTOID_LIFETIME_ATTRIBUTION: '1' };
  assert.deepEqual(thrustConfig(env), { condition: 'leaf', replica: 1, fidelity: false });
  for (const patch of [{ CRYPTOID_THRUST_SCOPE: 'other' }, { CRYPTOID_THRUST_REPLICA: '3' },
    { CRYPTOID_STYLE_WRITE_PROBE: '1' }, { CRYPTOID_ISOLATED_MINI_PACING: 'control' },
    { CRYPTOID_BOSS_CONTROL: '0' }, { CRYPTOID_THRUST_FIDELITY: '1', CRYPTOID_ATTRIBUTION_SECONDS: '1200' }])
    assert.throws(() => thrustConfig({ ...env, ...patch }));
});
test('the actual native fidelity check cannot evaluate or mutate an active page', async () => {
  let evaluated = false;
  await assert.rejects(verifyThrustFidelity({ condition: 'leaf', guard: async () => { throw Error('playing'); },
    page: { evaluate() { evaluated = true; } } }), /playing/);
  assert.equal(evaluated, false);
});
