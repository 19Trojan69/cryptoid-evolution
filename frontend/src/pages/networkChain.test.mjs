import assert from "node:assert/strict";
import { test } from "node:test";
import { appendSectionBlock, BLOCKS_PER_CHAIN } from "./networkChain.ts";

test("a block follows each completed section and the third grants one network reward", () => {
  const first = appendSectionBlock(0);
  const second = appendSectionBlock(first.blocks);
  const third = appendSectionBlock(second.blocks, 4);
  assert.deepEqual([first.blocks, second.blocks, third.blocks], [1, 2, BLOCKS_PER_CHAIN]);
  assert.deepEqual([first.shards, second.shards, third.shards], [0, 0, 3]);
  assert.equal(appendSectionBlock(third.blocks, 12).shards, 0);
});

test("excellent bonus hits strengthen the link without changing existing bonus rewards", () => {
  assert.deepEqual(appendSectionBlock(2, 9), { blocks: 3, shards: 5, extra: 2, linked: true });
  assert.equal(appendSectionBlock(2, 8).shards, 3);
  assert.equal(appendSectionBlock(0, 12).shards, 0);
});
