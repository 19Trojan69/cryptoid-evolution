import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseCryptoid, isGhostCloaked } from "./cryptoidRoster.ts";

test("early formations introduce classes gradually and preserve fictional markings", () => {
  const first = Array.from({ length: 13 }, (_, index) => chooseCryptoid(1, index));
  assert.deepEqual(new Set(first.map(enemy => enemy.type)), new Set(["solflare", "etherCrystal", "bitrock"]));
  assert.ok(first.every(enemy => enemy.health >= 1 && enemy.radius <= 50 && /^[A-Z0-9]{1,2}$/.test(enemy.faction)));
  assert.equal(chooseCryptoid(1, 3).shipClass, "heavy");
  assert.equal(chooseCryptoid(1, 3).health, 4);
  assert.equal(chooseCryptoid(2, 2).type, "stableCore");
  assert.equal(chooseCryptoid(3, 1).type, "memeSwarm");
});

test("rare Ghost Coin phases only while safe in formation", () => {
  assert.equal(chooseCryptoid(2, 12).type !== "ghostCoin", true);
  assert.equal(chooseCryptoid(3, 12).type, "ghostCoin");
  assert.equal(chooseCryptoid(3, 12).shipClass, "elite");
  assert.equal(isGhostCloaked("ghostCoin", true, 1_800), true);
  assert.equal(isGhostCloaked("ghostCoin", false, 1_800), false);
  assert.equal(isGhostCloaked("ghostCoin", true, 0), false);
  assert.equal(isGhostCloaked("solflare", true, 1_800), false);
});
