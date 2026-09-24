import assert from "node:assert/strict";
import { test } from "node:test";
import { buySkin, ownedSkins, playerSkins, selectedShip, shardBalance, SHIP_COLOR_KEY, SHIP_OWNED_KEY, SHIP_SKIN_KEY } from "./shipFleet.ts";

test("only the grey starter is free and the full reference fleet is purchasable", () => {
  assert.equal(playerSkins.length, 20);
  assert.equal(playerSkins[0].id, "grey-scout");
  assert.equal(playerSkins.filter(skin => skin.price === 0).length, 1);
  assert.equal(new Set(playerSkins.map(skin => skin.sprite)).size, 20);
});

test("a skin purchase spends once and never grants an unaffordable or duplicate hull", () => {
  assert.equal(buySkin("nova-wing", [], 24), null);
  assert.deepEqual(buySkin("nova-wing", [], 25), { owned: ["nova-wing"], balance: 0 });
  assert.equal(buySkin("nova-wing", ["nova-wing"], 50), null);
  assert.equal(buySkin("grey-scout", [], 50), null);
  assert.equal(buySkin("nova-wing", [], Number.NaN), null);
});

test("saved selection cannot equip a locked hull or invent Shards", () => {
  const values = new Map([[SHIP_SKIN_KEY, "pi-vanguard"], [SHIP_COLOR_KEY, "cyan"], [SHIP_OWNED_KEY, "not json"]]);
  globalThis.localStorage = { getItem: key => values.get(key) ?? null };
  assert.equal(selectedShip().skin.id, "grey-scout");
  assert.equal(selectedShip().color.id, "cyan");
  assert.deepEqual(ownedSkins('["pi-vanguard","fake-id"]'), ["pi-vanguard"]);
  values.set(SHIP_OWNED_KEY, '["pi-vanguard"]');
  assert.equal(selectedShip().skin.id, "pi-vanguard");
  assert.equal(shardBalance("Infinity"), 0);
  assert.equal(shardBalance("-10"), 0);
});
