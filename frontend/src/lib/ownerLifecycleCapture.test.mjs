import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = name => name === 'evidence' ? readFileSync(new URL('./ownerLifecycleEvidence.mjs', import.meta.url), 'utf8').replace('export const ownerLifecycleEvidence', 'window.CryptoidPrivatePreviewEvidence') : readFileSync(new URL('./ownerLifecycleCapture.mjs', import.meta.url), 'utf8').replace("import { ownerLifecycleEvidence as evidence } from './ownerLifecycleEvidence.mjs';", 'const evidence = window.CryptoidPrivatePreviewEvidence;').replace('export function installOwnerLifecycleCapture', 'function installOwnerLifecycleCapture');
function storage() {
  const values = new Map(), reads = [], writes = [];
  return { values, reads, writes, getItem(key) { reads.push(key); return values.get(key) ?? null; },
    setItem(key, value) { writes.push(key); values.set(key, value); } };
}
function host(options = {}) {
  const mutations = [], sizes = [], listeners = new Map(), frames = new Map();
  const row = { clock: 0, requests: 0, root: {}, nodes: [], timeOrigin: options.timeOrigin || 1000 };
  const shell = { paused: 'false', getAttribute() { return this.paused; }, querySelectorAll() { return row.nodes; } };
  const document = { hidden: false, getElementById(id) {
    return id === 'root' ? row.root : id === 'cryptoid-private-preview-identity' ? { textContent: JSON.stringify({ sourceCommit: 'a'.repeat(40) }) } : null;
  }, querySelector() { return shell; }, addEventListener(type, fn) { listeners.set(type, fn); } };
  class MutationObserver { constructor(callback) { this.callback = callback; mutations.push(this); } observe(target, options) { this.target = target; this.options = options; } disconnect() {} }
  class ResizeObserver { constructor(callback) { this.callback = callback; sizes.push(this); } observe() {} disconnect() {} }
  const target = { document, innerWidth: 393, innerHeight: 628, location: { pathname: '/game' },
    sessionStorage: options.session || storage(), localStorage: options.local || storage(),
    performance: { timeOrigin: row.timeOrigin, now: () => row.clock, getEntriesByType: () => [{ type: options.navigationType || 'navigate' }] },
    addEventListener(type, fn) { listeners.set(type, fn); },
    requestAnimationFrame(callback) { assert.equal(this, target); frames.set(++row.requests, callback); return row.requests; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout() { throw Error('extra timer forbidden'); }, setInterval() { throw Error('extra interval forbidden'); } };
  const context = { window: target, document, performance: target.performance, location: target.location, MutationObserver, ResizeObserver };
  runInNewContext(source('evidence') + '\n' + source('lifecycle'), context);
  let authorized = options.authorized !== false;
  const install = () => runInNewContext("installOwnerLifecycleCapture(() => window.authorized, { sourceCommit: 'a'.repeat(40) })", context);
  Object.defineProperty(target, 'authorized', { get: () => authorized });
  const authorize = value => { authorized = value; };
  const deliver = (at, id = [...frames.keys()][0]) => {
    row.clock = at; const callback = frames.get(id); frames.delete(id); return callback.call(target, at);
  };
  const emit = (kind, details = {}) => listeners.get(kind)?.(details);
  const pause = value => { shell.paused = value; mutations.find(m => m.target === shell).callback(); };
  const report = () => JSON.parse(JSON.stringify(target.CryptoidPrivatePreviewEvidence.report(target)));
  return { target, row, frames, document, shell, mutations, sizes, install, deliver, emit, pause, report, authorize };
}

test('installation schedules no RAF/timer and repeated installation does not wrap twice', () => {
  const h = host(); h.install(); const wrapper = h.target.requestAnimationFrame; h.install();
  assert.equal(h.row.requests, 0); assert.equal(h.frames.size, 0); assert.equal(h.target.requestAnimationFrame, wrapper);
  assert.equal(h.report().events.filter(e => e.kind === 'document-start').length, 1);
});
test('native IDs, cancellation, receiver, timestamp, return value and thrown errors are preserved', () => {
  const h = host(); h.install(); let called = 0;
  const first = h.target.requestAnimationFrame(() => called++); h.target.cancelAnimationFrame(first);
  assert.equal(h.frames.size, 0); assert.equal(called, 0);
  const next = h.target.requestAnimationFrame(function(time) { assert.equal(this, h.target); assert.equal(time, 25); return 42; });
  assert.equal(next, 2); assert.equal(h.deliver(25), 42);
  const original = Error('original callback failure'); h.target.requestAnimationFrame(() => { throw original; });
  assert.throws(() => h.deliver(30), error => error === original);
  assert.equal(h.row.requests, 3);
});
test('measured active gap records existing callbacks without pausing or changing their clock', () => {
  const h = host(); h.install(); const times = [];
  h.target.requestAnimationFrame(t => { times.push(t); h.row.clock += 12; }); h.deliver(10);
  h.target.requestAnimationFrame(t => times.push(t)); h.deliver(330);
  h.emit('pagehide', { persisted: false });
  const gap = h.report().events.find(e => e.kind === 'frame-gap');
  assert.equal(gap.frameGapMs, 320); assert.equal(gap.previousCallbackMs, 12); assert.equal(gap.callbackMs, 0);
  assert.equal(h.shell.paused, 'false'); assert.deepEqual(times, [10, 330]); assert.equal(h.row.requests, 2);
});
test('observed pause, visibility and page restoration rearm observation without false active gaps', () => {
  const h = host(); h.install();
  const tick = at => { h.target.requestAnimationFrame(() => {}); h.deliver(at); };
  tick(10); h.pause('true'); h.row.clock = 8000; h.pause('false'); tick(8010);
  h.document.hidden = true; h.emit('visibilitychange'); h.row.clock = 20000;
  h.document.hidden = false; h.emit('visibilitychange'); tick(20010);
  h.emit('pageshow', { persisted: true }); tick(40010);
  h.emit('pagehide', { persisted: true });
  assert.equal(h.report().events.some(e => e.kind === 'frame-gap'), false);
  assert.equal(h.shell.paused, 'false'); assert.equal(h.row.requests, 4);
});
test('denied storage or observation failure never prevents the native callback', () => {
  const h = host();
  const denied = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } };
  h.target.localStorage = denied; h.target.sessionStorage = denied; h.install();
  h.target.performance.now = () => { throw Error('observation only'); };
  h.target.requestAnimationFrame(() => 17); assert.equal(h.deliver(22), 17);
});
test('the next document preserves the preceding document ID; ordinary navigation is not called an OS kill', () => {
  const first = host(); first.install(); first.emit('pagehide', { persisted: false });
  const second = host({ timeOrigin: 5000, navigationType: 'reload', session: first.target.sessionStorage, local: first.target.localStorage }); second.install();
  const boots = second.report().events.filter(e => e.kind === 'document-start');
  assert.equal(boots.length, 2); assert.equal(boots[1].documentStartedAt, 5000); assert.equal(boots[1].previousDocumentStartedAt, 1000);
  assert.equal(boots[1].navigationType, 'reload'); assert.ok(!JSON.stringify(boots).includes('memory'));
});
test('stored events remain bounded and noisy viewport writes are rate limited', () => {
  const h = host(); h.install(); const start = h.target.localStorage.writes.length;
  for (let i = 0; i < 200; i++) { h.row.clock = i; h.sizes[0].callback([{ contentRect: { width: 393, height: 628 + i } }]); }
  assert.equal(h.target.localStorage.writes.length, start);
  h.row.clock = 2000; h.emit('pagehide', { persisted: false });
  assert.equal(h.report().events.length, 48);
  assert.ok(h.target.localStorage.values.get('cryptoid_owner_lifecycle_v1').length < 32768);
});
test('report reading never writes and rejects private/malformed/out-of-range fields', () => {
  const h = host(); const key = h.target.CryptoidPrivatePreviewEvidence.key;
  h.target.localStorage.values.set(key, JSON.stringify({ version: 1, events: [{ kind: 'document-start', at: 100,
    sourceCommit: 'b'.repeat(40), documentStartedAt: 22, username: 'PRIVATE', accessToken: 'PRIVATE', message: 'PRIVATE',
    context: { phase: 'ENTRY', sector: 1, score: 9000, shards: 800, username: 'PRIVATE', browser: 'PRIVATE' } },
    { kind: 'PRIVATE', at: 200 }, { kind: 'frame-gap', at: 200, frameGapMs: -1, enemies: [[1, 2], ['PRIVATE', 3]] }] }));
  const before = h.target.localStorage.writes.length; const r = h.report();
  assert.equal(h.target.localStorage.writes.length, before); assert.equal(h.target.sessionStorage.writes.length, 0);
  assert.equal(r.evidenceSource, 'latest-origin-copy-may-be-another-tab'); assert.equal(r.events.length, 2);
  assert.ok(!JSON.stringify(r).includes('PRIVATE')); assert.ok(!JSON.stringify(r).includes('9000'));
  assert.equal(r.events[1].frameGapMs, undefined);
  const allowed = new Set([key, 'cryptoid_game_diagnostics_v1', 'cryptoid_game_session_v1']);
  assert.ok([...h.target.localStorage.reads, ...h.target.sessionStorage.reads].every(k => allowed.has(k)));
});
test('normal missing evidence and blocked storage are explicit, never fabricated history', () => {
  const h = host(); assert.equal(h.report().evidenceSource, 'absent');
  h.target.sessionStorage.values.set(h.target.CryptoidPrivatePreviewEvidence.key, '{bad');
  const r = h.report(); assert.equal(r.events.length, 0); assert.equal(r.storage.previewTab, 'unavailable-or-invalid');
});

 test('non-owner installation does nothing, revocation stops all observation writes', () => {
  const h = host({ authorized: false }); const original = h.target.requestAnimationFrame;
  h.install(); assert.equal(h.target.requestAnimationFrame, original);
  assert.equal(h.target.localStorage.writes.length, 0);
  h.authorize(true); h.install(); const writes = h.target.localStorage.writes.length;
  h.authorize(false); h.emit('pagehide', { persisted: false }); h.pause('true');
  h.target.requestAnimationFrame(() => 33); assert.equal(h.deliver(3000), 33);
  assert.equal(h.target.localStorage.writes.length, writes);
});
