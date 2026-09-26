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
  assert.ok(previous.attackCooldownMs >= 530);
  assert.ok(previous.attackPaceScale >= .88);
  assert.ok(previous.entryPaceScale >= .92);
  assert.ok(previous.groupAttackInterval >= 4);
  assert.ok(previous.projectileBonus <= 2);
  assert.ok(previous.bossHealth <= 300);
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
