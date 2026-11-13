import assert from "node:assert/strict";
import { test } from "node:test";
import { allPlayerColors, bossNozzleStyles, buySkin, buyStandardShip, enemyAppearance, enemySprite, EXTRA_STARTER_PRICE, fleetCount, migrateLegacyTestnetShipSave, ownedSkins, playerColors, playerSkins, readShipFleet, ownedShipInventoryColor, savedShipColors, selectedShip, shardBalance, SHARD_BALANCE_KEY, SHIP_COLOR_KEY, SHIP_COLORS_KEY, SHIP_FLEET_KEY, SHIP_OWNED_KEY, SHIP_SKIN_KEY, shipSaveKey, shipSaveNetworkForHost, shipNozzleStyles, spriteVisualOffset, standardHullAvailable } from "./shipFleet.ts";
import { reinforcementCount } from "./sectorManager.ts";

globalThis.sessionStorage ??= { getItem: () => null };

test("Testnet Shards and ship purchases never populate Mainnet saves", () => {
  assert.equal(shipSaveNetworkForHost("cryptoid-evolution-testnet.vercel.app"), "testnet");
  assert.equal(shipSaveNetworkForHost("cryptoid-evolution.vercel.app"), "mainnet");
  const values = new Map([
    ["cryptoid_shard_balance", "420"],
    ["cryptoid_ship_fleet_v2", '{"grey-scout":{"grey":1},"nova-wing":{"gold":1}}'],
    ["cryptoid_player_ship_skin", "nova-wing"],
    ["cryptoid_player_ship_color", "gold"],
    ["cryptoid_player_ship_colors", '{"nova-wing":"gold"}'],
    ["cryptoid_owned_ship_skins", '["nova-wing"]'],
  ]);
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  migrateLegacyTestnetShipSave(storage);
  for (const [key, value] of [...values].filter(([key]) => !key.endsWith("_testnet"))) {
    assert.equal(values.get(shipSaveKey(key, "testnet")), value);
    assert.equal(values.get(shipSaveKey(key, "mainnet")), undefined);
  }
  values.set(shipSaveKey("cryptoid_shard_balance", "testnet"), "10");
  migrateLegacyTestnetShipSave(storage);
  assert.equal(values.get(shipSaveKey("cryptoid_shard_balance", "testnet")), "10");
  assert.notEqual(SHARD_BALANCE_KEY, "cryptoid_shard_balance");
});

test("only the grey starter is free and the prepared Mainnet catalog covers all 20 hulls", () => {
  assert.equal(playerSkins.length, 20);
  assert.equal(playerSkins[0].id, "grey-scout");
  assert.equal(playerSkins.filter(skin => skin.price === 0).length, 1);
  assert.equal(new Set(playerSkins.map(skin => skin.sprite)).size, 20);
  assert.equal(EXTRA_STARTER_PRICE, 150);
  playerSkins.slice(1).forEach((skin, index) => assert.equal(skin.price, 150 + index * 250, skin.id));
  assert.equal(playerSkins.filter(skin => standardHullAvailable(skin.id)).length, 10);
  assert.equal(playerSkins.filter(skin => standardHullAvailable(skin.id, true)).length, 20);
  assert.equal(standardHullAvailable("unknown", true), false);
});

test("later sectors field all 20 player hulls as enemy models", () => {
  const classes = ["light", "medium", "heavy", "elite"];
  const early = new Set(classes.flatMap(shipClass => Array.from({ length: 20 }, (_, slot) => enemySprite(shipClass, slot, 1))));
  const late = new Set(classes.flatMap(shipClass => Array.from({ length: 20 }, (_, slot) => enemySprite(shipClass, slot, 51))));
  assert.ok(early.size < late.size);
  assert.deepEqual(late, new Set(playerSkins.map(skin => skin.sprite)));
  assert.equal(enemySprite("elite", 3, 51), 18);
});

