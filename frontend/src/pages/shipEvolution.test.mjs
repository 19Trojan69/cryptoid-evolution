import assert from "node:assert/strict";
import { test } from "node:test";
import { ownedShipStage, projectileGuardForStage, projectileImpact, shipEvolutionAsset, stageWeaponLevel } from "./shipEvolution.ts";

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

test("all twenty hulls gain the same permanent firepower and projectile protection by stage", () => {
  for (let index = 0; index < 20; index++) {
    const advanced = `ship_${String(index + 1).padStart(2, "0")}_stage_2`;
    const elite = `ship_${String(index + 1).padStart(2, "0")}_stage_3`;
    for (const [owned, minimumWeapon, freeHits] of [
      [[], 1, 0], [[advanced], 2, 1], [[advanced, elite], 2, 2],
    ]) {
      const stage = ownedShipStage(index, owned);
      assert.equal(stageWeaponLevel(stage, 1), minimumWeapon);
      assert.equal(stageWeaponLevel(stage, 4), 4);
      let guard = projectileGuardForStage(stage);
      assert.equal(guard, freeHits);
      for (let hit = 0; hit < freeHits; hit++) {
        const outcome = projectileImpact(guard, false);
        assert.equal(outcome.damage, 0);
        assert.equal(outcome.blockedByHull, true);
        guard = outcome.guard;
      }
      assert.equal(projectileImpact(guard, false).damage, 1);
    }
  }
  assert.deepEqual(projectileImpact(2, true), { guard: 2, damage: 1, blockedByHull: false });
});
