import test from 'node:test';
import assert from 'node:assert/strict';
import { flatVisualModule, diagnosticSceneName } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
test('background restoration releases only two original modules and retains every foreground alias', () => {
  const before = { flat: process.env.CRYPTOID_FLAT_SCENE, background: process.env.CRYPTOID_FLAT_BACKGROUND };
  try {
    process.env.CRYPTOID_FLAT_SCENE = '1'; process.env.CRYPTOID_FLAT_BACKGROUND = '0';
    assert.equal(diagnosticSceneName(), 'flat-live-scene');
    for (const name of ['Starfield', 'SectorBackdrop']) assert.ok(flatVisualModule('/repo/frontend/src/pages/' + name + '.tsx'));
    process.env.CRYPTOID_FLAT_BACKGROUND = '1';
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background');
    for (const name of ['Starfield', 'SectorBackdrop']) assert.equal(flatVisualModule('/repo/frontend/src/pages/' + name + '.tsx'), null);
    for (const name of ['GameShipVisual', 'BossHullView', 'BonusRockLayer']) assert.ok(flatVisualModule('/repo/frontend/src/pages/' + name + '.tsx'));
    for (const name of ['gameAudio', 'gameInput', 'sectorBoss', 'projectilePresentation']) assert.equal(flatVisualModule('/repo/frontend/src/pages/' + name + '.ts'), null);
    process.env.CRYPTOID_FLAT_SCENE = '0'; assert.equal(diagnosticSceneName(), 'original-artwork');
  } finally {
    for (const [key, value] of Object.entries({ CRYPTOID_FLAT_SCENE: before.flat, CRYPTOID_FLAT_BACKGROUND: before.background }))
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
