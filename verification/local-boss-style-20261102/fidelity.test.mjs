import test from 'node:test';
import assert from 'node:assert/strict';
import { pausedLocalStyleFidelity, verifyLocalStyleFidelity } from './fidelity.mjs';
function fixture(condition, firing = false) {
  function style(initial = '') {
    let values = new Map(initial.split(';').filter(Boolean).map(s => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; }));
    return new Proxy({ getPropertyValue: k => values.get(k) || '', setProperty: (k, v) => values.set(k, v), removeProperty: k => values.delete(k) }, {
      get(target, k) { if (k === 'cssText') return [...values].map(([k, v]) => k + ':' + v).join(';'); return target[k] ?? values.get(k) ?? ''; },
      set(_target, k, v) { if (k === 'cssText') values = new Map(v.split(';').filter(Boolean).map(s => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; }));
        else values.set(k, v); return true; },
    });
  }
  const element = (classes, css) => ({ style: style(css), classList: { contains: c => classes.split(' ').includes(c) },
    getAttribute: k => k === 'class' ? classes : null });
  const root = element('sector-boss', condition === 'control' ? '--boss-thrust:15px;left:3px' : 'left:3px');
  const svg = element('boss-special-weapon' + (firing ? ' boss-special-weapon-firing' : ''), condition === 'control' ? '--weapon-charge:0.4;left:4px' : 'left:4px');
  const engines = [0, 1].map(() => element('boss-engine-flame', condition === 'control' ? 'left:5px' : 'left:5px;height:15px'));
  const lights = ['boss-special-conductor', 'boss-special-muzzle'].map(c => element(c,
    condition === 'control' ? '' : 'opacity:' + (firing && c.endsWith('muzzle') ? 1 : .55)));
  const nodes = [root, svg, ...engines, ...lights], original = nodes.map(n => n.style.cssText), animation = { startTime: 123, playbackRate: 1 };
  root.querySelector = () => svg; root.querySelectorAll = () => engines; svg.querySelectorAll = () => lights; root.getAnimations = () => [animation];
  let reads = 0; const state = { status: 'paused', technicalPause: false };
  const host = { throwAfter: Infinity, document: { hidden: false, querySelector: () => root }, __crossDeviceTest: { inspect: () => state },
    getComputedStyle(n) { if (++reads > host.throwAfter) throw Error('Synthetic native read failed');
      if (engines.includes(n)) return { height: n.style.height || root.style.getPropertyValue('--boss-thrust') };
      return { opacity: n.style.opacity || String(firing && n.classList.contains('boss-special-muzzle') ? 1 : .25 + .75 * Number(svg.style.getPropertyValue('--weapon-charge'))) };
    } };
  return { host, state, nodes, original };
}
test('the actual paused fidelity function preserves computed values, declarations and native animations in both built directions and firing states', () => {
  for (const condition of ['control', 'leaves']) for (const firing of [false, true]) {
    const f = fixture(condition, firing), proof = pausedLocalStyleFidelity(condition, f.host);
    assert.equal(proof.sameNativeComputedValues, true); assert.equal(proof.sameNativeAnimationsStartsAndRates, true);
    assert.equal(proof.appOrAnimationClocksWritten, false); assert.deepEqual(f.nodes.map(n => n.style.cssText), f.original);
  }
});
test('native read failure restores original declarations; active or hidden scenes cannot be mutated and failed guards cannot evaluate', async () => {
  const f = fixture('control'); f.host.throwAfter = 6;
  assert.throws(() => pausedLocalStyleFidelity('control', f.host), /Synthetic native read failed/);
  assert.deepEqual(f.nodes.map(n => n.style.cssText), f.original);
  for (const change of [f => f.state.status = 'playing', f => f.host.document.hidden = true]) {
    const f = fixture('leaves'); change(f); assert.throws(() => pausedLocalStyleFidelity('leaves', f.host));
    assert.deepEqual(f.nodes.map(n => n.style.cssText), f.original);
  }
  let evaluated = false;
  await assert.rejects(verifyLocalStyleFidelity({ condition: 'leaves', guard: async () => { throw Error('not paused'); },
    page: { evaluate() { evaluated = true; } } }), /not paused/); assert.equal(evaluated, false);
});
