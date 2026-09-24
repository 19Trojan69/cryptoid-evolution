import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceShot, contactWithEnemy, movePlayer, placePlayer, shipHitsEnemy, shotHitsEnemy, MAX_PLAYER_SHOTS } from "./playerCombat.ts";
import { receiveImpacts } from "./powerUps.ts";

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

test("an attacker can make contact only once per run, even across invulnerability", () => {
  const player = { x: .5, y: .85 };
  const touching = { x: 400, y: 510, radius: 25 };
  assert.deepEqual(contactWithEnemy(player, 800, 600, touching, false, false, 0), { connected: false, damage: 0 });
  assert.deepEqual(contactWithEnemy(player, 800, 600, { ...touching, x: 460 }, true, false, 0), { connected: false, damage: 0 });
  assert.deepEqual(contactWithEnemy(player, 800, 600, touching, true, false, 600), { connected: true, damage: 0 });
  assert.deepEqual(contactWithEnemy(player, 800, 600, touching, true, true, 0), { connected: false, damage: 0 });
  const first = contactWithEnemy(player, 800, 600, touching, true, false, 0);
  assert.deepEqual(first, { connected: true, damage: 1 });
  assert.deepEqual(receiveImpacts({ hearts: 3, shieldCharges: 1, overdriveMs: 0 }, first.damage), { hearts: 3, shieldCharges: 0, overdriveMs: 0 });
  assert.equal(receiveImpacts({ hearts: 3, shieldCharges: 0, overdriveMs: 0 }, first.damage).hearts, 2);
});
