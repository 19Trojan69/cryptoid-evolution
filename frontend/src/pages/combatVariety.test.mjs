import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseAttackPattern, attackGroupSize, attackPosition, attackDuration } from './attackPatterns.ts';
import { entryStartX, entryPosition, entryPatternForSector } from './entryPatterns.ts';
import { attackPressure, attackSlots } from './attackPressure.ts';
import { formationLayout, arrangeFormationBySize } from './sectorManager.ts';
import { chooseCryptoid } from './cryptoidRoster.ts';
import { advanceEnemyFire, advanceEnemyShot, enemyAttackFireTime, enemyVolleyKind, enemyShotLimit, enemyShotHitsPlayer, ENEMY_BURST_GAP_MS } from './enemyFire.ts';
import { createPowerUpDrop } from './powerUps.ts';
import { activateCollectedPower } from './collectedPower.ts';
import { activeWeaponLevel, placePlayerFromPointer, TOUCH_SHIP_OFFSET_PX } from './playerCombat.ts';
import { makeShipVolley } from './shipAttributes.ts';
import { nextAfterClear, advanceAfterClear } from './sectorBoss.ts';
import { COMBAT_REF_KEYS, readCombatCheckpoint } from '../../../backend/src/combatCheckpoint.ts';

const dimensions = [[320, 568], [390, 844], [768, 1024], [1024, 768], [1363, 936]];
const classes = ['light', 'medium', 'heavy', 'elite'];
const fire = overrides => advanceEnemyFire({ progress: {kind: 'single', pulses: 0, lastPulseMs: null}, elapsedMs: 0,
  id: 1, x: 195, y: 220, radius: 50, shipClass: 'heavy', player: {x: .5, y: .85}, width: 390, height: 844, stage: 301, available: 5, ...overrides });

test('all first-nine arrivals dock, remain in the upper field and introduce solo manoeuvres without time unlocking groups', () => {
  const signatures = new Set();
  for (let stage = 1; stage <= 9; stage++) {
    for (const elapsed of [0, 600_000]) for (let turn = 0; turn < 30; turn++) {
      assert.equal(attackGroupSize(chooseAttackPattern(turn, elapsed, stage)), 1);
      assert.equal(attackSlots(stage, 1, 5), 0);
    }
    for (const [width, height] of dimensions) {
      const roster = Array.from({length: 6}, (_, i) => chooseCryptoid(stage, i));
      const slots = arrangeFormationBySize(formationLayout(stage, width, height, stage), roster.map(e => e.radius));
      const signature = [];
      for (let index = 0; index < 6; index++) {
        const slot = slots[index], radius = roster[index].radius, pattern = entryPatternForSector(stage);
        const startX = entryStartX(pattern, index, width, radius, slot.entrySide, stage, slot.x);
        const path = {pattern, stage, startX, startY: 72 + radius, targetX: slot.x, targetY: slot.y, width, height, radius, side: slot.entrySide, index};
        if (stage === 1) assert.equal(startX, slot.x);
        for (let step = 0; step <= 100; step++) {
          const point = entryPosition({...path, progress: step / 100});
          assert.ok(point.x >= radius - 1e-9 && point.x <= width - radius + 1e-9);
          assert.ok(point.y <= height * .5 && point.y >= 0);
          if (step === 100) assert.deepEqual(point, {x: slot.x, y: slot.y});
        }
        signature.push(Math.round(startX / width * 100));
      }
      if (width === 390) signatures.add(signature.join(','));
    }
  }
  assert.ok(signatures.size >= 6);
  assert.ok(attackPressure(5).breathingMs > attackPressure(6).breathingMs);
  for (let stage = 10; stage <= 500; stage++) assert.equal(attackPressure(stage).breathingMs, 0);
});

