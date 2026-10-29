import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

// Offline analysis only: consume existing synthetic captures, never a device
// report, live browser, collector, account or deployed application.
const root = new URL('../../', import.meta.url);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = [
  { kind: 'duration', path: 'verification/boss2-return-duration-20261029/evidence/synthetic-duration-evidence.json.gz',
    bytes: 59743, sha256: 'b1913273cf5c5275a945a09c4972d7ed05865105b738d141b9cea3a521b3a983' },
  { kind: 'heap', path: 'verification/boss2-heap-retention-20261029/evidence/synthetic-heap-summaries.json.gz',
    bytes: 317167, sha256: '65ff0c00483abb2623bd455c795ee59d37de05c8282c5e61bf83945b6c3f3f18' },
  { kind: 'filters', path: 'verification/boss2-css-filter-attribution-20261029/evidence/synthetic-filter-measurements.json.gz',
    bytes: 53698, sha256: '9945d119edd8387e316dbf4fa1eda04fcc70cb2fb2ae4acba9038b2a2da7db5e' },
  { kind: 'built-filter-preview', path: 'verification/boss2-css-filter-attribution-20261029/evidence/synthetic-built-preview-verifications.json.gz',
    bytes: 13518, sha256: 'c2401151627cfea0a0bac66f1719d754e10c1a522f86ffdbd97fefbea123b073' },
];
const sourcePins = {
  'frontend/src/pages/gameAudio.ts': '3aeb4ca63260573b38d2b753bda61461eb2d4191beae2aac072ce722657077a8',
  'frontend/src/pages/musicPlayback.ts': 'adfd371b7afff15c45ceefd71a71d993a4f5d5dc30f7ab43de001e0168b813eb',
  'frontend/src/pages/CanvasEffects.tsx': 'a3175a169a00e6269c02a16393f09d93fd77834efac816763f2cdb50e7255eeb',
  'frontend/src/pages/resourceCache.ts': '952fb2d2517898a4aaf6d94091fd1506bcea547ca642d77ccc919a9965bc8ff1',
  'frontend/src/pages/paintedShip.ts': 'd05431e5655b3b1a46d989da7bf19599163be93f00d54401354f7952cac61682',
  'frontend/src/pages/bossWeaponTextures.ts': '4c7b35ba5ed92ca1e8694562929fe9b9bd2d588f9fe937a555e120c55ed8dec0',
  'frontend/src/pages/bossWeaponRenderer.ts': 'fe9a3004aa0125f04f1f442e73e4cd087ab3edaf9312a6fc2e7c8c5ff03be579',
  'frontend/src/pages/BossWeaponsView.tsx': '1b1ddbbaa33d400804a1f4e12e4413a08fdcc6e6e49699a0824c1e8cfcaf511c',
  'frontend/src/pages/Starfield.tsx': 'a3857a6452f79a16a645df8b1e4e29c52dba3f0ef4a8fbd08e92c015214ff638',
  'frontend/src/lib/cssFramePacing.ts': '4155660b00d827922168660c313f9d625ee120222e008d02f795c34418f35846',
  'frontend/src/lib/nativeFrameEasing.ts': 'ef4af28072849c78d464b9022bb625daf3db0cf5427429c551576280e125a702',
  'frontend/src/pages/GamePage.tsx': '6b500123cb1443bbcb52809f0dbd06520ea0aee02a550ec346ab5ce1f186f277',
};
for (const [path, expected] of Object.entries(sourcePins))
  assert.equal(sha256(readFileSync(new URL(path, root))), expected, path + ' exact reviewed source');

const numeric = (value, label) => {
  assert.ok(Number.isFinite(value) && value >= 0, label + ': finite nonnegative measurement required');
  return value;
};
const stats = values => ({ first: values[0], minimum: Math.min(...values), maximum: Math.max(...values),
  last: values.at(-1), constantAcrossSamples: values.every(value => value === values[0]) });
