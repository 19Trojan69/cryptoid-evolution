import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { reflectionMaskCss, reflectionMaskSelector } from './reflectionMaskControl.mjs';
import { diagnosticSceneName, bossHullReflectionUnmasked } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Protected guest Preview only');
const enabled = process.env.CRYPTOID_REFLECTION_IMAGE_MASK_OFF !== '0';
process.env.CRYPTOID_REFLECTION_IMAGE_MASK_OFF = enabled ? '1' : '0';
process.env.CRYPTOID_UNMASKED_HEAT_REFLECTION = '1';
await import('../boss2-unmasked-heat-reflection-20261030/buildReflectionPreview.mjs');
assert.equal(bossHullReflectionUnmasked(), enabled);
const root = resolve(new URL('../..', import.meta.url).pathname);
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const label = enabled ? 'MASKENTEST: Hitzespuren und Reflexion ohne Bildmasken'
  : 'MASKENKONTROLLE: Hitzespuren ohne Maske; Reflexion mit Maske';
const maskCss = reflectionMaskCss(enabled);
const bannerCss = '.device-preview-menu section::before { content: ' + JSON.stringify(label) + ' !important; }\n';
const css = maskCss + bannerCss;
writeFileSync(output + '/diagnostic-reflection-mask.css', css);
const htmlPath = output + '/index.html', html = readFileSync(htmlPath, 'utf8');
assert.equal(html.split('</head>').length, 2);
writeFileSync(htmlPath, html.replace('</head>', '<link rel="stylesheet" href="/diagnostic-reflection-mask.css"></head>'));
const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
assert.equal(info.diagnosticScene, diagnosticSceneName());
assert.equal(info.bossHeatMaskCandidate.activeHeatImageMaskRemoved, true);
assert.equal(info.bossHeatMaskCandidate.reflectionHidden, false);
assert.equal(info.bossWeaponControl.disabled, true); assert.equal(info.guestOnly, true);
info.bossHeatMaskCandidate.label = label;
info.bossUnmaskedHeatReflection.label = label;
info.bossUnmaskedHeatReflection.originalReflectionCascadeMaskAndLightRetained = !enabled;
info.bossUnmaskedHeatReflection.originalReflectionCascadeLightAndBlendRetained = true;
info.bossUnmaskedHeatReflection.originalInlineReflectionMaskRetained = true;
info.bossUnmaskedHeatReflection.activeReflectionImageMaskRemoved = enabled;
info.bossReflectionMaskCandidate = {
  version: 1, enabled, label,
  failedOwnerSource: 'e16befbb1251b14b0f2742f8a984c29a00173c41', failedOwnerSavedTime: '08:48',
  ownerFailureEvidenceCommit: '32502a90b2ef314e7194750883234846d46b39f2',
  baselineMaskOffReflectionHiddenOwnerSource: '67dabc714907be6d3ae99ccf9ebeab170eb34b06',
  baselineMaskOffReflectionHiddenOwnerTime: '10:56',
  selector: reflectionMaskSelector, activeReflectionImageMaskRemoved: enabled,
  reflectionVisibleUnderOriginalDisplayCascade: true, originalReflectionInlineMaskAndPreparationRetained: true,
  originalReflectionGradientLightBlendAndBoundsRetained: true,
  bothHeatImageMasksStillRemoved: true, originalHeatHotspotsVisible: true,
  bossWeaponComponentStillExcluded: true, priorFilterReactorExplosionCanvasControlsRetained: true,
  originalBossImageHealthMiniExplosionsBackgroundRetained: true,
  sourceGameChanged: false, gameplayChanged: false, simulationClocksChanged: false,
  inputChanged: false, audioChanged: false, extraTimersOrFrames: false,
  reflectionMayPaintAcrossRectangularBounds: enabled,
  physicalDeviceTested: false, nativeDeviceAccepted: false, nativeTerminationCauseMeasured: false,
  whiteScreenFixed: false, productionCandidate: false,
  stylesheetSha256: createHash('sha256').update(css).digest('hex'),
};
info.buildOnlyTransforms.push('reflection mask comparison: standard/WebKit mask-image:none only on visible original boss reflection; heat remains unmasked');
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_REFLECTION_MASK_BUILD ' + JSON.stringify({ source: info.sourceCommit, scene: info.diagnosticScene, control: info.bossReflectionMaskCandidate }));
