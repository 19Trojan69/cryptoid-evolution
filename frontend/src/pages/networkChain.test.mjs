import assert from "node:assert/strict";
import { test } from "node:test";
import { appendSectionBlock, bonusChainReward, BLOCKS_PER_CHAIN } from "./networkChain.ts";

test("one block per cleared sector completes the chain at the ninth sector", () => {
  let blocks = 0;
  for (let sector = 1; sector <= 9; sector++) {
    const next = appendSectionBlock(blocks, sector);
    assert.equal(next.blocks, sector);
    assert.equal(next.linked, sector === 9);
    assert.equal(next.shards, sector === 9 ? 12 : 0);
    blocks = next.blocks;
  }
  assert.equal(blocks, BLOCKS_PER_CHAIN);
  assert.equal(appendSectionBlock(blocks, 10).shards, 0);
});

test("excellent bonus hits pay their chain reward after the boss and only with a saved chain", () => {
  assert.deepEqual(appendSectionBlock(8), { blocks: 9, shards: 12, linked: true });
  assert.equal(bonusChainReward(9, 9), 6);
  assert.equal(bonusChainReward(9, 8), 0);
  assert.equal(bonusChainReward(8, 12), 0);
});

test("the chain reward grows with level and is paid only once", () => {
  assert.equal(appendSectionBlock(8, 500).shards + bonusChainReward(9, 9, 500), 27);
  assert.equal(appendSectionBlock(9, 500).shards, 0);
});
