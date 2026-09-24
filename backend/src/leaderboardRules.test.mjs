import { test } from "node:test";
import assert from "node:assert/strict";
import { TOP_LIMIT, validRunScore } from "./leaderboardRules.ts";

test("ranking contains at most 100 accounts and accepts plausible run scores", () => {
  assert.equal(TOP_LIMIT, 100);
  assert.equal(validRunScore(1200, 1000, 60_000), true);
  assert.equal(validRunScore(300, 1000, 2000), false);
  assert.equal(validRunScore(0, 1000, 2000), true);
  for (const score of [NaN, -1, 1.5, Infinity, "100", 999_999_999]) assert.equal(validRunScore(score, 1000, 60_000), false);
  assert.equal(validRunScore(10, 60_000, 1_000), false);
});
