import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceEnemyShot, createEnemyShot, enemyShotHitsPlayer, enemyShotLimit } from "./enemyFire.ts";

test("fire begins visibly above the ship, with a limited projectile budget", () => {
  const player = { x: .5, y: .85 };
  assert.equal(createEnemyShot(1, 400, 540, player, 800, 800), null);
  assert.equal(createEnemyShot(1, 400, 440, player, 800, 800), null);
  assert.equal(createEnemyShot(1, 400, 90, player, 800, 800), null);
  assert.equal(enemyShotLimit(375, 0), 3);
  assert.equal(enemyShotLimit(800, 0), 4);
  assert.equal(enemyShotLimit(800, 400_000), 6);
});

test("enemy shot locks its direction so the player can dodge", () => {
  const shot = createEnemyShot(2, 220, 210, { x: .65, y: .85 }, 800, 800);
  assert.ok(shot);
  const later = advanceEnemyShot(shot, 500);
  assert.equal(later.vx, shot.vx);
  assert.equal(later.vy, shot.vy);
  assert.ok(later.y > shot.y);
  assert.equal(enemyShotHitsPlayer({ ...shot, x: 400, y: 680 }, { x: .5, y: .85 }, 800, 800), true);
  assert.equal(enemyShotHitsPlayer({ ...shot, x: 460, y: 680 }, { x: .5, y: .85 }, 800, 800), false);
});
