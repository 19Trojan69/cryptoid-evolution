import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Boss heat-layer comparison is protected-preview only');
const enabled = process.env.CRYPTOID_BOSS_HEAT_ON !== '0';
process.env.CRYPTOID_BOSS_HEAT_CONTROL = '1';
process.env.CRYPTOID_BOSS_HEAT_ON = enabled ? '1' : '0';
process.env.CRYPTOID_BOSS_REFLECTION_CONTROL = '0'; process.env.CRYPTOID_BOSS_REFLECTION_ON = '0';
process.env.CRYPTOID_BOSS_MASK_LAYERS_OFF = '0'; process.env.CRYPTOID_BOSS_WEAPON_CANVAS_OFF = '1';
await import('../boss2-boss-weapon-control-20261030/buildWeaponPreview.mjs');
const root = resolve(new URL('../..', import.meta.url).pathname);
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const label = enabled ? 'HITZESPURENTEST: Boss-Hitzespuren an; Reflexion bleibt aus'
  : 'HITZESPURENVERGLEICH: Boss-Hitzespuren aus; Reflexion bleibt aus';
const selectors = ['.diagnostic-flat-scene .sector-boss .hull-reflection'];
if (!enabled) selectors.push('.diagnostic-flat-scene .sector-boss .hull-heat-layer');
const css = selectors.join(',\n') + ' { display: none !important; }\n'
  + '.device-preview-menu section::before { content: ' + JSON.stringify(label) + ' !important; }\n';
writeFileSync(output + '/diagnostic-boss-heat-control.css', css);
const htmlPath = output + '/index.html', html = readFileSync(htmlPath, 'utf8');
assert.equal(html.split('</head>').length, 2);
writeFileSync(htmlPath, html.replace('</head>', '<link rel="stylesheet" href="/diagnostic-boss-heat-control.css"></head>'));
const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
assert.equal(info.bossWeaponControl.disabled, true);
assert.equal(info.diagnosticScene, enabled ? 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-reflection'
  : 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-masks');
info.bossHeatControl = { version: 1, enabled, label, stylesheetSha256: createHash('sha256').update(css).digest('hex'),
  baselineBothHiddenPhoneSource: 'eb018b2b5e422aaf65beb66a64c77b870b3c156e',
  baselineHeatHiddenReflectionRestoredPhoneSource: 'fc688cb812395a9c3ce9e91a064a0b25406224f5',
  hiddenSelectors: selectors, reflectionHidden: true, originalHullHeatRetained: enabled,
  originalElementsAndMaskStylesRetained: true, originalBossHullImageRetained: true,
  originalBossHealthAndMiniExplosionsRetained: true, originalBossOuterLayoutRetained: true,
  originalBackgroundRetained: true, originalImagePreparationRetained: true,
  originalPresentationComponentsAndHooksRetained: true, bossWeaponComponentStillExcluded: true,
  priorFlatOuterCssControlsRetained: true, cssFiltersStillDisabled: true, reactorStillDisabled: true,
  ordinaryExplosionCanvasStillDisabled: true, weaponSimulationRetained: true,
  collisionGeometryChanged: false, simulationClocksChanged: false, inputChanged: false,
  audioChanged: false, hudChanged: false, extraSimulationTimersOrFrames: false,
  deviceTemperatureMeasured: false, nativeDeviceAccepted: false, whiteScreenFixed: false, productionCandidate: false };
info.buildOnlyTransforms.push('boss reflection remains display:none; optionally restore only original hull heat layer');
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_BOSS_HEAT_BUILD ' + JSON.stringify({ source: info.sourceCommit, control: info.bossHeatControl }));
