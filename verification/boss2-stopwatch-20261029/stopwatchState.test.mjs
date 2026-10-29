import test from 'node:test';
import assert from 'node:assert/strict';
import { createStopwatch, formatStopwatch, STOPWATCH_KEY } from './stopwatchState.mjs';
const source = '417cc1b0242d5cb11ca3d2ab826111e542523774';
function host(initial = null) {
  let time = 100, wall = 1793290000000;
  const values = new Map(initial ? [[STOPWATCH_KEY, initial]] : []), writes = [];
  const storage = { getItem: key => values.get(key) ?? null,
    setItem(key, value) { values.set(key, value); writes.push({ key, value }); } };
  const make = () => createStopwatch({ source, storage, now: () => time, wallNow: () => wall });
  const snapshot = (status = 'playing', token = 'a', visible = true, frameAt = time) => ({ status, token, visible, frameAt });
  return { values, writes, storage, make, snapshot, tick(ms, wallMs = ms) { time += ms; wall += wallMs; } };
}
test('real start begins at zero; active monotonic time advances independently of wall-clock corrections', () => {
  const h = host(), clock = h.make();
  clock.observe(h.snapshot('paused')); assert.equal(h.writes.length, 0);
  h.tick(5000); clock.observe(h.snapshot('paused')); assert.equal(clock.view().live.elapsedMs, 0);
  clock.observe(h.snapshot()); h.tick(1000, -10000); clock.observe(h.snapshot());
  assert.equal(clock.view().live.elapsedMs, 1000); assert.equal(clock.view().live.mode, 'running');
});
test('pause freezes time and only later observed gameplay resumes the same run', () => {
  const h = host(), clock = h.make(); clock.observe(h.snapshot());
  h.tick(1200); clock.observe(h.snapshot('paused')); const id = clock.view().latest.id;
  h.tick(10000); clock.observe(h.snapshot('paused')); assert.equal(clock.view().latest.elapsedMs, 1200);
  clock.observe(h.snapshot()); h.tick(1000); clock.observe(h.snapshot());
  assert.equal(clock.view().latest.elapsedMs, 2200); assert.equal(clock.view().latest.id, id);
});
test('duplicate DOM notifications before the next frame neither invent a stall nor lose the active-time anchor', () => {
  const h = host(), clock = h.make(); clock.observe(h.snapshot());
  const frame = h.snapshot().frameAt; h.tick(10); clock.observe(h.snapshot('playing', 'a', true, frame));
  assert.equal(clock.view().live.mode, 'running'); h.tick(990); clock.observe(h.snapshot());
  assert.equal(clock.view().latest.elapsedMs, 1000);
});
test('normal exit keeps the final checkpoint; reopening never adds time while the page was absent', () => {
  const h = host(), clock = h.make(); clock.observe(h.snapshot()); h.tick(1000); clock.observe(h.snapshot());
  clock.observe(null); const saved = h.values.get(STOPWATCH_KEY); h.tick(60000);
  const reopened = h.make(); assert.equal(reopened.view().latest.elapsedMs, 1000);
  assert.equal(reopened.view().latest.mode, 'ended'); assert.equal(reopened.view().live, null);
  assert.equal(h.values.get(STOPWATCH_KEY), saved);
});
test('abrupt process loss recovers the last running checkpoint without requiring a final handler or full recording', () => {
  const h = host(), clock = h.make(); clock.observe(h.snapshot()); h.tick(2000); clock.observe(h.snapshot());
  h.tick(180000); const reopened = h.make();
  assert.equal(reopened.view().latest.elapsedMs, 2000);
  assert.equal(reopened.view().latest.mode, 'running'); assert.equal(reopened.view().live, null);
});
test('unchanged or stale frame heartbeats freeze the stopwatch; a long observer gap is never counted as active play', () => {
  const h = host(), clock = h.make(); clock.observe(h.snapshot()); h.tick(1000);
  clock.observe(h.snapshot()); const frame = h.snapshot().frameAt;
  h.tick(1000); clock.observe(h.snapshot('playing', 'a', true, frame));
  assert.equal(clock.view().latest.elapsedMs, 1000); assert.equal(clock.view().latest.mode, 'stalled');
  h.tick(10000); clock.observe(h.snapshot()); assert.equal(clock.view().latest.elapsedMs, 1000);
  assert.equal(clock.view().latest.unobservedGaps, 1);
  h.tick(1000); clock.observe(h.snapshot()); h.tick(1000); clock.observe(h.snapshot());
  assert.equal(clock.view().latest.elapsedMs, 2000);
});
test('background visibility freezes time, keeps a checkpoint and requires actual playing frames on return', () => {
  const h = host(), clock = h.make(); clock.observe(h.snapshot()); h.tick(500);
  clock.observe(h.snapshot('playing', 'a', false)); assert.equal(clock.view().latest.elapsedMs, 500);
  h.tick(120000); clock.observe(h.snapshot('paused')); assert.equal(clock.view().latest.elapsedMs, 500);
  assert.equal(clock.view().latest.mode, 'paused');
});
test('new preparation leaves the old value intact; starting a new scene keeps one previous run in bounded storage', () => {
  const h = host(), clock = h.make(); clock.observe(h.snapshot()); h.tick(1000); clock.observe(h.snapshot());
  clock.observe(null); const first = clock.view().latest;
  clock.observe(h.snapshot('paused', 'b')); assert.deepEqual(clock.view().latest, first);
  h.tick(1000); clock.observe(h.snapshot('playing', 'b'));
  assert.equal(clock.view().latest.elapsedMs, 0); assert.equal(clock.view().previous.id, first.id);
  for (let i = 0; i < 1000; i++) { h.tick(1000); clock.observe(h.snapshot('playing', 'b')); }
  assert.ok(h.values.get(STOPWATCH_KEY).length < 2048); assert.ok(h.writes.every(w => w.key === STOPWATCH_KEY));
  assert.deepEqual(Object.keys(JSON.parse(h.values.get(STOPWATCH_KEY))).sort(), ['latest', 'previous', 'version']);
});
test('terminal game states freeze the recorded value even if stray later playing snapshots appear', () => {
  for (const status of ['game-over', 'victory', 'destroying']) {
    const h = host(), clock = h.make(); clock.observe(h.snapshot()); h.tick(1000); clock.observe(h.snapshot(status));
    h.tick(1000); clock.observe(h.snapshot()); assert.equal(clock.view().latest.elapsedMs, 1000);
    assert.equal(clock.view().latest.mode, 'ended');
  }
});
test('denied or full storage never interrupts play and exposes the persistence failure', () => {
  const h = host(); h.storage.getItem = () => { throw Error('denied'); };
  h.storage.setItem = () => { throw Error('quota'); };
  const clock = h.make(); assert.equal(clock.view().storageAvailable, false);
  assert.doesNotThrow(() => clock.observe(h.snapshot())); h.tick(1000); clock.observe(h.snapshot());
  assert.equal(clock.view().live.elapsedMs, 1000); assert.equal(clock.view().storageAvailable, false);
});
test('corrupt, oversized or unsupported saved records are ignored without clearing other application storage', () => {
  for (const raw of ['{', 'x'.repeat(2049), '{"version":2}', '{"version":1,"latest":{"elapsedMs":-1}}']) {
    const h = host(raw), clock = h.make(); assert.equal(clock.view().latest, null); assert.equal(h.writes.length, 0);
  }
});
test('display preserves total seconds and switches to hours without wrapping the elapsed time', () => {
  for (const [ms, text] of [[0, '00:00'], [59999, '00:59'], [60000, '01:00'], [3600000, '01:00:00'], [3661000, '01:01:01'], [-1, '00:00'], [NaN, '00:00']])
    assert.equal(formatStopwatch(ms), text);
});
