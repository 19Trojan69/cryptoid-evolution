import assert from 'node:assert/strict';
import { summarizeAttribution } from '../../memory-retention-attribution-20261101/evidence/attributionSummary.mjs';
import { assertStyleProof } from '../config.mjs';
export const measured = { source: '0f21c59239fafad5f2d396bcf940f8e7812a9d5d', tree: '51d66b277803a3dc200a3c675a603b3cbaeb8e44' };

export function summarizeStyle(capture) {
  const base = summarizeAttribution(capture, measured);
  assert.equal(capture.requestedSeconds, 60); assert.equal(capture.activeStyleWriteProbe, true);
  assert.equal(capture.styleProbeRemovedBeforeInactiveInspection, true);
  assert.equal(capture.inactiveNativeAllocationRequested, undefined);
  assert.equal(capture.isolatedMiniPacing, undefined);
  assertStyleProof(capture.styleWriteObservation);
  const groups = capture.styleWriteObservation.groups;
  assert.equal(new Set(groups.map(row => row.owner + '|' + row.property)).size, groups.length);
  const names = ['calls', 'firstObservedArgument', 'matchingPreviousArgument', 'differentPreviousArgument', 'unclassifiedArgument'];
  const totals = Object.fromEntries(names.map(key => [key, groups.reduce((n, row) => n + row[key], 0)]));
  const byProperty = new Map(), byOwner = new Map();
  for (const row of groups) for (const [map, key, name] of [[byProperty, row.property, 'property'], [byOwner, row.owner, 'owner']]) {
    if (!map.has(key)) map.set(key, { [name]: key, ...Object.fromEntries(names.map(key => [key, 0])) });
    for (const field of names) map.get(key)[field] += row[field];
  }
  return { sourceCommit: base.sourceCommit, sourceTree: base.sourceTree,
    observedActiveMs: base.observedActiveMs, observedWallMs: base.observedWallMs, volleysAdvanced: base.volleysAdvanced,
    engineVersion: base.engineVersion, actualInstalledPackages: base.actualInstalledPackages,
    apiObservationOnly: true, memoryComparisonEligible: false, physicalPhoneAcceptanceEstablished: false,
    observationRestoredBeforeInactiveInspection: true, observedHomeOwnershipReleased: base.observedHomeOwnershipReleased,
    totals, unclassifiedOwnerCalls: groups.filter(row => row.owner === 'unclassified-style-owner').reduce((n, row) => n + row.calls, 0),
    byProperty: [...byProperty.values()].sort((a, b) => b.calls - a.calls || a.property.localeCompare(b.property)),
    byOwner: [...byOwner.values()].sort((a, b) => b.calls - a.calls || a.owner.localeCompare(b.owner)), groups,
    limits: 'Successful native custom-property API calls and consecutive primitive arguments only; no actual value readback, invalidation counts, allocation attribution, memory effect or physical phone acceptance.',
    whiteScreenFixed: false };
}
