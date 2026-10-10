import { test } from "node:test";
import assert from "node:assert/strict";
import { armorBonusFromPaid, hangarCatalog, purchasePrerequisite, shipUpgradePrerequisite } from "./hangarCatalog.ts";

test("only paid permanent armor grants hearts and duplicate orders do not stack", () => {
  assert.equal(armorBonusFromPaid([]), 0);
  assert.equal(armorBonusFromPaid(["armor_hull_mk1", "armor_hull_mk1"]), 1);
  assert.equal(armorBonusFromPaid(["armor_hull_mk2"]), 2);
  assert.equal(armorBonusFromPaid(["armor_hull_mk1", "armor_hull_mk2", "weapon_twin"]), 3);
  assert.ok(hangarCatalog.filter(offer => offer.kind === "armor").every(offer => offer.pricePi > .3));
  assert.equal(hangarCatalog.find(offer => offer.id === "start_bomb")?.powerUp, "bomb");
  assert.equal(hangarCatalog.find(offer => offer.id === "start_emp")?.powerUp, "emp");
});

test("all twenty Elite purchases require the matching paid Advanced stage", () => {
  const upgrades = hangarCatalog.filter(offer => offer.kind === "ship_upgrade");
  assert.equal(upgrades.length, 40);
  for (let index = 1; index <= 20; index++) {
    const prefix = `ship_${String(index).padStart(2, "0")}_stage_`;
    const advanced = upgrades.find(offer => offer.id === `${prefix}2`);
    const elite = upgrades.find(offer => offer.id === `${prefix}3`);
    assert.ok(advanced);
    assert.ok(elite);
    assert.equal(advanced.pricePi, 9.9);
    assert.equal(elite.pricePi, 19.9);
    assert.equal(shipUpgradePrerequisite(advanced), null);
    assert.equal(shipUpgradePrerequisite(elite), advanced.id);
    assert.equal(purchasePrerequisite(advanced), null);
    assert.equal(purchasePrerequisite(elite), advanced.id);
  }
});

test("Titanium is the second armor purchase while existing paid armor keeps its hearts", () => {
  const hull = hangarCatalog.find(offer => offer.id === "armor_hull_mk1");
  const titanium = hangarCatalog.find(offer => offer.id === "armor_hull_mk2");
  assert.equal(purchasePrerequisite(hull), null);
  assert.equal(purchasePrerequisite(titanium), hull.id);
  // The lookup also protects requests from clients with an older catalog.
  assert.equal(purchasePrerequisite({ id: titanium.id }), hull.id);
  assert.equal(hull.pricePi, 19.9);
  assert.equal(titanium.pricePi, 29.9);
  assert.equal(Math.round((hull.pricePi + titanium.pricePi) * 100), 4980);
  assert.equal(armorBonusFromPaid([titanium.id]), 2);
  assert.equal(armorBonusFromPaid([hull.id, titanium.id]), 3);
  for (const offer of hangarCatalog.filter(item => item.kind === "weapon" || item.kind === "power")) {
    assert.equal(purchasePrerequisite(offer), null);
  }
});
