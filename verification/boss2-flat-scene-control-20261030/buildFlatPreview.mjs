import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(new URL('../..', import.meta.url).pathname);
assert.equal(process.env.VERCEL_ENV, 'preview', 'Flat diagnostic scene is protected-preview only');
const enabled = process.env.CRYPTOID_FLAT_SCENE !== '0';
process.env.CRYPTOID_FLAT_SCENE = enabled ? '1' : '0';
process.env.CRYPTOID_CANVAS_EFFECT_CONTROL = '1'; // Preserve preceding failed control.
await import('../boss2-canvas-effect-control-20261030/buildCanvasPreview.mjs');
const output = root + '/verification/boss2-forensics-20261028/results/device-preview/site';
const infoPath = output + '/device-preview-info.json', info = JSON.parse(readFileSync(infoPath, 'utf8'));
const css = enabled ? readFileSync(new URL('./flatScene.css', import.meta.url), 'utf8')
  : '.device-preview-menu section::before { content: "VERGLEICH: Originaldarstellung; Explosions-Canvas, Reaktor und CSS-Filter aus" !important; }\n';
writeFileSync(output + '/diagnostic-flat-scene.css', css);
const htmlPath = output + '/index.html', html = readFileSync(htmlPath, 'utf8');
assert.equal(html.split('</head>').length, 2);
writeFileSync(htmlPath, html.replace('</head>', '<link rel="stylesheet" href="/diagnostic-flat-scene.css"></head>'));
info.flatSceneControl = { version: 1, enabled, kind: 'flat-live-scene',
  gameControllerBlob: 'd73579b3f9abe575adacfa978259aec9bdb0e7fd',
  visualModuleAliases: enabled ? ['Starfield', 'SectorBackdrop', 'GameShipVisual', 'BossHullView', 'BonusRockLayer'] : [],
  stylesheetSha256: createHash('sha256').update(css).digest('hex'),
  originalImagePreparationRetained: true, originalPhysicsRetained: true, originalFrameClockRetained: true,
  originalProjectilePresenterRetained: true, originalControlsRetained: true, originalAudioRetained: true,
  hudAndDialogsRetained: true, extraGameTimersOrFrames: false, whiteScreenFixed: false,
  nativeDeviceAccepted: false, productionCandidate: false };
info.buildOnlyTransforms.push('optional flat scene: visual aliases, impact JSX, marker class');
writeFileSync(infoPath, JSON.stringify(info, null, 2) + '\n');
console.log('CRYPTOID_FLAT_SCENE_BUILD ' + JSON.stringify({ sourceCommit: info.sourceCommit, control: info.flatSceneControl }));
