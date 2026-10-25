import { campaignSection } from './campaign.ts';
import { formation, createEnemy, moveEnemy, enemyReady, attackTime, type Enemy, type Field, type FormationSlot } from './enemies.ts';
import type { StepResult, CoreEvent } from './session.ts';
import { movePlayer, placePlayerFromPointer, advanceShot, MAX_PLAYER_SHOTS, shotHitsEnemy, contactWithEnemy, enemyMotionVisible,
  retainContactLatch, type PlayerPosition, type PlayerShot } from '../../frontend/src/pages/playerCombat.ts';
import { makeShipVolley, shipFireInterval, hullAttributes } from '../../frontend/src/pages/shipAttributes.ts';
import { projectileGuardForStage, projectileImpact, stageWeaponLevel, type ShipStage } from '../../frontend/src/pages/shipEvolution.ts';
import { combatTiming, combatAttackPattern } from '../../frontend/src/pages/combatVariety.ts';
import { attackSlots, attackPressure } from '../../frontend/src/pages/attackPressure.ts';
import { attackGroupSize, chooseAttackPattern } from '../../frontend/src/pages/attackPatterns.ts';
import { isGhostCloaked } from '../../frontend/src/pages/cryptoidRoster.ts';
import { blockFlights, nextBlockFlight, GROUP_CLEAR_POINTS, REINFORCEMENT_WARNING_MS } from '../../frontend/src/pages/blockFlights.ts';
import { levelDifficulty } from '../../frontend/src/pages/levelDifficulty.ts';
import { advanceEnemyFire, enemyVolleyKind, enemyAttackFireTime, enemyShotLimit, advanceEnemyShot,
  enemyShotHitsPlayer, enemyShotOutsideField, type EnemyShot } from '../../frontend/src/pages/enemyFire.ts';
import { createSectorBoss, moveSectorBoss, bossVulnerable, damageSectorBoss, BOSS_WARNING_MS, BOSS_ENTRY_MS, type SectorBoss } from '../../frontend/src/pages/sectorBoss.ts';
import { advanceBossTurrets, damageBossTurret } from '../../frontend/src/pages/bossTurrets.ts';
import { advanceBossCore } from '../../frontend/src/pages/bossCore.ts';
import { bossHitTarget } from '../../frontend/src/pages/bossHitTarget.ts';
import { contactWithBoss } from '../../frontend/src/pages/bossContact.ts';
import { bossPoints, bossShardReward } from '../../frontend/src/pages/shardEarnings.ts';
import { createDoubleKillCombo, creditComboDefeat, type DoubleKillCombo } from '../../frontend/src/pages/doubleKillCombo.ts';
import { bossEscortCount, bossEscortSlots, bossEscortRosterIndex, bossEscortAttackInterval, reactorEscortCount, advanceEscortReserve } from '../../frontend/src/pages/bossEscorts.ts';

export type BattleInput = Readonly<{ horizontal: number; vertical: number; pointer?: { x: number; y: number; touch: boolean } }>;
export type BattlePhase = 'intro' | 'combat' | 'clear' | 'boss-stop' | 'defeat';
export type BattleState = {
  field: Field; stage: number; phase: BattlePhase; sectionMs: number; clearMs: number; activeMs: number;
  player: PlayerPosition; hearts: number; maxHearts: number; impactCooldownMs: number; recoveringMs: number;
  hull: string; edition: ShipStage; projectileGuard: number;
  weaponLevel: number; weaponSource: 'standard' | 'paid'; paidWeaponLevel: number; paidWeaponMs: number;
  fireMs: number; nextId: number; enemies: Enemy[]; shots: PlayerShot[]; enemyShots: EnemyShot[];
  boss: SectorBoss | null; flight: number; offset: number; spawned: number; spawnMs: number; slots: FormationSlot[];
  attackMs: number; attackCycle: number; escortSlots: FormationSlot[] | null; escortSpawned: number; escortWave: number; escortMs: number;
  score: number; shards: number; destroyed: number; combo: DoubleKillCombo;
};
export type BattleOptions = { stage: number; field: Field; hull?: string; edition?: ShipStage; hearts?: number;
  paidWeaponLevel?: number; paidWeaponMs?: number };

/** A private migration fixture. No account/save schema or shop authority lives
 * here. Pickups, effects, full loadout switching and bonus/save ports are still
 * migration gates; this must not replace the released game yet. */
