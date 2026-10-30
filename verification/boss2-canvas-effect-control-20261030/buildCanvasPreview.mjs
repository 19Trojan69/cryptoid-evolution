import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = resolve(new URL('../..', import.meta.url).pathname);
assert.equal(process.env.VERCEL_ENV, 'preview', 'Canvas effect control is protected-preview only');
assert.equal(JSON.parse(readFileSync(root + '/vercel.json', 'utf8')).git.deploymentEnabled, false);
const enabled = process.env.CRYPTOID_CANVAS_EFFECT_CONTROL !== '0';
process.env.CRYPTOID_CANVAS_EFFECT_CONTROL = enabled ? '1' : '0';
// Installer metadata may be dirty in a Vercel checkout. Runtime source changes
// are forbidden; do not silently equate that flag with a pristine source tree.
assert.equal(execFileSync('git', ['diff', '--name-only', 'HEAD', '--', 'frontend/src', 'frontend/scripts', 'backend/src', 'api'],
  { cwd: root, encoding: 'utf8' }).trim(), '', 'Runtime source files must match the committed tree');
await import('../boss2-brief-report-20261030/buildBriefPreview.mjs');
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
const label = enabled ? 'GRAFIKTEST: Explosions-Canvas aus; Ersatzdarstellung aktiv; Reaktor und CSS-Filter aus'
  : 'VERGLEICH: Explosions-Canvas an; Reaktor und CSS-Filter aus';
const css = '.device-preview-menu section::before { content: ' + JSON.stringify(label) + ' !important; }\n';
writeFileSync(output + '/diagnostic-canvas-effect-control.css', css);
const htmlPath = output + '/index.html', html = readFileSync(htmlPath, 'utf8');
assert.equal(html.split('</head>').length, 2);
writeFileSync(htmlPath, html.replace('</head>', '<link rel="stylesheet" href="/diagnostic-canvas-effect-control.css"></head>'));
info.canvasEffectControl = { version: 1, enabled, kind: 'existing-original-impact-fallback', label,
  originalSourceBlob: '73e6239d7d6be8a886279bcd38d6cd230e9834af', originalSourceFilesClean: true,
  transform: enabled ? 'CanvasEffectLayer enabled=false' : 'none', canvasImpactPreparationAllowed: !enabled,
  otherCanvasesDisabled: false, allEffectsRemoved: false, originalFallbackMayRenderMoreDom: true,
  simulationClocksChanged: false, audioChanged: false, inputChanged: false, whiteScreenFixed: false };
info.buildOnlyTransforms.push('optional isolated CanvasEffectLayer fallback control');
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_CANVAS_CONTROL_BUILD ' + JSON.stringify({ sourceCommit: info.sourceCommit, control: info.canvasEffectControl }));