const median = values => {
  assert.ok(values.length);
  const ordered = [...values].sort((a, b) => a - b), middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
};
const audioFields = ['audioVoices', 'audioWeaponVoices', 'audioBossVoices', 'audioEffectVoices',
  'audioSampleBuffers', 'audioBufferBytes', 'audioRockBuffers', 'audioClockStalls', 'audioBlockedSounds', 'audioReapedVoices'];
const canvasFields = ['registeredEffects', 'retainedHullUsers', 'sourceImages', 'textureEntries',
  'cacheBytes', 'imageBytes', 'textureBytes', 'surfaceBytes', 'hullLoads', 'hullEvictions'];
const cases = [], excluded = [];
for (const input of inputs) {
  const raw = readFileSync(new URL(input.path, root));
  assert.equal(raw.length, input.bytes, input.path + ' bytes');
  assert.equal(sha256(raw), input.sha256, input.path + ' digest');
  const data = JSON.parse(gunzipSync(raw).toString('utf8'));
  let entries;
  if (input.kind === 'heap') entries = Object.entries(data.cases).map(([duration, verification]) =>
    ({ condition: duration, runId: 40880149703, verification }));
  else entries = data.cases ?? data.captures;
  assert.ok(Array.isArray(entries));
  for (const entry of entries) {
    const v = entry.verification;
    const condition = entry.condition ?? entry.case ?? v.condition;
    const runId = entry.runId ?? (input.kind === 'built-filter-preview' ? 40906805249 : null);
    const identity = { group: input.kind, engine: v.engine, condition, runId,
      originalComplete: v.complete, input: input.path };
    if (v.complete !== true || v.diagnostics !== false || input.kind === 'duration' && v.requestedSeconds !== 360) {
      excluded.push({ ...identity, sampleCount: v.points?.length ?? 0,
        reason: v.complete !== true ? 'original overall failure preserved; not a completed control'
          : 'recording-on control outside this recording-off resource analysis' });
      continue;
    }
    assert.equal(v.physicalDevice, false);
    assert.equal(v.protection, true);
    const points = v.points;
    assert.ok(Array.isArray(points) && points.length > 0, 'complete case must contain actual resource samples');
    let previous = -Infinity;
    for (const point of points) {
      const seconds = numeric(point.seconds ?? point.elapsedSeconds, 'sample time');
      assert.ok(seconds >= previous, 'ordered active samples'); previous = seconds;
      for (const field of audioFields) numeric(point.audio?.[field], 'audio.' + field);
      for (const field of canvasFields) numeric(point.canvas?.[field], 'canvas.' + field);
      assert.equal(point.audio.audioVoices, point.audio.audioWeaponVoices + point.audio.audioEffectVoices);
      assert.ok(point.audio.audioBossVoices <= point.audio.audioWeaponVoices);
      assert.equal(point.canvas.cacheBytes, point.canvas.imageBytes + point.canvas.textureBytes);
      assert.deepEqual(point.canvas.failures, [], 'no captured Canvas fallback failure');
    }
    const audio = Object.fromEntries(audioFields.map(field => [field, stats(points.map(point => point.audio[field]))]));
    const canvas = Object.fromEntries(canvasFields.map(field => [field, stats(points.map(point => point.canvas[field]))]));
    const sampleSeconds = points.map(point => point.seconds ?? point.elapsedSeconds);
    const duration = v.observedActiveSeconds;
    assert.ok(Number.isFinite(duration) && duration >= sampleSeconds.at(-1));
    const memory = point => numeric(point.process?.summedPssKiB ?? point.summedPssKiB ?? point.pssKiB, 'Linux PSS');
    const last30 = points.filter((_, i) => sampleSeconds[i] >= duration - 30);
    assert.ok(last30.length > 0);
    cases.push({ ...identity, activeSeconds: duration, sampleCount: points.length,
      lastSampleSeconds: sampleSeconds.at(-1), volleyProgress: v.volleyProgress,
      resourceSampling: 'approximately once per second; sampled maxima, not continuous peaks', audio, canvas,
      last30MedianLinuxDescendantPssKiB: median(last30.map(memory)),
      postObservationCollection: input.kind === 'heap',
      sampledResourcesAreNotTotalProcessRam: true });
  }
}
assert.equal(cases.length, 14, 'all fourteen independent completed recording-off captures');
assert.equal(excluded.length, 12, 'original failures and recording-on controls remain explicit');
const max = (kind, field) => Math.max(...cases.map(c => c[kind][field].maximum));
const result = {
  schemaVersion: 1,
  analysis: 'offline resource-lifetime audit of previously captured Linux guest Boss-2 scenes',
  sourcePins, inputs,
  newBrowserRuns: 0, applicationChanges: false, deploymentChanges: false,
  physicalDeviceMeasurement: false, whiteScreenCauseEstablished: false, whiteScreenFixed: false,
  pendingPhysicalControl: {
    sourceCommit: '417cc1b0242d5cb11ca3d2ab826111e542523774',
    url: 'https://cryptoid-evolution-testnet-eb5f8lafa-19-trojan69.vercel.app/',
    outcome: 'pending; no owner observation supplied for this complete-filter-off control',
  },
  aggregate: {
    completedCaptures: cases.length, samples: cases.reduce((sum, c) => sum + c.sampleCount, 0),
    allSampleBufferCountsConstant: cases.every(c => c.audio.audioSampleBuffers.constantAcrossSamples),
    allSampleBufferBytesConstant: cases.every(c => c.audio.audioBufferBytes.constantAcrossSamples),
    sampleBufferCounts: [...new Set(cases.map(c => c.audio.audioSampleBuffers.first))],
    decodedEffectsBufferBytesByEngine: Object.fromEntries(['chromium', 'webkit'].map(engine => [engine,
      [...new Set(cases.filter(c => c.engine === engine).map(c => c.audio.audioBufferBytes.first))]])),
    maximumObservedAudioVoices: max('audio', 'audioVoices'),
    maximumObservedCanvasCacheBytes: max('canvas', 'cacheBytes'),
    maximumObservedCanvasSurfaceBytes: max('canvas', 'surfaceBytes'),
    maximumObservedCanvasImages: max('canvas', 'sourceImages'),
    maximumObservedCanvasTextureEntries: max('canvas', 'textureEntries'),
    maximumObservedRegisteredEffects: max('canvas', 'registeredEffects'),
    maximumObservedRetainedHullUsers: max('canvas', 'retainedHullUsers'),
    maximumObservedRockBuffers: max('audio', 'audioRockBuffers'),
    observedAudioClockStalls: max('audio', 'audioClockStalls'),
    observedBlockedSounds: max('audio', 'audioBlockedSounds'),
  },
  limitations: [
    'Only the protected Boss-2 reactor fixture is covered; unseeded workload and simulated progress differ across runs.',
    'Resource counters cover registered effect buffers and the ordinary-impact Canvas cache/surface, not all game images or all graphics allocations.',
    'Music decoding/media state, browser image/compositor/driver caches, total native phone memory and temperature are outside these counters.',
    'Do not subtract these overlapping logical counters from process PSS to invent a residual GPU or leak size.',
    'Cumulative hullLoads, hullEvictions and draws count completed work, not live retained objects.',
    'Approximately one-second observations can miss short peaks; stable sampled counts cannot rule out browser-internal retention or device-specific faults.',
    'Heap-capture runs were collected only after the active interval and are not untouched post-observation process measurements.',
    'No new physical test, universal smartphone stability, campaign acceptance or White Screen fix is established.',
  ],
  excluded, cases,
};
const output = new URL('results.json', import.meta.url);
writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log('CRYPTOID_RESOURCE_LIFETIME_AUDIT ' + JSON.stringify({ output: fileURLToPath(output), ...result.aggregate }));