export function createBattle(options: BattleOptions): BattleState {
  campaignSection(options.stage);
  const f = options.field;
  if (![f.width, f.height, f.hudBottom, f.playerDiameter].every(Number.isFinite)
    || f.width < 160 || f.height < 240 || f.hudBottom < 0 || f.hudBottom > f.height * .35 || f.playerDiameter <= 0)
    throw new RangeError('Invalid playfield');
  const hull = options.hull ?? 'grey-scout', edition = options.edition ?? 1, hearts = options.hearts ?? 3;
  const paidWeaponLevel = options.paidWeaponLevel ?? 1, paidWeaponMs = options.paidWeaponMs ?? 0;
  if (!Object.hasOwn(hullAttributes, hull) || ![1, 2, 3].includes(edition) || !Number.isInteger(hearts) || hearts < 1 || hearts > 6
    || !Number.isInteger(paidWeaponLevel) || paidWeaponLevel < 1 || paidWeaponLevel > 5
    || !Number.isFinite(paidWeaponMs) || paidWeaponMs < 0 || paidWeaponMs > 60_000) throw new RangeError('Invalid supplied loadout');
  const paid = paidWeaponLevel > 1 && paidWeaponMs > 0;
  const state: BattleState = { field: { ...f }, stage: options.stage, phase: 'intro', sectionMs: 0, clearMs: 0, activeMs: 0,
    player: { x: .5, y: .83 }, hearts, maxHearts: hearts, impactCooldownMs: 0, recoveringMs: 0,
    hull, edition, projectileGuard: projectileGuardForStage(edition), weaponLevel: paid ? paidWeaponLevel : 1,
    weaponSource: paid ? 'paid' : 'standard', paidWeaponLevel, paidWeaponMs,
    fireMs: 0, nextId: 1, enemies: [], shots: [], enemyShots: [], boss: null,
    flight: 0, offset: 0, spawned: 0, spawnMs: 0, slots: [], attackMs: 0, attackCycle: 0,
    escortSlots: null, escortSpawned: 0, escortWave: 0, escortMs: 0, score: 0, shards: 0, destroyed: 0, combo: createDoubleKillCombo() };
  enterStage(state, options.stage); return state;
}

function enterStage(state: BattleState, stage: number) {
  campaignSection(stage);
  state.stage = stage; state.phase = 'intro'; state.sectionMs = 0; state.clearMs = 0;
  state.enemies = []; state.shots = []; state.enemyShots = []; state.fireMs = 0;
  state.flight = 0; state.offset = 0; state.spawned = 0; state.spawnMs = 0; state.attackMs = 0;
  state.escortSlots = null; state.escortSpawned = 0; state.escortWave = 0; state.escortMs = 0;
  state.boss = stage % 10 === 0 ? createSectorBoss(stage, state.field.width, state.field.hudBottom, state.field.height) : null;
  state.slots = state.boss ? [] : formation(stage, state.field, blockFlights(stage)[0]);
}

// Clone only mutable simulation data. Static boss configuration and formation
// geometry are shared read-only; there is no full-state copy into React.
function fork(state: Readonly<BattleState>): BattleState {
  return { ...state, player: { ...state.player }, combo: { ...state.combo }, enemies: state.enemies.map(enemy => ({ ...enemy })),
    shots: [...state.shots], enemyShots: [...state.enemyShots], boss: state.boss ? { ...state.boss,
      turrets: state.boss.turrets.map(gun => ({ ...gun, firedBarrels: [...gun.firedBarrels] })),
      core: state.boss.core ? { ...state.boss.core } : undefined } : null };
}

