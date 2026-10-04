import test from 'node:test';
import assert from 'node:assert/strict';
import { addMissionWeapons } from './missionWeapons.ts';

test('confirmed new weapon is available but not automatically activated', () => {
  assert.deepEqual(addMissionWeapons([1], [0,0,0,0,0,0], ['weapon_twin'], true), {
    unlockedWeapons: [1,2], weaponTimers: [0,0,-1,0,0,0],
  });
});
test('refresh and repeated shop visits never refill spent or running weapons', () => {
  const timers = [0,0,0,43000,0,0];
  const result = addMissionWeapons([1,2,3], timers, ['weapon_twin','weapon_rapid_twin'], true);
  assert.deepEqual(result.weaponTimers, timers);
  assert.deepEqual(addMissionWeapons(result.unlockedWeapons, result.weaponTimers, ['weapon_twin','weapon_rapid_twin'], true), result);
});
test('non-weapons, unknown products and locked Testnet tiers cannot be granted', () => {
  assert.deepEqual(addMissionWeapons([1], [0,0,0,0,0,0], ['start_shield','weapon_plasma','weapon_triple','fake'], true).unlockedWeapons, [1]);
});
test('reconciliation does not mutate its inputs or remove existing weapons', () => {
  const levels = [1,2]; const timers = [0,0,15000,0,0,0];
  addMissionWeapons(levels, timers, ['weapon_rapid_twin'], true);
  assert.deepEqual(levels,[1,2]); assert.deepEqual(timers,[0,0,15000,0,0,0]);
});
