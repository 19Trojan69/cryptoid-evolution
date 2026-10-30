import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { diagnosticSceneName, bossHullHeatUnmasked } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';

assert.equal(process.env.VERCEL_ENV, 'preview', 'Hull heat mask candidate is protected-preview only');
const enabled = process.env.CRYPTOID_BOSS_HEAT_UNMASKED !== '0';
Object.assign(process.env, {
  CRYPTOID_FLAT_SCENE: '1', CRYPTOID_FLAT_BACKGROUND: '1', CRYPTOID_ORIGINAL_BOSS: '1',
  CRYPTOID_BOSS_WEAPON_CANVAS_OFF: '1', CRYPTOID_BOSS_MASK_LAYERS_OFF: '0',
  CRYPTOID_BOSS_REFLECTION_CONTROL: '0', CRYPTOID_BOSS_REFLECTION_ON: '0',
  CRYPTOID_BOSS_HEAT_CONTROL: '1', CRYPTOID_BOSS_HEAT_ON: '1',
  CRYPTOID_BOSS_HEAT_UNMASKED: enabled ? '1' : '0',
});
await import('../boss2-boss-weapon-control-20261030/buildWeaponPreview.mjs');
assert.equal(bossHullHeatUnmasked(), enabled);
const root = resolve(new URL('../..', import.meta.url).pathname);
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const label = enabled
  ? 'MASKENKANDIDAT: Boss-Hitzespuren an; ohne Bildmaske'
  : 'MASKENVERGLEICH: Boss-Hitzespuren an; originale Bildmaske';
const intervention = enabled ? readFileSync(new URL('./heatMask.css', import.meta.url), 'utf8') : '';
const css = '.diagnostic-flat-scene .sector-boss .hull-reflection { display: none !important; }\n'
  + intervention + '.device-preview-menu section::before { content: ' + JSON.stringify(label) + ' !important; }\n';
writeFileSync(output + '/diagnostic-boss-heat-mask.css', css);
const htmlPath = output + '/index.html', html = readFileSync(htmlPath, 'utf8');
assert.equal(html.split('</head>').length, 2);
writeFileSync(htmlPath, html.replace('</head>', '<link rel="stylesheet" href="/diagnostic-boss-heat-mask.css"></head>'));
const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
assert.equal(info.bossWeaponControl.disabled, true);
assert.equal(info.diagnosticScene, diagnosticSceneName());
assert.equal(info.guestOnly, true); assert.equal(info.liveBackend, false);
info.bossHeatMaskCandidate = {
  version: 1, enabled, label, failedPhoneSource: '2a531983e5217b14141fb8623ecb35df65d7f700',
  selector: '.diagnostic-flat-scene .sector-boss .hull-heat-layer',
  stylesheetSha256: createHash('sha256').update(css).digest('hex'),
  activeHeatImageMaskRemoved: enabled, inlineMaskStylesRetained: true,
  originalHeatComponentHotspotsGradientsAndKeysRetained: true,
  originalHeatLayerBoundsAndOverflowRetained: true, originalMiniExplosionsRetained: true,
  reflectionHidden: true, bossWeaponComponentStillExcluded: true,
  originalBossHullImageHealthBackgroundAndPreparationRetained: true,
  priorFilterReactorExplosionCanvasControlsRetained: true,
  gameplayChanged: false, simulationClocksChanged: false, inputChanged: false,
  audioChanged: false, hudChanged: false, extraTimersOrFrames: false,
  edgeClippingMayDiffer: enabled, physicalDeviceTested: false,
  nativeDeviceAccepted: false, nativeTerminationCauseMeasured: false,
  whiteScreenFixed: false, productionCandidate: false,
};
info.buildOnlyTransforms.push('heat mask candidate: visible original heat, hidden reflection; optional mask-image:none only');
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_HEAT_MASK_BUILD ' + JSON.stringify({ source: info.sourceCommit, scene: info.diagnosticScene, candidate: info.bossHeatMaskCandidate }));