test('class variants unlock at bounded stages and keep light ships single across the whole 500-stage campaign', () => {
  for (let stage = 1; stage <= 500; stage++) for (let turn = 0; turn < 120; turn++) {
    assert.equal(enemyVolleyKind('light', stage, turn), 'single');
    if (stage < 21) for (const c of classes) assert.equal(enemyVolleyKind(c, stage, turn), 'single');
    if (stage < 51) assert.equal(enemyVolleyKind('elite', stage, turn), 'single');
    if (stage < 101) assert.equal(enemyVolleyKind('medium', stage, turn), 'single');
    if (stage < 301) for (const c of classes) assert.notEqual(enemyVolleyKind(c, stage, turn), 'burst');
  }
  const heavy = Array.from({length: 120}, (_, n) => enemyVolleyKind('heavy', 21, n));
  assert.equal(heavy.filter(k => k === 'double').length, 30);
  assert.equal(enemyVolleyKind('heavy', 301, 5), 'burst');
  assert.equal(enemyVolleyKind('elite', 351, 7), 'burst');
  for (const c of classes) assert.equal(enemyVolleyKind(c, 500, 1), 'single', 'large hulls still have ordinary attacks');
});

test('actual volley spawning obeys the phone/tablet budget; two wing shots stay parallel and leave a legal dodge point', () => {
  for (let stage = 1; stage <= 500; stage++) for (const c of classes) for (const [width, height] of dimensions) {
    for (const available of [0, 1, 2, enemyShotLimit(width, 600_000, stage)]) {
      const kind = enemyVolleyKind(c, stage, stage % 24);
      const event = fire({progress: {kind, pulses: 0, lastPulseMs: null}, shipClass: c, stage, width, height, x: width / 2, y: height * .35, available});
      assert.ok(event.shots.length <= available);
      assert.equal(Boolean(event.sound), event.shots.length > 0);
      if (event.sound === 'double') {
        assert.equal(event.shots.length, 2);
        assert.equal(event.shots[0].vx, 0); assert.equal(event.shots[1].vx, 0);
        assert.equal(event.shots[0].vy, event.shots[1].vy);
      }
      const arriving = event.shots.map(s => advanceEnemyShot(s, (height * .85 - s.y) / s.vy));
      assert.ok(Array.from({length: 21}, (_, i) => ({x: (30 + i * (width - 60) / 20) / width, y: .85}))
        .some(player => arriving.every(s => !enemyShotHitsPlayer(s, player, width, height))));
    }
  }
  const reduced = fire({progress: {kind: 'double', pulses: 0, lastPulseMs: null}, available: 1});
  assert.equal(reduced.sound, 'single'); assert.equal(reduced.complete, true);
  assert.equal(fire({y: 500}).sound, null);
});

test('burst sounds follow actual pulses, keep their gap after stalls, and resume without duplicating the first shot', () => {
  const first = fire({progress: {kind: 'burst', pulses: 0, lastPulseMs: null}, elapsedMs: 1000});
  assert.equal(first.sound, 'single'); assert.equal(first.complete, false);
  assert.equal(fire({progress: first.progress, elapsedMs: 1001}).sound, null);
  assert.equal(fire({progress: first.progress, elapsedMs: 1259}).sound, null);
  const second = fire({progress: JSON.parse(JSON.stringify(first.progress)), elapsedMs: 1000 + ENEMY_BURST_GAP_MS});
  assert.equal(second.sound, 'single'); assert.equal(second.complete, true);
  assert.equal(fire({progress: second.progress, elapsedMs: 2000}).sound, null);
  assert.equal(fire({progress: first.progress, elapsedMs: 1500, available: 0}).sound, null);
  assert.equal(fire({progress: first.progress, elapsedMs: 1600, y: 500}).complete, true);
});

test('real formation slots and warned attack paths can fire before reaching the player half', () => {
  for (const stage of [1, 9, 21, 51, 101, 251, 301, 351, 499]) for (const [width, height] of dimensions) {
    const roster = Array.from({length: 6}, (_, i) => chooseCryptoid(stage, i));
    const slots = arrangeFormationBySize(formationLayout(stage, width, height, stage), roster.map(e => e.radius));
    for (let i = 0; i < roster.length; i++) {
      const e = roster[i], slot = slots[i];
      const pattern = 'dive', duration = attackDuration(pattern) * e.attackPace;
      const elapsed = enemyAttackFireTime(duration, slot.y, height, e.radius) + 16;
      const point = attackPosition({pattern, progress: elapsed / duration, startX: slot.x, startY: slot.y, width, height, radius: e.radius, side: slot.entrySide, lane: 0});
      const event = fire({shipClass: e.shipClass, stage, width, height, x: point.x, y: point.y + e.radius * .4, radius: e.radius});
      assert.equal(event.shots.length, 1, `${stage}/${i}/${width} has a reachable firing window`);
    }
  }
});

