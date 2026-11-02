import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { summarizeFlow, classifyFlows } from './summary.mjs';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url)));
const m = read('manifest.json');
function actual(engine) { const cell = m.captures.find(c => c.label === 'initial' && c.engine === engine); return { cell, c: read(cell.observation.file) }; }
test('the real first WebKit failures preserve premature frame-zero clock starts without claiming native crashes or phone acceptance', () => {
  const initial = m.captures.filter(c => c.label === 'initial'); assert.equal(initial.length, 8);
  const rows = initial.map(cell => summarizeFlow(read(cell.observation.file), cell)), result = classifyFlows(rows);
  assert.equal(result.retainedFailures, 4); assert.equal(result.cohorts[0].prematureClockStartFailures, 4);
  assert.equal(result.cohorts[0].allEightShortFlowsPassed, false); assert.equal(result.cohorts[0].completeFourConditionLongStage, false);
  for (const r of rows.filter(r => r.cell.engine === 'webkit')) {
    assert.equal(r.prematureClockStartEdges.length, 1); assert.ok(r.prematureClockStartEdges[0].sampleGapMs < 300);
    assert.equal(r.prematureClockStartEdges[0].previousFrames, 0); assert.equal(r.prematureClockStartEdges[0].currentFrames, 0);
    assert.equal(r.physicalPhoneAcceptanceEstablished, false); assert.equal(r.whiteScreenFixed, false);
  }
});
test('completed Chromium UI cycles require real active time, volleys, pause, weapons, exit, bridge release and normal report', () => {
  const { cell, c } = actual('chromium'); assert.equal(summarizeFlow(c, cell).completedUiCycles, 3);
  for (const change of [c => c.cycles[0].observedActiveMs = 59999, c => c.cycles[1].weaponRoundtripVerified = false,
    c => c.cycles[2].frameProbeReleased = false, c => c.normalReportVerified = false, c => c.automaticResume = true,
    c => c.clockGapBuildProof.newTimers = true, c => c.sourceTree = '0'.repeat(40)]) {
    const broken = structuredClone(c); change(broken); assert.throws(() => summarizeFlow(broken, cell));
  }
});
test('failed initial captures and missing long stages remain present in the combined archive', () => {
  const rows = m.captures.map(cell => summarizeFlow(read(cell.observation.file), cell));
  const result = classifyFlows(rows); assert.ok(result.retainedFailures >= 4); assert.equal(result.whiteScreenFixed, false);
  assert.throws(() => classifyFlows([rows[0], rows[0]]));
  const f = actual('webkit'); f.c.complete = true; assert.throws(() => summarizeFlow(f.c, f.cell));
});
