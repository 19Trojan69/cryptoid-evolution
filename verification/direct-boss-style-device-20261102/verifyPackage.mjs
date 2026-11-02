import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const directory = new URL('../boss2-forensics-20261028/results/device-preview/site/', import.meta.url);
const info = JSON.parse(readFileSync(new URL('device-preview-info.json', directory)));
const expected = JSON.parse(readFileSync(new URL('../local-boss-style-20261102/evidence/expected-builds.json', import.meta.url)));
assert.deepEqual(info.qaLocalBossStyle, expected.leaves);
assert.equal(info.qaClockGapProbe, undefined); assert.equal(info.directStyleDeviceCandidate.activeFrameProbeIncluded, false);
assert.equal(info.directStyleDeviceCandidate.activeClockTraceIncluded, false);
assert.equal(info.directStyleDeviceCandidate.physicalDeviceAccepted, false); assert.equal(info.directStyleDeviceCandidate.whiteScreenFixed, false);
assert.equal(info.diagnosticScene, 'original-artwork'); assert.equal(info.guestOnly, true);
for (const key of ['liveBackend', 'actualPiAuthentication', 'payments', 'automaticUpload', 'automaticResume']) assert.equal(info[key], false);
const digest = file => createHash('sha256').update(readFileSync(new URL(file, directory))).digest('hex');
assert.equal(info.diagnosticStopwatch.stateSha256, digest('diagnostic-stopwatch-state.js'));
assert.equal(info.diagnosticStopwatch.browserSha256, digest('diagnostic-stopwatch.js'));
console.log('CRYPTOID_DIRECT_STYLE_DEVICE_PACKAGE ' + JSON.stringify({ passed: true, sourceCommit: info.sourceCommit,
  activeScalarProbeIncluded: false, whiteScreenFixed: false }));