test("each block uses distinct shop hulls and paints across both enemy flights", () => {
  const shopHulls = new Set(playerSkins.map(skin => skin.sprite));
  const availablePaints = new Set(allPlayerColors.map(color => color.id));
  const openingHulls = new Set();
  for (let sector = 1; sector <= 500; sector++) {
    if (sector % 10 === 0) continue; // Boss has its own design.
    const ships = Array.from({ length: 6 + reinforcementCount(sector) }, (_, index) => enemyAppearance(sector, index));
    assert.equal(new Set(ships.map(ship => ship.sprite)).size, ships.length, `duplicate hull in block ${sector}`);
    assert.equal(new Set(ships.map(ship => ship.color)).size, ships.length, `duplicate paint in block ${sector}`);
    assert.ok(ships.every(ship => shopHulls.has(ship.sprite) && availablePaints.has(ship.color)));
    if (sector <= 4) ships.forEach(ship => openingHulls.add(ship.sprite));
  }
  assert.deepEqual(openingHulls, shopHulls, "the entire shop fleet appears within the first four blocks");
});

test("a skin purchase spends once and never grants an unaffordable or duplicate hull", () => {
  assert.equal(buySkin("nova-wing", [], 149), null);
  assert.deepEqual(buySkin("nova-wing", [], 150), { owned: ["nova-wing"], balance: 0 });
  assert.equal(buySkin("nova-wing", ["nova-wing"], 300), null);
  assert.equal(buySkin("grey-scout", [], 50), null);
  assert.equal(buySkin("nova-wing", [], Number.NaN), null);
  assert.equal(buySkin("twin-core", [], 50_000), null);
  assert.equal(buyStandardShip("twin-core", { "grey-scout": { grey: 1 } }, 50_000), null);
  assert.equal(buyStandardShip("red-comet", { "grey-scout": { grey: 1 } }, 2_150)?.balance, 0);
});

test("saved selection cannot equip a locked hull or invent Shards", () => {
  const values = new Map([[SHIP_SKIN_KEY, "pi-vanguard"], [SHIP_COLOR_KEY, "cyan"], [SHIP_OWNED_KEY, "not json"]]);
  globalThis.localStorage = { getItem: key => values.get(key) ?? null };
  assert.equal(selectedShip().skin.id, "grey-scout");
  assert.equal(selectedShip().color.id, "original");
  assert.deepEqual(ownedSkins('["pi-vanguard","fake-id"]'), ["pi-vanguard"]);
  values.set(SHIP_OWNED_KEY, '["pi-vanguard"]');
  assert.equal(selectedShip().skin.id, "pi-vanguard");
  assert.equal(selectedShip().color.id, "vanguard-metallic");
  assert.equal(shardBalance("Infinity"), 0);
  assert.equal(shardBalance("-10"), 0);
});

test("legacy paint records remain readable without overriding the model livery", () => {
  assert.equal(playerColors.length, 9);
  assert.ok(allPlayerColors.some(color => color.id === "coral"));
  assert.ok(playerColors.some(color => color.id === "bronze"));
  const colors = savedShipColors('{"nova-wing":"coral","grey-scout":"cobalt","fake":"ruby"}');
  assert.deepEqual(savedShipColors('{"nova-wing":"unknown"}'), {});
  const values = new Map([[SHIP_SKIN_KEY, "nova-wing"], [SHIP_OWNED_KEY, '["nova-wing"]'], [SHIP_COLOR_KEY, "violet"], [SHIP_COLORS_KEY, JSON.stringify(colors)]]);
  globalThis.localStorage = { getItem: key => values.get(key) ?? null };
  assert.equal(selectedShip().color.id, "original");
  assert.equal(ownedShipInventoryColor(readShipFleet(null, '["nova-wing"]', JSON.stringify(colors)), "nova-wing"), "coral");
});

test("formation guides compensate for visible sprite centers and rotation", () => {
  const normal = spriteVisualOffset(2, 100, false);
  const rotated = spriteVisualOffset(2, 100, true);
  assert.deepEqual(rotated, { x: -normal.x, y: -normal.y });
  assert.ok(Math.abs(rotated.y) > 10);
});

