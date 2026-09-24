import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceShot, movePlayer, placePlayer, shipHitsEnemy, shotHitsEnemy, MAX_PLAYER_SHOTS } from "./playerCombat.ts";

test("ship moves left, right and a limited distance upward without leaving the field", () => {
  assert.ok(movePlayer({ x: .5, y: .86 }, -1, 0, 100, 800, 600).x < .5);
  assert.ok(movePlayer({ x: .5, y: .86 }, 1, 0, 100, 800, 600).x > .5);
  assert.equal(movePlayer({ x: .5, y: .86 }, 0, -1, 1000, 800, 600).y, .7);
  assert.equal(movePlayer({ x: .5, y: .86 }, 0, 1, 1000, 800, 600).y, .91);
  assert.ok(placePlayer(-100, 0, 320, 600).x >= 30 / 320);
  assert.equal(MAX_PLAYER_SHOTS, 28);
});

test("shots travel upward, collide only with visible enemies; player hitbox remains compact", () => {
  const shot = advanceShot({ id: 1, x: 400, y: 500, speedX: 0, damage: 1, empowered: false }, 100);
  assert.equal(shot.y, 436);
  assert.equal(shotHitsEnemy(shot, { x: 400, y: 435, radius: 25, cloaked: false }), true);
  assert.equal(shotHitsEnemy(shot, { x: 400, y: 435, radius: 25, cloaked: true }), false);
  assert.equal(shipHitsEnemy({ x: .5, y: .85 }, 800, 600, { x: 400, y: 510, radius: 25 }), true);
  assert.equal(shipHitsEnemy({ x: .5, y: .85 }, 800, 600, { x: 460, y: 510, radius: 25 }), false);
});
