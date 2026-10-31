import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { reflectionBlendCss, reflectionBlendSelector } from './reflectionBlendControl.mjs';
import { diagnosticSceneName, bossHullReflectionNormalBlend } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Protected guest Preview only');
const enabled = process.env.CRYPTOID_REFLECTION_NORMAL_BLEND !== '0';
process.env.CRYPTOID_REFLECTION_NORMAL_BLEND = enabled ? '1' : '0';
process.env.CRYPTOID_REFLECTION_IMAGE_MASK_OFF = '1';
await import('../boss2-reflection-mask-control-20261031/buildReflectionMaskPreview.mjs');
assert.equal(bossHullReflectionNormalBlend(), enabled);
const root = resolve(new URL('../..', import.meta.url).pathname);
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const label = enabled ? 'BLENDTEST: Reflexion normal; beide Bildmasken aus'
  : 'BLENDKONTROLLE: Reflexion screen; beide Bildmasken aus';
const css = reflectionBlendCss(enabled) + '.device-preview-menu section::before { content: ' + JSON.stringify(label) + ' !important; }\n';
writeFileSync(output + '/diagnostic-reflection-blend.css', css);
const htmlPath = output + '/index.html', html = readFileSync(htmlPath, 'utf8');
assert.equal(html.split('</head>').length, 2);
writeFileSync(htmlPath, html.replace('</head>', '<link rel="stylesheet" href="/diagnostic-reflection-blend.css"></head>'));
const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
assert.equal(info.diagnosticScene, diagnosticSceneName());
assert.equal(info.bossReflectionMaskCandidate.activeReflectionImageMaskRemoved, true);
assert.equal(info.bossHeatMaskCandidate.activeHeatImageMaskRemoved, true);
assert.equal(info.bossHeatMaskCandidate.reflectionHidden, false);
assert.equal(info.bossWeaponControl.disabled, true); assert.equal(info.guestOnly, true);
for (const key of ['bossHeatMaskCandidate','bossUnmaskedHeatReflection','bossReflectionMaskCandidate']) info[key].label = label;
info.bossUnmaskedHeatReflection.originalReflectionCascadeLightAndBlendRetained = !enabled;
info.bossUnmaskedHeatReflection.originalReflectionCascadeAndLightRetained = true;
info.bossReflectionMaskCandidate.originalReflectionGradientLightBlendAndBoundsRetained = !enabled;
info.bossReflectionMaskCandidate.originalReflectionGradientLightAndBoundsRetained = true;
info.bossReflectionMaskCandidate.activeReflectionBlend = enabled ? 'normal' : 'screen';
info.bossReflectionBlendCandidate = {
  version: 1, enabled, label, selector: reflectionBlendSelector,
  failedOwnerSource: 'ebe70ac8ac80ebd8bce3f00273a9182520f51323', failedOwnerSavedTime: '09:20',
  ownerFailureEvidenceCommit: '0a2a0d697daaf78bfea9ccecb04d14820e33a612',
  ownerLeftRunningWithoutPlayingReported: true,
  activeReflectionBlend: enabled ? 'normal' : 'screen',
  bothOriginalBossOverlaysVisible: true, bothOverlaysStandardAndWebkitMasksStillRemoved: true,
  originalReflectionGradientLightOpacityBoundsAndDisplayCascadeRetained: true,
  originalInlineMasksAndImagePreparationRetained: true,
  originalHeatHotspotsRetained: true, originalBossImageHealthMiniExplosionsBackgroundRetained: true,
  bossWeaponsViewStillExcluded: true, priorFilterReactorExplosionCanvasControlsRetained: true,
  sourceGameChanged: false, gameplayChanged: false, simulationClocksChanged: false,
  inputChanged: false, audioChanged: false, extraTimersOrFrames: false,
  reflectionBlendAppearanceMayDiffer: enabled, rectangularReflectionBoundsRemain: true,
  physicalDeviceTested: false, nativeDeviceAccepted: false, nativeTerminationCauseMeasured: false,
  whiteScreenFixed: false, productionCandidate: false,
  stylesheetSha256: createHash('sha256').update(css).digest('hex'),
};
info.buildOnlyTransforms.push('reflection blend comparison: mix-blend-mode:normal only on original visible unmasked boss reflection; both image masks remain removed');
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_REFLECTION_BLEND_BUILD ' + JSON.stringify({ source: info.sourceCommit, scene: info.diagnosticScene, control: info.bossReflectionBlendCandidate }));
