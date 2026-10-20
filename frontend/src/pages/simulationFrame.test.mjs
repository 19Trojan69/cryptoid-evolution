import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulationFrame, MAX_SIMULATION_STEP_MS, MAX_SIMULATION_STEPS } from './simulationFrame.ts';

test('late frames consume real time with collision steps at most 34 ms', () => {
  for (const gap of [0, 16.667, 33.333, 34, 35, 50, 64, 88, 100, 136]) {
    const frame = simulationFrame(gap, true);
    assert.equal(frame.simulatedMs, gap);
    assert.ok(frame.stepMs <= MAX_SIMULATION_STEP_MS);
    assert.ok(frame.steps >= 1 && frame.steps <= MAX_SIMULATION_STEPS);
    assert.equal(frame.stepMs * frame.steps, gap);
  }
});

test('long stalls stay bounded without a backlog; pause keeps the full wall-time shift', () => {
  assert.equal(simulationFrame(1000, true).simulatedMs, 136);
  assert.equal(simulationFrame(16, true).simulatedMs, 16);
  const paused = simulationFrame(60_000, false);
  assert.equal(paused.steps, 1); assert.equal(paused.stepMs, 60_000);
  for (const invalid of [-1, NaN, Infinity]) assert.equal(simulationFrame(invalid, true).simulatedMs, 0);
});

for (const [label, interval, pattern] of [
  ['60 Hz', 1000/60], ['30 Hz', 1000/30], ['20 Hz', 50], ['88 ms stalls', 88],
  ['irregular delivery', 16, '16,17,50,88,33,64'],
]) test(`actual GamePage: player/enemy shots and timers retain speed at ${label}`, () => {
  const directory = mkdtempSync(join(tmpdir(), 'cryptoid-cadence-'));
  try {
    const stdout = execFileSync(process.execPath, ['scripts/verifySimulationStability.cjs'], {
      cwd: fileURLToPath(new URL('../../', import.meta.url)), encoding: 'utf8',
      env: { ...process.env, CRYPTOID_CADENCE_ONLY:'1', CRYPTOID_EXPECT_REALTIME:'1',
        CRYPTOID_FRAME_MS:String(interval), CRYPTOID_FRAME_PATTERN:pattern || '',
        CRYPTOID_WIDTH:'430', CRYPTOID_HEIGHT:'825', CRYPTOID_SIMULATION_OUT:join(directory,'result.json') },
    });
    const result = JSON.parse(stdout.trim().split('\n').at(-1));
    assert.ok(Math.abs(result.playerDistance-640)<1e-7);
    assert.ok(Math.abs(result.enemyDistance-200)<1e-7);
    assert.equal(result.pausePreservesMovementAndTimers,true);
    assert.equal(result.sceneRequestsPerFrameMax,1);
  } finally { rmSync(directory,{recursive:true,force:true}); }
});
