import assert from "node:assert/strict";
import test from "node:test";
import { enemyHealthBonus, levelDifficulty, MAX_DIFFICULTY_LEVEL } from "./levelDifficulty.ts";
import { SECTIONS_PER_SECTOR, sectorForSection, sectionInSector, sectorName } from "./sectorManager.ts";
import { BOSS_ENTRY_MS, bossFireInterval, bossVulnerable, createSectorBoss, moveSectorBoss, nextAfterClear } from "./sectorBoss.ts";

// Logic-level regression coverage, not a substitute for a complete browser run.
test("all 500 levels advance smoothly within the existing fairness caps", () => {
  assert.ok(MAX_DIFFICULTY_LEVEL >= 500);
  let previous = levelDifficulty(1);
  for (let level = 1; level <= 500; level += 1) {
    const current = levelDifficulty(level);
    assert.equal(current.level, level);
    for (const value of Object.values(current)) assert.ok(Number.isFinite(value));
    assert.ok(current.progress >= 0 && current.progress <= 1);
    assert.ok(current.attackCooldownMs >= 530 && current.attackCooldownMs <= 750);
    assert.ok(current.attackPaceScale >= .88 && current.attackPaceScale <= 1);
    assert.ok(current.entryPaceScale >= .92 && current.entryPaceScale <= 1);
    assert.ok(current.groupAttackInterval >= 4 && current.groupAttackInterval <= 12);
    assert.ok(current.projectileBonus >= 0 && current.projectileBonus <= 2);
    assert.ok(current.bossHealth >= 15 && current.bossHealth <= 75);
    if (level > 1) {
      assert.ok(current.progress > previous.progress, `no progress at level ${level}`);
      assert.ok(current.attackCooldownMs < previous.attackCooldownMs);
      assert.ok(previous.attackCooldownMs - current.attackCooldownMs < 1);
      assert.ok(current.attackPaceScale <= previous.attackPaceScale);
      assert.ok(current.entryPaceScale <= previous.entryPaceScale);
      assert.ok(current.bossHealth > previous.bossHealth);
      assert.ok(current.bossHealth - previous.bossHealth < .13);
    }
    previous = current;
  }
});

test("enemy durability never falls or gains more than the two-hit safety cap", () => {
  const previous = Array(15).fill(0);
  for (let level = 1; level <= 500; level += 1) {
    for (let index = 0; index < previous.length; index += 1) {
      const bonus = enemyHealthBonus(level, index);
      assert.ok(Number.isInteger(bonus));
      assert.ok(bonus >= previous[index] && bonus <= 2);
      previous[index] = bonus;
    }
  }
});

test("each level keeps rounds 1, 2 and 3 before its boss transition", () => {
  assert.equal(SECTIONS_PER_SECTOR, 3);
  for (let level = 1; level <= 501; level += 1) {
    for (let round = 1; round <= SECTIONS_PER_SECTOR; round += 1) {
      const section = (level - 1) * SECTIONS_PER_SECTOR + round;
      assert.equal(sectorForSection(section), level);
      assert.equal(sectionInSector(section), round);
      assert.equal(nextAfterClear(round === 3, false), round === 3 ? "boss" : "section");
      if (round === 3) {
        assert.equal(nextAfterClear(true, true), "section");
        assert.equal(sectorForSection(section + 1), level + 1);
        assert.equal(sectionInSector(section + 1), 1);
      }
    }
  }
});

test("level 500 is not a terminal value in numbering or sector names", () => {
  for (const level of [500, 501, 750, 1_000]) {
    const section = (level - 1) * SECTIONS_PER_SECTOR + 1;
    assert.equal(sectorForSection(section), level);
    assert.equal(sectionInSector(section), 1);
    assert.ok(sectorName(level).length > 0);
    assert.ok(!sectorName(level).includes("undefined"));
    assert.deepEqual(levelDifficulty(level), levelDifficulty(MAX_DIFFICULTY_LEVEL));
  }
});

test("invalid difficulty input safely falls back instead of producing NaN", () => {
  for (const input of [NaN, Infinity, -Infinity, 0, -20]) {
    assert.deepEqual(levelDifficulty(input), levelDifficulty(1));
  }
  assert.deepEqual(levelDifficulty(2.9), levelDifficulty(2));
});

test("boss entry and firing remain bounded from the first level through level 500", () => {
  for (const level of [1, 20, 100, 250, 500]) {
    for (const width of [320, 390, 768, 1_280]) {
      let boss = createSectorBoss(level, width, 100);
      assert.equal(boss.health, levelDifficulty(level).bossHealth);
      assert.equal(boss.health, boss.maxHealth);
      assert.equal(bossVulnerable(boss), false);
      boss = moveSectorBoss(boss, BOSS_ENTRY_MS - 1, width, 800);
      assert.equal(bossVulnerable(boss), false);
      boss = moveSectorBoss(boss, 1, width, 800);
      assert.equal(bossVulnerable(boss), true);
      for (let step = 0; step < 100; step += 1) {
        boss = moveSectorBoss(boss, 100, width, 800);
        assert.ok(boss.x >= boss.radius && boss.x <= width - boss.radius);
        assert.ok(Number.isFinite(boss.y));
      }
      const normalInterval = bossFireInterval(boss, level);
      const damagedInterval = bossFireInterval({ ...boss, health: boss.maxHealth / 2 }, level);
      assert.ok(normalInterval >= 2_280);
      assert.ok(damagedInterval >= 1_680 && damagedInterval < normalInterval);
    }
  }
});
