import assert from "node:assert/strict";
import { test } from "node:test";
import { appendSectionBlock, bonusChainReward, BLOCKS_PER_CHAIN } from "./networkChain.ts";

test("a block follows each completed section and the third grants one network reward", () => {
  const first = appendSectionBlock(0);
  const second = appendSectionBlock(first.blocks);
  const third = appendSectionBlock(second.blocks, 4);
  assert.deepEqual([first.blocks, second.blocks, third.blocks], [1, 2, BLOCKS_PER_CHAIN]);
  assert.deepEqual([first.shards, second.shards, third.shards], [0, 0, 3]);
  assert.equal(appendSectionBlock(third.blocks, 12).shards, 0);
});

test("excellent bonus hits pay their chain reward after the boss and only with a saved chain", () => {
  assert.deepEqual(appendSectionBlock(2), { blocks: 3, shards: 3, linked: true });
  assert.equal(bonusChainReward(3, 9), 2);
  assert.equal(bonusChainReward(3, 8), 0);
  assert.equal(bonusChainReward(2, 12), 0);
});

test("the chain reward grows with level and is paid only once", () => {
  assert.equal(appendSectionBlock(2, 500).shards + bonusChainReward(3, 9, 500), 8);
  assert.equal(appendSectionBlock(3, 500).shards, 0);
});
