import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { localStyleSource, localStyleConfig, localStyleProof } from './transform.mjs';
import { createSectorBoss, BOSS_ENTRY_MS } from '../../frontend/src/pages/sectorBoss.ts';
import { coreInterval } from '../../frontend/src/pages/bossCore.ts';
const root = new URL('../../', import.meta.url).pathname, require = createRequire(root + 'frontend/package.json');
const React = require('react'), server = require('react-dom/server'), { build } = require('esbuild');
const names = ['BossHullView', 'BossReactorView'];
const sources = Object.fromEntries(names.map(name => [name, readFileSync(root + 'frontend/src/pages/' + name + '.tsx', 'utf8')]));
async function load(condition, name) {
  const built = await build({ entryPoints: [root + 'frontend/src/pages/' + name + '.tsx'], bundle: true, platform: 'node',
    format: 'cjs', jsx: 'automatic', write: false, logLevel: 'silent', external: ['react', 'react/jsx-runtime'],
    plugins: [{ name: 'exact-virtual-style-candidate', setup(b) {
      b.onLoad({ filter: /\/Boss(Hull|Reactor)View\.tsx$/ }, args => {
        const n = args.path.split('/').at(-1).slice(0, -4);
        return { contents: localStyleSource(sources[n], n, condition), loader: 'tsx' };
      });
    } }] });
  const scope = { exports: {}, module: { exports: {} }, require }; scope.exports = scope.module.exports;
  vm.runInNewContext(built.outputFiles[0].text, scope); return scope.module.exports.default;
}
const views = Object.fromEntries(await Promise.all(['control', 'leaves'].map(async c => [c, await load(c, 'BossHullView')])));
const render = (condition, props) => server.renderToStaticMarkup(React.createElement(views[condition], props), { identifierPrefix: 'qa' });
function compare(before, after, { firing, charge }) {
  const thrust = /;--boss-thrust:([^";]+)/.exec(before)?.[1];
  const wantedOpacity = .25 + charge * .75;
  let engines = 0, paths = 0;
  const normalized = after.replace(/<i class="boss-engine-flame ship-thruster"[^>]*>/g, tag => {
    engines++; assert.ok(thrust); assert.ok(tag.includes(';height:' + thrust + '"'));
    return tag.replace(';height:' + thrust, '');
  }).replace(/<path[^>]*class="boss-special-(conductor|muzzle)"[^>]*>/g, (tag, kind) => {
    paths++; const opacity = / style="opacity:([^"]+)"/.exec(tag); assert.ok(opacity);
    assert.equal(Number(opacity[1]), firing && kind === 'muzzle' ? 1 : wantedOpacity);
    return tag.replace(opacity[0], '');
  });
  assert.deepEqual(normalized, before.replace(/;--boss-thrust:[^";]+/, '').replace(/;--weapon-charge:[^";]+/, ''));
  return { engines, paths };
}
test('both controls are byte-identical, virtual edits are exactly reversible and mixed diagnostic conditions are rejected', () => {
  for (const name of names) {
    assert.equal(localStyleSource(sources[name], name, 'control'), sources[name]);
    assert.throws(() => localStyleSource(sources[name] + '\n', name, 'leaves'));
    assert.throws(() => localStyleSource(sources[name], name, 'other'));
  }
  const env = { CRYPTOID_LOCAL_STYLE_SCOPE: 'leaves', CRYPTOID_LIFETIME_ATTRIBUTION: '1', CRYPTOID_SOAK_CONDITION: 'original' };
  assert.equal(localStyleConfig({}), null); assert.deepEqual(localStyleConfig(env), { condition: 'leaves', replica: 1, fidelity: false });
  for (const patch of [{ CRYPTOID_THRUST_SCOPE: 'leaf' }, { CRYPTOID_STYLE_WRITE_PROBE: '1' },
    { CRYPTOID_LOCAL_STYLE_REPLICA: '3' }, { CRYPTOID_LOCAL_STYLE_FIDELITY: '1', CRYPTOID_ATTRIBUTION_SECONDS: '1200' }])
    assert.throws(() => localStyleConfig({ ...env, ...patch }));
  assert.equal(localStyleProof(sources, 'leaves').newEffectsOrGlobalListeners, false);
});
test('real React SSR preserves all markup and exact consumer values over 50 bosses, entry/motion states, charge, firing and closed reactors', () => {
  let cases = 0;
  for (let id = 1; id <= 50; id++) for (const [exposed, volley, elapsed] of [
    [false, 0, 0], [true, 0, 0], [true, 0, 450], [true, 0, 1800],
    [true, 1, 0], [true, 1, 90], [true, 1, 179], [true, 1, 180], [true, 1, 18000],
  ]) for (const [thrust, flightElapsed] of [[0, 0], [.15, BOSS_ENTRY_MS - 1], [.75, BOSS_ENTRY_MS], [1, 60000]]) {
    const boss = createSectorBoss(id * 10, 430, 90, 825); boss.elapsed = flightElapsed;
    boss.visualMotion = { thrust }; if (exposed) boss.turrets.forEach(t => t.health = 0);
    boss.core = { elapsed, volley, lastShotColor: volley ? '#e19c52' : undefined };
    const props = { boss, ready: true, light: .25, now: 20000, fallDurationMs: 5000, title: 'Boss' };
    const result = compare(render('control', props), render('leaves', props), {
      firing: exposed && volley > 0 && elapsed < 180, charge: exposed ? Math.min(1, elapsed / coreInterval(boss)) : 0 });
    assert.equal(result.engines, boss.config.engineAnchors.length); assert.ok(result.paths > 0); cases++;
  }
  assert.equal(cases, 1800);
});
test('every absent or falling hull retains its existing complete markup', () => {
  assert.equal(render('control', { boss: null }), render('leaves', { boss: null }));
  for (let id = 1; id <= 50; id++) {
    const boss = createSectorBoss(id * 10, 430, 90, 825);
    const props = { boss: null, fall: { id: 1, x: 20, y: 30, bossShipWidth: 210, bossHeight: 140,
      bossImage: boss.config.image, bossModel: boss, fireSites: boss.config.fireSites, fallDistance: 177 },
    ready: true, light: .2, now: 20000, fallDurationMs: 5123, title: 'Boss' };
    // A falling hull has no reactor or engines, so no consumer is changed.
    assert.equal(render('control', props), render('leaves', props));
  }
});