test('the first Grey Scout pickup produces Twin for twenty seconds, respects safety/duplicates and adds no owned stock', () => {
  const options = {id: 1, x: 195, y: 220, width: 390, height: 844, threats: [], activeCount: 0, chanceRoll: .99, kindRoll: 0, destroyed: 3, dropsCreated: 1, level: 1, usedTypes: ['shield']};
  const drop = createPowerUpDrop(options); assert.equal(drop.type, 'weapon');
  assert.equal(createPowerUpDrop({...options, threats: [{x: 195, y: 245, radius: 25}]}), null);
  assert.equal(createPowerUpDrop({...options, activeCount: 3}), null);
  assert.equal(createPowerUpDrop({...options, usedTypes: ['shield', 'weapon']}), null);
  assert.equal(createPowerUpDrop({...options, level: 11}), null);
  const base = {hearts: 3, shieldCharges: 0, shieldMs: 0, shieldActive: false, weaponLevel: 1, weaponCap: 1, pickupWeaponLevel: 1, pickupWeaponMs: 0, paidWeaponLevel: 1, paidWeaponMs: 0, rapidFireMs: 0, overdriveMs: 0, ownedStock: [1]};
  const state = activateCollectedPower(base, drop.type);
  let id = 0;
  assert.equal(makeShipVolley('grey-scout', 1, base.weaponLevel, 195, 700, false, () => ++id).length, 1);
  assert.equal(makeShipVolley('grey-scout', 1, state.weaponLevel, 195, 700, false, () => ++id).length, 2);
  assert.equal(state.pickupWeaponMs, 20_000); assert.deepEqual(state.ownedStock, [1]);
  assert.equal(activeWeaponLevel(1, 0, state.pickupWeaponLevel, 0, state.weaponCap), 1);
  assert.equal(placePlayerFromPointer(195, 700, 390, 844, true).y * 844, 700 - TOUCH_SHIP_OFFSET_PX);
});

test('old and new combat saves preserve burst progress, class projectiles and the existing boss transition', () => {
  const shot = fire().shots[0];
  const saved = {version: 1, clock: 5000, sequence: 1, stage: 1, encounter: 'normal', width: 390, height: 844,
    state: {asteroids: [{x: 100, y: 100, health: 4, maxHealth: 4, entryElapsed: 100, entryDuration: 5000, entryStage: 1, fireCycle: 3, fireProgress: {kind: 'burst', pulses: 1, lastPulseMs: 16}}],
      bonusTargets: [], shots: [], enemyShots: [shot], player: {x: .5, y: .85}, powerUps: [], powerUpTypes: ['weapon'], combo: {remainingMs: 0}, chainBlocks: 0, projectileGuard: 0, pendingStartPower: null, phase: 'FORMATION', boss: null},
    refs: Object.fromEntries(COMBAT_REF_KEYS.map(k => [k, k === 'nextId' ? 10 : 0])), formationStarted: true, slots: null, escortSlots: null};
  const restored = readCombatCheckpoint(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(restored.state.asteroids[0].fireProgress, saved.state.asteroids[0].fireProgress);
  assert.deepEqual(restored.state.enemyShots, [shot]);
  delete saved.state.asteroids[0].fireProgress; delete saved.state.asteroids[0].entryStage;
  assert.ok(readCombatCheckpoint(saved));
  assert.equal(nextAfterClear(1, 'normal', 9), 'boss');
  assert.deepEqual(advanceAfterClear(9, 'normal'), {encounter: 'boss-intro', section: 10, sector: 10, resetChain: false});
});
