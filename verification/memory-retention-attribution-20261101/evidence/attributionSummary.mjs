import assert from 'node:assert/strict';

export const measuredSource = '9cfe6ae1df777524d84c1a7301694490a4ed3a13';
export const measuredTree = '44fe46c19cfd3d13838866457ea9cbadf6c153f7';
const natural = value => Number.isSafeInteger(value) && value >= 0;
const finite = value => Number.isFinite(value) && value >= 0;
const median = values => {
  assert.ok(values.length); const ordered = [...values].sort((a, b) => a - b), middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
};
const schema = [
  ['paused-before-gc', 'paused', false], ['paused-settled-before-gc', 'paused', false],
  ['paused-after-gc', 'paused', true], ['paused-after-snapshot', 'paused', false],
  ['home-before-gc', 'unmounted', false], ['home-settled-before-gc', 'unmounted', false],
  ['home-after-gc', 'unmounted', true], ['home-after-snapshot', 'unmounted', false],
  ['blank-before-gc', 'blank', false], ['blank-after-gc', 'blank', true],
];

// PSS belongs to observed Linux processes. The GPU process is a process role,
// not a measurement of GPU-resident memory or a native allocator attribution.
export function processPss(memory) {
  assert.equal(memory.available, true); assert.equal(memory.contentProcessObserved, true);
  assert.ok(Array.isArray(memory.processes) && memory.processes.length);
  const roles = {};
  for (const process of memory.processes) {
    assert.ok(['chromium-renderer', 'chromium-gpu', 'browser-other'].includes(process.role));
    assert.ok(natural(process.pssKiB));
    roles[process.role] = (roles[process.role] || 0) + process.pssKiB;
  }
  assert.equal(Object.values(roles).reduce((a, b) => a + b, 0), memory.summedPssKiB,
    'Every reported PSS byte is accounted for once by process role');
  assert.ok('chromium-renderer' in roles);
  return { totalKiB: memory.summedPssKiB, byRoleKiB: roles };
}

function resources(stats) {
  assert.ok(stats);
  assert.equal(stats.css.mode, 'native-easing'); assert.equal(stats.css.targetHz, 60);
  assert.equal(stats.css.jsFrameWrites, 0);
  for (const key of ['active', 'configured', 'fallbacks']) assert.ok(natural(stats.css[key]));
  assert.ok(stats.css.configured >= stats.css.active);
  for (const key of ['painted', 'sources', 'pending', 'retained', 'retainCount', 'sourceRetained', 'sourceRetainCount'])
    assert.ok(natural(stats.painted[key]));
  assert.ok(finite(stats.painted.estimatedBytes));
  for (const key of ['registeredEffects', 'sourceImages', 'textureEntries', 'retainedHullUsers'])
    assert.ok(natural(stats.canvas[key]));
  for (const key of ['cacheBytes', 'surfaceBytes']) assert.ok(finite(stats.canvas[key]));
  assert.equal(typeof stats.canvas.activeDrawFrame, 'boolean');
  assert.deepEqual(stats.canvas.failures, [], 'Capture must preserve a graphics failure as a failure');
}

