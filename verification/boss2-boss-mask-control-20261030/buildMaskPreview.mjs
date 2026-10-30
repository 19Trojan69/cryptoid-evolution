import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Boss masked-layer comparison is protected-preview only');
const hidden = process.env.CRYPTOID_BOSS_MASK_LAYERS_OFF !== '0';
process.env.CRYPTOID_BOSS_MASK_LAYERS_OFF = hidden ? '1' : '0';
process.env.CRYPTOID_BOSS_WEAPON_CANVAS_OFF = '1';
await import('../boss2-boss-weapon-control-20261030/buildWeaponPreview.mjs');
const root = resolve(new URL('../..', import.meta.url).pathname);
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const label = hidden ? 'MASKENTEST: Boss-Reflexion und Hitzespuren aus; Bossbild bleibt an'
  : 'MASKENVERGLEICH: Boss-Reflexion und Hitzespuren an; Bossbild bleibt an';
const css = (hidden ? readFileSync(new URL('./maskedLayers.css', import.meta.url), 'utf8') : '')
  + '.device-preview-menu section::before { content: ' + JSON.stringify(label) + ' !important; }\n';
writeFileSync(output + '/diagnostic-boss-mask-control.css', css);
const htmlPath = output + '/index.html', html = readFileSync(htmlPath, 'utf8');
assert.equal(html.split('</head>').length, 2);
writeFileSync(htmlPath, html.replace('</head>', '<link rel="stylesheet" href="/diagnostic-boss-mask-control.css"></head>'));
const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
assert.equal(info.bossWeaponControl.disabled, true);
assert.equal(info.diagnosticScene, hidden ? 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-masks'
  : 'flat-live-scene-original-background-original-boss-no-weapon-canvas');
info.bossMaskControl = { version: 1, hidden, label, stylesheetSha256: createHash('sha256').update(css).digest('hex'),
  baselineFailedPhoneSource: '68bbf03220a868762606136308844aa24a8a2a75',
  selectors: ['.diagnostic-flat-scene .sector-boss .hull-reflection', '.diagnostic-flat-scene .sector-boss .hull-heat-layer'],
  declaration: 'display: none !important', originalElementsAndMaskStylesRetained: true,
  originalBossHullImageRetained: true, originalBossHealthRetained: true, originalBossMiniExplosionsRetained: true,
  originalBossOuterLayoutRetained: true, originalBackgroundRetained: true, originalImagePreparationRetained: true,
  originalPresentationComponentsAndHooksRetained: true, bossWeaponComponentStillExcluded: true,
  cssFiltersStillDisabled: true, reactorStillDisabled: true, ordinaryExplosionCanvasStillDisabled: true,
  weaponSimulationRetained: true, collisionGeometryChanged: false, simulationClocksChanged: false,
  inputChanged: false, audioChanged: false, hudChanged: false, extraSimulationTimersOrFrames: false,
  nativeDeviceAccepted: false, whiteScreenFixed: false, productionCandidate: false };
info.buildOnlyTransforms.push('optional display:none for boss hull-reflection and hull-heat-layer; original elements, hull image and all simulation retained');
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_BOSS_MASK_BUILD ' + JSON.stringify({ source: info.sourceCommit, control: info.bossMaskControl }));
