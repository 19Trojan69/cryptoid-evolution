import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { pausedSceneProbe, conditions, pairs } from './sceneProbe.mjs';
import { captureStyleTimeline, summarizeTimeline, maxEvents } from './timeline.mjs';
function fixture(firing = false) {
  const calls = [], marks = []; let reads = 0;
  class Element {
    constructor(name, classes, style = null) {
      this.name = name; this.attrs = new Map([['class', classes]]); this.props = new Map();
      if (style !== null) this.setAttribute('style', style);
      this.style = { setProperty: (key, value) => {
        calls.push({ node: name, key, value, firing: svg.classList.contains('boss-special-weapon-firing') });
        this.props.set(key, value); this.attrs.set('style', [...this.props].map(([k, v]) => k + ':' + v).join(';'));
      }, removeProperty: key => { const prior = this.props.get(key) || ''; this.props.delete(key);
        this.attrs.set('style', [...this.props].map(([k, v]) => k + ':' + v).join(';')); return prior; } };
      this.classList = { contains: name => (this.attrs.get('class') || '').split(' ').includes(name),
        toggle: (name, yes) => { const all = (this.attrs.get('class') || '').split(' ').filter(s => s && s !== name);
          if (yes) all.push(name); this.attrs.set('class', all.join(' ')); } };
    }
    getAttribute(key) { return this.attrs.get(key) ?? null; }
    setAttribute(key, value) { this.attrs.set(key, value); if (key === 'style') this.props = new Map(value.split(';').filter(Boolean).map(s => {
      const i = s.indexOf(':'); return [s.slice(0, i).trim(), s.slice(i + 1).trim()]; })); }
    removeAttribute(key) { this.attrs.delete(key); if (key === 'style') this.props = new Map(); }
  }
  const root = new Element('root', 'sector-boss', '--boss-thrust:15px;left:3px');
  const svg = new Element('svg', 'boss-special-weapon' + (firing ? ' boss-special-weapon-firing' : ''), '--weapon-charge:0.2;left:5px');
  const engines = [new Element('e1', 'boss-engine-flame', 'left:1px'), new Element('e2', 'boss-engine-flame')];
  const lights = [new Element('conductor', 'boss-special-conductor'), new Element('muzzle', 'boss-special-muzzle', 'stroke:red')];
  const nodes = [root, svg, ...engines, ...lights], animations = [{ startTime: 100, playbackRate: 1 }];
  root.getAnimations = () => animations;
  root.querySelector = selector => selector === '.boss-special-weapon' ? svg : null;
  root.querySelectorAll = selector => selector === '.boss-engine-flame' ? engines : [];
  svg.querySelectorAll = () => lights;
  const original = () => nodes.map(n => [...n.attrs]); const before = original();
  const state = { status: 'paused', technicalPause: false, coreVolley: 1 };
  const host = { document: { hidden: false, querySelector: selector => selector === '.sector-boss' ? root : null },
    __crossDeviceTest: { inspect: () => state }, performance: { mark: name => marks.push(name) }, throwAfter: Infinity,
    getComputedStyle: n => {
      if (++reads > host.throwAfter) throw Error('Synthetic native-read failure');
      if (engines.includes(n)) return { height: n.props.get('height') || root.props.get('--boss-thrust') };
      const flash = svg.classList.contains('boss-special-weapon-firing') && n.classList.contains('boss-special-muzzle');
      return { opacity: String(flash ? 1 : n.props.has('opacity') ? Number(n.props.get('opacity')) : .25 + Number(svg.props.get('--weapon-charge')) * .75) };
    } };
  return { host, calls, marks, before, original, state };
}
const args = condition => ({ condition, pairs, prefix: `cryptoid-recalc-r1-${condition}-`, firingFidelity: true });
test('actual paused scene function preserves outputs across four scopes, firing overrides, exact attributes and native animations', () => {
  for (const firing of [false, true]) {
    const h = fixture(firing), outputs = conditions.map(c => pausedSceneProbe(args(c), h.host));
    for (const row of outputs) {
      assert.deepEqual(row.outputs, outputs[0].outputs); assert.equal(row.firingFidelityCases, 10);
      assert.equal(row.sameNativeAnimationsStartsAndRates, true); assert.equal(row.appOrAnimationClocksWritten, false);
    }
    assert.deepEqual(h.original(), h.before); assert.equal(h.state.status, 'paused');
    assert.ok(h.calls.filter(c => c.node === 'muzzle' && c.key === 'opacity' && c.firing).every(c => c.value === '1'));
    assert.ok(h.calls.every(c => ['--boss-thrust', '--weapon-charge', 'height', 'opacity'].includes(c.key)));
  }
});
test('a failed native read restores the exact original scene; active/hidden or unbounded input cannot start the mutation', () => {
  const h = fixture(); h.host.throwAfter = 25;
  assert.throws(() => pausedSceneProbe(args('both-local'), h.host), /native-read failure/); assert.deepEqual(h.original(), h.before);
  for (const change of [h => h.state.status = 'playing', h => h.host.document.hidden = true]) {
    const h = fixture(); change(h); assert.throws(() => pausedSceneProbe(args('root'), h.host)); assert.deepEqual(h.calls, []);
  }
  assert.throws(() => pausedSceneProbe({ ...args('root'), pairs: pairs.slice(1) }, fixture().host));
});
const prefix = 'cryptoid-recalc-r1-root-', frameId = 'frame-fixture';
function nativeEvents() {
  const rows = [{ ph: 'M', name: 'process_name', pid: 7, args: { name: 'Renderer' } },
    { ph: 'X', name: 'UpdateLayoutTree', pid: 7, ts: 0, dur: 0, args: { beginData: { frame: frameId }, elementCount: 1 } }];
  for (let i = 0; i < 16; i++) rows.push(
    { ph: 'R', name: prefix + i + ':start', pid: 7, ts: 10 * i + 1 },
    { ph: 'X', name: 'UpdateLayoutTree', pid: 7, ts: 10 * i + 2, dur: 3, args: { beginData: { frame: frameId }, elementCount: 3 } },
    { ph: 'R', name: prefix + i + ':end', pid: 7, ts: 10 * i + 7 });
  return rows;
}
test('native calculation counts are assigned only to exact owned mark intervals in the observed frame', () => {
  const s = summarizeTimeline(nativeEvents(), { prefix, steps: 16, frameId });
  assert.equal(s.totalElementStyleCalculations, 48); assert.equal(s.unassignedSetupRestoreOrOtherStyleEvents, 1);
  assert.ok(s.steps.every(r => r.nativeEvents === 1 && r.elementStyleCalculations === 3));
  for (const mutate of [e => delete e.find(e => e.name === 'UpdateLayoutTree').args.elementCount,
    e => e.find(e => e.name === prefix + '0:start').name = 'foreign',
    e => e.forEach(e => { if (e.args?.beginData) e.args.beginData.frame = 'other'; }),
    e => e.find(e => e.name === 'UpdateLayoutTree').ph = 'B']) {
    const e = nativeEvents(); mutate(e); assert.throws(() => summarizeTimeline(e, { prefix, steps: 16, frameId }));
  }
});
class Session extends EventEmitter {
  calls = []; loss = false; detachFails = false;
  async send(method, params) { this.calls.push({ method, params });
    if (method === 'Tracing.end') this.emit('Tracing.tracingComplete', { dataLossOccurred: this.loss }); return {}; }
  async detach() { if (this.detachFails) throw Error('Synthetic detach failure'); }
}
async function collect(session = new Session(), change = {}) {
  const saved = [];
  const result = await captureStyleTimeline({ session, guard: async () => ({ status: 'paused' }), prefix, frameId,
    run: async () => { session.emit('Tracing.dataCollected', { value: [...Array.from({ length: 10001 }, () => ({ ph: 'X', name: 'other' })), ...nativeEvents()] }); return { steps: 16 }; },
    save: b => saved.push(b), ...change }); return { session, saved, result };
}
test('actual timeline collector requests no memory dumps, filters unrelated events and cleans up native tracing', async () => {
  const s = await collect(); assert.equal(s.result.complete, true); assert.equal(s.result.native.totalElementStyleCalculations, 48);
  assert.deepEqual(s.session.calls.map(c => c.method), ['Tracing.start', 'Tracing.end']);
  assert.equal(s.result.sessionDetached, true); assert.equal(s.result.tracingStopped, true);
  assert.equal(JSON.parse(gunzipSync(s.saved[0])).traceEvents.length, nativeEvents().length);
  assert.equal(s.session.listenerCount('Tracing.dataCollected'), 0); assert.equal(s.session.listenerCount('Tracing.tracingComplete'), 0);
});
test('guard faults, missing native counters, loss, overflow and unconfirmed detach retain failure instead of a style-work benefit', async () => {
  for (const mode of ['guard', 'counter', 'loss', 'budget', 'detach']) {
    const session = new Session(); if (mode === 'loss') session.loss = true; if (mode === 'detach') session.detachFails = true;
    const s = await collect(session, { guard: async () => { if (mode === 'guard') throw Error('not paused'); return {}; },
      run: async () => {
        const e = nativeEvents(); if (mode === 'counter') delete e[3].args.elementCount;
        if (mode === 'budget') e.push(...Array.from({ length: maxEvents }, () => nativeEvents()[0]));
        session.emit('Tracing.dataCollected', { value: e }); return { steps: 16 };
      } });
    assert.equal(s.result.complete, false); assert.equal(s.saved.length, 1); assert.equal(session.listenerCount('Tracing.dataCollected'), 0);
  }
});
test('the first real native trace parses its explicit element counts while its failed restoration remains a failed comparison', () => {
  const c = JSON.parse(gunzipSync(readFileSync(new URL('./evidence/initial-failed-r1.json.gz', import.meta.url))));
  assert.equal(c.complete, false); assert.equal(c.cases.length, 1); assert.equal(c.cases[0].complete, false);
  assert.match(c.failure.message, /Exact original inline attributes restored/); assert.equal(c.normalExitVerified, undefined);
  const events = JSON.parse(gunzipSync(readFileSync(new URL('./evidence/initial-failed-r1-root-timeline.json.gz', import.meta.url)))).traceEvents;
  const partial = summarizeTimeline(events, { prefix: c.cases[0].prefix, steps: 16, frameId: c.frameId });
  assert.equal(partial.totalElementStyleCalculations, 1520); assert.ok(partial.steps.every(r => r.elementStyleCalculations === 95));
  assert.equal(c.performanceOrMemoryBenefitEstablished, false);
});
