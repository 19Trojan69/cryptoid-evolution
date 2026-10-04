import assert from "node:assert/strict";
import test from "node:test";
import { MAX_DIFFICULTY_LEVEL, enemyHealthBonus, levelDifficulty } from "./levelDifficulty.ts";

test("every level up to 500 raises pressure gently and within fixed limits", () => {
  let previous = levelDifficulty(1);
  for (let level = 2; level <= MAX_DIFFICULTY_LEVEL; level += 1) {
    const current = levelDifficulty(level);
    assert.ok(current.attackCooldownMs < previous.attackCooldownMs);
    assert.ok(current.attackPaceScale < previous.attackPaceScale);
    assert.ok(current.entryPaceScale < previous.entryPaceScale);
    assert.ok(current.bossHealth > previous.bossHealth);
    previous = current;
  }
  assert.ok(previous.attackCooldownMs >= 300);
  assert.ok(previous.attackPaceScale >= .67);
  assert.ok(previous.entryPaceScale >= .82);
  assert.ok(previous.groupAttackInterval >= 2);
  assert.ok(previous.projectileBonus <= 2);
  assert.equal(levelDifficulty(1).bossHealth, 84);
  assert.ok(levelDifficulty(100).bossHealth < 120);
  assert.equal(previous.bossHealth, 360);
});

test("enemy durability never decreases and the endless curve stops escalating after level 500", () => {
  for (let slot = 0; slot < 15; slot += 1) {
    let previous = 0;
    for (let level = 1; level <= MAX_DIFFICULTY_LEVEL; level += 1) {
      const current = enemyHealthBonus(level, slot);
      assert.ok(current >= previous);
      assert.ok(current <= 2);
      previous = current;
    }
  }
  assert.deepEqual(levelDifficulty(5_000), levelDifficulty(500));
  assert.deepEqual(levelDifficulty(0), levelDifficulty(1));
});

test("the next nine-sector campaign level adds a modest pressure step", () => {
  const within = levelDifficulty(9).progress - levelDifficulty(8).progress;
  const nextLevel = levelDifficulty(11).progress - levelDifficulty(10).progress;
  assert.ok(nextLevel > within && nextLevel < within * 5);
  assert.ok(levelDifficulty(20).bossHealth > levelDifficulty(10).bossHealth);
});