export function stepBattle(previous: Readonly<BattleState>, input: BattleInput, delta: number, _atMs: number): StepResult<BattleState> {
  if (!Number.isFinite(delta) || delta < 0 || delta > 34) throw new RangeError('Unbounded simulation step');
  if (![input.horizontal, input.vertical].every(Number.isFinite) || input.pointer && ![input.pointer.x, input.pointer.y].every(Number.isFinite)) throw new TypeError('Invalid combat input');
  if (delta === 0 || previous.phase === 'defeat' || previous.phase === 'boss-stop') return { state: previous as BattleState };
  const state = fork(previous), events: CoreEvent[] = [];
  const event = (type: CoreEvent['type'], key: string, value?: CoreEvent['value']) => events.push({ type, key, value });
  const { width, height } = state.field, previousPlayer = previous.player, timing = combatTiming(state.stage);
  const normal = state.stage % 10 !== 0;
  state.activeMs += delta; state.sectionMs += delta;
  state.impactCooldownMs = Math.max(0, state.impactCooldownMs - delta);
  state.recoveringMs = Math.max(0, state.recoveringMs - delta);
  state.combo.remainingMs = Math.max(0, state.combo.remainingMs - delta);
  state.player = input.pointer
    ? placePlayerFromPointer(input.pointer.x, input.pointer.y, width, height, input.pointer.touch)
    : movePlayer(previous.player, input.horizontal, input.vertical, delta, width, height);
  if (state.phase === 'clear') {
    state.fireMs = 0; state.clearMs += delta;
    if (state.clearMs >= timing.clearMs) { enterStage(state, state.stage + 1); event('phase', 'stage-enter', state.stage); }
    return { state, events };
  }
  // The released selected paid timer is protected during intro and recovery.
  if (state.phase === 'combat' && state.weaponSource === 'paid' && !state.recoveringMs) {
    state.paidWeaponMs = Math.max(0, state.paidWeaponMs - delta);
    if (!state.paidWeaponMs) { state.weaponLevel = 1; state.paidWeaponLevel = 1; state.weaponSource = 'standard'; event('hud', 'weapon-expired'); }
  }
  const introMs = normal ? timing.introMs : BOSS_WARNING_MS;
  if (state.phase === 'intro' && state.sectionMs >= introMs) { state.phase = 'combat'; event('phase', 'combat', state.stage); }
  if (normal && state.phase === 'combat' && state.spawned < state.slots.length) {
    state.spawnMs += delta;
    if (state.spawnMs >= timing.gapMs) {
      state.spawnMs -= timing.gapMs;
      state.enemies.push(createEnemy(state.nextId++, state.stage, state.spawned++, state.offset, state.field, state.slots));
    }
  }
  if (!normal && state.phase === 'combat' && state.boss) advanceEscorts(state, delta);
  selectAttack(state, delta, normal);
  const pressure = attackPressure(state.stage);
  const surviving: Enemy[] = [];
  for (const enemy of state.enemies) {
    let next = moveEnemy(enemy, delta, state.field);
    if (enemy.attackPattern && !next.attackPattern && !(normal && pressure.overlap)) state.attackMs = 0;
    if (next.attackPattern && !next.attackDelay && !next.firedThisAttack && next.attackElapsed < attackTime(next)) {
      const shipClass = next.escort ? 'light' : next.shipClass;
      const fireAt = next.escort ? attackTime(next) * .28 : enemyAttackFireTime(attackTime(next), next.entryTargetY, height, next.radius);
      const fired = advanceEnemyFire({ progress: next.fireProgress ?? { kind: 'single', pulses: 0, lastPulseMs: null }, elapsedMs: next.attackElapsed - fireAt,
        id: state.nextId, x: next.x, y: next.y + next.radius * .4, radius: next.radius, shipClass,
        player: state.player, width, height, stage: state.stage, available: enemyShotLimit(width, state.activeMs, state.stage) - state.enemyShots.length });
      next = { ...next, fireProgress: fired.progress, firedThisAttack: fired.complete };
      state.nextId += fired.shots.length; state.enemyShots.push(...fired.shots);
      if (fired.sound) event('sound', `enemy-${shipClass}-${fired.sound}`);
    }
    if (next.collidedThisAttack && !retainContactLatch(true, previousPlayer, width, height, enemy)) next = { ...next, collidedThisAttack: false };
    const hit = contactWithEnemy(state.player, width, height, next, !next.cloaked && enemyMotionVisible(enemy, next, width, height), next.collidedThisAttack, state.impactCooldownMs, enemy, previousPlayer);
    if (hit.damage) {
      damagePlayer(state, events); state.score += next.points; creditComboDefeat(state, next.reward, state.activeMs);
      event('sound', 'explosion'); continue;
    }
    next.cloaked = isGhostCloaked(next.type, !next.attackPattern && enemyReady(next), state.activeMs);
    surviving.push(next);
  }
  state.enemies = surviving;
  if (state.boss && state.phase === 'combat') {
    const before = state.boss;
    state.boss = moveSectorBoss(before, delta, width, height);
    if (contactWithBoss(state.player, width, height, state.boss, state.impactCooldownMs, before, previousPlayer).damage) damagePlayer(state, events);
    const capacity = () => enemyShotLimit(width, state.activeMs, state.stage) - state.enemyShots.length;
    const fired = advanceBossTurrets(state.boss, state.player, width, height, delta, capacity(), state.nextId);
    state.nextId += fired.shots.length; state.enemyShots.push(...fired.shots);
    for (const fire of fired.events) event('sound', `boss-${fire.kind}`, fire.barrels);
    const pulses = advanceBossCore(state.boss, state.player, width, height, delta, capacity(), state.nextId);
    state.nextId += pulses.length; state.enemyShots.push(...pulses);
    if (pulses.length) event('sound', 'boss-pulse', pulses.length);
  }
  state.enemyShots = state.enemyShots.flatMap(shot => {
    const moved = advanceEnemyShot(shot, delta);
    if (enemyShotHitsPlayer(moved, state.player, width, height, shot, previousPlayer)) {
      if (!state.impactCooldownMs) {
        const impact = projectileImpact(state.projectileGuard, false); state.projectileGuard = impact.guard;
        if (impact.damage) damagePlayer(state, events);
        else { state.impactCooldownMs = 1_500; event('sound', 'shield'); }
      }
      return [];
    }
    return enemyShotOutsideField(moved, width, height) ? [] : [moved];
  });
  if (state.phase === 'combat') {
    state.fireMs += delta;
    const effectiveLevel = stageWeaponLevel(state.edition, state.weaponLevel), interval = shipFireInterval(state.hull, effectiveLevel, 0);
    if (state.fireMs >= interval) {
      state.fireMs %= interval;
      if (state.shots.length < MAX_PLAYER_SHOTS) {
        state.shots.push(...makeShipVolley(state.hull, state.edition, state.weaponLevel, state.player.x * width, state.player.y * height - 23, false, () => state.nextId++).slice(0, MAX_PLAYER_SHOTS - state.shots.length));
        event('sound', 'laser', effectiveLevel);
      }
    }
  }
  const remaining: PlayerShot[] = [];
  for (const before of state.shots) {
    const shot = advanceShot(before, delta);
    if (shot.y < -10) continue;
    const target = state.boss && state.phase === 'combat' && bossVulnerable(state.boss) ? bossHitTarget(state.boss, before, shot) : null;
    if (target && state.boss) {
      if (target.kind === 'turret') {
        const points = damageBossTurret(state.boss, target.index, shot.damage); state.score += points;
        event('sound', points ? 'explosion' : 'enemyHit');
      } else if (damageSectorBoss(state.boss, shot.damage, state.activeMs)) {
        event('sound', state.boss.health ? 'enemyHit' : 'boss-defeat');
        if (!state.boss.health) {
          state.score += bossPoints(state.stage); state.shards += bossShardReward(state.stage);
          state.phase = 'boss-stop'; state.enemies = []; state.enemyShots = []; state.shots = [];
          event('checkpoint', 'boss-defeat', state.stage); event('phase', 'boss-stop', state.stage);
          break;
        }
      }
      continue;
    }
    const enemy = state.enemies.find(candidate => shotHitsEnemy(shot, candidate));
    if (!enemy) { remaining.push(shot); continue; }
    enemy.health = Math.max(0, enemy.health - shot.damage);
    if (enemy.health < 1e-9) enemy.health = 0;
    event('sound', enemy.health ? 'enemyHit' : 'explosion');
    if (!enemy.health) {
      state.score += enemy.points * (enemy.attackPattern && !enemy.attackDelay ? 2 : 1);
      creditComboDefeat(state, enemy.reward, state.activeMs);
      state.enemies = state.enemies.filter(candidate => candidate.id !== enemy.id);
      if (enemy.attackPattern) state.attackMs = 0;
    }
  }
  state.shots = state.phase === 'boss-stop' ? [] : remaining;
  if (normal && state.phase === 'combat' && state.spawned === state.slots.length && state.enemies.length === 0) {
    state.score += GROUP_CLEAR_POINTS;
    const next = nextBlockFlight(state.stage, state.flight, state.spawned, 0);
    state.shots = []; state.enemyShots = []; state.fireMs = 0; state.attackMs = 0;
    if (next) {
      state.flight = next.group; state.offset = next.offset; state.spawned = 0; state.spawnMs = 0;
      state.slots = formation(state.stage, state.field, next.count, next.offset);
      state.sectionMs = Math.max(0, timing.introMs - REINFORCEMENT_WARNING_MS - timing.breathingMs); state.phase = 'intro';
      event('phase', 'reinforcement', state.flight);
    } else { state.phase = 'clear'; state.clearMs = 0; event('checkpoint', 'block-clear', state.stage); }
  }
  if (!state.hearts) { state.phase = 'defeat'; state.shots = []; state.enemyShots = []; event('phase', 'defeat'); }
  if (state.phase !== previous.phase) event('hud', 'phase', state.phase);
  return { state, events };
}

