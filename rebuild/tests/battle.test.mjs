import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, stepBattle } from '../core/battle.ts';
import { createEnemy, formation, moveEnemy, RETURN_DURATION_MS, attackTime } from '../core/enemies.ts';
import { CoreSession } from '../core/session.ts';
import { combatCryptoid, combatTiming } from '../../frontend/src/pages/combatVariety.ts';
import { makeShipVolley, shipFireInterval } from '../../frontend/src/pages/shipAttributes.ts';
import { gunPosition } from '../../frontend/src/pages/bossTurrets.ts';
import { bossWeapons } from '../../frontend/src/pages/bossWeapons.ts';
import { bossHullExposed, BOSS_ENTRY_MS } from '../../frontend/src/pages/sectorBoss.ts';
import { bossPoints, bossShardReward } from '../../frontend/src/pages/shardEarnings.ts';
import { blockFlights } from '../../backend/src/blockFlights.ts';
import { enemyAppearance } from '../core/appearance.ts';
import { enemyAppearance as releasedAppearance } from '../../frontend/src/pages/shipFleet.ts';
import { bossHitTarget } from '../../frontend/src/pages/bossHitTarget.ts';

const field = { width: 393, height: 744, hudBottom: 72, playerDiameter: 94 };
const idle = { horizontal: 0, vertical: 0 };
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; }
function tick(state, n = 1, input = idle) { for (let i = 0; i < n; i++) state = stepBattle(state, input, 17, (i + 1) * 17).state; return state; }
function combat(stage) { const state = createBattle({ stage, field }); state.phase = 'combat'; state.sectionMs = 10_000; return state; }

test('all 450 regular sections spawn the released six-ship roster and entry timing', () => {
  for (let stage = 1; stage <= 500; stage++) {
    if (stage % 10 === 0) continue;
    const slots = formation(stage, field);
    for (let index = 0; index < 6; index++) {
      const enemy = createEnemy(index + 1, stage, index, 0, field, slots), original = combatCryptoid(stage, index);
      for (const key of ['type', 'shipClass', 'health', 'radius', 'points', 'reward', 'faction', 'attackPace']) assert.equal(enemy[key], original[key]);
      assert.equal(enemy.entryDuration, Math.round((combatTiming(stage).entryMs + (original.shipClass === 'heavy' ? 600 : 0)) * 1.1));
      const docked = moveEnemy(enemy, enemy.entryDuration, field);
      assert.equal(docked.x, enemy.entryTargetX); assert.equal(docked.y, enemy.entryTargetY);
    }
  }
});

test('the storage-free appearance lookup matches released hull and paint IDs across all 500 stages', () => {
  for (let stage = 1; stage <= 500; stage++) for (let index = 0; index < 90; index++)
    assert.deepEqual(enemyAppearance(stage, index), releasedAppearance(stage, index));
});

test('entry, original sway, dive and return terminate in the same formation without a second clock', () => {
  let enemy = createEnemy(1, 1, 0, 0, field, formation(1, field));
  enemy = moveEnemy(enemy, enemy.entryDuration + enemy.formationDuration, field);
  enemy = moveEnemy(enemy, 500, field);
  assert.ok(enemy.x !== enemy.entryTargetX);
  enemy = { ...enemy, attackPattern: 'dive', attackDelay: 0 };
  enemy = moveEnemy(enemy, attackTime(enemy), field);
  assert.equal(enemy.attackElapsed, attackTime(enemy));
  enemy = moveEnemy(enemy, RETURN_DURATION_MS, field);
  assert.equal(enemy.attackPattern, null); assert.equal(enemy.x, enemy.entryTargetX); assert.equal(enemy.y, enemy.entryTargetY);
});

test('each simulation step is deterministic and leaves the prior snapshot immutable', () => {
  const initial = tick(createBattle({ stage: 1, field }), 200);
  freeze(initial);
  const a = stepBattle(initial, { horizontal: .5, vertical: -1 }, 17, 1);
  const b = stepBattle(initial, { horizontal: .5, vertical: -1 }, 17, 1);
  assert.deepEqual(a, b);
  assert.notEqual(a.state, initial);
});

