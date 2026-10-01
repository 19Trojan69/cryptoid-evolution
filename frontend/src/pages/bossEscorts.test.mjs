import assert from "node:assert/strict";
import test from "node:test";
import { bossEscortAttackInterval, bossEscortCount, bossEscortReinforcements, bossEscortRosterIndex, bossEscortSlots } from "./bossEscorts.ts";
import { BOSS_ENTRY_MS, createSectorBoss, moveSectorBoss } from "./sectorBoss.ts";

test("boss escorts arrive gradually and stay capped at six", () => {
  assert.deepEqual([10, 50, 60, 150, 240, 330, 420, 500].map(bossEscortCount), [0, 0, 2, 3, 4, 5, 6, 6]);
  assert.equal(bossEscortReinforcements(230), 0);
  assert.equal(bossEscortReinforcements(240), 2);
  assert.equal(bossEscortReinforcements(500), 3);
  assert.ok(bossEscortAttackInterval(60) > bossEscortAttackInterval(300));
  assert.ok(bossEscortAttackInterval(300) > bossEscortAttackInterval(500));
  assert.ok(bossEscortAttackInterval(500) >= 1_050);
  for (let index = 0; index < 6; index++) assert.ok([0, 1, 5].includes(bossEscortRosterIndex(index, 0) % 6));
});

test("every late boss docks escorts below its hull and above the player collision zone", () => {
  for (const [width, height, visibleTop] of [[375, 700, 100], [390, 780, 110], [1200, 800, 100], [1200, 900, 0]]) {
    for (let level = 60; level <= 500; level += 10) {
      const boss = moveSectorBoss(createSectorBoss(level, width, visibleTop, height), BOSS_ENTRY_MS, width, height);
      const count = bossEscortCount(level);
      const slots = bossEscortSlots(level, width, height, boss, count);
      assert.equal(slots.length, count, `${level} at ${width}x${height}`);
      for (const slot of slots) {
        assert.ok(slot.x >= 30 && slot.x <= width - 30);
        assert.ok(slot.y - 18 >= boss.y + boss.height / 2 + Math.min(height * .04, 32) + 5);
        assert.ok(slot.y + 18 + 27 + 4 <= height * .5 + .01);
      }
      assert.equal(new Set(slots.map(slot => `${slot.x},${slot.y}`)).size, count);
    }
  }
});
