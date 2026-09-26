import { test } from "node:test";
import assert from "node:assert/strict";
import { BOSS_ENTRY_MS, BOSS_FIRE_INTERVAL_MS, bossFireInterval, bossVulnerable, damageSectorBoss, createSectorBoss, moveSectorBoss, nextAfterClear } from "./sectorBoss.ts";

test("a bonus clear begins a boss, while a boss clear moves to the next sector", () => {
  assert.equal(nextAfterClear(true, false), "boss");
  assert.equal(nextAfterClear(true, true), "section");
  assert.equal(nextAfterClear(false, false), "section");
});

test("the boss enters visibly, stays in the upper field and remains reachable on phone and desktop", () => {
  for (const [width, height] of [[375, 700], [1200, 800]]) {
    let boss = createSectorBoss(1, width);
    assert.equal(bossVulnerable(boss), false);
    assert.ok(boss.y < 0);
    for (let i = 0; i < 1_000; i++) {
      boss = moveSectorBoss(boss, 34, width, height);
      assert.ok(boss.x >= boss.radius && boss.x <= width - boss.radius);
      assert.ok(boss.y <= height * .25);
    }
    assert.equal(bossVulnerable(boss), true);
    assert.ok(boss.fireElapsed > BOSS_FIRE_INTERVAL_MS);
  }
});

test("health grows within a cap and a damaged boss fires with a bounded interval", () => {
  const boss = createSectorBoss(1, 375);
  assert.equal(bossFireInterval(boss), 2_500);
  assert.equal(bossFireInterval({ ...boss, health: 60 }), 1_900);
  assert.equal(createSectorBoss(1, 375).maxHealth, 120);
  assert.equal(createSectorBoss(500, 375).maxHealth, 300);
  assert.equal(createSectorBoss(999, 375).maxHealth, 300);
  assert.ok(bossFireInterval(createSectorBoss(500, 375), 500) >= 2_280);
  assert.equal(bossVulnerable(moveSectorBoss(boss, BOSS_ENTRY_MS, 375, 700)), true);
});

test("boss entry can begin below the measured HUD instead of behind it", () => {
  const visibleTop = 104;
  const boss = createSectorBoss(1, 390, visibleTop);
  assert.ok(boss.y >= visibleTop + boss.radius);
});

test("a boss takes one hit per volley and survives opening fire without a shield", () => {
  const boss = createSectorBoss(1, 375);
  assert.equal(damageSectorBoss(boss, 2, 1000), true);
  assert.equal(damageSectorBoss(boss, 2, 1000), false);
  assert.equal(damageSectorBoss(boss, 2, 1100), false);
  assert.equal(boss.health, 118);
  assert.equal(damageSectorBoss(boss, 2, 1200), true);
  assert.equal(boss.health, 116);
});