test('keyboard diagonal and touch offsets preserve the playable bounds', () => {
  let state = combat(1);
  state = tick(state, 10, { horizontal: 1, vertical: -1 });
  assert.ok(state.player.y >= .5 && state.player.x < 1);
  state = tick(state, 1, { ...idle, pointer: { x: 100, y: 600, touch: true } });
  assert.equal(state.player.x, 100 / field.width); assert.equal(state.player.y, (600 - 68) / field.height);
});

test('all editions preserve volley damage, cadence and the existing 28-shot limit', () => {
  for (const edition of [1, 2, 3]) for (const level of [1, 2, 3, 4, 5]) {
    let state = createBattle({ stage: 1, field, hull: 'red-comet', edition, paidWeaponLevel: level, paidWeaponMs: 60_000 });
    state.phase = 'combat'; state.sectionMs = 10_000;
    state.fireMs = shipFireInterval(state.hull, Math.max(edition >= 2 ? 2 : 1, level), 0);
    const result = stepBattle(state, idle, 1, 1).state;
    const expected = makeShipVolley(state.hull, edition, level, state.player.x * field.width, state.player.y * field.height - 23, false, (() => { let id = 1; return () => id++; })());
    assert.deepEqual(result.shots.map(s => s.damage), expected.map(s => s.damage));
    assert.deepEqual(result.shots.map(s => s.visualLevel), expected.map(s => s.visualLevel));
    state.shots = Array.from({ length: 27 }, (_, index) => ({ id: index + 100, x: 1, y: 600, speedX: 0, damage: 1, empowered: false }));
    assert.equal(stepBattle(state, idle, 1, 1).state.shots.length, 28);
  }
});

test('single-consumption hits preserve per-enemy rewards and never credit the wallet', () => {
  const state = combat(1), enemy = createEnemy(100, 1, 0, 0, field, state.slots);
  enemy.entryElapsed = enemy.entryDuration; enemy.formationElapsed = enemy.formationDuration;
  enemy.x = enemy.entryTargetX; enemy.y = enemy.entryTargetY; enemy.health = 1;
  state.enemies = [enemy];
  state.shots = [{ id: 101, x: enemy.x, y: enemy.y + 5, speedX: 0, damage: 1, empowered: false }];
  const next = stepBattle(state, idle, 17, 17).state;
  assert.equal(next.destroyed, 1); assert.equal(next.score, enemy.points); assert.equal(next.shards, enemy.reward);
  assert.equal(next.shots.some(s => s.id === 101), false);
  assert.equal(tick(next).destroyed, 1);
});

test('hull guard protects projectiles; repeated overlap cannot consume more than one life', () => {
  let state = createBattle({ stage: 1, field, edition: 2 }); state.phase = 'combat';
  const shot = { id: 80, x: state.player.x * field.width, y: state.player.y * field.height - 1, vx: 0, vy: .1, radius: 5 };
  state.enemyShots = [shot]; state = tick(state);
  assert.equal(state.hearts, 3); assert.equal(state.projectileGuard, 0);
  state.impactCooldownMs = 0; state.enemyShots = [{ ...shot, id: 81 }]; state = tick(state);
  assert.equal(state.hearts, 2);
  state.enemyShots = [{ ...shot, id: 82 }]; state = tick(state);
  assert.equal(state.hearts, 2);
});

test('finite original flight plans advance once and clear projectiles at the boundary', () => {
  const state = combat(19); state.spawned = state.slots.length; state.enemies = [];
  assert.ok(blockFlights(19).length > 1);
  let next = tick(state);
  assert.equal(next.flight, 1); assert.equal(next.phase, 'intro'); assert.equal(next.spawned, 0);
  next.phase = 'combat'; next.spawned = next.slots.length;
  next = tick(next);
  assert.equal(next.phase, 'clear'); assert.equal(next.score, GROUP_POINTS * 2);
  next = tick(next, Math.ceil(combatTiming(19).clearMs / 17) + 1);
  assert.equal(next.stage, 20); assert.ok(next.boss); assert.equal(next.phase, 'intro');
});
const GROUP_POINTS = 50;

