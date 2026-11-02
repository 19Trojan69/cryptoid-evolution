import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import '../direct-boss-style-device-20261102/verifyPackage.mjs';

const site = new URL('../boss2-forensics-20261028/results/device-preview/site/', import.meta.url);
const info = JSON.parse(readFileSync(new URL('device-preview-info.json', site)));
assert.deepEqual(info.diagnosticResourceCheckpoint, {
  version: 1, maxPointsPerRun: 1, maxSavedCharacters: 16384,
  baselineSourceCommit: 'b042c8e50ad3f05a70418ae5ee6bb4412809035b',
  existingInspectorResultReused: true, additionalGameInspectorReads: false,
  newGameTimers: false, newAnimationFrames: false, newGlobalListeners: false,
  extraStorageWritesScheduled: false, gameClocksWritten: false,
  additionalSerializedData: true, resourceCheckpointGuaranteed: false,
  recordingStateMeasured: false, nativeMemoryMeasured: false,
  reportDocumentOriginAtExport: true, sourceGameFilesEdited: false, whiteScreenFixed: false,
});
assert.equal(createHash('sha256').update(readFileSync(new URL('diagnostic-stopwatch-state.js', site))).digest('hex'),
  '5e5845d5e5beef85ca5dadac597b8d751e81f931374b942b22fdedc7d83bbb5c');
console.log('CRYPTOID_RESOURCE_CHECKPOINT_PACKAGE ' + JSON.stringify({ passed: true,
  sourceCommit: info.sourceCommit, diagnosticOnly: true, whiteScreenFixed: false }));
