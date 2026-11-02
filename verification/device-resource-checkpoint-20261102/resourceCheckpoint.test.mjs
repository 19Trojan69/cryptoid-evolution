import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createStopwatch, STOPWATCH_KEY } from '../boss2-stopwatch-20261029/stopwatchState.mjs';
import { BRIEF_KEY, MAX_BYTES, MAX_EVENTS, cleanResourceCheckpoint, createBrief, readBrief } from '../boss2-brief-report-20261030/briefState.mjs';
import { installBriefDiagnostics } from '../boss2-brief-report-20261030/briefBrowser.mjs';

const source = 'a'.repeat(40);
const options = { scene: 'reactor', protection: true, diagnostics: false };
const memory = () => {
  const map = new Map(), writes = [];
  return { map, writes, getItem: key => map.get(key) ?? null,
    setItem(key, value) { map.set(key, value); writes.push({ key, value }); } };
};
const clockRecord = (id = 'run-1') => ({ id, source, startedAt: 100000, updatedAt: 105000,
  elapsedMs: 5000, unobservedGaps: 0, mode: 'running' });
const point = clock => ({ version: 1, clockId: clock.id, at: clock.updatedAt, elapsedMs: clock.elapsedMs,
  frameAt: 5000.5, visible: true, audioState: 'running', audioClockMs: 4921.25,
  audioClockStalls: 0, audioRecoveries: 0, audioBlockedSounds: 0, audioVoices: 4,
  audioBufferBytes: 7100000, canvasRegisteredEffects: 2, canvasCacheBytes: 1059028,
  canvasSurfaceBytes: 2270208, canvasFailureCount: 0 });

test('optional resource data is copied, bounded and tied to the exact saved clock', () => {
  const clock = clockRecord(), input = point(clock);
  input.private = { native: input }; // Neither cycles nor unselected fields are retained.
  const clean = cleanResourceCheckpoint(input, clock);
  assert.equal(clean.audioVoices, 4); input.audioVoices = 999;
  assert.equal(clean.audioVoices, 4); assert.equal(clean.private, undefined);
  assert.ok(JSON.stringify(clean).length < 1024);
  for (const invalid of [null, {}, { ...input, clockId: 'other-run' }, { ...input, version: 2 },
    { ...input, at: clock.startedAt - 1 }, { ...input, at: clock.updatedAt + 1 },
    { ...input, elapsedMs: clock.elapsedMs + 1 }, { ...input, at: Infinity }])
    assert.equal(cleanResourceCheckpoint(invalid, clock), null);
  const unknown = cleanResourceCheckpoint({ ...point(clock), audioState: 'invented', audioVoices: -1,
    audioClockMs: NaN, audioBufferBytes: Number.MAX_SAFE_INTEGER + 1, canvasFailureCount: .5 }, clock);
  for (const key of ['audioState', 'audioVoices', 'audioClockMs', 'audioBufferBytes', 'canvasFailureCount'])
    assert.equal(unknown[key], null, `${key}: unknown is not a measured zero`);
  const throwing = new Proxy({}, { get() { throw Error('optional telemetry unavailable'); } });
  assert.equal(cleanResourceCheckpoint(throwing, clock), null);
});

test('only the newest valid point survives; another document cannot resume or overwrite the old run', () => {
  const storage = memory(); let wall = 105000;
  const brief = createBrief({ storage, source, now: () => wall, documentStartedAt: 99000 });
  const first = clockRecord(); brief.checkpoint(first, options, point(first));
  const next = { ...first, updatedAt: 106000, elapsedMs: 6000 }; wall = next.updatedAt;
  brief.checkpoint(next, options, point(next));
  for (const value of [undefined, point(first), { ...point(next), clockId: 'foreign' }]) {
    wall += 1000; brief.checkpoint({ ...next, updatedAt: wall }, options, value);
    assert.equal(readBrief(storage).latest.resourceCheckpoint.at, next.updatedAt);
  }
  const saved = readBrief(storage).latest, writes = storage.writes.length;
  const afterReload = createBrief({ storage, source, now: () => ++wall, documentStartedAt: wall + 1 });
  afterReload.checkpoint(saved.clock, options, { ...point(saved.clock), audioVoices: 777 });
  assert.deepEqual(afterReload.snapshot().latest, saved); assert.equal(storage.writes.length, writes);
  const second = { ...clockRecord('run-2'), startedAt: wall, updatedAt: wall };
  afterReload.checkpoint(second, options, point(second));
  assert.deepEqual(readBrief(storage).previous, saved);
  assert.equal(readBrief(storage).latest.resourceCheckpoint.clockId, second.id);
  assert.equal(readBrief(storage).limits.recordingStateMeasured, false);
  assert.equal(readBrief(storage).limits.nativeMemoryMeasured, false);
});

