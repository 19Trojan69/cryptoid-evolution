import assert from 'node:assert/strict';

const median = values => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const max = values => values.length ? Math.max(...values) : null;
const finite = value => Number.isFinite(value) && value >= 0;

// Offline acceptance of synthetic evidence. A successful short smoke flow,
// source mismatch or incomplete UI teardown must never become a 20-minute pass.
export function summarizeNative(record, expectedSource, minimumMs = 1_200_000) {
  assert.equal(record.sourceCommit, expectedSource, 'Exact measured source');
  assert.ok(['chromium', 'webkit'].includes(record.engine));
  assert.ok(['original', 'mini-start'].includes(record.condition));
  assert.ok(['smoke', 'soak'].includes(record.run));
  assert.equal(record.physicalDevice, false); assert.equal(record.whiteScreenFixed, false);
  assert.equal(record.clocksAccelerated, false); assert.equal(record.automaticResume, false);
  assert.equal(record.additionalFullRecording, false);
  const cycle = record.cycles?.[0];
  const durationComplete = record.complete === true && record.run === 'soak'
    && finite(cycle?.observedActiveMs) && cycle.observedActiveMs >= minimumMs;
  if (record.complete === true) {
    assert.equal(record.normalReportVerified, true, 'Final normal report verified');
    assert.equal(record.cycles.length, 3, 'Three complete UI lifecycles required');
    for (const run of record.cycles) {
      assert.equal(run.complete, true);
      assert.equal(run.normalExitVerified, true);
      assert.equal(run.pauseFreezeVerified, true);
      assert.equal(run.weaponRoundtripVerified, true);
      assert.equal(run.qaInspectionBridgeReleased, true);
      assert.ok(finite(run.observedActiveMs) && run.observedActiveMs >= run.requestedMs);
      assert.ok(run.volleysAdvanced > 0);
    }
  }
  const points = cycle?.points ?? [];
  for (let index = 0; index < points.length; index++) {
    assert.ok(finite(points[index].activeMs));
    assert.ok(Number.isFinite(points[index].linuxBrowserDescendantPssKiB));
    if (index) assert.ok(points[index].activeMs >= points[index - 1].activeMs);
  }
  const pss = points.map(point => point.linuxBrowserDescendantPssKiB);
  const firstMinute = points.filter(point => point.activeMs < 60_000);
  const lastMinute = points.filter(point => point.activeMs >= (cycle?.observedActiveMs ?? Infinity) - 60_000);
  const sampledMax = (group, key) => max(points.map(point => point[group]?.[key]).filter(finite));
  return {
    engine: record.engine, condition: record.condition, run: record.run,
    sourceCommit: record.sourceCommit, sourceTree: record.sourceTree,
    completed: record.complete === true, twentyMinuteLinuxObservationCompleted: durationComplete,
    measuredActiveMs: cycle?.observedActiveMs ?? null,
    measuredWallMs: cycle?.observedWallMs ?? null,
    cyclesCompleted: record.cycles?.filter(run => run.complete).length ?? 0,
    volleyProgress: cycle?.volleysAdvanced ?? null,
    linuxProcessPss: { samples: pss.length, firstKiB: pss[0] ?? null, lastKiB: pss.at(-1) ?? null,
      maximumKiB: max(pss), firstMinuteMedianKiB: median(firstMinute.map(point => point.linuxBrowserDescendantPssKiB)),
      lastMinuteMedianKiB: median(lastMinute.map(point => point.linuxBrowserDescendantPssKiB)) },
    sampledResourceMaxima: { canvasSourceImages: sampledMax('canvas', 'sourceImages'),
      canvasTextureEntries: sampledMax('canvas', 'textureEntries'), canvasCacheBytes: sampledMax('canvas', 'cacheBytes'),
      canvasSurfaceBytes: sampledMax('canvas', 'surfaceBytes'), effects: max(points.map(point => point.effects).filter(finite)),
      audioVoices: sampledMax('audio', 'audioVoices'), audioSampleBuffers: sampledMax('audio', 'audioSampleBuffers'),
      audioClockStalls: sampledMax('audio', 'audioClockStalls') },
    failure: record.failure ? { code: record.failure.code, message: record.failure.message } : null,
    physicalPhoneAcceptanceEstablished: false, whiteScreenFixed: false,
  };
}
