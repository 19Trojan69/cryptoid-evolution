import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertObservationOnly } from '../../scripts/fullSessionScope.mjs';
import { createOwnerFlightRecorder, createOwnerDiagnosticProbe } from './ownerFlightRecorder.ts';
import { resourceTimingEnabled, retainOwnerResourceTiming } from './performanceDiagnostics.ts';
import { OWNER_TIMING_ARM_KEY, readTimingCapture } from './timingReport.mjs';
import { FLIGHT_RECORDER_KEY, PREVIOUS_FLIGHT_RECORDER_KEY, FLIGHT_RECORDER_MAX_CHARS,
  readFlightRecorders, cleanFlightRecorder } from './flightRecorderReport.mjs';
import { readOwnerStabilityReport } from './stabilityReport.mjs';

const build = { sourceCommit: 'a'.repeat(40), sourceTree: 'b'.repeat(40), workingTreeDirty: true };
const playing = { sector: 20, flight: 0, phase: 'ATTACK_CYCLE', encounter: 'boss-fight', status: 'playing',
  enemies: 1, attackers: 0, returning: 0, playerShots: 3, enemyShots: 4, effects: 0, rocks: 0, rockEffects: 0, pickups: 0 };
function fixture() {
  let now = 100, wall = 1000000, runtimeCalls = 0, writes = 0, fullWrites = 0;
  const local = new Map(), session = new Map();
  const storage = data => ({ getItem: k => data.get(k) ?? null,
    setItem: (k, v) => { if (k === 'cryptoid_owner_full_status_v1') fullWrites++; else if (!k.startsWith('cryptoid_owner_crash_tail_v1_')) writes++; data.set(k, v); }, removeItem: k => data.delete(k) });
  const host = { localStorage: storage(local), sessionStorage: storage(session), __cryptoidBootId: 'test-boot' };
  const options = { build, now: () => now, wallNow: () => wall,
    runtime: () => { runtimeCalls++; return { animations: 12, particles: 5, domNodes: 500, bossPaints: 100, username: 'private-user' }; } };
  const advance = delta => { now += delta; wall += delta; };
  const frame = (probe, context = playing) => {
    probe.begin(now, context); advance(1); probe.mark('boss-motion-and-weapons');
    probe.sceneRequested(); const start = probe.sceneRenderBegin(); advance(2); probe.sceneCommitted(start);
    probe.simulationStep(16, 16); probe.end(now);
  };
  return { host, local, session, options, advance, frame, stats: () => ({ now, wall, runtimeCalls, writes, fullWrites }) };
}

