import test from 'node:test';
import assert from 'node:assert/strict';
import { compareDynamicSnapshots } from './validation.mjs';
function fixture(firing = false) {
  const expected = { thrust: '15px', canonicalThrust: '15px', charge: .4, firing };
  const c = { canonicalMarkup: '<original-art>', rootThrust: '15px', svgCharge: '0.4', firing,
    engines: [{ inlineHeight: '', computedHeight: '15px' }],
    lights: ['boss-special-conductor', 'boss-special-muzzle'].map(kind => ({ kind, inlineOpacity: '',
      native: { opacity: String(firing && kind.endsWith('muzzle') ? 1 : .55), fill: '#fff', stroke: '#123' } })) };
  const l = structuredClone(c); l.rootThrust = ''; l.svgCharge = ''; l.engines[0].inlineHeight = '15px';
  l.lights.forEach(r => r.inlineOpacity = r.native.opacity);
  return { c, l, expected };
}
test('native equality still requires current direct consumer values, original markup and firing class', () => {
  for (const firing of [false, true]) {
    const { c, l, expected } = fixture(firing);
    assert.deepEqual(compareDynamicSnapshots(c, l, expected), { engines: 1, lights: 2 });
    for (const change of [
      r => r.canonicalMarkup += 'changed-path', r => r.engines[0].computedHeight = '14px',
      r => r.engines[0].inlineHeight = '14px', r => r.lights[0].inlineOpacity = '.25',
      r => r.lights[0].native.stroke = '#000', r => r.lights[1].native.opacity = '.25',
      r => r.lights.pop(), r => r.rootThrust = '15px', r => r.svgCharge = '.4', r => r.firing = !firing,
    ]) {
      const broken = structuredClone(l); change(broken); assert.throws(() => compareDynamicSnapshots(c, broken, expected));
    }
  }
});
test('the real Chromium CSSOM rounding can pass only with exact current canonical input AND exact native height', () => {
  const { c, l, expected } = fixture();
  expected.thrust = '29.29525px'; expected.canonicalThrust = '29.2952px';
  c.rootThrust = expected.thrust; c.engines[0].computedHeight = '29.2812px';
  l.engines[0] = { inlineHeight: '29.2952px', computedHeight: '29.2812px' };
  assert.deepEqual(compareDynamicSnapshots(c, l, expected), { engines: 1, lights: 2 });
  l.engines[0].computedHeight = '29.2813px';
  assert.throws(() => compareDynamicSnapshots(c, l, expected), /Exactly equal native heights/);
  l.engines[0].computedHeight = '29.2812px'; l.engines[0].inlineHeight = '29.2951px';
  assert.throws(() => compareDynamicSnapshots(c, l, expected), /current nested model/);
  l.engines[0].inlineHeight = '29.2952px'; delete expected.canonicalThrust;
  assert.throws(() => compareDynamicSnapshots(c, l, expected));
});
test('matching stale native values cannot conceal a context update failure; fall and absence cannot acquire consumers', () => {
  const { c, l, expected } = fixture();
  c.lights[0].native.opacity = l.lights[0].native.opacity = '.25'; l.lights[0].inlineOpacity = '.25';
  assert.throws(() => compareDynamicSnapshots(c, l, expected), /every changed charge/);
  for (const kind of ['falling', 'absent']) {
    const c = { canonicalMarkup: '<same>', engines: [], lights: [] }, l = structuredClone(c);
    assert.deepEqual(compareDynamicSnapshots(c, l, { [kind]: true }), { engines: 0, lights: 0 });
    l.lights.push({}); assert.throws(() => compareDynamicSnapshots(c, l, { [kind]: true }));
  }
});
