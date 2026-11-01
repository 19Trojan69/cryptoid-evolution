import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeNative } from './nativeSummary.mjs';
const source = 'a'.repeat(40);
function capture() {
  return { sourceCommit: source, sourceTree: 'b'.repeat(40), engine: 'chromium', condition: 'original',
    run: 'soak', physicalDevice: false, whiteScreenFixed: false, complete: true, normalReportVerified: true,
    clocksAccelerated: false, automaticResume: false, additionalFullRecording: false,
    cycles: [1200001, 10001, 10002].map((observedActiveMs, index) => ({ complete: true,
      observedActiveMs, requestedMs: index ? 10000 : 1200000, observedWallMs: observedActiveMs + 10,
      volleysAdvanced: index ? 2 : 400, normalExitVerified: true, pauseFreezeVerified: true,
      weaponRoundtripVerified: true, qaInspectionBridgeReleased: true,
      points: [{ activeMs: 1000, linuxBrowserDescendantPssKiB: 450000 },
        { activeMs: observedActiveMs - 1000, linuxBrowserDescendantPssKiB: 460000 }] })) };
}
test('a successful 30-second smoke observation is never a twenty-minute acceptance', () => {
  const data = capture(); data.run = 'smoke'; data.cycles[0].observedActiveMs = 30001; data.cycles[0].requestedMs = 30000;
  data.cycles[0].points[1].activeMs = 29000;
  assert.equal(summarizeNative(data, source).twentyMinuteLinuxObservationCompleted, false);
});
test('a complete duration with all UI cleanup remains Linux evidence only', () => {
  const result = summarizeNative(capture(), source);
  assert.equal(result.twentyMinuteLinuxObservationCompleted, true);
  assert.equal(result.physicalPhoneAcceptanceEstablished, false); assert.equal(result.whiteScreenFixed, false);
});
test('a false complete flag cannot bypass missing teardown or a failed final report', () => {
  const data = capture(); data.cycles[2].normalExitVerified = false;
  assert.throws(() => summarizeNative(data, source));
  const report = capture(); report.normalReportVerified = false;
  assert.throws(() => summarizeNative(report, source));
});
test('a startup gap without a measured interval stays a failed, unmeasured observation', () => {
  const data = capture(); data.complete = false; data.cycles = [{ complete: false, requestedMs: 30000, points: [] }];
  data.failure = { code: 'verification-failed', message: 'one recorded initial gap' };
  const result = summarizeNative(data, source);
  assert.equal(result.measuredActiveMs, null); assert.equal(result.twentyMinuteLinuxObservationCompleted, false);
  assert.equal(result.linuxProcessPss.maximumKiB, null);
});
test('wrong sources and a reversed sample timeline reject evidence', () => {
  assert.throws(() => summarizeNative(capture(), 'c'.repeat(40)));
  const data = capture(); data.cycles[0].points.reverse();
  assert.throws(() => summarizeNative(data, source));
});
