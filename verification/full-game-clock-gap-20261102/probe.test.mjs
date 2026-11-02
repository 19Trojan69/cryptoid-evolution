import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFrameProbe } from './frameProbe.mjs';
import { createClockTrace, classifyClockTrace } from './clockTrace.mjs';
import { instrumentClockFrames, instrumentClockSamples, clockGapConfig } from './transforms.mjs';
test('existing native frames distinguish a large actual playing-frame gap from a delayed clock checkpoint', () => {
  const f = createFrameProbe(); f.record(0, 0, 'playing'); f.record(16, 16, 'playing');
  assert.equal(f.read().maxPlayingGapMs, 16); f.record(3017, 3001, 'playing');
  assert.equal(f.read().maxPlayingGapMs, 3001); assert.equal(f.read().gaps.at(-1).gap, 3001);
  for (let i = 0; i < 1000; i++) f.record(4000 + i * 300, 300, 'playing');
  assert.equal(f.read().gaps.length, 16); assert.equal(f.read().frames, 1003);
  const r = f.read(); r.gaps[0].gap = 0; assert.notEqual(f.read().gaps[0].gap, 0);
  const first = createFrameProbe(); first.record(4100, 4000, 'playing');
  assert.equal(first.read().maxPlayingGapMs, 4000, 'A first playing callback gap is retained too');
});
test('bounded existing-clock observations never keep contact, account, DOM or raw storage payloads', () => {
  const trace = createClockTrace();
  for (let i = 0; i < 1000; i++) trace.record(i * 1000, { status: 'playing', frameAt: i * 1000 - 10, visible: true, token: { private: true } },
    { live: { id: 'run', mode: 'running', elapsedMs: i * 1000, unobservedGaps: 0, token: 'private', previous: 'private' } }, true,
    { frames: i * 60, playingFrames: i * 60, maxPlayingGapMs: 20, lastStatus: 'playing', private: true });
  const r = trace.read(); assert.equal(r.rows.length, 96); assert.equal(r.dropped, 904);
  assert.ok(JSON.stringify(r).length < 32768); assert.doesNotMatch(JSON.stringify(r), /private|token|previous/);
});
test('ongoing frames after a checkpoint gap do not assert phone stability or reconstruct the missing interval', () => {
  const base = { clockId: 'a', visible: true, status: 'playing', maxPlayingGapMs: 20, frameGeneration: 1 };
  const rows = [{ ...base, unobservedGaps: 0, frames: 60, frameAt: 1000 },
    { ...base, unobservedGaps: 1, frames: 240, frameAt: 4000 }, { ...base, unobservedGaps: 1, frames: 300, frameAt: 5000 }];
  let r = classifyClockTrace({ rows }); assert.equal(r.classification, 'clock-checkpoint-gap-with-continuing-game-frames');
  assert.equal(r.whiteScreenFixed, false); assert.equal(r.unobservedIntervalCannotBeReconstructed, true);
  rows[2].maxPlayingGapMs = 3000; r = classifyClockTrace({ rows });
  assert.equal(r.classification, 'clock-gap-with-unresolved-game-progress');
  assert.equal(classifyClockTrace({ rows }, { snapshot: { scene: { technicalPause: true } } }).classification,
    'clock-gap-with-observed-technical-pause');
  rows[2].maxPlayingGapMs = 20; rows[2].frameGeneration = 2;
  assert.equal(classifyClockTrace({ rows }).classification, 'clock-gap-with-unresolved-game-progress');
  rows[1].clockId = rows[2].clockId = 'new'; assert.equal(classifyClockTrace({ rows }).clockGapEdges, 0);
});
test('both virtual hooks are uniquely reversible and do not alter the existing watchdog, time calculation or scheduling', () => {
  const controller = readFileSync(new URL('../../frontend/src/pages/GamePage.tsx', import.meta.url), 'utf8');
  const clock = readFileSync(new URL('../boss2-stopwatch-20261029/stopwatchBrowser.mjs', import.meta.url), 'utf8');
  const c = instrumentClockFrames(controller), s = instrumentClockSamples(clock);
  assert.ok(c.includes('qaClockFrames.record(time, lastMeasuredFrameRef.current, state.status)'));
  for (const token of ['requestAnimationFrame', 'setInterval(', 'clock.observe(snapshot)'])
    assert.equal(s.split(token).length, clock.split(token).length);
  for (const token of ['startGuardedGameLoop(', 'watch: callback => window.setInterval(callback, 500)'])
    assert.equal(c.split(token).length, controller.split(token).length);
  assert.throws(() => instrumentClockFrames(c)); assert.throws(() => instrumentClockSamples(s));
  assert.equal(clockGapConfig([]), null); assert.equal(clockGapConfig(['--clock-probe', 'webkit', 'control', '1', 'short']).seconds, 60);
  for (const args of [['--clock-probe', 'unknown', 'leaves', '1', 'short'], ['--clock-probe', 'webkit', 'control', '3', 'short']])
    assert.throws(() => clockGapConfig(args));
});
