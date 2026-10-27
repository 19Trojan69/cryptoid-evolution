import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { startGuardedGameLoop } from './gameLoop.ts';
import { createFrameScheduler } from '../lib/frameScheduler.ts';
import { gameOverLoopChange, restoreGameOverLoopGameChange } from '../../scripts/gameOverLoopReviewedChanges.mjs';

const source = readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
assert.equal(source.split(gameOverLoopChange.after).length, 2);
const predicate = (line, stateRef) => new Function('stateRef', 'return (' + line.trim().slice('sleepWhenInactive: '.length, -1) + ')')(stateRef);

test('only terminal Game Over gains sleep with retained effects; all resumable/destruction states retain their policy', () => {
  for (const status of ['loading', 'playing', 'paused', 'destroying', 'game-over', 'victory']) for (const count of [0, 1, 8]) {
    const stateRef = { current: { status, effects: Array.from({ length: count }, () => ({})) } };
    const original = predicate(gameOverLoopChange.before, stateRef)(), current = predicate(gameOverLoopChange.after, stateRef)();
    assert.equal(current, status === 'game-over' ? true : original);
    if (status === 'destroying' || status === 'paused' && count > 0) assert.equal(current, false);
  }
});

test('actual scheduler removes terminal callbacks with finished records; released policy reproduces 300 in five seconds', () => {
  const run = line => {
    let now = 0, serial = 0, steps = 0, watcher;
    const frames = new Map(), stateRef = { current: { status: 'game-over', effects: [{}] } };
    const stop = startGuardedGameLoop({ step: () => steps++, fault: () => assert.fail('terminal state faulted'),
      sleepWhenInactive: predicate(line, stateRef), active: () => stateRef.current.status === 'playing', visible: () => true, now: () => now,
      requestFrame: fn => { frames.set(++serial, fn); return serial; }, cancelFrame: id => frames.delete(id),
      watch: fn => { watcher = fn; return 1; }, unwatch: () => { watcher = null; } });
    for (let frame = 1; frame <= 300; frame++) { now = frame * 1000 / 60; for (const [id, fn] of [...frames]) { frames.delete(id); fn(now); } if (frame % 30 === 0) watcher(); }
    stop(); assert.equal(frames.size, 0); assert.equal(watcher, null); return steps;
  };
  assert.equal(run(gameOverLoopChange.before), 300); assert.equal(run(gameOverLoopChange.after), 0);
});

test('sleep cancels only its own client; finite graphics keep the shared clock and explicit restart wakes one game loop', () => {
  let now = 0, serial = 0, watcher, graphics = 0, game = 0;
  const native = new Map(), stateRef = { current: { status: 'destroying', effects: [{}] } };
  const scheduler = createFrameScheduler({ request: fn => { native.set(++serial, fn); return serial; }, cancel: id => native.delete(id), report: e => { throw e; } });
  const stop = startGuardedGameLoop({ step: () => game++, fault: () => assert.fail('faulted'), sleepWhenInactive: predicate(gameOverLoopChange.after, stateRef),
    active: () => stateRef.current.status === 'playing', visible: () => true, now: () => now,
    requestFrame: scheduler.request, cancelFrame: scheduler.cancel, watch: fn => { watcher = fn; return 1; }, unwatch: () => { watcher = null; } });
  const effect = () => { if (++graphics < 10) scheduler.request(effect); }; scheduler.request(effect);
  stateRef.current.status = 'game-over'; stop.wake();
  for (let frame = 0; frame < 15; frame++) { now += 1000 / 60; for (const [id, fn] of [...native]) { native.delete(id); fn(now); } }
  assert.equal(game, 0); assert.equal(graphics, 10); assert.equal(native.size, 0);
  now += 100_000; watcher(); assert.equal(stateRef.current.status, 'game-over'); assert.equal(native.size, 0);
  stateRef.current = { status: 'playing', effects: [] }; stop.wake(); stop.wake(); assert.equal(native.size, 1);
  now += 1000 / 60; for (const [id, fn] of [...native]) { native.delete(id); fn(now); }
  assert.equal(game, 1); assert.equal(native.size, 1); stop(); assert.equal(native.size, 0);
});

test('one reviewed predicate restores the full released controller; broadening sleep to paused effects is rejected', () => {
  assert.equal(createHash('sha256').update(restoreGameOverLoopGameChange(source)).digest('hex'), '21d28b3a2c856eec20cd9b98798be7be6d3ac97d59d265846b1d163495e6fbc7');
  assert.throws(() => restoreGameOverLoopGameChange(source.replace("status === 'game-over' || (", "status !== 'playing' || (")), /one exact/);
  assert.notEqual(createHash('sha256').update(restoreGameOverLoopGameChange(source.replace('watch: callback => window.setInterval(callback, 500)', 'watch: callback => window.setInterval(callback, 1000)'))).digest('hex'), '21d28b3a2c856eec20cd9b98798be7be6d3ac97d59d265846b1d163495e6fbc7');
});
