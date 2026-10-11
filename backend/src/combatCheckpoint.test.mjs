import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { COMBAT_REF_KEYS, readCombatCheckpoint } = require('../build/combatCheckpoint.js');
const checkpoint = () => ({
  version: 1, clock: 5000, sequence: 1, stage: 1, encounter: 'normal', width: 390, height: 844,
  state: { asteroids: [{x: 100, y: 100, health: .92, maxHealth: 4, entryElapsed: 100, entryDuration: 5000}], bonusTargets: [], shots: [{x: 100, y: 500, damage: 1.08}], enemyShots: [], player: {x: .5, y: .8}, powerUps: [], combo: {remainingMs: 0}, chainBlocks: 0, projectileGuard: 0, pendingStartPower: null, phase: 'FORMATION', boss: null },
  refs: Object.fromEntries(COMBAT_REF_KEYS.map(key => [key, key === 'nextId' ? 10 : 0])),
  formationStarted: true, slots: null, escortSlots: null,
});
test('fractional health and hull-enhanced projectiles survive checkpoint round trips', () => {
  const c = checkpoint();
  const restored = readCombatCheckpoint(JSON.parse(JSON.stringify(c)));
  assert.ok(restored);
  assert.equal(restored.state.asteroids[0].health, .92);
  assert.equal(restored.state.shots[0].damage, 1.08);
  c.state.asteroids[0].health = 3;
  assert.equal(readCombatCheckpoint(c).state.asteroids[0].health, 3, 'legacy integer saves remain valid');
});
test('exposed boss cores can resume with less than one health point', () => {
  const c = checkpoint(); c.stage = 10; c.encounter = 'boss-fight';
  c.state.asteroids = []; c.state.boss = {health: .84, config: {level: 10}};
  assert.equal(readCombatCheckpoint(c).state.boss.health, .84);
});
test('zero, negative, non-finite and excessive health are still rejected', () => {
  for (const health of [0, -1, NaN, Infinity, 1001, 5]) {
    const c = checkpoint(); c.state.asteroids[0].health = health;
    assert.equal(readCombatCheckpoint(c), null);
  }
  for (const health of [0, -1, NaN, Infinity, 10001]) {
    const c = checkpoint(); c.stage = 10; c.encounter = 'boss-fight'; c.state.asteroids = []; c.state.boss = {health, config: {level: 10}};
    assert.equal(readCombatCheckpoint(c), null);
  }
});
