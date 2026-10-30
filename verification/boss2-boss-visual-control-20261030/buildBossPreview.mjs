import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Boss visual comparison is protected-preview only');
const enabled = process.env.CRYPTOID_ORIGINAL_BOSS !== '0';
process.env.CRYPTOID_FLAT_SCENE = '1'; process.env.CRYPTOID_FLAT_BACKGROUND = '1';
process.env.CRYPTOID_ORIGINAL_BOSS = enabled ? '1' : '0';
await import('../boss2-background-control-20261030/buildBackgroundPreview.mjs');
const root = resolve(new URL('../..', import.meta.url).pathname);
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const label = enabled ? 'BOSSTEST: Bossgrafik wieder an; Schiffe und Effekte bleiben einfach'
  : 'BOSSVERGLEICH: Bossgrafik aus; Schiffe und Effekte bleiben einfach';
writeFileSync(output + '/diagnostic-boss-control.css', '.device-preview-menu section::before { content: ' + JSON.stringify(label) + ' !important; }\n');
const htmlPath = output + '/index.html', html = readFileSync(htmlPath, 'utf8');
assert.equal(html.split('</head>').length, 2);
writeFileSync(htmlPath, html.replace('</head>', '<link rel="stylesheet" href="/diagnostic-boss-control.css"></head>'));
const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
info.flatSceneControl.visualModuleAliases = enabled ? ['GameShipVisual', 'BonusRockLayer']
  : ['GameShipVisual', 'BossHullView', 'BonusRockLayer'];
info.backgroundControl.simpleForegroundRetained = !enabled;
info.backgroundControl.simpleShipsAndImpactsRetained = true;
info.bossVisualControl = { version: 1, originalBossRestored: enabled, label,
  baselineBackgroundPhoneSource: '8e34152c5552f0ed02101566190ae68620105434',
  restoredModule: enabled ? 'BossHullView' : null,
  originalBossVisualChildrenRestored: enabled, originalBossWeaponCanvasRestored: enabled,
  simplePlayerEnemyShipsRetained: true, simpleShotsImpactsAndRocksRetained: true,
  originalBackgroundRetained: true, originalImagePreparationRetained: true,
  priorFlatOuterCssControlsRetained: true, cssFiltersStillDisabled: true, reactorStillDisabled: true,
  ordinaryExplosionCanvasStillDisabled: true, simulationLogicChanged: false,
  collisionGeometryChanged: false, simulationClocksChanged: false, inputChanged: false,
  audioChanged: false, hudChanged: false, extraSimulationTimersOrFrames: false,
  nativeDeviceAccepted: false, whiteScreenFixed: false, productionCandidate: false };
info.buildOnlyTransforms.push('optional original BossHullView including original visual children; ships and impacts remain flat');
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_BOSS_VISUAL_BUILD ' + JSON.stringify({ source: info.sourceCommit, control: info.bossVisualControl }));