test('resource checkpoints do not add writes or change the clock, contacts, pause and end behavior', () => {
  function exercise(resources) {
    const storage = memory(); let wall = 100000, tick = 0;
    const brief = createBrief({ storage, source, now: () => wall, documentStartedAt: wall });
    const clock = createStopwatch({ storage, source, now: () => tick, wallNow: () => wall });
    const steps = [[1000, 'playing'], [50, 'playing'], [950, 'playing'], [250, 'paused'],
      [1000, 'paused'], [1000, 'playing'], [1000, 'playing'], [250, null]];
    for (const [dt, status] of steps) {
      tick += dt; wall += dt;
      const view = clock.observe(status ? { token: 'scene', status, frameAt: tick, visible: true } : null);
      const run = view.live?.startedAt ? view.live : view.latest;
      brief.checkpoint(run, options, resources && run ? point(run) : undefined);
      for (let i = 0; i < 100; i++) brief.record({ kind: 'touchstart', contacts: 1, target: 'field' });
    }
    brief.flush(true);
    return { storage, saved: readBrief(storage), clock: storage.getItem(STOPWATCH_KEY) };
  }
  const before = exercise(false), after = exercise(true);
  assert.deepEqual(after.storage.writes.map(w => w.key), before.storage.writes.map(w => w.key));
  assert.equal(after.clock, before.clock);
  const { resourceCheckpoint, ...unchanged } = after.saved.latest;
  assert.deepEqual(unchanged, before.saved.latest);
  assert.equal(resourceCheckpoint.clockId, after.saved.latest.clock.id);
  assert.equal(after.saved.latest.clock.mode, 'ended');
  assert.equal(after.saved.latest.clock.unobservedGaps, 0);
});

test('optional counters cannot overflow a fitting two-run contact record or increase the 16384-character bound', () => {
  function exercise(resources) {
    const storage = memory(); let wall = 1.2345678901234567e+300;
    const clock = { ...clockRecord('b'.repeat(100)), startedAt: 1, updatedAt: Number.MAX_VALUE,
      elapsedMs: 123456789.12345679, unobservedGaps: Number.MAX_SAFE_INTEGER };
    const event = { kind: 'lostpointercapture', at: Number.MAX_VALUE, elapsedMs: Number.MAX_VALUE,
      mode: 'running', target: 'document', trusted: false, contacts: 10, primary: false,
      pointerType: 'mouse', errorName: 'QuotaExceededError' };
    const oldClock = { ...clock, id: 'c'.repeat(100) };
    const old = { clock: oldClock, documentStartedAt: Number.MAX_VALUE, options,
      events: Array.from({ length: MAX_EVENTS }, () => ({ ...event })), dropped: Number.MAX_SAFE_INTEGER };
    if (resources) old.resourceCheckpoint = point(oldClock);
    storage.map.set(BRIEF_KEY, JSON.stringify({ version: 1, latest: old, previous: null }));
    const brief = createBrief({ storage, source, now: () => wall, documentStartedAt: Number.MAX_VALUE });
    brief.checkpoint(clock, options, resources ? point(clock) : undefined);
    for (let i = 0; i < MAX_EVENTS; i++) {
      wall += 1.2345678901234567e+298;
      brief.record(event);
    }
    brief.flush(true);
    return { storage, raw: storage.getItem(BRIEF_KEY), snapshot: brief.snapshot() };
  }
  const before = exercise(false), after = exercise(true);
  assert.ok(JSON.stringify({ version: 1, latest: after.snapshot.latest, previous: after.snapshot.previous }).length > MAX_BYTES,
    'Fixture actually exercises optional resource overflow');
  assert.ok(before.raw.length <= MAX_BYTES); assert.equal(after.raw, before.raw);
  assert.equal(after.snapshot.storageAvailable, true);
  assert.deepEqual(after.storage.writes.map(w => w.key), before.storage.writes.map(w => w.key));
  const saved = readBrief(after.storage);
  assert.equal(saved.latest.events.length, MAX_EVENTS); assert.equal(saved.previous.events.length, MAX_EVENTS);
  assert.equal(saved.limits.maxCharacters, 16384); assert.equal(saved.limits.resourceCheckpointGuaranteed, false);
  assert.equal(saved.latest.resourceCheckpoint, undefined);
});