function damagePlayer(state: BattleState, events: CoreEvent[]) {
  if (state.impactCooldownMs || !state.hearts) return;
  state.hearts--; state.impactCooldownMs = 1_500; state.recoveringMs = 1_350;
  state.projectileGuard = state.hearts ? projectileGuardForStage(state.edition) : 0;
  events.push({ type: 'sound', key: state.hearts ? 'collision' : 'playerDestroy' }, { type: 'checkpoint', key: 'life-lost', value: state.hearts });
}

function selectAttack(state: BattleState, delta: number, normal: boolean) {
  const ready = state.enemies.filter(enemyReady), active = state.enemies.filter(enemy => enemy.attackPattern).length;
  const available = ready.filter(enemy => !enemy.attackPattern);
  const total = normal ? state.slots.length : state.escortSlots?.length;
  const spawned = normal ? state.spawned : state.escortSpawned;
  const complete = total !== undefined && spawned === total && ready.length > 0 && ready.length === state.enemies.length;
  if (complete) state.attackMs += delta;
  else if (!active) state.attackMs = 0;
  const pressure = attackPressure(state.stage), timing = combatTiming(state.stage);
  const slots = normal ? attackSlots(state.stage, active, available.length) : active ? 0 : available.length;
  const interval = normal ? active ? pressure.intervalMs : state.stage <= 29 ? state.stage === 1 ? 1_600 : 1_900
    : levelDifficulty(state.stage).attackCooldownMs + pressure.breathingMs + timing.breathingMs : bossEscortAttackInterval(state.stage);
  if (!complete || slots < 1 || state.attackMs < interval) return;
  // The nine-block teaching table has no tenth (boss) entry. Escorts use the
  // existing general attack selector, including early exposed-reactor wings.
  let pattern = normal ? combatAttackPattern(state.stage, state.attackCycle++, state.activeMs)
    : chooseAttackPattern(state.attackCycle++, state.activeMs, state.stage);
  if (!normal && pattern === 'vDive') pattern = 'double';
  if (slots < attackGroupSize(pattern)) pattern = slots >= 2 ? 'double' : 'curve';
  const count = attackGroupSize(pattern), chosen = available.slice(0, count).map(enemy => enemy.id);
  state.enemies = state.enemies.map(enemy => {
    const index = chosen.indexOf(enemy.id); if (index < 0) return enemy;
    const cycle = enemy.fireCycle + 1;
    return { ...enemy, attackPattern: pattern, attackDelay: 900 + (pattern === 'double' ? index * 350 : pattern === 'vDive' ? index * 180 : 0),
      attackLane: index - (count - 1) / 2, firedThisAttack: false, collidedThisAttack: false, fireCycle: cycle,
      fireProgress: { kind: enemyVolleyKind(enemy.escort ? 'light' : enemy.shipClass, state.stage, cycle + enemy.entryIndex), pulses: 0, lastPulseMs: null } };
  });
  state.attackMs = 0;
}

