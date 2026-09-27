import assert from "node:assert/strict";
import { test } from "node:test";
import { ownedShipStage, shipEvolutionAsset } from "./shipEvolution.ts";

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
