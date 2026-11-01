import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeReport, summarizeReports } from './reportAnalysis.mjs';
const source = 'a'.repeat(40), tree = 'b'.repeat(40);
function report(mode = 'running', elapsedMs = 550312) {
  const clock = { id: 'synthetic-run', source, startedAt: 1_000_000,
    updatedAt: 1_600_000, elapsedMs, mode };
  return { format: 'cryptoid-isolated-boss2-device-report', source: { sourceCommit: source, sourceTree: tree },
    stopwatch: { latest: clock }, briefDiagnostics: { latest: { clock: { ...clock },
      options: { scene: 'reactor', fullRecording: false, protection: true } } },
    returnEvidence: { lastSession: { at: 1_599_900, active: true, context: { status: 'playing' } },
      activeDocument: { startedAt: 1_600_200 }, reloadTrace: { events: [
        { kind: 'boot-after-active-session', at: 1_600_800, context: { status: 'playing' } },
      ] } } };
}
function full() {
  const records = [
    { seq: 1, clockMs: 2, kind: 'lifecycle', data: { signal: 'app-boot' } },
    { seq: 2, clockMs: 2005, kind: 'sample', data: { pacing: { simulatedMs: 2000, wallMs: 2000 } } },
    { seq: 3, clockMs: 62_005, kind: 'sample', data: { pacing: { simulatedMs: 1000, wallMs: 1000 } } },
  ];
  return { format: 'cryptoid-full-session-report', summary: { build: { sourceCommit: source, sourceTree: tree },
    startedAt: 1_000_000, lastAt: 1_062_005, state: 'recording', count: 3 }, records,
    integrity: { contiguous: true, errors: [], records: 3 } };
}
test('the same source with a normal 10:56 end and a 09:10 return never becomes a stable control', () => {
  const result = summarizeReports([report('ended', 656318), report()]);
  assert.equal(result.sourceConditions.length, 1);
  assert.equal(result.sourceConditions[0].recordedEnds, 1);
  assert.equal(result.sourceConditions[0].abruptReturnSignals, 1);
  assert.equal(result.sourceConditions[0].hasStableReleaseProof, false);
});
test('16:02 is a saved checkpoint, not an exact crash time or an improvement certificate', () => {
  const row = analyzeReport(report('running', 962934));
  assert.equal(row.savedStopwatchMs, 962934);
  assert.equal(row.abruptReturnSignal, true);
  assert.equal(row.continuousDeviceStabilityEstablished, false);
  assert.equal(row.nativeTerminationCauseEstablished, false);
});
test('no clock and an options history alone do not assign time or a matched condition', () => {
  const input = report(); delete input.stopwatch; delete input.briefDiagnostics;
  input.testOptionsHistory = [{ diagnostics: false, scene: 'reactor', protection: true }];
  const row = analyzeReport(input);
  assert.equal(row.savedStopwatchMs, null); assert.equal(row.matchedOptions, null);
  assert.equal(row.abruptReturnSignal, false);
});
test('reporting build and retained run build stay distinct', () => {
  const input = report(); input.source.sourceCommit = 'c'.repeat(40);
  const row = analyzeReport(input);
  assert.equal(row.sourceCommit, source); assert.equal(row.reportingSourceCommit, 'c'.repeat(40));
  assert.equal(row.savedStopwatchMs, null); assert.equal(row.sourceTree, null);
  assert.equal(row.abruptReturnSignal, false); assert.equal(row.matchedOptions, null);
});
test('a false match flag cannot substitute for identical brief/stopwatch identities', () => {
  const input = report(); input.briefMatchesLatestStopwatch = true;
  input.briefDiagnostics.latest.clock.id = 'another-run';
  const row = analyzeReport(input);
  assert.equal(row.briefMatchesStopwatch, false); assert.equal(row.matchedOptions, null);
});
test('an older boot event cannot be attributed to the current saved clock', () => {
  const input = report(); input.returnEvidence.lastSession.at -= 70_000;
  assert.equal(analyzeReport(input).abruptReturnSignal, false);
});
test('full-session wall span and captured simulation are separate measurements', () => {
  const row = analyzeReport(full());
  assert.equal(row.recordedDocumentSpanMs, 62005);
  assert.equal(row.capturedSimulationMs, 3000);
  assert.equal(row.capturedActiveWallMs, 3000);
  assert.equal(row.normalEndRecorded, false);
  assert.equal(row.outcome, 'open-or-limited-recording');
});
test('sequence corruption is detected independently of the supplied integrity flag', () => {
  const input = full(); input.records[2].seq = 2;
  const row = analyzeReport(input);
  assert.equal(row.recordIntegrityValid, false); assert.equal(row.capturedSimulationMs, null);
});
test('nonfinite, negative and impossible timing data never count as active time', () => {
  for (const value of [-1, Infinity, NaN, 2001.1]) {
    const input = full(); input.records[1].data.pacing.simulatedMs = value;
    assert.equal(analyzeReport(input).capturedSimulationMs, null);
  }
});
test('a limited recorder and an ended recorder require different evidence', () => {
  const input = full(); input.summary.state = 'limited';
  assert.equal(analyzeReport(input).normalEndRecorded, false);
  input.summary.state = 'closed';
  assert.equal(analyzeReport(input).normalEndRecorded, false);
  input.records[2] = { seq: 3, clockMs: 62005, kind: 'end', data: { operation: 'finish' } };
  assert.equal(analyzeReport(input).normalEndRecorded, true);
});
test('technical summaries exclude arbitrary account, contact, URL and error fields', () => {
  const input = report(); input.account = 'private-account';
  input.briefDiagnostics.latest.events = [{ raw: 'private-touch-history' }];
  input.exception = 'private-error'; input.url = 'private-url';
  const text = JSON.stringify(analyzeReport(input));
  assert.doesNotMatch(text, /private-account|private-touch-history|private-error|private-url/);
});
