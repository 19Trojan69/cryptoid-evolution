import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { installStyleWriteProbe } from './styleWriteProbe.mjs';
import { styleProbeConfig, assertStyleProof } from './config.mjs';

function host() {
  const calls = [], reads = [];
  class Style {
    setProperty(...args) {
      calls.push({ receiver: this, args });
      if (args[0] === '--throw') throw Error('original-error');
      if (typeof args[1] === 'object') String(args[1]);
      return args;
    }
    getPropertyValue() { assert.fail('No extra style-value readback'); }
  }
  class HTML {
    constructor(className = 'player-ship') { this.className = className; this.value = new Style(); this.tagName = 'DIV'; }
    get style() { reads.push(this); return this.value; }
    getAttribute(name) { assert.equal(name, 'class'); return this.className; }
  }
  class SVG {
    constructor() { this.value = new Style(); this.tagName = 'svg'; }
    get style() { reads.push(this); return this.value; }
    getAttribute(name) { assert.equal(name, 'class'); return 'boss-special-weapon'; }
  }
  const view = { CSSStyleDeclaration: Style, HTMLElement: HTML, SVGElement: SVG, location: { protocol: 'http:' } };
  const originals = [Style.prototype.setProperty, Object.getOwnPropertyDescriptor(HTML.prototype, 'style'),
    Object.getOwnPropertyDescriptor(SVG.prototype, 'style')];
  vm.runInNewContext('(' + installStyleWriteProbe.toString() + ')(view)', { view,
    setTimeout: () => assert.fail('No timer'), requestAnimationFrame: () => assert.fail('No RAF'),
    document: { querySelectorAll: () => assert.fail('No DOM scan') } });
  return { view, calls, reads, originals, Style, HTML, SVG };
}
const clean = value => JSON.parse(JSON.stringify(value));
test('actual browser function forwards original calls/results, counts only the requested interval and restores all descriptors', () => {
  const s = host(), html = new s.HTML(), svg = new s.SVG();
  html.style.setProperty('--bank', 'outside');
  const probe = s.view.__styleWriteProbe; probe.begin();
  const result = html.style.setProperty('--bank', '2'); assert.deepEqual(result, ['--bank', '2']);
  html.style.setProperty('--bank', '2'); html.style.setProperty('--bank', 2);
  html.style.setProperty('--bank', '3'); html.style.setProperty('--bank', '3', 'important');
  svg.style.setProperty('--weapon-charge', .5); svg.style.setProperty('--weapon-charge', .6);
  html.style.setProperty('color', 'red');
  const proof = clean(probe.finish()); assertStyleProof(proof);
  const bank = proof.groups.find(row => row.property === '--bank');
  assert.deepEqual(bank, { owner: 'div.player-ship', property: '--bank', calls: 5,
    firstObservedArgument: 1, matchingPreviousArgument: 2, differentPreviousArgument: 2, unclassifiedArgument: 0 });
  assert.equal(proof.ignoredNonCustomCalls, 1); assert.equal(proof.groups.some(row => 'value' in row), false);
  assert.equal(s.calls.length, 9); assert.equal(s.calls[1].receiver, html.value); assert.equal(s.reads.length, 9);
  assert.equal(s.Style.prototype.setProperty, s.originals[0]);
  assert.deepEqual(Object.getOwnPropertyDescriptor(s.HTML.prototype, 'style'), s.originals[1]);
  assert.deepEqual(Object.getOwnPropertyDescriptor(s.SVG.prototype, 'style'), s.originals[2]);
  assert.equal(s.view.__styleWriteProbe, undefined); assert.throws(() => probe.begin()); assert.throws(() => probe.finish());
});
test('objects are converted by the native call once, original exceptions survive and unattributed calls are explicit', () => {
  const s = host(), html = new s.HTML(); s.view.__styleWriteProbe.begin();
  let conversions = 0; const value = { toString() { conversions++; return 'native-value'; } };
  const args = html.style.setProperty('--custom', value); assert.equal(args[1], value); assert.equal(conversions, 1);
  new s.Style().setProperty('--unknown-owner', '1');
  assert.throws(() => html.style.setProperty('--throw', 'x'), /original-error/);
  const proof = clean(s.view.__styleWriteProbe.finish());
  assert.equal(proof.groups.find(row => row.property === '--custom').unclassifiedArgument, 1);
  assert.equal(proof.groups.find(row => row.property === '--unknown-owner').owner, 'unclassified-style-owner');
  assert.equal(proof.failedCalls, 1); assert.throws(() => assertStyleProof(proof));
});
test('the observer budget cannot silently truncate a successful observation and cannot alter native work', () => {
  const s = host(); s.view.__styleWriteProbe.begin();
  for (let i = 0; i < 520; i++) new s.HTML('owner-' + i).style.setProperty('--value', String(i));
  const proof = clean(s.view.__styleWriteProbe.finish());
  assert.equal(proof.groups.length, 512); assert.equal(proof.overflow, 8); assert.equal(s.calls.length, 520);
  assert.equal(proof.setPropertyRestored, true); assert.throws(() => assertStyleProof(proof));
});
test('retirement does not overwrite another later prototype change or report it as restored', () => {
  const s = host(); s.view.__styleWriteProbe.begin();
  const later = function() { return 'later'; }; s.Style.prototype.setProperty = later;
  const proof = clean(s.view.__styleWriteProbe.finish());
  assert.equal(s.Style.prototype.setProperty, later); assert.equal(proof.setPropertyRestored, false);
  assert.throws(() => assertStyleProof(proof));
});
test('short-only configuration excludes native dumps, old treatments and long memory comparisons', () => {
  assert.equal(styleProbeConfig({}), false); assert.equal(styleProbeConfig({ CRYPTOID_STYLE_WRITE_PROBE: '0' }), false);
  const env = { CRYPTOID_STYLE_WRITE_PROBE: '1', CRYPTOID_ATTRIBUTION_SECONDS: '60',
    CRYPTOID_LIFETIME_ATTRIBUTION: '1', CRYPTOID_SOAK_CONDITION: 'original' };
  assert.equal(styleProbeConfig(env), true);
  for (const patch of [{ CRYPTOID_STYLE_WRITE_PROBE: 'other' }, { CRYPTOID_ATTRIBUTION_SECONDS: '1200' },
    { CRYPTOID_LIFETIME_ATTRIBUTION: '0' }, { CRYPTOID_SOAK_CONDITION: 'mini-start' },
    { CRYPTOID_INACTIVE_NATIVE_TRACE: '1' }, { CRYPTOID_ISOLATED_MINI_PACING: 'control' }, { CRYPTOID_BOSS_MASK: '0' }])
    assert.throws(() => styleProbeConfig({ ...env, ...patch }));
});
