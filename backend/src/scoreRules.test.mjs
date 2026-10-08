import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { careerValue, bestRunValue, runLevel } = require('../build/scoreRules.js');

test('career and best-run records are separate for each network and missing records stay empty', () => {
  const user = { bestScore: 9999, bestScoreV2: { testnet: 800 }, careerScoreByNetwork: { testnet: 350 }, bestRunByNetwork: { testnet: { score: 200, level: 12 } } };
  assert.equal(careerValue(user, 'testnet'), 350);
  assert.deepEqual(bestRunValue(user, 'testnet'), { score: 800, level: null });
  user.bestScoreV2.testnet = 180;
  assert.deepEqual(bestRunValue(user, 'testnet'), { score: 200, level: 12 });
  assert.equal(careerValue(user, 'mainnet'), 0);
  assert.deepEqual(bestRunValue(user, 'mainnet'), { score: 0, level: null });
});

test('best-run level comes from the active run, never from the highest profile level', () => {
  const player = { highestSector: 500, lastStart: { startSector: 11 }, mission: { sector: 25 } };
  assert.equal(runLevel(player, ['block:24', 'boss:2']), 3);
  assert.equal(runLevel({ ...player, mission: null }, ['bonus:50']), 50);
  assert.equal(runLevel({ lastStart: { startSector: 10 } }, []), 1);
});
