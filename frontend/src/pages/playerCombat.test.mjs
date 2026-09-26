import { test } from "node:test";
import assert from "node:assert/strict";
import { activeWeaponLevel, advanceShot, contactWithEnemy, movePlayer, placePlayer, placePlayerFromPointer, shipCollisionOutcome, shipHitsEnemy, shotHitsEnemy, MAX_PLAYER_SHOTS, PICKUP_WEAPON_DURATION_MS, PURCHASED_WEAPON_DURATION_MS, TOUCH_SHIP_OFFSET_PX, fireInterval, makeVolley } from "./playerCombat.ts";

test("weapon tiers fire multi-shot volleys and apply plasma damage", () => {
  let next = 0;
  assert.equal(makeVolley(1, 200, 500, false, () => ++next).length, 1);
  assert.deepEqual(makeVolley(2, 200, 500, false, () => ++next).map(shot => shot.x), [192, 208]);
  const plasma = makeVolley(5, 200, 500, false, () => ++next);
  assert.deepEqual(plasma.map(shot => shot.x), [187, 200, 213]);
  assert.ok(plasma.every(shot => shot.damage === 2));
  assert.equal(fireInterval(3, 0), 220);
  assert.equal(fireInterval(1, 15000), 220);
});
import { receiveImpacts, resolvePlayerDamage } from "./powerUps.ts";

test("ship moves left, right and a limited distance upward without leaving the field", () => {
  assert.ok(movePlayer({ x: .5, y: .86 }, -1, 0, 100, 800, 600).x < .5);
  assert.ok(movePlayer({ x: .5, y: .86 }, 1, 0, 100, 800, 600).x > .5);
  assert.equal(movePlayer({ x: .5, y: .86 }, 0, -1, 1000, 800, 600).y, .5);
  assert.equal(movePlayer({ x: .5, y: .86 }, 0, 1, 1000, 800, 600).y, .91);
  assert.ok(placePlayer(-100, 0, 320, 600).x >= 30 / 320);
  assert.equal(MAX_PLAYER_SHOTS, 28);
  assert.ok(movePlayer({ x: .5, y: .86 }, 1, 0, 16, 800, 600).x > .512);
});

test("touch control keeps the ship visibly above the thumb without delaying its position", () => {
  const mouse = placePlayerFromPointer(200, 500, 400, 800, false);
  const touch = placePlayerFromPointer(200, 500, 400, 800, true);
  assert.equal(mouse.x, touch.x);
  assert.equal(mouse.y * 800 - touch.y * 800, TOUCH_SHIP_OFFSET_PX);
});

test("bought shots last five minutes while pickups last twenty seconds", () => {
  assert.equal(PURCHASED_WEAPON_DURATION_MS, 300_000);
  assert.equal(PICKUP_WEAPON_DURATION_MS, 20_000);
  assert.equal(activeWeaponLevel(3, 300_000, 4, 20_000, 5), 4);
  assert.equal(activeWeaponLevel(3, 300_000, 4, 0, 5), 3);
  assert.equal(activeWeaponLevel(3, 0, 4, 20_000, 5), 4);
  assert.equal(activeWeaponLevel(3, 0, 4, 0, 5), 1);
  assert.equal(activeWeaponLevel(5, 300_000, 1, 0, 3), 3);
});

test("shots travel upward, collide only with visible enemies; player hitbox remains compact", () => {
  const shot = advanceShot({ id: 1, x: 400, y: 500, speedX: 0, damage: 1, empowered: false }, 100);
  assert.equal(shot.y, 436);
  assert.equal(shotHitsEnemy(shot, { x: 400, y: 435, radius: 25, cloaked: false }), true);
  assert.equal(shotHitsEnemy(shot, { x: 400, y: 435, radius: 25, cloaked: true }), false);
  assert.equal(shipHitsEnemy({ x: .5, y: .85 }, 800, 600, { x: 400, y: 510, radius: 25 }), true);
  assert.equal(shipHitsEnemy({ x: .5, y: .85 }, 800, 600, { x: 450, y: 510, radius: 25 }), true); // visible hulls overlap
  assert.equal(shipHitsEnemy({ x: .5, y: .85 }, 800, 600, { x: 460, y: 510, radius: 25 }), false);
});

test("visible ships collide in every phase; cooldown and dive state prevent repeated damage", () => {
  const player = { x: .5, y: .85 };
  const touching = { x: 400, y: 510, radius: 25 };
  assert.deepEqual(contactWithEnemy(player, 800, 600, touching, false, false, 0), { connected: false, damage: 0 });
  assert.deepEqual(contactWithEnemy(player, 800, 600, { ...touching, x: 460 }, true, false, 0), { connected: false, damage: 0 });
  assert.deepEqual(contactWithEnemy(player, 800, 600, touching, true, false, 600), { connected: true, damage: 0 });
  assert.deepEqual(contactWithEnemy(player, 800, 600, touching, true, true, 0), { connected: false, damage: 0 });
  assert.deepEqual(contactWithEnemy(player, 800, 600, touching, true, false, 0), { connected: true, damage: 1 }); // formation or return
  const first = contactWithEnemy(player, 800, 600, touching, true, false, 0);
  assert.deepEqual(first, { connected: true, damage: 1 });
  assert.deepEqual(receiveImpacts({ hearts: 3, shieldCharges: 1, overdriveMs: 0 }, first.damage), { hearts: 3, shieldCharges: 0, overdriveMs: 0 });
  assert.equal(receiveImpacts({ hearts: 3, shieldCharges: 0, overdriveMs: 0 }, first.damage).hearts, 2);
  assert.deepEqual(resolvePlayerDamage({ hearts: 3, shieldCharges: 0, overdriveMs: 0 }, first.damage, true), { hearts: 2, shieldCharges: 0, overdriveMs: 0 });
  assert.deepEqual(resolvePlayerDamage({ hearts: 3, shieldCharges: 1, overdriveMs: 0 }, first.damage, true), { hearts: 3, shieldCharges: 0, overdriveMs: 0 });
  assert.deepEqual(resolvePlayerDamage({ hearts: 3, shieldCharges: 1, overdriveMs: 0 }, first.damage, false), { hearts: 2, shieldCharges: 1, overdriveMs: 0 });
});

test("a ship crossing the player between two frames causes one impact", () => {
  const player = { x: .5, y: .85 };
  const before = { x: 400, y: 400 };
  const after = { x: 400, y: 620, radius: 25 };
  assert.deepEqual(contactWithEnemy(player, 800, 600, after, true, false, 0, before), { connected: true, damage: 1 });
  assert.deepEqual(contactWithEnemy(player, 800, 600, after, true, true, 0, before), { connected: false, damage: 0 });
});

test("shielded collisions consume protection while unshielded collisions destroy both ships", () => {
  assert.deepEqual(shipCollisionOutcome(true, 1, 20_000), { absorbedByShield: true, destroysEnemy: false, destroysPlayerLife: false });
  assert.deepEqual(shipCollisionOutcome(false, 1, 20_000), { absorbedByShield: false, destroysEnemy: true, destroysPlayerLife: true });
  assert.deepEqual(shipCollisionOutcome(true, 0, 20_000), { absorbedByShield: false, destroysEnemy: true, destroysPlayerLife: true });
  assert.deepEqual(shipCollisionOutcome(true, 1, 0), { absorbedByShield: false, destroysEnemy: true, destroysPlayerLife: true });
});
