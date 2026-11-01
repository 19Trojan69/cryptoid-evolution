import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { instrumentMemoryInspection, restoreMemoryInspection, inspectionPrefix, requireInactiveCheckpoint } from './inspection.mjs';
const source = readFileSync(new URL('../../frontend/src/pages/GamePage.tsx', import.meta.url), 'utf8');
const ts = createRequire(new URL('../../frontend/package.json', import.meta.url))('typescript');
test('inspection adds only an exactly reversible module-level prefix to the pinned controller', () => {
  assert.equal(restoreMemoryInspection(instrumentMemoryInspection(source)), source);
  assert.throws(() => instrumentMemoryInspection(source + '\n'), /Exact original controller/);
  assert.throws(() => instrumentMemoryInspection(instrumentMemoryInspection(source)));
});
test('the actual generated inspection reads existing getters without capturing component state or scheduling', () => {
  const calls = [], context = { window: {}, cssFramePacingStats: () => { calls.push('css'); return { active: 7 }; },
    paintedShipResourceStats: () => { calls.push('painted'); return { retained: 13 }; },
    canvasEffectResources: () => { calls.push('canvas'); return { registeredEffects: 1 }; },
    setTimeout: () => assert.fail('new timer'), setInterval: () => assert.fail('new interval'),
    requestAnimationFrame: () => assert.fail('new RAF') };
  vm.runInNewContext(ts.transpileModule(inspectionPrefix, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  assert.deepEqual(calls, [], 'No read or work on module install');
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.__lifetimeAttributionStats())),
    { css: { active: 7 }, painted: { retained: 13 }, canvas: { registeredEffects: 1 } });
  assert.deepEqual(calls, ['css', 'painted', 'canvas']);
  assert.doesNotMatch(inspectionPrefix, /stateRef|soundRef|musicRef|getAnimations|querySelector|addEventListener|\.current\b/);
});
test('profiling cannot run while play, loading, hidden time or technical recovery is active', () => {
  const row = { hidden: false, mounted: true, scene: { status: 'paused', technicalPause: false }, clock: { latest: { mode: 'paused' } } };
  requireInactiveCheckpoint(row, 'paused');
  for (const status of ['playing', 'loading', 'destroying', 'game-over'])
    assert.throws(() => requireInactiveCheckpoint({ ...row, scene: { ...row.scene, status } }, 'paused'));
  assert.throws(() => requireInactiveCheckpoint({ ...row, hidden: true }, 'paused'));
  assert.throws(() => requireInactiveCheckpoint({ ...row, scene: { ...row.scene, technicalPause: true } }, 'paused'));
  assert.throws(() => requireInactiveCheckpoint({ ...row, clock: { latest: { mode: 'running' } } }, 'paused'));
});
test('unmount and blank checkpoints cannot substitute for a still-mounted or unconfirmed exit', () => {
  const row = { hidden: false, mounted: false, clock: { latest: { mode: 'ended' } } };
  requireInactiveCheckpoint(row, 'unmounted');
  assert.throws(() => requireInactiveCheckpoint({ ...row, mounted: true }, 'unmounted'));
  assert.throws(() => requireInactiveCheckpoint({ ...row, clock: { latest: { mode: 'paused' } } }, 'unmounted'));
  requireInactiveCheckpoint({ hidden: false, mounted: false, stats: null, url: 'about:blank' }, 'blank');
  assert.throws(() => requireInactiveCheckpoint({ hidden: false, mounted: false, stats: {}, url: 'about:blank' }, 'blank'));
  assert.throws(() => requireInactiveCheckpoint(row, 'unknown'));
});
