import test from "node:test";
import assert from "node:assert/strict";
import { activateCollectedPower } from "./collectedPower.ts";

const player = () => ({
  hearts: 3, shieldCharges: 0, shieldMs: 0, shieldActive: false,
  weaponLevel: 1, weaponCap: 1, pickupWeaponLevel: 1, pickupWeaponMs: 0,
  paidWeaponLevel: 1, paidWeaponMs: 0, rapidFireMs: 0, overdriveMs: 0,
});

test("collected shield immediately protects, collected weapon immediately changes shots", () => {
  let state = activateCollectedPower(player(), "shield");
  assert.equal(state.shieldCharges, 1);
  assert.equal(state.shieldActive, true);
  state = activateCollectedPower(state, "weapon");
  assert.equal(state.weaponLevel, 2);
  assert.equal(state.pickupWeaponMs, 20_000);
  state = activateCollectedPower(state, "shield");
  assert.equal(state.shieldCharges, 2);
});

test("collected weapon stacks within the five level limit", () => {
  let state = player();
  for (let i = 0; i < 6; i++) state = activateCollectedPower(state, "weapon");
  assert.equal(state.weaponLevel, 5);
  assert.equal(state.weaponCap, 5);
});