test('all 50 bosses reject protected-hull damage; a swept gun hit cannot leak into the reactor', () => {
  for (let stage = 10; stage <= 500; stage += 10) {
    const state = combat(stage); state.boss.elapsed = BOSS_ENTRY_MS; state.boss.y = 180;
    const gun = gunPosition(state.boss, bossWeapons[state.boss.config.id - 1][0]);
    const health = state.boss.health, turretHealth = state.boss.turrets.reduce((sum, t) => sum + t.health, 0);
    state.shots = [{ id: 100, x: gun.x, y: gun.y + 10, speedX: 0, damage: 2, empowered: true }];
    const next = stepBattle(state, idle, 34, 34).state;
    assert.equal(next.boss.health, health);
    assert.ok(next.boss.turrets.reduce((sum, t) => sum + t.health, 0) < turretHealth, `boss ${stage / 10}`);
    assert.equal(next.shots.some(shot => shot.id === 100), false);
  }
});

test('all 50 exposed reactors and their escort cycles run with bounded projectiles', () => {
  for (let stage = 10; stage <= 500; stage += 10) {
    let state = combat(stage); state.boss.elapsed = BOSS_ENTRY_MS; state.boss.y = 160;
    for (const turret of state.boss.turrets) turret.health = 0;
    state.player.x = .08; state.player.y = .91;
    assert.equal(bossHullExposed(state.boss), true);
    let fired = false;
    for (let i = 0; i < 720; i++) {
      state = tick(state); fired ||= state.boss.core?.volley > 0;
      assert.ok(state.enemyShots.length <= 5); assert.ok(state.enemies.length <= 6); assert.ok(state.shots.length <= 28);
    }
    assert.equal(fired, true, `boss ${stage / 10}`);
  }
});

test('boss defeat commits once and freezes at an explicit statistics gate', () => {
  const state = combat(40); state.boss.elapsed = BOSS_ENTRY_MS; state.boss.y = 150; state.boss.health = 1;
  for (const turret of state.boss.turrets) turret.health = 0;
  // Find a point inside the original silhouette through the public collision helper.
  let point;
  for (let y = 110; y < 190 && !point; y += 2) for (let x = 80; x < 310 && !point; x += 2)
    if (bossHitTarget(state.boss, { x, y }, { x, y })) point = { x, y };
  assert.ok(point);
  state.shots = [{ id: 111, ...point, speedX: 0, damage: 2, empowered: true }];
  const result = stepBattle(state, idle, 1, 1), next = result.state;
  assert.equal(next.phase, 'boss-stop'); assert.equal(next.score, bossPoints(40)); assert.equal(next.shards, bossShardReward(40));
  assert.equal(result.events.filter(e => e.key === 'boss-defeat' && e.type === 'checkpoint').length, 1);
  assert.deepEqual(tick(next, 10_000), next);
});

test('a paused session preserves weapon time and never turns a long gap into fast combat', () => {
  const session = new CoreSession('battle-run', createBattle({ stage: 40, field, paidWeaponLevel: 3, paidWeaponMs: 60_000 }), stepBattle);
  session.loaded(session.loadingTicket()); session.start(); const clock = session.acquireClock();
  for (let i = 0; i < 400; i++) { clock.tick(17, idle); session.drainEvents(); }
  session.pause('hidden'); const before = session.snapshot();
  clock.tick(60_000, idle); assert.deepEqual(session.snapshot().state, before.state);
  session.resume(); clock.tick(2_501, idle);
  assert.equal(session.snapshot().pausedBy, 'loop-stall'); assert.deepEqual(session.snapshot().state, before.state);
});
