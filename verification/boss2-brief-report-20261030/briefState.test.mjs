import test from 'node:test';
import assert from 'node:assert/strict';
import { createStopwatch, STOPWATCH_KEY } from '../boss2-stopwatch-20261029/stopwatchState.mjs';
import { BRIEF_KEY, MAX_EVENTS, MAX_BYTES, createBrief, readBrief, readSavedStopwatch, reportIdentity, shareReportFile } from './briefState.mjs';

const source = 'a'.repeat(40);
const memory = () => { const map = new Map(); return { map, writes: [], getItem(key) { return map.get(key) ?? null; },
  setItem(key, value) { map.set(key, value); this.writes.push({ key, length: value.length }); } }; };
function fixture(storage = memory()) {
  let wall = 100000, tick = 0;
  const brief = createBrief({ storage, source, now: () => wall, documentStartedAt: wall });
  const clock = createStopwatch({ storage, source, now: () => tick, wallNow: () => wall });
  const options = { diagnostics: false, protection: true, scene: 'reactor' };
  const advance = (dt, status = 'playing', token = 'first') => {
    wall += dt; tick += dt;
    const view = clock.observe(token ? { token, status, frameAt: tick, visible: true } : null);
    brief.checkpoint(view.live?.startedAt ? view.live : view.latest, options);
    return view;
  };
  return { storage, brief, advance, now: () => wall };
}

test('recorder-off run exports the real saved clock and keeps the previous run', () => {
  const f = fixture();
  f.advance(1000, 'paused'); assert.equal(f.storage.getItem(BRIEF_KEY), null);
  f.advance(1000); f.advance(1000); f.advance(1000);
  const before = readSavedStopwatch(f.storage); assert.equal(before.displayedTime, '00:02');
  assert.equal(readBrief(f.storage).latest.clock.id, before.latest.id);
  assert.equal(readBrief(f.storage).latest.options.fullRecording, false);
  f.advance(1000, 'paused'); const paused = readSavedStopwatch(f.storage).latest.elapsedMs;
  f.advance(2000, 'paused'); assert.equal(readSavedStopwatch(f.storage).latest.elapsedMs, paused);
  f.advance(1, 'paused', null);
  const ended = readBrief(f.storage).latest; assert.equal(ended.clock.mode, 'ended');
  f.advance(1, 'paused', 'second'); f.advance(1000, 'playing', 'second');
  const next = readBrief(f.storage); assert.notEqual(next.latest.clock.id, ended.clock.id);
  assert.equal(next.previous.clock.id, ended.clock.id);
  assert.equal(readSavedStopwatch(f.storage).previous.id, ended.clock.id);
});
test('bounded events do not become one storage write per contact', () => {
  const f = fixture(); f.advance(1000);
  const before = f.storage.writes.filter(w => w.key === BRIEF_KEY).length;
  for (let i = 0; i < 10000; i++) f.brief.record({ kind: 'pointerdown', contacts: 2, target: 'field', clientX: 22, pressure: .8, pointerId: 99 });
  assert.equal(f.storage.writes.filter(w => w.key === BRIEF_KEY).length, before);
  for (let i = 0; i < 100; i++) { f.advance(1000); for (let j = 0; j < 16; j++) f.brief.record({ kind: 'touchstart', contacts: 2, target: 'field' }); }
  f.brief.flush(true);
  const raw = f.storage.getItem(BRIEF_KEY), data = JSON.parse(raw);
  assert.ok(data.latest.events.length <= MAX_EVENTS); assert.ok(raw.length < MAX_BYTES);
  assert.ok(data.latest.dropped > 9000); assert.doesNotMatch(raw, /clientX|pressure|pointerId/);
});
test('a discarded unsaved tail is not represented as an exact terminal event', () => {
  const f = fixture(); f.advance(1000); f.advance(1000);
  f.brief.record({ kind: 'touchstart', contacts: 2, target: 'field' });
  const restored = readBrief(f.storage);
  assert.equal(restored.latest.events.some(e => e.kind === 'touchstart'), false);
  assert.equal(restored.limits.terminalEventGuaranteed, false);
  assert.equal(readSavedStopwatch(f.storage).exactCrashTime, false);
  const anotherDocument = createBrief({ storage: f.storage, source, now: f.now, documentStartedAt: f.now() + 10 });
  anotherDocument.checkpoint(restored.latest.clock, {});
  assert.deepEqual(anotherDocument.snapshot().latest, restored.latest);
});
test('critical cancellation is flushed, while storage denial never breaks the caller', () => {
  const f = fixture(); f.advance(1000); f.advance(500);
  f.brief.record({ kind: 'pointercancel', contacts: 0, target: 'field' }, true);
  assert.ok(readBrief(f.storage).latest.events.some(e => e.kind === 'pointercancel'));
  const bad = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const g = fixture(bad); assert.doesNotThrow(() => { g.advance(1000); g.brief.record({ kind: 'pagehide' }, true); });
  assert.equal(g.brief.snapshot().storageAvailable, false);
  assert.equal(readSavedStopwatch(bad).storage, 'unavailable'); assert.equal(readBrief(bad).storage, 'unavailable');
});
test('saved data is allowlisted and malformed oversized records are rejected', () => {
  const f = fixture(); f.advance(1000);
  const data = JSON.parse(f.storage.getItem(BRIEF_KEY)); data.latest.secret = 'account';
  data.latest.events.push({ kind: 'touchstart', at: f.now(), elapsedMs: 0, mode: 'running', target: 'field', clientX: 17, pressure: .5 });
  f.storage.setItem(BRIEF_KEY, JSON.stringify(data));
  assert.doesNotMatch(JSON.stringify(readBrief(f.storage)), /clientX|pressure|secret|account/);
  f.storage.setItem(BRIEF_KEY, ' '.repeat(MAX_BYTES + 1)); assert.equal(readBrief(f.storage).storage, 'invalid');
  f.storage.setItem(STOPWATCH_KEY, '{bad'); assert.equal(readSavedStopwatch(f.storage).latest, null);
});
test('report identity and share filename identify the same prepared bytes', async () => {
  const a = reportIdentity({}), b = reportIdentity({}); assert.notEqual(a.reportId, b.reportId);
  assert.equal(a.filename, `cryptoid-diagnose-${a.reportId}.json`);
  const blob = new Blob([JSON.stringify({ reportId: a.reportId })]);
  const host = { File, navigator: { share() {}, canShare: ({ files }) => files[0].type === 'text/plain' } };
  const file = shareReportFile(blob, a.filename, host);
  assert.equal(file.name, a.filename); assert.equal(file.type, 'text/plain');
  assert.equal(await file.text(), await blob.text());
  assert.equal(shareReportFile(blob, a.filename, { File, navigator: {} }), null);
});
