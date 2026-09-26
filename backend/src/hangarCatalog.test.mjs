import { test } from "node:test";
import assert from "node:assert/strict";
import { armorBonusFromPaid, hangarCatalog } from "./hangarCatalog.ts";

test("only paid permanent armor grants hearts and duplicate orders do not stack", () => {
  assert.equal(armorBonusFromPaid([]), 0);
  assert.equal(armorBonusFromPaid(["armor_hull_mk1", "armor_hull_mk1"]), 1);
  assert.equal(armorBonusFromPaid(["armor_hull_mk2"]), 2);
  assert.equal(armorBonusFromPaid(["armor_hull_mk1", "armor_hull_mk2", "weapon_twin"]), 3);
  assert.ok(hangarCatalog.filter(offer => offer.kind === "armor").every(offer => offer.pricePi > .3));
});
