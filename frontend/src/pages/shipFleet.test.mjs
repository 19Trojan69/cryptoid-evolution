import assert from "node:assert/strict";
import { test } from "node:test";
import { allPlayerColors, buySkin, buyShipVariant, colorForSkin, fleetCount, ownedSkins, playerColors, playerSkins, readShipFleet, repaintStarter, savedShipColors, selectedShip, shardBalance, SHIP_COLOR_KEY, SHIP_COLORS_KEY, SHIP_FLEET_KEY, SHIP_OWNED_KEY, SHIP_SKIN_KEY, shipNozzleStyles, spriteVisualOffset } from "./shipFleet.ts";

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

test("the nine metallic paints retain stable IDs and existing legacy paint IDs", () => {
  assert.equal(playerColors.length, 9);
  assert.ok(allPlayerColors.some(color => color.id === "coral"));
  assert.ok(playerColors.some(color => color.id === "bronze"));
  assert.equal(colorForSkin("nova-wing", {}, "violet", "grey-scout").id, "grey");
  const colors = savedShipColors('{"nova-wing":"coral","grey-scout":"cobalt","fake":"ruby"}');
  assert.equal(colorForSkin("nova-wing", colors).id, "coral");
  assert.equal(colorForSkin("grey-scout", colors).id, "cobalt");
  assert.equal(colorForSkin("dark-delta", colors).id, "grey");
  assert.deepEqual(savedShipColors('{"nova-wing":"unknown"}'), {});
  const values = new Map([[SHIP_SKIN_KEY, "nova-wing"], [SHIP_OWNED_KEY, '["nova-wing"]'], [SHIP_COLOR_KEY, "violet"], [SHIP_COLORS_KEY, JSON.stringify(colors)]]);
  globalThis.localStorage = { getItem: key => values.get(key) ?? null };
  assert.equal(selectedShip().color.id, "coral");
});

test("formation guides compensate for visible sprite centers and rotation", () => {
  const normal = spriteVisualOffset(2, 100, false);
  const rotated = spriteVisualOffset(2, 100, true);
  assert.deepEqual(rotated, { x: -normal.x, y: -normal.y });
  assert.ok(Math.abs(rotated.y) > 10);
});

test("every ship has model-specific mirrored exhaust anchors", () => {
  const nozzleCounts = new Set();
  for (const skin of playerSkins) {
    const player = shipNozzleStyles(skin.sprite);
    const enemy = shipNozzleStyles(skin.sprite, true);
    nozzleCounts.add(player.length);
    assert.equal(enemy.length, player.length);
    player.forEach((nozzle, index) => {
      const mirrored = enemy[index];
      const playerX = Number.parseFloat(nozzle["--nozzle-x"]);
      const playerY = Number.parseFloat(nozzle["--nozzle-y"]);
      assert.ok(playerX >= 15 && playerX <= 85);
      assert.ok(playerY >= 50 && playerY <= 90);
      assert.equal(Number.parseFloat(mirrored["--nozzle-x"]), 100 - playerX);
      assert.equal(Number.parseFloat(mirrored["--nozzle-y"]), 100 - playerY);
    });
  }
  assert.deepEqual([...nozzleCounts].sort(), [1, 2, 3, 4]);
});

test("bonus and boss exhausts use their visible engine exits", () => {
  assert.deepEqual(shipNozzleStyles(4), [
    { "--nozzle-x": "28%", "--nozzle-y": "75%" },
    { "--nozzle-x": "74%", "--nozzle-y": "75%" },
  ]);
  assert.deepEqual(shipNozzleStyles(19, true), [
    { "--nozzle-x": "73%", "--nozzle-y": "48%" },
    { "--nozzle-x": "55%", "--nozzle-y": "38%" },
    { "--nozzle-x": "44%", "--nozzle-y": "38%" },
    { "--nozzle-x": "28%", "--nozzle-y": "48%" },
  ]);
});

test("legacy ships migrate into counts and repeat purchases add the chosen variant", () => {
  const fleet = readShipFleet(null, '["nova-wing"]', '{"nova-wing":"coral"}');
  assert.equal(fleetCount(fleet, "grey-scout", "grey"), 1);
  assert.equal(fleetCount(fleet, "nova-wing", "coral"), 1);
  assert.equal(buyShipVariant("nova-wing", "bronze", fleet, 24), null);
  const first = buyShipVariant("nova-wing", "bronze", fleet, 100);
  const second = buyShipVariant("nova-wing", "bronze", first.fleet, first.balance);
  assert.equal(second.balance, 50);
  assert.equal(fleetCount(second.fleet, "nova-wing"), 3);
  assert.equal(fleetCount(second.fleet, "nova-wing", "bronze"), 2);
  assert.equal(fleetCount(second.fleet, "nova-wing", "coral"), 1);
  assert.deepEqual(readShipFleet(JSON.stringify(second.fleet), null, null), second.fleet);
  const values = new Map([[SHIP_SKIN_KEY, "nova-wing"], [SHIP_COLOR_KEY, "bronze"], [SHIP_FLEET_KEY, JSON.stringify(second.fleet)], [SHIP_COLORS_KEY, '{"nova-wing":"bronze"}']]);
  globalThis.localStorage = { getItem: key => values.get(key) ?? null };
  assert.equal(selectedShip().color.id, "bronze");
});

test("free starter repaint preserves total and additional copies cost Shards", () => {
  const issued = readShipFleet(null, null, null);
  const painted = repaintStarter(issued, "metallic-blue");
  assert.equal(fleetCount(painted, "grey-scout"), 1);
  assert.equal(fleetCount(painted, "grey-scout", "grey"), 0);
  assert.equal(fleetCount(painted, "grey-scout", "metallic-blue"), 1);
  assert.equal(buyShipVariant("grey-scout", "silver", painted, 19), null);
  const second = buyShipVariant("grey-scout", "silver", painted, 20);
  assert.equal(fleetCount(second.fleet, "grey-scout"), 2);
  assert.equal(second.balance, 0);
});