// This validates a completed attribution protocol. A one-minute control cannot
// become a twenty-minute result, and neither becomes physical phone acceptance.
export function summarizeAttribution(capture) {
  assert.equal(capture.version, 1); assert.equal(capture.sourceCommit, measuredSource);
  assert.equal(capture.sourceTree, measuredTree); assert.equal(capture.complete, true);
  assert.equal(capture.failure, undefined); assert.equal(capture.actualHostOS, 'linux');
  assert.equal(capture.condition, 'original-artwork'); assert.ok([60, 1200].includes(capture.requestedSeconds));
  for (const key of ['physicalDevice', 'physicalPiBrowser', 'whiteScreenFixed', 'nativeTerminationCauseMeasured',
    'clocksAccelerated', 'automaticResume', 'fullRecording', 'randomnessSeeded', 'activeHeapProfilerAttached',
    'activeForcedGc', 'activeHeapSnapshots', 'activeScreenshots', 'activeNativeAnimationScans'])
    assert.equal(capture[key], false, key);
  for (const key of ['collisionProtection', 'qaReadsExistingModuleCounters', 'snapshotsOnlyAfterInactiveGate',
    'qaControllerBridgeRemoved', 'explicitBlankDocumentControl']) assert.equal(capture[key], true, key);
  assert.equal(capture.buildProof.originalArtworkRetained, true);
  for (const key of ['capturesGameInstance', 'newAppTimersOrFrames', 'activeNativeAnimationScan', 'cleanupPolicyChanged',
    'shippedRuntimeSourceEdited']) assert.equal(capture.buildProof[key], false, key);
  assert.ok(finite(capture.observedActiveMs) && capture.observedActiveMs >= capture.requestedSeconds * 1000);
  assert.ok(finite(capture.observedWallMs) && capture.observedWallMs >= capture.requestedSeconds * 1000);
  assert.ok(capture.volleysAdvanced > 0);
  assert.ok(capture.points.length >= Math.floor(capture.requestedSeconds / 6));
  assert.equal(capture.points[0].activeMs, 0);
  for (let index = 0; index < capture.points.length; index++) {
    const point = capture.points[index]; assert.ok(finite(point.activeMs));
    assert.ok(point.activeMs <= capture.observedActiveMs); processPss(point.memory);
    resources({ css: point.css, painted: point.painted, canvas: point.canvas });
    if (index) {
      const delta = point.activeMs - capture.points[index - 1].activeMs;
      assert.ok(delta > 0 && delta <= 15000, 'Ordered sample coverage');
    }
  }
  assert.ok(capture.observedActiveMs - capture.points.at(-1).activeMs <= 15000);
  assert.deepEqual(capture.checkpoints.map(row => [row.label, row.phase, row.forcedGc]), schema,
    'Keep pre-GC, GC, snapshot-perturbed and blank states distinct');
  for (const row of capture.checkpoints) {
    assert.equal(row.sameGameDocument, row.phase !== 'blank');
    assert.equal(row.mounted, row.phase === 'paused');
    if (row.phase === 'blank') assert.equal(row.stats, null); else resources(row.stats);
    for (const key of ['usedSize', 'totalSize', 'embedderHeapUsedSize', 'backingStorageSize']) assert.ok(finite(row.heap[key]));
    for (const key of ['documents', 'nodes', 'jsEventListeners']) assert.ok(natural(row.dom[key]));
    processPss(row.memory);
  }
  assert.deepEqual(capture.snapshots.map(row => [row.label, row.phase]), [['paused', 'paused'], ['home', 'unmounted']]);
  for (const snapshot of capture.snapshots) {
    assert.equal(snapshot.activePlay, false); assert.equal(snapshot.afterExplicitInactiveGc, true);
    assert.match(snapshot.sha256, /^[0-9a-f]{64}$/);
    for (const key of ['bytes', 'compressedBytes', 'nodes', 'selfBytes']) assert.ok(natural(snapshot[key]) && snapshot[key] > 0);
  }
  const maxima = (group, key) => Math.max(...capture.points.map(point => point[group][key]));
  const firstMinute = capture.points.filter(row => row.activeMs < 60000);
  const lastMinute = capture.points.filter(row => row.activeMs >= capture.observedActiveMs - 60000);
  const checkpoints = capture.checkpoints.map(row => ({ label: row.label,
    pss: processPss(row.memory), usedJsBytes: row.heap.usedSize, embedderHeapUsedBytes: row.heap.embedderHeapUsedSize,
    backingStorageBytes: row.heap.backingStorageSize, dom: row.dom, attached: row.attached,
    cssActive: row.stats?.css.active ?? null, paintedPins: row.stats?.painted.retainCount ?? null,
    canvasCacheBytes: row.stats?.canvas.cacheBytes ?? null, canvasSurfaceBytes: row.stats?.canvas.surfaceBytes ?? null }));
  const home = capture.checkpoints.find(row => row.label === 'home-after-gc');
  return { sourceCommit: capture.sourceCommit, sourceTree: capture.sourceTree,
    requestedSeconds: capture.requestedSeconds, observedActiveMs: capture.observedActiveMs,
    observedWallMs: capture.observedWallMs, volleysAdvanced: capture.volleysAdvanced,
    completeAttributionCapture: true, completedTwentyMinuteLinuxObservation: capture.requestedSeconds === 1200,
    actualInstalledPackages: capture.actualInstalledPackages, engineVersion: capture.engineVersion,
    processPssKiB: { firstMinuteMedian: median(firstMinute.map(row => row.memory.summedPssKiB)),
      lastMinuteMedian: median(lastMinute.map(row => row.memory.summedPssKiB)),
      peakSample: Math.max(...capture.points.map(row => row.memory.summedPssKiB)) },
    sampledMaxima: { cssActive: maxima('css', 'active'), cssConfiguredCumulative: maxima('css', 'configured'),
      paintedPins: maxima('painted', 'retainCount'), paintedEstimatedBytes: maxima('painted', 'estimatedBytes'),
      canvasCacheBytes: maxima('canvas', 'cacheBytes'), canvasSurfaceBytes: maxima('canvas', 'surfaceBytes') },
    checkpoints,
    observedHomeOwnershipReleased: home.stats.css.active === 0 && home.stats.painted.retainCount === 0
      && home.stats.canvas.cacheBytes === 0 && home.stats.canvas.surfaceBytes === 0
      && home.stats.canvas.registeredEffects === 0 && home.stats.canvas.activeDrawFrame === false
      && home.attached.canvases === 0 && home.attached.nativeAnimations === 0,
    physicalPhoneAcceptanceEstablished: false, permanentLeakProven: false, whiteScreenFixed: false };
}
