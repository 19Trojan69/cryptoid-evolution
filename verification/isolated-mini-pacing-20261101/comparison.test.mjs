import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { comparisonConfig, comparisonCss, comparisonProof, assertPathProof } from './comparison.mjs';
import { installNativePathProbe } from './nativePathProbe.mjs';
import { restoreBossMiniPacing } from '../boss2-mini-start-control-20261101/miniStartControl.mjs';
const source = readFileSync(new URL('../../frontend/src/lib/cssFramePacing.ts', import.meta.url), 'utf8');
test('full original control is byte-identical; bypass is exactly the existing two reversible guards', () => {
  assert.equal(comparisonCss(source, 'control'), source);
  assert.equal(restoreBossMiniPacing(comparisonCss(source, 'bypass')), source);
  assert.throws(() => comparisonCss(source + '\n', 'bypass'));
  const proof = comparisonProof(source, 'bypass');
  assert.equal(proof.originalMiniMarkupAndCompletionRetained, true);
  assert.equal(proof.allEarlierVisualControlsOff, true);
  assert.equal(proof.gameClocksChanged, false);
});
test('no flag preserves old paths; isolated runs reject inherited controls and ambiguous conditions', () => {
  assert.equal(comparisonConfig({}), null);
  const env = { CRYPTOID_ISOLATED_MINI_PACING: 'bypass', CRYPTOID_LIFETIME_ATTRIBUTION: '1', CRYPTOID_SOAK_CONDITION: 'original' };
  assert.deepEqual(comparisonConfig(env), { condition: 'bypass', replica: 1, pathProof: false });
  for (const patch of [{ CRYPTOID_FLAT_SCENE: '0' }, { CRYPTOID_BOSS_MINI_INSPECTION_OFF: '0' },
    { CRYPTOID_CANVAS_EFFECTS_OFF: '1' }, { CRYPTOID_ISOLATED_REPLICA: '3' },
    { CRYPTOID_LIFETIME_ATTRIBUTION: '0' }, { CRYPTOID_ISOLATED_MINI_PACING: 'other' },
    { CRYPTOID_SOAK_CONDITION: 'mini-start' }]) assert.throws(() => comparisonConfig({ ...env, ...patch }));
});
test('a bypass is only verified with positive authored events and other paths, zero actual mini start/timing calls', () => {
  const proof = { miniStartEvents: 7, miniEndEvents: 6, miniQueriesTotal: 5, miniQueriesAtStart: 0,
    miniTimingUpdates: 0, otherTimingUpdates: 8 };
  assertPathProof(proof, 'bypass'); assert.throws(() => assertPathProof(proof, 'control'));
  assertPathProof({ ...proof, miniQueriesAtStart: 2, miniTimingUpdates: 4 }, 'control');
  for (const patch of [{ miniStartEvents: 0 }, { miniEndEvents: 0 }, { otherTimingUpdates: 0 },
    { miniQueriesAtStart: 1 }, { miniTimingUpdates: 1 }, { miniStartEvents: '7' }])
    assert.throws(() => assertPathProof({ ...proof, ...patch }, 'bypass'));
});
test('actual short probe counts start and completion separately, preserves calls/results and removes wrapped listeners', () => {
  class Host {
    listeners = new Map();
    addEventListener(type, callback) { const list = this.listeners.get(type) || []; if (!list.includes(callback)) list.push(callback); this.listeners.set(type, list); }
    removeEventListener(type, callback) { this.listeners.set(type, (this.listeners.get(type) || []).filter(x => x !== callback)); }
    dispatch(type, target) { for (const listener of this.listeners.get(type) || []) listener.call(this, { target }); }
  }
  let nativeQueries = 0, nativeWrites = 0;
  class Element extends Host {
    constructor(isMini = false) { super(); this.isMini = isMini; }
    closest() { return this.isMini ? this : null; }
    getAnimations(...args) { nativeQueries++; assert.deepEqual(args, [{ subtree: true }]); return ['native-result']; }
  }
  class Effect { constructor(target) { this.target = target; } updateTiming(value) { nativeWrites++; return value; } }
  const body = new Element(), document = new Host(); document.body = body;
  const context = { EventTarget: Host, Element, KeyframeEffect: Effect, document, window: {},
    setTimeout: () => assert.fail('probe timer'), requestAnimationFrame: () => assert.fail('probe RAF') };
  vm.runInNewContext('(' + installNativePathProbe.toString() + ')()', context);
  const mini = new Element(true), effect = new Effect(mini), value = { easing: 'native' };
  function start() { assert.equal(this, body); assert.deepEqual(mini.getAnimations({ subtree: true }), ['native-result']); assert.equal(effect.updateTiming(value), value); }
  body.addEventListener('animationstart', start, true); body.addEventListener('animationstart', start, true);
  document.dispatch('animationstart', mini); body.dispatch('animationstart', mini);
  mini.getAnimations({ subtree: true }); document.dispatch('animationend', mini);
  new Effect(body).updateTiming(value);
  body.removeEventListener('animationstart', start, true); body.dispatch('animationstart', mini);
  const proof = JSON.parse(JSON.stringify(context.window.__isolatedMiniNativeProof()));
  assert.deepEqual(proof, { miniStartEvents: 1, miniEndEvents: 1, miniQueriesTotal: 2,
    miniQueriesAtStart: 1, miniTimingUpdates: 1, otherTimingUpdates: 1 });
  assert.equal(nativeQueries, 2); assert.equal(nativeWrites, 2); assert.equal(body.listeners.get('animationstart').length, 0);
  assert.throws(() => vm.runInNewContext('(' + installNativePathProbe.toString() + ')()', context));
});
