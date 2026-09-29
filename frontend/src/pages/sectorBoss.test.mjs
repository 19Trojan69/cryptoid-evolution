import { test } from "node:test";
import assert from "node:assert/strict";
import { BOSS_ENTRY_MS, BOSS_FIRE_INTERVAL_MS, BOSS_WARNING_MS, advanceAfterClear, bossFireInterval, bossVulnerable, damageSectorBoss, createSectorBoss, moveSectorBoss, nextAfterClear } from "./sectorBoss.ts";
import { appendSectionBlock } from "./networkChain.ts";
import { blockInLevel, campaignLevel } from "./sectorManager.ts";

test("the boss appears after the complete recorded three-signal warning", () => {
  assert.ok(BOSS_WARNING_MS > 4_833 && BOSS_WARNING_MS < 5_100);
});

test("one formation advances one block; every tenth step is the boss", () => {
  assert.equal(nextAfterClear("normal", 1), "block");
  assert.equal(nextAfterClear("normal", 8), "block");
  assert.equal(nextAfterClear("normal", 9), "boss");
  assert.equal(nextAfterClear("normal", 499), "boss");
  assert.equal(nextAfterClear("normal", 501), "block");
  assert.equal(nextAfterClear("boss-clear"), "bonus");
  assert.equal(nextAfterClear("bonus"), "block");
});

test("level ten retains its level through boss and bonus", () => {
  assert.deepEqual(advanceAfterClear(1, "normal"), { encounter: "normal", section: 2, sector: 2, resetChain: false });
  assert.deepEqual(advanceAfterClear(9, "normal"), { encounter: "boss-intro", section: 10, sector: 10, resetChain: false });
  assert.deepEqual(advanceAfterClear(10, "boss-clear"), { encounter: "bonus", section: 10, sector: 10, resetChain: false });
  assert.deepEqual(advanceAfterClear(10, "bonus"), { encounter: "normal", section: 11, sector: 11, resetChain: true });
  for (let boss = 1; boss <= 50; boss++) {
    assert.equal(advanceAfterClear(boss * 10 - 1, "normal").sector, boss * 10);
    assert.equal(advanceAfterClear(boss * 10 - 1, "normal").encounter, "boss-intro");
  }
});

test("a complete campaign level has exactly nine formations, one boss and one bonus", () => {
  let section = 1;
  const ordinary = [];
  for (let block = 0; block < 9; block++) {
    ordinary.push(section);
    const next = advanceAfterClear(section, "normal");
    section = next.section;
    if (block < 8) assert.equal(next.encounter, "normal");
    else assert.deepEqual(next, { encounter: "boss-intro", section: 10, sector: 10, resetChain: false });
  }
  assert.deepEqual(ordinary, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(advanceAfterClear(section, "boss-clear").encounter, "bonus");
  assert.deepEqual(advanceAfterClear(section, "bonus"), { encounter: "normal", section: 11, sector: 11, resetChain: true });
});

test("all fifty levels play nine blocks, boss and bonus without repeated formations", () => {
  let section = 1;
  for (let level = 1; level <= 50; level++) {
    let chain = 0;
    for (let block = 1; block <= 9; block++) {
      assert.equal(campaignLevel(section), level);
      assert.equal(blockInLevel(section), block);
      chain = appendSectionBlock(chain, section).blocks;
      const next = advanceAfterClear(section, "normal");
      assert.equal(next.section, level * 10 - 9 + block);
      assert.equal(next.encounter, block === 9 ? "boss-intro" : "normal");
      section = next.section;
    }
    assert.equal(chain, 9);
    assert.equal(section, level * 10);
    assert.equal(advanceAfterClear(section, "boss-clear").encounter, "bonus");
    const afterBonus = advanceAfterClear(section, "bonus");
    assert.equal(afterBonus.section, level * 10 + 1);
    assert.equal(afterBonus.resetChain, true);
    section = afterBonus.section;
  }
});

test("the boss enters visibly, stays in the upper field and remains reachable on phone and desktop", () => {
  for (const [width, height] of [[375, 700], [1200, 800]]) {
    let boss = createSectorBoss(10, width, 0, height);
    assert.equal(bossVulnerable(boss), false);
    assert.ok(boss.y < 0);
    for (let i = 0; i < 1_000; i++) {
      boss = moveSectorBoss(boss, 34, width, height);
      assert.ok(boss.x >= boss.radius && boss.x <= width - boss.radius);
      assert.ok(boss.y + boss.height / 2 <= height * .49);
    }
    assert.equal(bossVulnerable(boss), true);
    assert.ok(boss.fireElapsed > BOSS_FIRE_INTERVAL_MS);
  }
});

test("health grows within a cap and a damaged boss fires with a bounded interval", () => {
  const boss = createSectorBoss(10, 375);
  assert.equal(bossFireInterval(boss), 2_500);
  assert.equal(bossFireInterval({ ...boss, health: 14 }), 1_900);
  assert.ok(createSectorBoss(10, 375).maxHealth > 28);
  assert.equal(createSectorBoss(500, 375).maxHealth, 80);
  assert.throws(() => createSectorBoss(999, 375), /No boss/);
  assert.ok(bossFireInterval(createSectorBoss(500, 375), 500) >= 2_280);
  assert.equal(bossVulnerable(moveSectorBoss(boss, BOSS_ENTRY_MS, 375, 700)), true);
});

test("the boss descends smoothly only during its final 20 percent of health", () => {
  const width = 375;
  const height = 700;
  let boss = moveSectorBoss(createSectorBoss(10, width), BOSS_ENTRY_MS, width, height);
  for (let i = 0; i < 220; i++) boss = moveSectorBoss(boss, 16, width, height);
  const restingY = boss.y;
  boss = moveSectorBoss({ ...boss, health: boss.maxHealth * .21 }, 1_000, width, height);
  assert.ok(Math.abs(boss.y - restingY) < 1);
  const firstStep = moveSectorBoss({ ...boss, health: boss.maxHealth * .1 }, 16, width, height);
  assert.ok(firstStep.y > restingY && firstStep.y < restingY + 3);
  boss = firstStep;
  for (let i = 0; i < 220; i++) boss = moveSectorBoss({ ...boss, health: boss.maxHealth * .1 }, 16, width, height);
  assert.ok(boss.y > restingY + 5);
  assert.ok(boss.y + boss.height / 2 < height * .5);
});

test("the opening boss remains tougher than regular ships but falls in a short fight", () => {
  const boss = createSectorBoss(10, 375);
  for (let hit = 0; hit < Math.ceil(boss.maxHealth); hit++) {
    assert.equal(damageSectorBoss(boss, 1, hit * 320), true);
  }
  assert.equal(boss.health, 0);
});

test("boss entry can begin below the measured HUD instead of behind it", () => {
  const visibleTop = 104;
  const boss = createSectorBoss(10, 390, visibleTop);
  assert.ok(boss.y >= visibleTop + boss.height / 2);
});

test("a boss takes one hit per volley and survives opening fire without a shield", () => {
  const boss = createSectorBoss(10, 375);
  assert.equal(damageSectorBoss(boss, 2, 1000), true);
  assert.equal(damageSectorBoss(boss, 2, 1000), false);
  assert.equal(damageSectorBoss(boss, 2, 1100), false);
  assert.equal(boss.health, boss.maxHealth - 2);
  assert.equal(damageSectorBoss(boss, 2, 1200), true);
  assert.equal(boss.health, boss.maxHealth - 4);
});
