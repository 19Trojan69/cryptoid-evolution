import test from 'node:test';
import assert from 'node:assert/strict';
import { crashRecoveryBoundary } from './crashRecoveryBoundary.mjs';
const summary = { state: 'recording', lastAt: 10000 };
const tail = { state: 'recording', documentStartedAt: 1000, lastObservedAt: 10300, evidenceSource: 'current-tab' };
const boot = { kind: 'document-start', at: 14000, documentStartedAt: 13000, previousDocumentStartedAt: 999, route: 'home' };
const lifecycle = events => ({ evidenceSource: 'current-tab', events });
test('a replacement links the last saved game to first observed Home, with both missing intervals explicit', () => {
  const r = crashRecoveryBoundary(summary, tail, lifecycle([boot]));
  assert.equal(r.status, 'replacement-without-lifecycle-signal');
  assert.equal(r.unobservedBeforeNextDocumentMs, 2700);
  assert.equal(r.nextDocumentObservationDelayMs, 1000);
  assert.equal(r.homeObservedAt, 14000);
  assert.equal(r.nativeCauseKnown, false); assert.equal(r.whitePixelsObserved, false);
});
test('same document, unrelated previous boot or origin-only evidence cannot be called a correlated replacement', () => {
  for (const row of [{ ...boot, documentStartedAt: 1000 }, { ...boot, previousDocumentStartedAt: 2000 }])
    assert.equal(crashRecoveryBoundary(summary, tail, lifecycle([row])).status, 'replacement-not-observed');
  assert.equal(crashRecoveryBoundary(summary, { ...tail, evidenceSource: 'origin-fallback-may-be-another-tab' }, lifecycle([boot])).status, 'tab-correlation-unavailable');
  assert.equal(crashRecoveryBoundary(summary, tail, { ...lifecycle([boot]), evidenceSource: 'absent' }).status, 'tab-correlation-unavailable');
});
test('normal closed runs and observed navigation departures retain their distinct evidence', () => {
  assert.equal(crashRecoveryBoundary({ ...summary, state: 'closed' }, tail, lifecycle([boot])).status, 'closed-run');
  const r = crashRecoveryBoundary(summary, tail, lifecycle([{ kind: 'pagehide', at: 10400, documentStartedAt: 1000 }, boot]));
  assert.equal(r.status, 'replacement-with-lifecycle-signal');
  assert.deepEqual(r.departureSignals, [{ kind: 'pagehide', at: 10400 }]);
});
test('missing tail or a next document first seen in Admin never fabricates Home or an unrecorded crash', () => {
  assert.equal(crashRecoveryBoundary(summary, null, lifecycle([boot])).status, 'tail-unavailable');
  const r = crashRecoveryBoundary(summary, tail, lifecycle([{ ...boot, route: 'admin' }]));
  assert.equal(r.homeObservedAt, null); assert.equal(r.firstObservedRoute, 'admin');
  assert.equal(r.nativeCauseKnown, false);
});
test('navigation start can precede the old pagehide; an earlier restored departure is not reused', () => {
  const r = crashRecoveryBoundary(summary, tail, lifecycle([
    { kind: 'pagehide', at: 10100, documentStartedAt: 1000 },
    { kind: 'pageshow', at: 10200, documentStartedAt: 1000 },
    { kind: 'pagehide', at: 13300, documentStartedAt: 1000 }, boot,
  ]));
  assert.deepEqual(r.departureSignals, [{ kind: 'pagehide', at: 13300 }]);
  assert.equal(r.status, 'replacement-with-lifecycle-signal');
  const overlapping = crashRecoveryBoundary(summary, { ...tail, lastObservedAt: 13100 }, lifecycle([boot]));
  assert.equal(overlapping.unobservedBeforeNextDocumentMs, 0);
  assert.equal(overlapping.previousEvidenceAfterNavigationStartMs, 100);
});

const sourceCommit = 'a'.repeat(40);
const capturedStart = { kind: 'document-start', at: 1500, documentStartedAt: 1003, sourceCommit, route: 'home' };
const driftedTail = { ...tail, startedAt: 2000, build: { sourceCommit } };
const linkedBoot = { ...boot, previousDocumentStartedAt: 1003 };
test('independent same-tab start and source link a small origin discrepancy without claiming a cause', () => {
  const r = crashRecoveryBoundary(summary, driftedTail, lifecycle([
    capturedStart,
    { kind: 'visibility', at: 3000, documentStartedAt: 1003, hidden: true },
    { kind: 'visibility', at: 4000, documentStartedAt: 1003, hidden: false },
    linkedBoot,
  ]));
  assert.equal(r.status, 'replacement-without-lifecycle-signal');
  assert.equal(r.lifecycleDocumentStartedAt, 1003);
  assert.equal(r.documentStartOffsetMs, 3);
  assert.equal(r.documentCorrelation, 'same-tab-start-record');
  assert.equal(r.previousDocumentStartedAt, 1000);
  assert.equal(r.homeObservedAt, 14000);
  assert.equal(r.unobservedBeforeNextDocumentMs, 2700);
  assert.equal(r.nativeCauseKnown, false);
  assert.equal(r.whitePixelsObserved, false);
});
test('the same small discrepancy preserves an actual final departure', () => {
  const r = crashRecoveryBoundary(summary, driftedTail, lifecycle([
    capturedStart, { kind: 'pagehide', at: 13300, documentStartedAt: 1003 }, linkedBoot,
  ]));
  assert.equal(r.status, 'replacement-with-lifecycle-signal');
  assert.deepEqual(r.departureSignals, [{ kind: 'pagehide', at: 13300 }]);
});
test('a discrepancy alone, a different source, or a start after the run cannot bridge documents', () => {
  for (const events of [
    [linkedBoot],
    [{ ...capturedStart, sourceCommit: 'b'.repeat(40) }, linkedBoot],
    [{ ...capturedStart, at: 2500 }, linkedBoot],
    [{ ...capturedStart, documentStartedAt: 1006 }, { ...linkedBoot, previousDocumentStartedAt: 1006 }],
    [capturedStart, { kind: 'document-start', at: 5000, documentStartedAt: 4900, sourceCommit }, linkedBoot],
    [capturedStart, { ...capturedStart, at: 1600, documentStartedAt: 1004 }, linkedBoot],
  ]) assert.equal(crashRecoveryBoundary(summary, driftedTail, lifecycle(events)).status, 'replacement-not-observed');
  for (const changed of [{ ...driftedTail, build: {} }, { ...driftedTail, startedAt: undefined }, { ...driftedTail, startedAt: 11000 }])
    assert.equal(crashRecoveryBoundary(summary, changed, lifecycle([capturedStart, linkedBoot])).status, 'replacement-not-observed');
});
test('small-origin recovery still requires both same-tab sources and an open run', () => {
  const events = lifecycle([capturedStart, linkedBoot]);
  assert.equal(crashRecoveryBoundary(summary, { ...driftedTail, evidenceSource: 'origin-fallback-may-be-another-tab' }, events).status, 'tab-correlation-unavailable');
  assert.equal(crashRecoveryBoundary(summary, driftedTail, { ...events, evidenceSource: 'latest-origin-copy-may-be-another-tab' }).status, 'tab-correlation-unavailable');
  assert.equal(crashRecoveryBoundary({ ...summary, state: 'closed' }, driftedTail, events).status, 'closed-run');
});
