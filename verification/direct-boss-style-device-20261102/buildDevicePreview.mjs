import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { localStyleProof } from '../local-boss-style-20261102/transform.mjs';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Isolated guest Preview only');
assert.equal(process.argv.includes('--clock-probe'), false, 'Active scalar trace is excluded from the owner Preview');
// Project settings may include unrelated or older CRYPTOID controls. Discard
// them in this build process before importing any environment-driven builder.
// Do not read/log their values or modify the stored Vercel project environment.
for (const key of Object.keys(process.env)) if (key.startsWith('CRYPTOID_')) delete process.env[key];
for (const key of Object.keys(process.env)) assert.equal(key.startsWith('CRYPTOID_'), false, 'No inherited diagnostic treatment');
await import('./verifyScope.mjs');
Object.assign(process.env, { CRYPTOID_SOAK_CONDITION: 'original', CRYPTOID_LIFETIME_ATTRIBUTION: '1',
  CRYPTOID_LOCAL_STYLE_SCOPE: 'leaves', CRYPTOID_LOCAL_STYLE_REPLICA: '1',
  CRYPTOID_LOCAL_STYLE_FIDELITY: '0', CRYPTOID_ATTRIBUTION_SECONDS: '60' });
await import('../systematic-stability-20261101/prepareSoakBuild.mjs');
const root = resolve(new URL('../..', import.meta.url).pathname), directory = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const path = directory + '/device-preview-info.json', info = JSON.parse(readFileSync(path, 'utf8'));
const sources = Object.fromEntries(['BossHullView', 'BossReactorView'].map(n => [n, readFileSync(root + '/frontend/src/pages/' + n + '.tsx', 'utf8')]));
assert.deepEqual(info.qaLocalBossStyle, localStyleProof(sources, 'leaves'));
assert.equal(info.qaClockGapProbe, undefined); assert.equal(info.bossMiniStartControl, undefined);
assert.equal(info.diagnosticScene, 'original-artwork'); assert.equal(info.diagnosticCanvasEffects, 'original-canvas-renderer');
for (const key of ['liveBackend', 'actualPiAuthentication', 'payments', 'automaticUpload', 'automaticResume']) assert.equal(info[key], false);
assert.equal(info.guestOnly, true);
const state = readFileSync(directory + '/diagnostic-stopwatch-state.js', 'utf8');
assert.equal(state, readFileSync(root + '/verification/boss2-stopwatch-20261029/stopwatchState.mjs', 'utf8'));
assert.ok(state.includes('starting && (!fresh || !advancing)'));
function scan(p) { for (const entry of readdirSync(p, { withFileTypes: true })) {
  const path = p + '/' + entry.name;
  if (entry.isDirectory()) scan(path);
  else if (path.endsWith('.js')) assert.doesNotMatch(readFileSync(path, 'utf8'), /__clockFrameProbe|__clockGapTrace/,
    'No active frame/checkpoint ring in the owner bundle');
} }
scan(directory);
const label = 'STABILITÄTSTEST · Originalgrafik';
writeFileSync(directory + '/diagnostic-direct-style.css', '.device-preview-menu section::before { content: ' + JSON.stringify(label) + '; display:block; color:#9ce7db; margin-bottom:12px; font-weight:700; }\n');
const hp = directory + '/index.html', html = readFileSync(hp, 'utf8'), link = '<link rel="stylesheet" href="/diagnostic-direct-style.css">';
assert.equal(html.split('</head>').length, 2); writeFileSync(hp, html.replace('</head>', link + '</head>'));
info.directStyleDeviceCandidate = { version: 1, label, condition: 'leaves',
  inheritedProjectBuildControlsExcluded: true,
  basisNativeFlowSource: 'a8e407a649431c719dfee64e0ec3cf63d73de3e0', basisNativeFlowRun: 41445407351,
  candidateArtifactMustPassBothLongEngineGatesBeforeDeviceUse: true,
  originalArtworkAudioGameplayRetained: true, virtualStyleChangeOnly: true,
  freshAdvancingFrameRequiredForDiagnosticClockStart: true,
  diagnosticClockStateSha256: createHash('sha256').update(state).digest('hex'),
  activeFrameProbeIncluded: false, activeClockTraceIncluded: false,
  sourceGameFilesEdited: false, productionCandidate: false, physicalDeviceAccepted: false, whiteScreenFixed: false };
info.buildOnlyTransforms.push('Exact verified direct boss thrust/charge style distribution; original formulas, artwork, context consumers and clocks retained');
info.diagnosticResourceCheckpoint = { version: 1, maxPointsPerRun: 1, maxSavedCharacters: 16384,
  baselineSourceCommit: 'b042c8e50ad3f05a70418ae5ee6bb4412809035b',
  existingInspectorResultReused: true, additionalGameInspectorReads: false,
  newGameTimers: false, newAnimationFrames: false, newGlobalListeners: false,
  extraStorageWritesScheduled: false, gameClocksWritten: false,
  additionalSerializedData: true, resourceCheckpointGuaranteed: false,
  recordingStateMeasured: false, nativeMemoryMeasured: false,
  reportDocumentOriginAtExport: true, sourceGameFilesEdited: false, whiteScreenFixed: false };
writeFileSync(path, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_DIRECT_STYLE_DEVICE_BUILD ' + JSON.stringify({ source: info.sourceCommit, candidate: info.directStyleDeviceCandidate }));

// Owner-authorized separate mobile HUD candidate; original game and clock remain frozen.
const { applyMobileHudCandidate } = await import('../mobile-hud-device-20261103/applyMobileHudCandidate.mjs');
applyMobileHudCandidate(root, directory);
