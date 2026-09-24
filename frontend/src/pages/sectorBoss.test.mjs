import { test } from "node:test";
import assert from "node:assert/strict";
import { BOSS_ENTRY_MS, BOSS_FIRE_INTERVAL_MS, bossFireInterval, bossVulnerable, createSectorBoss, moveSectorBoss, nextAfterClear } from "./sectorBoss.ts";

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
  assert.equal(bossFireInterval({ ...boss, health: 7 }), 1_900);
  assert.equal(createSectorBoss(999, 375).maxHealth, 36);
  assert.equal(bossVulnerable(moveSectorBoss(boss, BOSS_ENTRY_MS, 375, 700)), true);
});