function advanceEscorts(state: BattleState, delta: number) {
  const boss = state.boss!;
  if (boss.elapsed < BOSS_ENTRY_MS + 1_500) return;
  const reserve = boss.turrets.every(gun => gun.health <= 0);
  if (!state.escortSlots && !reserve && bossEscortCount(state.stage)) state.escortSlots = bossEscortSlots(state.stage, state.field.width, state.field.height, boss, bossEscortCount(state.stage));
  const pending = state.escortSlots && state.escortSpawned < state.escortSlots.length;
  if (reserve && !pending) {
    const next = advanceEscortReserve(boss, state.stage, state.enemies.length, state.escortMs, delta); state.escortMs = next.elapsed;
    if (next.ready) {
      const slots = bossEscortSlots(state.stage, state.field.width, state.field.height, boss, reactorEscortCount(state.stage));
      if (slots.length) { state.escortWave++; state.escortSpawned = 0; state.escortMs = 360; state.escortSlots = slots; }
    }
  }
  if (!state.escortSlots || state.escortSpawned >= state.escortSlots.length) return;
  state.escortMs += delta;
  if (state.escortMs < 360) return;
  state.escortMs -= 360;
  const index = state.escortSpawned++, slot = state.escortSlots[index];
  const roster = bossEscortRosterIndex(index, state.escortWave);
  const enemy = createEnemy(state.nextId++, state.stage, index, roster - index, state.field, state.escortSlots);
  const x = slot.entrySide === 1 ? 22 : state.field.width - 22;
  state.enemies.push({ ...enemy, escort: true, radius: 18, x, y: slot.y - 8, entryStartX: x, entryStartY: slot.y - 8,
    entryStage: 500, entryDuration: 1_850, formationDuration: 300 });
  if (state.escortSpawned === state.escortSlots.length) state.escortMs = 0;
}
