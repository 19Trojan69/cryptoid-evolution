import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { reflectionCss } from './reflectionControl.mjs';
import { diagnosticSceneName, bossUnmaskedHeatReflectionRestored } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
assert.equal(process.env.VERCEL_ENV, 'preview', 'Protected guest Preview only');
const enabled = process.env.CRYPTOID_UNMASKED_HEAT_REFLECTION !== '0';
process.env.CRYPTOID_UNMASKED_HEAT_REFLECTION = enabled ? '1' : '0';
process.env.CRYPTOID_BOSS_HEAT_UNMASKED = '1';
await import('../boss2-boss-heat-unmasked-20261030/buildMaskPreview.mjs');
assert.equal(bossUnmaskedHeatReflectionRestored(), enabled);
const root = resolve(new URL('../..', import.meta.url).pathname);
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const maskPath = output + '/diagnostic-boss-heat-mask.css';
const before = readFileSync(maskPath, 'utf8'), changed = reflectionCss(before, enabled);
writeFileSync(maskPath, changed);
const label = enabled ? 'REFLEXIONSTEST: Hitzespuren ohne Maske; Reflexion an'
  : 'REFLEXIONSVERGLEICH: Hitzespuren ohne Maske; Reflexion aus';
const css = '.device-preview-menu section::before { content: ' + JSON.stringify(label) + ' !important; }\n';
writeFileSync(output + '/diagnostic-unmasked-heat-reflection.css', css);
const htmlPath = output + '/index.html', html = readFileSync(htmlPath, 'utf8');
assert.equal(html.split('</head>').length, 2);
writeFileSync(htmlPath, html.replace('</head>', '<link rel="stylesheet" href="/diagnostic-unmasked-heat-reflection.css"></head>'));
const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
assert.equal(info.diagnosticScene, diagnosticSceneName());
assert.equal(info.bossHeatMaskCandidate.activeHeatImageMaskRemoved, true);
assert.equal(info.bossWeaponControl.disabled, true); assert.equal(info.guestOnly, true);
info.bossHeatMaskCandidate.reflectionHidden = !enabled;
info.bossHeatMaskCandidate.label = label;
info.bossHeatMaskCandidate.stylesheetSha256 = createHash('sha256').update(changed).digest('hex');
info.bossUnmaskedHeatReflection = {
  version: 1, enabled, label, baselineOwnerSource: '67dabc714907be6d3ae99ccf9ebeab170eb34b06',
  baselineOwnerTime: '10:56', baselineOwnerNormalExit: true,
  removedOnly: enabled ? '.diagnostic-flat-scene .sector-boss .hull-reflection { display: none !important; }' : null,
  originalReflectionCascadeMaskAndLightRetained: true, originalUnmaskedHeatHotspotsRetained: true,
  heatImageMaskStillRemoved: true, inlineHeatMaskStylesRetained: true,
  bossWeaponComponentStillExcluded: true, originalBossImageHealthMiniExplosionsBackgroundRetained: true,
  priorFilterReactorExplosionCanvasControlsRetained: true,
  simulationClocksChanged: false, gameplayChanged: false, inputChanged: false, audioChanged: false,
  extraTimersOrFrames: false, nativeDeviceAccepted: false, physicalDeviceTested: false,
  whiteScreenFixed: false, productionCandidate: false,
  maskStylesheetSha256: createHash('sha256').update(changed).digest('hex'),
  bannerStylesheetSha256: createHash('sha256').update(css).digest('hex'),
};
info.buildOnlyTransforms.push('unmasked-heat reflection comparison: remove only the previous reflection display:none rule');
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_UNMASKED_HEAT_REFLECTION_BUILD ' + JSON.stringify({ source: info.sourceCommit, scene: info.diagnosticScene, control: info.bossUnmaskedHeatReflection }));
