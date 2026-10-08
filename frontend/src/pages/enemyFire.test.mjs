import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceEnemyShot, createEnemyShot, enemyShotBody, enemyShotHitsPlayer, enemyShotLimit } from "./enemyFire.ts";
import { projectileImpact } from "./shipEvolution.ts";
import { resolvePlayerDamage } from "./powerUps.ts";

test("fire begins visibly above the ship, with a limited projectile budget", () => {
  const player = { x: .5, y: .85 };
  assert.equal(createEnemyShot(1, 400, 540, player, 800, 800), null);
  assert.equal(createEnemyShot(1, 400, 440, player, 800, 800), null);
  assert.equal(createEnemyShot(1, 400, 90, player, 800, 800), null);
  assert.equal(enemyShotLimit(375, 0), 3);
  assert.equal(enemyShotLimit(800, 0), 4);
  assert.equal(enemyShotLimit(800, 400_000), 6);
  assert.equal(enemyShotLimit(375, 0, 500), 5);
  assert.equal(enemyShotLimit(800, 0, 500), 6);
});

test("enemy shot locks its direction so the player can dodge", () => {
  const shot = createEnemyShot(2, 220, 210, { x: .65, y: .85 }, 800, 800);
  assert.ok(shot);
  const later = advanceEnemyShot(shot, 500);
  assert.equal(later.vx, shot.vx);
  assert.equal(later.vy, shot.vy);
  assert.ok(later.y > shot.y);
  assert.equal(enemyShotHitsPlayer({ ...shot, x: 400, y: 680 }, { x: .5, y: .85 }, 800, 800), true);
  assert.equal(enemyShotHitsPlayer({ ...shot, x: 426, y: 680 }, { x: .5, y: .85 }, 800, 800), true);
  assert.equal(enemyShotHitsPlayer({ ...shot, x: 460, y: 680 }, { x: .5, y: .85 }, 800, 800), false);
});

test("a stationary player is on the flight path even from the far side", () => {
  const player = { x: .8, y: .85 };
  const shot = createEnemyShot(3, 45, 170, player, 375, 800);
  assert.ok(shot);
  const timeToPlayer = (player.y * 800 - shot.y) / shot.vy;
  const arrival = advanceEnemyShot(shot, timeToPlayer);
  assert.ok(Math.abs(arrival.x - player.x * 375) < .001);
  assert.ok(shot.vx > 0);
});

test("visible enemy projectile tips damage the player while glow and near misses do not", () => {
  const player = { x: .5, y: .85 }, width = 800, height = 800;
  const y = player.y * height;
  const lance = { id: 1, x: 400, y: y - 35, vx: 0, vy: .28, radius: 5, bossKind: 'lance' };
  assert.equal(enemyShotBody(lance).extension, 11);
  assert.equal(enemyShotHitsPlayer(lance, player, width, height), true);
  assert.equal(enemyShotHitsPlayer({ ...lance, x: 434 }, player, width, height), false);
  assert.equal(enemyShotHitsPlayer({ ...lance, y: y - 41 }, player, width, height), false);
  assert.equal(enemyShotHitsPlayer({ ...lance, bossKind: 'rapid', y: y - 34 }, player, width, height), true);
  assert.equal(enemyShotHitsPlayer({ ...lance, bossKind: 'bolt' }, player, width, height), false);
  assert.equal(enemyShotHitsPlayer({ ...lance, bossKind: 'orb', radius: 7 }, player, width, height), false);
});

test("an unprotected enemy shot removes one life; shields and hull guard retain their protection", () => {
  const player = { x: .5, y: .85 }, shot = { id: 2, x: 400, y: 680, vx: 0, vy: .2, radius: 5 };
  assert.equal(enemyShotHitsPlayer(shot, player, 800, 800), true);
  const bare = projectileImpact(0, false);
  assert.equal(bare.damage, 1);
  assert.equal(resolvePlayerDamage({ hearts: 3, shieldCharges: 0, shieldMs: 0 }, bare.damage, false).hearts, 2);
  const guarded = projectileImpact(1, false);
  assert.equal(guarded.damage, 0);
  assert.equal(guarded.guard, 0);
  assert.equal(resolvePlayerDamage({ hearts: 3, shieldCharges: 0, shieldMs: 0 }, guarded.damage, false).hearts, 3);
  const shielded = projectileImpact(0, true);
  const protectedPlayer = resolvePlayerDamage({ hearts: 3, shieldCharges: 1, shieldMs: 1000 }, shielded.damage, true);
  assert.equal(protectedPlayer.hearts, 3);
  assert.equal(protectedPlayer.shieldCharges, 0);
});
