import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { flatGameScene, restoreFlatGameScene, flatVisualModule, visualExports, flatSceneEnabled } from './flatTransform.mjs';
const path = process.env.CRYPTOID_FLAT_SOURCE || new URL('../../frontend/src/pages/GamePage.tsx', import.meta.url);
test('the complete controller restores exactly after only its impact JSX and root class are changed', () => {
  const source = readFileSync(path, 'utf8'), changed = flatGameScene(source);
  assert.equal(restoreFlatGameScene(changed), source);
  assert.ok(changed.includes('className="game-shell diagnostic-flat-scene" data-effects-paused='));
  assert.ok(changed.includes('className="diagnostic-flat-impact"'));
});
test('a different controller is rejected instead of partially patched', () => {
  const source = readFileSync(path, 'utf8');
  assert.throws(() => flatGameScene(source.replace('state.hearts > 0', 'state.hearts > 1')));
});
test('only the five explicit visual modules can be replaced; audio, input and simulation are excluded', () => {
  assert.deepEqual(Object.keys(visualExports).sort(), ['BonusRockLayer.tsx', 'BossHullView.tsx', 'GameShipVisual.tsx', 'SectorBackdrop.tsx', 'Starfield.tsx']);
  for (const name of Object.keys(visualExports)) assert.ok(flatVisualModule('/repo/frontend/src/pages/' + name).includes('flatComponents.jsx'));
  for (const name of ['gameAudio.ts', 'gameInput.ts', 'playerCombat.ts', 'sectorBoss.ts', 'projectilePresentation.ts', 'GamePage.tsx'])
    assert.equal(flatVisualModule('/repo/frontend/src/pages/' + name), null);
  const previous = process.env.CRYPTOID_FLAT_SCENE;
  try {
    delete process.env.CRYPTOID_FLAT_SCENE; assert.equal(flatSceneEnabled(), false);
    process.env.CRYPTOID_FLAT_SCENE = '1'; assert.equal(flatSceneEnabled(), true);
  } finally { if (previous === undefined) delete process.env.CRYPTOID_FLAT_SCENE; else process.env.CRYPTOID_FLAT_SCENE = previous; }
});
