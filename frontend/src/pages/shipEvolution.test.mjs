import assert from "node:assert/strict";
import { test } from "node:test";
import { ownedShipStage, projectileGuardForStage, projectileImpact, powerUpPickupRadius, shipEvolutionAsset, stagePickupRadiusBonus, stageWeaponLevel } from "./shipEvolution.ts";

test("each ship points to its own progression and an orphan Elite cannot be equipped", () => {
  for (let index = 0; index < 20; index++) {
    const advanced = `ship_${String(index + 1).padStart(2, "0")}_stage_2`;
    const elite = `ship_${String(index + 1).padStart(2, "0")}_stage_3`;
    assert.equal(ownedShipStage(index, []), 1);
    assert.equal(ownedShipStage(index, [elite]), 1);
    assert.equal(ownedShipStage(index, [advanced]), 2);
    assert.equal(ownedShipStage(index, [advanced, elite]), 3);
    assert.equal(shipEvolutionAsset(index, 3), `/ships/evolution/${elite}.png`);
  }
});

test("all twenty hulls gain the same permanent firepower and pickup range without invisible hit protection", () => {
  for (let index = 0; index < 20; index++) {
    const advanced = `ship_${String(index + 1).padStart(2, "0")}_stage_2`;
    const elite = `ship_${String(index + 1).padStart(2, "0")}_stage_3`;
    for (const [owned, minimumWeapon, radiusBonus] of [
      [[], 1, 0], [[advanced], 2, 10], [[advanced, elite], 2, 20],
    ]) {
      const stage = ownedShipStage(index, owned);
      assert.equal(stageWeaponLevel(stage, 1), minimumWeapon);
      assert.equal(stageWeaponLevel(stage, 4), 4);
      assert.equal(projectileGuardForStage(stage), 0);
      assert.equal(stagePickupRadiusBonus(stage), radiusBonus);
      assert.equal(powerUpPickupRadius(stage), 34 * (1 + radiusBonus / 100));
      for (const legacyGuard of [0, 1, 2])
        assert.deepEqual(projectileImpact(legacyGuard, false), { guard: 0, damage: 1, blockedByHull: false });
    }
  }
  assert.deepEqual(projectileImpact(2, true), { guard: 0, damage: 1, blockedByHull: false });
});
