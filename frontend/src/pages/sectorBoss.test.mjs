import { test } from "node:test";
import assert from "node:assert/strict";
import { BOSS_ENTRY_MS, BOSS_FIRE_INTERVAL_MS, BOSS_WARNING_MS, advanceAfterClear, bossFireInterval, bossVulnerable, damageSectorBoss, createSectorBoss, encounterHudLabel, moveSectorBoss, nextAfterClear } from "./sectorBoss.ts";

test("the boss appears after the complete recorded three-signal warning", () => {
  assert.ok(BOSS_WARNING_MS > 4_833 && BOSS_WARNING_MS < 5_100);
});

test("three combat rounds lead to the boss, then bonus, then the next sector", () => {
  assert.equal(nextAfterClear(1, "normal"), "round");
  assert.equal(nextAfterClear(2, "normal"), "round");
  assert.equal(nextAfterClear(3, "normal"), "boss");
  assert.equal(nextAfterClear(3, "boss-clear"), "bonus");
  assert.equal(nextAfterClear(3, "bonus"), "section");
});

test("actual section transitions retain level and chain through boss and bonus", () => {
  let section = 1;
  for (const [current, expected] of [
    ["normal", { encounter: "normal", section: 2, sector: 1, resetChain: false }],
    ["normal", { encounter: "normal", section: 3, sector: 1, resetChain: false }],
    ["normal", { encounter: "boss-intro", section: 3, sector: 1, resetChain: false }],
    ["boss-clear", { encounter: "bonus", section: 3, sector: 1, resetChain: false }],
    ["bonus", { encounter: "normal", section: 4, sector: 2, resetChain: true }],
  ]) {
    const next = advanceAfterClear(section, current);
    assert.deepEqual(next, expected);
    section = next.section;
  }
  assert.deepEqual(advanceAfterClear(6, "bonus"), { encounter: "normal", section: 7, sector: 3, resetChain: true });
});

test("HUD shows round fractions, then BOSS and BONUS instead of a fourth round", () => {
  assert.deepEqual([1, 2, 3].map(round => encounterHudLabel(round, "normal")), ["1/3", "2/3", "3/3"]);
  for (const encounter of ["boss-intro", "boss-fight", "boss-clear"]) assert.equal(encounterHudLabel(3, encounter), "BOSS");
  assert.equal(encounterHudLabel(3, "bonus"), "BONUS");
  assert.equal(encounterHudLabel(1, "normal"), "1/3");
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
  assert.equal(bossFireInterval({ ...boss, health: 14 }), 1_900);
  assert.equal(createSectorBoss(1, 375).maxHealth, 28);
  assert.equal(createSectorBoss(500, 375).maxHealth, 80);
  assert.equal(createSectorBoss(999, 375).maxHealth, 80);
  assert.ok(bossFireInterval(createSectorBoss(500, 375), 500) >= 2_280);
  assert.equal(bossVulnerable(moveSectorBoss(boss, BOSS_ENTRY_MS, 375, 700)), true);
});

test("the boss descends smoothly only during its final 20 percent of health", () => {
  const width = 375;
  const height = 700;
  let boss = moveSectorBoss(createSectorBoss(1, width), BOSS_ENTRY_MS, width, height);
  for (let i = 0; i < 220; i++) boss = moveSectorBoss(boss, 16, width, height);
  const restingY = boss.y;
  boss = moveSectorBoss({ ...boss, health: boss.maxHealth * .21 }, 1_000, width, height);
  assert.ok(Math.abs(boss.y - restingY) < 1);
  const firstStep = moveSectorBoss({ ...boss, health: boss.maxHealth * .1 }, 16, width, height);
  assert.ok(firstStep.y > restingY && firstStep.y < restingY + 3);
  boss = firstStep;
  for (let i = 0; i < 220; i++) boss = moveSectorBoss({ ...boss, health: boss.maxHealth * .1 }, 16, width, height);
  assert.ok(boss.y > restingY + 30);
  assert.ok(boss.y < height * .35);
});

test("the opening boss remains tougher than regular ships but falls in a short fight", () => {
  const boss = createSectorBoss(1, 375);
  for (let hit = 0; hit < 28; hit++) {
    assert.equal(damageSectorBoss(boss, 1, hit * 320), true);
  }
  assert.equal(boss.health, 0);
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
  assert.equal(boss.health, 26);
  assert.equal(damageSectorBoss(boss, 2, 1200), true);
  assert.equal(boss.health, 24);
});
