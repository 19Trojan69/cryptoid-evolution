import test from "node:test";
import assert from "node:assert/strict";
import { canActivatePower, spendPower, storePower } from "./powerInventory.ts";

test("duplicate pickups remain queued until each previous effect ends", () => {
  let inventory = { shield: 0, overdrive: 0, rapid: 0, weapon: 0 };
  inventory = storePower(storePower(inventory, "shield"), "shield");
  assert.equal(inventory.shield, 2);
  assert.equal(canActivatePower(inventory, "shield", 0), true);
  inventory = spendPower(inventory, "shield");
  assert.equal(canActivatePower(inventory, "shield", 19_000), false);
  assert.equal(inventory.shield, 1);
  assert.equal(canActivatePower(inventory, "shield", 0), true);
  inventory = spendPower(inventory, "shield");
  assert.equal(canActivatePower(inventory, "shield", 0), false);
});

test("each power has its own three-charge cap and cannot go negative", () => {
  let inventory = { shield: 0, overdrive: 0, rapid: 0, weapon: 0 };
  for (let i = 0; i < 5; i++) inventory = storePower(inventory, "weapon");
  inventory = storePower(inventory, "rapid");
  assert.deepEqual(inventory, { shield: 0, overdrive: 0, rapid: 1, weapon: 3 });
  assert.equal(spendPower(inventory, "shield").shield, 0);
});
