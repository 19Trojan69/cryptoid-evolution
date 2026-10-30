import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { diagnosticSceneName } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Background comparison is protected-preview only');
const enabled = process.env.CRYPTOID_FLAT_BACKGROUND !== '0';
process.env.CRYPTOID_FLAT_SCENE = '1';
process.env.CRYPTOID_FLAT_BACKGROUND = enabled ? '1' : '0';
await import('../boss2-flat-scene-control-20261030/buildFlatPreview.mjs');
const root = resolve(new URL('../..', import.meta.url).pathname);
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const label = enabled ? 'HINTERGRUNDTEST: Einfache Formen; Sterne und Planeten wieder an'
  : 'VERGLEICH: Einfache Formen; Sterne und Planeten aus';
const css = '.device-preview-menu section::before { content: ' + JSON.stringify(label) + ' !important; }\n';
writeFileSync(output + '/diagnostic-background-control.css', css);
const htmlPath = output + '/index.html', html = readFileSync(htmlPath, 'utf8');
assert.equal(html.split('</head>').length, 2);
writeFileSync(htmlPath, html.replace('</head>', '<link rel="stylesheet" href="/diagnostic-background-control.css"></head>'));
const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
assert.equal(info.diagnosticScene, diagnosticSceneName());
info.flatSceneControl.visualModuleAliases = enabled ? ['GameShipVisual', 'BossHullView', 'BonusRockLayer']
  : ['Starfield', 'SectorBackdrop', 'GameShipVisual', 'BossHullView', 'BonusRockLayer'];
info.backgroundControl = { version: 1, originalBackgroundRestored: enabled, label,
  originalModules: enabled ? ['Starfield', 'SectorBackdrop'] : [],
  baselineFlatPhoneSource: '9b38b695fc3f9b81407dfe97c5feb8128ca95767',
  originalBackgroundPresentationHooksRestored: enabled, originalImagePreparationRetained: true,
  simpleForegroundRetained: true, flatFieldBaseFillRetained: true, cssFiltersStillDisabled: true,
  reactorStillDisabled: true, ordinaryExplosionCanvasStillDisabled: true,
  gameControllerLogicChanged: false, simulationFrameClockChanged: false, extraSimulationTimersOrFrames: false,
  inputChanged: false, audioChanged: false, hudChanged: false, liveBackend: false,
  whiteScreenFixed: false, nativeDeviceAccepted: false, productionCandidate: false };
info.buildOnlyTransforms.push('optional restoration of original Starfield and SectorBackdrop; foreground remains flat');
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_BACKGROUND_BUILD ' + JSON.stringify({ source: info.sourceCommit, control: info.backgroundControl }));
