import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const originalControllerBlob = 'd73579b3f9abe575adacfa978259aec9bdb0e7fd';
// Module-level getters retain their existing modules, never a GamePage instance.
// No new counters, listeners, scheduling, DOM/animation scan or cleanup policy.
export const inspectionPrefix = `
if (typeof window !== 'undefined') {
  (window as any).__lifetimeAttributionStats = () => ({
    css: cssFramePacingStats(),
    painted: paintedShipResourceStats(),
    canvas: canvasEffectResources(),
  });
}
`;
export function instrumentMemoryInspection(source) {
  const bytes = Buffer.from(source);
  assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'),
    originalControllerBlob, 'Exact original controller required');
  for (const name of ['cssFramePacingStats', 'paintedShipResourceStats', 'canvasEffectResources'])
    assert.ok(source.includes(name), 'Existing read-only getter ' + name);
  assert.ok(!source.includes('__lifetimeAttributionStats'));
  const changed = inspectionPrefix + source;
  assert.equal(restoreMemoryInspection(changed), source);
  return changed;
}
export function restoreMemoryInspection(source) {
  assert.ok(source.startsWith(inspectionPrefix));
  return source.slice(inspectionPrefix.length);
}
export function requireInactiveCheckpoint(observed, phase) {
  assert.equal(observed.hidden, false, 'Deliberately foregrounded test page');
  if (phase === 'paused') {
    assert.equal(observed.mounted, true);
    assert.equal(observed.scene?.status, 'paused', 'Heavy profiling only after actual manual pause');
    assert.equal(observed.scene.technicalPause, false);
    assert.equal(observed.clock?.latest?.mode, 'paused');
  } else if (phase === 'unmounted') {
    assert.equal(observed.mounted, false, 'Game must already be unmounted');
    assert.equal(observed.clock?.latest?.mode, 'ended');
  } else if (phase === 'blank') {
    assert.equal(observed.mounted, false);
    assert.equal(observed.url, 'about:blank', 'Explicit document-destruction control');
    assert.equal(observed.stats, null, 'No game module probe in the blank document');
  } else assert.fail('Unknown checkpoint phase');
}
