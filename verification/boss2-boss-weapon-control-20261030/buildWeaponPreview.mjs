import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Boss weapon component comparison is protected-preview only');
const disabled = process.env.CRYPTOID_BOSS_WEAPON_CANVAS_OFF !== '0';
process.env.CRYPTOID_BOSS_WEAPON_CANVAS_OFF = disabled ? '1' : '0';
process.env.CRYPTOID_ORIGINAL_BOSS = '1';
await import('../boss2-boss-visual-control-20261030/buildBossPreview.mjs');
const root = resolve(new URL('../..', import.meta.url).pathname);
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const label = disabled ? 'WAFFENTEST: Boss-Waffenfläche aus; Bossbild und Hintergrund bleiben an'
  : 'WAFFENVERGLEICH: Boss-Waffenfläche an; Bossbild und Hintergrund bleiben an';
writeFileSync(output + '/diagnostic-boss-weapon-control.css', '.device-preview-menu section::before { content: ' + JSON.stringify(label) + ' !important; }\n');
const htmlPath = output + '/index.html', html = readFileSync(htmlPath, 'utf8');
assert.equal(html.split('</head>').length, 2);
writeFileSync(htmlPath, html.replace('</head>', '<link rel="stylesheet" href="/diagnostic-boss-weapon-control.css"></head>'));
const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
assert.equal(info.diagnosticScene, disabled ? 'flat-live-scene-original-background-original-boss-no-weapon-canvas'
  : 'flat-live-scene-original-background-original-boss');
info.bossVisualControl.originalBossWeaponCanvasRestored = !disabled;
info.bossWeaponControl = { version: 1, disabled, label,
  baselineFailedPhoneSource: '089d2267dc504611ecbf912b4422f3fb5f5cecf2',
  excludedVisualModule: disabled ? 'BossWeaponsView' : null,
  originalBossHullImageReflectionDamageHealthRetained: true,
  originalBossOuterLayoutRetained: true, originalBackgroundRetained: true,
  originalImagePreparationRetained: true, simpleNonBossShipsShotsImpactsRocksRetained: true,
  priorFlatOuterCssControlsRetained: true, cssFiltersStillDisabled: true,
  reactorStillDisabled: true, ordinaryExplosionCanvasStillDisabled: true,
  weaponSimulationRetained: true, collisionGeometryChanged: false, simulationClocksChanged: false,
  inputChanged: false, audioChanged: false, hudChanged: false, extraSimulationTimersOrFrames: false,
  componentPresentationHooksAlsoExcluded: disabled, purePixelOnlyIsolation: false,
  nativeDeviceAccepted: false, whiteScreenFixed: false, productionCandidate: false };
info.buildOnlyTransforms.push('optional omission of BossWeaponsView presentation component; boss hull and weapon simulation retained');
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_BOSS_WEAPON_BUILD ' + JSON.stringify({ source: info.sourceCommit, control: info.bossWeaponControl }));
