import { test } from "node:test";
import assert from "node:assert/strict";
import { BONUS_FLIGHT_MS, BONUS_TARGET_COUNT, bonusHeartReward, bonusPosition, bonusReward, isBonusSection } from "./bonusChallenge.ts";

test("every third section is a bonus and later sectors repeat the pattern", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 18, 19].map(isBonusSection), [false, false, true, false, false, true, true, false]);
});

test("bonus ships enter from opposite sides, remain above player space, and leave the opposite edge", () => {
  for (const [width, height] of [[375, 700], [1200, 800]]) {
    for (let index = 0; index < BONUS_TARGET_COUNT; index++) {
      const start = bonusPosition(index, 0, width, height);
      const middle = bonusPosition(index, BONUS_FLIGHT_MS / 2, width, height);
      const end = bonusPosition(index, BONUS_FLIGHT_MS, width, height);
      assert.ok(start.x < 0 || start.x > width);
      assert.ok(middle.x > 0 && middle.x < width);
      assert.ok(end.x < 0 || end.x > width);
      assert.ok(middle.y < height * .65);
      assert.ok(Math.sign(start.x - width / 2) !== Math.sign(end.x - width / 2));
    }
  }
});

test("bonus tiers include a perfect reward without requiring perfect hits for progression", () => {
  assert.deepEqual([0, 5, 9, 12].map(hits => bonusReward(hits).points), [0, 500, 1_000, 2_000]);
  assert.deepEqual([0, 1, 5, 9, 12].map(hits => bonusReward(hits).shards), [0, 2, 4, 7, 12]);
  assert.deepEqual(bonusReward(5).powerUps, ["shield"]);
  assert.deepEqual(bonusReward(9).powerUps, []);
  assert.deepEqual(bonusReward(12).powerUps, ["shield"]);
  assert.equal(bonusReward(12).label, "PERFECT CRYPTO HUNT");
});

test("only a perfect bonus restores one previously lost heart", () => {
  assert.equal(bonusHeartReward(11, 2), 0);
  assert.equal(bonusHeartReward(12, 3), 0);
  assert.equal(bonusHeartReward(12, 2), 1);
  assert.equal(bonusHeartReward(12, 1), 1);
});
