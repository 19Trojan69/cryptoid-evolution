import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { heatFillCss, heatFillSelector } from './heatFillControl.mjs';
import { diagnosticSceneName, bossHeatFlatFillEnabled } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Protected guest Preview only');
const enabled = process.env.CRYPTOID_BOSS_HEAT_FLAT_FILL !== '0';
Object.assign(process.env, {
  CRYPTOID_BOSS_HEAT_FLAT_FILL: enabled ? '1' : '0', CRYPTOID_BOSS_HEAT_UNMASKED: '1',
  CRYPTOID_UNMASKED_HEAT_REFLECTION: '0', CRYPTOID_REFLECTION_IMAGE_MASK_OFF: '0', CRYPTOID_REFLECTION_NORMAL_BLEND: '0',
});
await import('../boss2-boss-heat-unmasked-20261030/buildMaskPreview.mjs');
assert.equal(bossHeatFlatFillEnabled(), enabled);
const root = resolve(new URL('../..', import.meta.url).pathname);
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const label = enabled ? 'HITZESPURENTEST: einfache Farbflächen; Reflexion aus'
  : 'HITZESPURENVERGLEICH: Originalverläufe; Reflexion aus';
const css = heatFillCss(enabled) + '.device-preview-menu section::before { content: ' + JSON.stringify(label) + ' !important; }\n';
writeFileSync(output + '/diagnostic-heat-flat-fill.css', css);
const htmlPath = output + '/index.html', html = readFileSync(htmlPath, 'utf8');
assert.equal(html.split('</head>').length, 2);
writeFileSync(htmlPath, html.replace('</head>', '<link rel="stylesheet" href="/diagnostic-heat-flat-fill.css"></head>'));
const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
assert.equal(info.diagnosticScene, diagnosticSceneName());
assert.equal(info.bossHeatMaskCandidate.activeHeatImageMaskRemoved, true);
assert.equal(info.bossHeatMaskCandidate.reflectionHidden, true);
assert.equal(info.bossWeaponControl.disabled, true); assert.equal(info.guestOnly, true);
info.bossHeatMaskCandidate.label = label;
info.bossHeatMaskCandidate.originalHeatComponentHotspotsGradientsAndKeysRetained = !enabled;
info.bossHeatMaskCandidate.originalHeatComponentPositionsKeysTransformsBoundsAndOpacityRetained = true;
info.bossHeatMaskCandidate.innerHeatRadialGradientsReplaced = enabled;
info.bossHeatFlatFillCandidate = {
  version: 1, enabled, label, selector: heatFillSelector,
  failedOwnerSource: '67dabc714907be6d3ae99ccf9ebeab170eb34b06', failedOwnerSavedTime: '09:10',
  ownerRepeatEvidenceCommit: '9d24ab0e53728c41a565df7d1996bd92d185b8f4',
  sameExportAlsoContainsPriorNormalOwnerTime: '10:56',
  innerHeatBackgroundImage: enabled ? 'none' : 'original radial gradients',
  innerHeatBackgroundColor: enabled ? '#ff7928' : 'original transparent',
  originalHotspotComponentsPositionsKeysTransformsShapeBoundsAndOpacityRetained: true,
  originalInlineHeatMaskAndImagePreparationRetained: true,
  heatStandardAndWebkitMasksStillRemoved: true, reflectionStillHidden: true,
  miniExplosionsAndTheirGradientsRetained: true,
  originalBossImageHealthBackgroundRetained: true, bossWeaponsViewStillExcluded: true,
  priorFilterReactorExplosionCanvasControlsRetained: true,
  uniformFlatMarkersDeliberatelyLookDifferent: enabled,
  newCanvasOrAsset: false, extraTimersOrFrames: false,
  sourceGameChanged: false, gameplayChanged: false, simulationClocksChanged: false,
  inputChanged: false, audioChanged: false, physicalDeviceTested: false,
  nativeDeviceAccepted: false, nativeTerminationCauseMeasured: false, whiteScreenFixed: false, productionCandidate: false,
  stylesheetSha256: createHash('sha256').update(css).digest('hex'),
};
info.buildOnlyTransforms.push('static boss heat fill comparison: replace only inner marker radial background images with uniform orange paint; heat mask removed/reflection hidden remain');
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_HEAT_FLAT_FILL_BUILD ' + JSON.stringify({ source: info.sourceCommit, scene: info.diagnosticScene, control: info.bossHeatFlatFillCandidate }));