test('ordinary player cannot obtain storage, create a manual probe or enable resource timing', () => {
  const forbidden = () => { throw Error('accessed'); };
  assert.equal(createOwnerFlightRecorder(false, forbidden, {build}), null);
  assert.equal(createOwnerDiagnosticProbe(false, forbidden, {build}), null);
  assert.equal(resourceTimingEnabled(), false);
});
test('automatic ring survives beyond 90 seconds and is bounded through a 20-minute run', () => {
  const f = fixture(), probe = createOwnerFlightRecorder(true, () => f.host, f.options);
  for (let i = 0; i < 1200; i++) { f.frame(probe); f.advance(997); }
  const captures = readFlightRecorders(f.host), capture = captures[0];
  assert.equal(captures.length, 1); assert.equal(capture.finished, false);
  assert.equal(capture.samples.length, 30);
  assert.ok(capture.samples[0].atMs > 1100000);
  assert.ok(capture.samples.at(-1).atMs >= 1196000);
  assert.ok(capture.samples.some(s => s.work['boss-motion-and-weapons'].maxMs === 1));
  assert.ok(capture.samples.some(s => s.sceneRenderToCommitP95Ms === 2));
  assert.ok(f.stats().runtimeCalls <= 121);
  assert.ok(f.stats().writes <= 1202); // two independent storage writes per 2-second window
  assert.ok(f.local.get(FLIGHT_RECORDER_KEY).length <= FLIGHT_RECORDER_MAX_CHARS);
  assert.ok(!JSON.stringify(capture).includes('private-user'));
  assert.equal(resourceTimingEnabled(), true);
  probe.finish(); assert.equal(resourceTimingEnabled(), false);
  const saved = f.local.get(FLIGHT_RECORDER_KEY); f.frame(probe); probe.finish();
  assert.equal(f.local.get(FLIGHT_RECORDER_KEY), saved);
});
test('new recording preserves the previous run, but loading/StrictMode cannot overwrite it', () => {
  const f = fixture(), first = createOwnerFlightRecorder(true, () => f.host, f.options);
  f.frame(first); f.advance(2000); f.frame(first); first.finish();
  const original = f.local.get(FLIGHT_RECORDER_KEY);
  f.advance(10000);
  const loading = createOwnerFlightRecorder(true, () => f.host, f.options);
  loading.begin(f.stats().now, {...playing, status: 'loading'}); loading.finish();
  assert.equal(f.local.get(FLIGHT_RECORDER_KEY), original);
  assert.equal(f.local.has(PREVIOUS_FLIGHT_RECORDER_KEY), false);
  const next = createOwnerFlightRecorder(true, () => f.host, f.options);
  f.frame(next); f.advance(2100); f.frame(next);
  assert.equal(f.local.get(PREVIOUS_FLIGHT_RECORDER_KEY), original);
  assert.equal(readFlightRecorders(f.host).length, 2);
  f.advance(3000); f.frame(next);
  assert.equal(f.local.get(PREVIOUS_FLIGHT_RECORDER_KEY), original);
  next.finish();
});
test('manual expiry does not stop automatic collection or release the other timing lease', () => {
  const f = fixture(); f.session.set(OWNER_TIMING_ARM_KEY, String(f.stats().wall));
  const probe = createOwnerDiagnosticProbe(true, () => f.host, f.options);
  for (let i=0; i<120; i++) { f.frame(probe); f.advance(997); }
  assert.equal(readTimingCapture(f.host).finished, true);
  assert.ok(readFlightRecorders(f.host)[0].samples.at(-1).atMs > 110000);
  assert.equal(resourceTimingEnabled(), true);
  probe.finish(); assert.equal(resourceTimingEnabled(), false);
  const releaseA = retainOwnerResourceTiming(Infinity), releaseB = retainOwnerResourceTiming(Infinity);
  releaseA(); assert.equal(resourceTimingEnabled(), true);
  releaseB(); assert.equal(resourceTimingEnabled(), false);
});
test('background/pause time is not a foreground stall or simulated time', () => {
  const f = fixture(), probe = createOwnerFlightRecorder(true, () => f.host, f.options);
  f.frame(probe); f.advance(13); f.frame(probe);
  probe.suspend(f.stats().now); f.advance(600000);
  f.frame(probe); f.advance(13); f.frame(probe); probe.finish();
  const capture = readFlightRecorders(f.host)[0];
  assert.ok(capture.samples.every(s => s.frameMaxMs <= 16));
  assert.ok(capture.samples.every(s => s.sampleDurationMs < 1000));
});
test('abrupt process loss needs no unload event; fresh report reads the last persisted evidence', async () => {
  const f = fixture(), probe = createOwnerFlightRecorder(true, () => f.host, f.options);
  f.frame(probe); f.advance(2100); f.frame(probe);
  // A replacement document only has the persisted strings, not the probe object.
  const snapshot = new Map(f.local), host = { localStorage: { getItem: k => snapshot.get(k) ?? null } };
  const report = await readOwnerStabilityReport(async () => ({canAdmin: true}), () => host);
  assert.equal(report.flightRecorders.length, 1); assert.equal(report.available, true);
  assert.equal(report.flightRecorders[0].finished, false);
  assert.equal(report.flightRecorders[0].metadata.sourceCommit, build.sourceCommit);
  probe.finish();
});
test('owner verification and active-view check precede even reading the added report storage', async () => {
  const forbidden = () => { throw Error('storage accessed'); };
  await assert.rejects(readOwnerStabilityReport(async () => ({canAdmin: false}), forbidden), /owner_access_required/);
  assert.equal(await readOwnerStabilityReport(async () => ({canAdmin: true}), forbidden, () => false), null);
});
test('denied storage and optional runtime failure never escape into the simulation', () => {
  const f = fixture();
  const denied = { sessionStorage: f.host.sessionStorage };
  Object.defineProperty(denied, 'localStorage', { get() { throw Error('blocked'); } });
  denied.sessionStorage.setItem = () => { throw Error('quota'); };
  const probe = createOwnerFlightRecorder(true, () => denied,
    {...f.options, runtime: () => { throw Error('unsupported'); }});
  assert.doesNotThrow(() => { f.frame(probe); f.advance(2100); f.frame(probe); probe.finish(); });
  assert.deepEqual(readFlightRecorders(denied), []);
  assert.equal(resourceTimingEnabled(), false);
});
test('only bounded compiled error coordinates survive, never private stack/message/URLs', () => {
  const f = fixture(), probe = createOwnerFlightRecorder(true, () => f.host, f.options);
  f.frame(probe); f.advance(2100); f.frame(probe); f.advance(2100);
  const error = new Error('private-message');
  error.stack = 'private-message\n at https://example.com/assets/GamePage-abc.js:123:45?token=private-token';
  probe.lifecycle('javascript-error', error); probe.finish();
  const capture = readFlightRecorders(f.host)[0];
  assert.deepEqual(capture.events.find(e => e.kind === 'javascript-error'),
    {atMs: 4206, sector: 20, flight: 0, kind: 'javascript-error', phase: 'ATTACK_CYCLE', encounter: 'boss-fight', status: 'playing',
      file: 'GamePage-abc.js', line: 123, column: 45});
  assert.ok(!JSON.stringify(capture).includes('private-'));
  assert.ok(!JSON.stringify(capture).includes('example.com'));
  const clean = cleanFlightRecorder({...capture, events: [{kind:'error', file:'https://private.js', line:1}]});
  assert.equal(clean.events[0].file, undefined);
});
test('reader rejects oversized/corrupt records and prefers freshest independent storage snapshot', () => {
  const f = fixture(), probe = createOwnerFlightRecorder(true, () => f.host, f.options);
  f.frame(probe); f.advance(2100); f.frame(probe);
  const older = f.local.get(FLIGHT_RECORDER_KEY);
  f.advance(2100); f.frame(probe);
  f.local.set(FLIGHT_RECORDER_KEY, older);
  assert.equal(readFlightRecorders(f.host)[0].savedAt, f.stats().wall);
  f.local.set(FLIGHT_RECORDER_KEY, 'x'.repeat(FLIGHT_RECORDER_MAX_CHARS + 1));
  f.session.set(FLIGHT_RECORDER_KEY, '{broken');
  assert.deepEqual(readFlightRecorders(f.host), []);
  assert.equal(cleanFlightRecorder({mode: 'rolling-owner', savedAt: Infinity}), null);
  probe.finish();
});
test('new collector has no scheduling/network/UI path; runtime wiring is verified-owner Testnet only', () => {
  const source = readFileSync(new URL('./ownerFlightRecorder.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(?:setInterval|setTimeout|requestAnimationFrame|fetch|addEventListener)\s*\(/);
  const game = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
  assert.match(game, /createOwnerDiagnosticProbe\(ownerDiagnostics && shipSaveNetwork === 'testnet'/);
  assert.match(game, /probe\?\.finish\(\); performanceProbeRef.current = null/);
});
test('first fault is persisted immediately even directly after a periodic write; repeat faults stay throttled', () => {
  const f = fixture(), probe = createOwnerFlightRecorder(true, () => f.host, f.options);
  f.frame(probe); f.advance(2100); f.frame(probe);
  const writes = f.stats().writes;
  const fullWrites = f.stats().fullWrites;
  probe.lifecycle('frame-error', new Error('private-message'));
  assert.equal(f.stats().writes, writes + 2);
  assert.equal(f.stats().fullWrites, fullWrites + 1);
  assert.ok(readFlightRecorders(f.host)[0].events.some(e => e.kind === 'frame-error'));
  for (let i=0; i<100; i++) probe.lifecycle('frame-error', new Error('private-message'));
  assert.equal(f.stats().writes, writes + 2);
  assert.equal(f.stats().fullWrites, fullWrites + 1);
  probe.finish();
});
test('a fault in the first playing frame is retained before any complete sample exists', () => {
  const f = fixture(), probe = createOwnerFlightRecorder(true, () => f.host, f.options);
  f.frame(probe); probe.lifecycle('render-error', new Error('private-message'));
  const capture = readFlightRecorders(f.host)[0];
  assert.equal(capture.samples.length, 0);
  assert.ok(capture.events.some(e => e.kind === 'render-error'));
  probe.finish();
});
test('GamePage, hull handoff, transport and save queue preserve the current approved source outside exact observations', () => {
  assertObservationOnly();
});