// A small host fixture exercises the real browser adapters, rather than a
// duplicate collector. Native engines additionally verify the actual game UI.
function browserHost() {
  const registrations = [], listeners = new Map(), docListeners = new Map();
  const listenerAPI = (map, label) => ({
    addEventListener(name, fn) { registrations.push(`${label}:${name}`); if (!map.has(name)) map.set(name, new Set()); map.get(name).add(fn); },
    removeEventListener(name, fn) { map.get(name)?.delete(fn); },
    dispatchEvent(event) { for (const fn of map.get(event.type) || []) fn(event); },
  });
  const element = () => ({ dataset: {}, children: [], setAttribute() {}, querySelector: () => null,
    append(...children) { for (const child of children) { child.parentElement = this; this.children.push(child); } },
    insertBefore(child) { this.append(child); }, remove() { this.parentElement = null; } });
  const root = element(), shell = element();
  const document = { ...listenerAPI(docListeners, 'document'), visibilityState: 'visible',
    createElement: element, getElementById: () => root,
    querySelector: selector => selector === '.game-shell' ? shell : null };
  const intervals = [], observers = []; let tick = 0, state = { status: 'paused', frameAt: 0 }, inspections = 0;
  const host = { ...listenerAPI(listeners, 'window'), document, localStorage: memory(), __deviceBossOptions: options,
    performance: { now: () => tick, timeOrigin: 100000 },
    __crossDeviceTest: { inspect() { inspections++; return state; } },
    CustomEvent: class { constructor(type, { detail }) { this.type = type; this.detail = detail; } },
    MutationObserver: class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} disconnect() {} },
    setInterval(fn, ms) { intervals.push({ fn, ms, cleared: false }); return intervals.length; },
    clearInterval(id) { intervals[id - 1].cleared = true; } };
  return { host, intervals, observers, registrations, inspections: () => inspections,
    advance(dt, next) {
      tick += dt; state = { status: 'playing', frameAt: tick };
      Object.defineProperties(state, Object.getOwnPropertyDescriptors(next)); intervals[0].fn();
    } };
}

test('the actual browser wire reuses one inspection and its existing timer, including unavailable counters', async t => {
  let wall = 100000; t.mock.method(Date, 'now', () => wall);
  const path = new URL('../boss2-stopwatch-20261029/stopwatchBrowser.mjs', import.meta.url);
  const moduleText = readFileSync(path, 'utf8').replace('__CRYPTOID_STOPWATCH_SOURCE__', source)
    .replace("'./stopwatchState.mjs'", JSON.stringify(new URL('../boss2-stopwatch-20261029/stopwatchState.mjs', import.meta.url).href));
  const { mountStopwatch } = await import('data:text/javascript;base64,' + Buffer.from(moduleText).toString('base64'));
  const f = browserHost(), disposeBrief = installBriefDiagnostics(f.host, source), disposeClock = mountStopwatch(f.host);
  assert.equal(f.inspections(), 1); assert.equal(f.intervals.length, 1); assert.equal(f.intervals[0].ms, 1000);
  assert.equal(f.observers.length, 1); assert.equal(f.registrations.length, 20);
  wall += 1000; f.advance(1000, { audio: { audioState: 'running', audioVoices: 3, audioBufferBytes: 7000000 },
    canvas: { registeredEffects: 2, cacheBytes: 1059028, surfaceBytes: 2270208, failures: [] } });
  let saved = readBrief(f.host.localStorage);
  assert.equal(saved.latest.resourceCheckpoint.audioBufferBytes, 7000000);
  assert.equal(saved.latest.resourceCheckpoint.canvasFailureCount, 0);
  wall += 1000; f.advance(1000, { get audio() { throw Error('optional getter'); } });
  saved = readBrief(f.host.localStorage);
  assert.equal(saved.latest.clock.mode, 'running'); assert.equal(saved.latest.clock.elapsedMs, 1000);
  assert.equal(saved.latest.resourceCheckpoint.at, 101000);
  wall += 1000; f.advance(1000, {});
  saved = readBrief(f.host.localStorage);
  assert.equal(saved.latest.clock.elapsedMs, 2000); assert.equal(saved.latest.resourceCheckpoint.audioVoices, null);
  assert.equal(f.inspections(), 4); assert.equal(f.registrations.length, 20); assert.equal(f.intervals.length, 1);
  disposeClock(); disposeBrief();
  assert.equal(f.inspections(), 5); assert.equal(f.intervals[0].cleared, true);
});

test('the underlying game clock remains byte-identical to the frozen device candidate', () => {
  const bytes = readFileSync(new URL('../boss2-stopwatch-20261029/stopwatchState.mjs', import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), '5e5845d5e5beef85ca5dadac597b8d751e81f931374b942b22fdedc7d83bbb5c');
});