test("evolution outlets use one or two main drives and mirror with their visible hull", () => {
  for (const skin of playerSkins) for (const stage of [1,2,3]) {
    const player=shipNozzleStyles(skin.sprite,false,stage),enemy=shipNozzleStyles(skin.sprite,true,stage);
    assert.equal(player.length,skin.sprite===11?1:2);assert.equal(enemy.length,player.length);
    player.forEach((nozzle,index)=>{
      const x=Number.parseFloat(nozzle['--nozzle-x']),y=Number.parseFloat(nozzle['--nozzle-y']);
      assert.ok(x>10&&x<90&&y>40&&y<95);
      assert.equal(Number.parseFloat(enemy[index]['--nozzle-x']),100-x);
      assert.equal(Number.parseFloat(enemy[index]['--nozzle-y']),100-y);
      assert.equal(enemy[index]['--nozzle-width'],nozzle['--nozzle-width']);
      assert.equal(nozzle['--flame-mid'],'#8fefff');
    });
  }
});

test("the ring hull has one centered drive, and boss preview anchors stay unchanged",()=>{
  for(const stage of [1,2,3])assert.equal(shipNozzleStyles(11,false,stage).length,1);
  const boss=bossNozzleStyles();assert.deepEqual(boss.map(nozzle=>[nozzle['--nozzle-x'],nozzle['--nozzle-y'],nozzle['--nozzle-width']]),[
    ['19%','49%','7%'],['44.5%','61%','11%'],['68%','49%','7%'],
  ]);
});

test("legacy ships retain their counts and each Standard purchase adds one hull", () => {
  const fleet = readShipFleet(null, '["nova-wing"]', '{"nova-wing":"coral"}');
  assert.equal(fleetCount(fleet, "grey-scout", "grey"), 1);
  assert.equal(fleetCount(fleet, "nova-wing", "coral"), 1);
  assert.equal(buyStandardShip("nova-wing", fleet, 149), null);
  const first = buyStandardShip("nova-wing", fleet, 300);
  const second = buyStandardShip("nova-wing", first.fleet, first.balance);
  assert.equal(second.balance, 0);
  assert.equal(fleetCount(second.fleet, "nova-wing"), 3);
  assert.equal(fleetCount(second.fleet, "nova-wing", "grey"), 2);
  assert.equal(fleetCount(second.fleet, "nova-wing", "coral"), 1);
  assert.deepEqual(readShipFleet(JSON.stringify(second.fleet), null, null), second.fleet);
  const values = new Map([[SHIP_SKIN_KEY, "nova-wing"], [SHIP_COLOR_KEY, "bronze"], [SHIP_FLEET_KEY, JSON.stringify(second.fleet)], [SHIP_COLORS_KEY, '{"nova-wing":"bronze"}']]);
  globalThis.localStorage = { getItem: key => values.get(key) ?? null };
  assert.equal(selectedShip().color.id, "original");
});

test("the free starter remains owned and additional copies cost Shards", () => {
  const issued = readShipFleet(null, null, null);
  assert.equal(fleetCount(issued, "grey-scout"), 1);
  assert.equal(buyStandardShip("grey-scout", issued, 149), null);
  const second = buyStandardShip("grey-scout", issued, 150);
  assert.equal(fleetCount(second.fleet, "grey-scout"), 2);
  assert.equal(second.balance, 0);
});


test("Testnet preview build scopes frontend saves even with a random deployment hostname", () => {
 assert.equal(shipSaveNetworkForHost("cryptoid-evolution-random.vercel.app", "testnet"), "testnet");
 assert.equal(shipSaveNetworkForHost("cryptoid-evolution.vercel.app", ""), "mainnet");
 assert.equal(shipSaveNetworkForHost("cryptoid-evolution-random.vercel.app", "invalid"), "mainnet");
});
