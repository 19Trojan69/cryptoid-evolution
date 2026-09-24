import { test } from "node:test";
import assert from "node:assert/strict";
import { SECTOR_DURATION_MS, sectorAt, sectorName } from "./sectorManager.ts";

test("sector phases progress in order and returning enemies mark reform", () => {
  assert.equal(sectorAt(0).phase, "SECTOR_INTRO");
  assert.equal(sectorAt(5_000).phase, "ENTRY");
  assert.equal(sectorAt(20_000).phase, "FORMATION");
  assert.equal(sectorAt(30_000).phase, "ATTACK_CYCLE");
  assert.equal(sectorAt(30_000, true).phase, "REFORM");
  assert.equal(sectorAt(260_000).phase, "FINAL_ATTACK");
  assert.equal(sectorAt(290_000).phase, "SECTOR_CLEAR");
});

test("a new named sector begins at each five-minute boundary without a final sector", () => {
  assert.equal(sectorAt(SECTOR_DURATION_MS - 1).number, 1);
  assert.deepEqual(sectorAt(SECTOR_DURATION_MS), { number: 2, name: "CRYSTAL CHAIN", phase: "SECTOR_INTRO" });
  assert.equal(sectorName(6), "QUANTUM VAULT");
  assert.equal(sectorName(7), "GENESIS BELT 2");
  assert.equal(sectorAt(300 * SECTOR_DURATION_MS).number, 301);
});
