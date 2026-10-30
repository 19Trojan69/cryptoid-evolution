import test from 'node:test';
import assert from 'node:assert/strict';
import { flatVisualModule, diagnosticSceneName } from '../boss2-flat-scene-control-20261030/flatTransform.mjs';
test('boss comparison restores only original BossHullView on the original-background flat-ships base', () => {
  const keys = ['CRYPTOID_FLAT_SCENE', 'CRYPTOID_FLAT_BACKGROUND', 'CRYPTOID_ORIGINAL_BOSS'];
  const before = keys.map(k => process.env[k]);
  try {
    process.env.CRYPTOID_FLAT_SCENE = '1'; process.env.CRYPTOID_FLAT_BACKGROUND = '1'; process.env.CRYPTOID_ORIGINAL_BOSS = '0';
    const path = name => '/repo/frontend/src/pages/' + name + '.tsx';
    assert.ok(flatVisualModule(path('BossHullView')));
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background');
    process.env.CRYPTOID_ORIGINAL_BOSS = '1';
    assert.equal(flatVisualModule(path('BossHullView')), null);
    assert.equal(diagnosticSceneName(), 'flat-live-scene-original-background-original-boss');
    for (const name of ['GameShipVisual', 'BonusRockLayer']) assert.ok(flatVisualModule(path(name)));
    for (const name of ['Starfield', 'SectorBackdrop']) assert.equal(flatVisualModule(path(name)), null);
    for (const name of ['gameInput', 'gameAudio', 'sectorBoss', 'projectilePresentation']) assert.equal(flatVisualModule('/repo/frontend/src/pages/' + name + '.ts'), null);
    process.env.CRYPTOID_FLAT_BACKGROUND = '0'; assert.ok(flatVisualModule(path('BossHullView')));
  } finally { keys.forEach((key, i) => { if (before[i] === undefined) delete process.env[key]; else process.env[key] = before[i]; }); }
});
