import { test } from "node:test";
import assert from "node:assert/strict";
import { collectPowerUp, createPowerUpDrop, movePowerUps, powerUpDescriptions, powerUpNames, powerUpSymbols, receiveImpacts, resolvePlayerDamage } from "./powerUps.ts";

const safe = { id: 1, x: 400, y: 220, width: 800, height: 600, hearts: 2, threats: [], activeCount: 0, chanceRoll: 0.04, kindRoll: 0.1, destroyed: 1, dropsCreated: 0 };

test("drops stay rare, but the first safe pickup appears after three kills", () => {
  assert.deepEqual(createPowerUpDrop(safe), { id: 1, x: 400, y: 220, type: "shield" });
  assert.equal(createPowerUpDrop({ ...safe, chanceRoll: 0.8 }), null);
  assert.equal(createPowerUpDrop({ ...safe, chanceRoll: 0.8, destroyed: 3 })?.type, "shield");
  assert.equal(createPowerUpDrop({ ...safe, chanceRoll: 0.8, destroyed: 3, dropsCreated: 1 }), null);
  assert.equal(createPowerUpDrop({ ...safe, kindRoll: 0.4 })?.type, "overdrive");
  assert.equal(createPowerUpDrop({ ...safe, kindRoll: 0.7 })?.type, "weapon");
  assert.equal(createPowerUpDrop({ ...safe, kindRoll: 0.8 })?.type, "rapid");
  assert.equal(createPowerUpDrop({ ...safe, kindRoll: 0.99 })?.type, "rapid");
});

test("drops avoid occupied paths and the lower danger area", () => {
  assert.equal(createPowerUpDrop({ ...safe, y: 500 }), null);
  assert.equal(createPowerUpDrop({ ...safe, threats: [{ x: 410, y: 270, radius: 25 }] }), null);
  assert.equal(createPowerUpDrop({ ...safe, activeCount: 3 }), null);
  assert.equal(movePowerUps([{ id: 1, type: "shield", x: 400, y: 500 }], 2_000, 600).length, 0);
});

test("shield absorbs impacts and combat power-ups never restore hearts", () => {
  let status = { hearts: 2, shieldCharges: 0, overdriveMs: 0 };
  status = collectPowerUp(status, "shield");
  assert.deepEqual(receiveImpacts(status, 1), { hearts: 2, shieldCharges: 0, shieldMs: 20_000, overdriveMs: 0 });
  assert.equal(receiveImpacts(status, 2).hearts, 1);
  assert.equal(collectPowerUp(status, "overdrive").overdriveMs, 20_000);
  assert.equal(collectPowerUp(status, "rapid").hearts, 2);
  assert.equal(collectPowerUp({ ...status, weaponLevel: 5 }, "weapon").weaponLevel, 5);
  assert.equal(collectPowerUp(status, "rapid").rapidFireMs, 20_000);
  assert.equal(collectPowerUp(status, "shield", 60_000).shieldMs, 60_000);
  assert.equal(collectPowerUp(status, "rapid", 60_000).rapidFireMs, 60_000);
  assert.equal(collectPowerUp(status, "overdrive", 60_000).overdriveMs, 60_000);
});

test("the first unshielded hit always removes one heart", () => {
  const status = { hearts: 3, shieldCharges: 0, shieldMs: 0, overdriveMs: 0 };
  assert.equal(resolvePlayerDamage(status, 1, true).hearts, 2);
  assert.equal(resolvePlayerDamage(status, 1, false).hearts, 2);
});


test("every power-up has a unique coin symbol and a field-guide description", () => {
  const types = ["shield", "overdrive", "weapon", "rapid"];
  assert.equal(new Set(types.map(type => powerUpSymbols[type])).size, types.length);
  for (const type of types) {
    assert.ok(powerUpNames[type].length > 0);
    assert.ok(powerUpDescriptions[type].length > 20);
  }
});
