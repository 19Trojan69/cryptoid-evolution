import { combatCryptoid, combatEntryStage, combatTiming } from '../../frontend/src/pages/combatVariety.ts';
import { formationLayout, formationSlotsForCount, arrangeFormationBySize, formationBelowHud } from '../../frontend/src/pages/sectorManager.ts';
import { entryPatternForSector, entryStartX, entryPosition, type EntryPattern } from '../../frontend/src/pages/entryPatterns.ts';
import { attackDuration, attackPosition, type AttackPattern } from '../../frontend/src/pages/attackPatterns.ts';
import { advanceShipMotion, idleShipMotion, type ShipMotion } from '../../frontend/src/pages/shipRealism.ts';
import type { CryptoidProfile } from '../../frontend/src/pages/cryptoidRoster.ts';
import type { EnemyFireProgress } from '../../frontend/src/pages/enemyFire.ts';

export type Field = Readonly<{ width: number; height: number; hudBottom: number; playerDiameter: number }>;
export type FormationSlot = ReturnType<typeof formationLayout>[number];
export type Enemy = CryptoidProfile & {
  id: number; x: number; y: number; maxHealth: number; cloaked: boolean; escort: boolean; appearanceIndex: number;
  entryElapsed: number; entryDuration: number; entryStartX: number; entryStartY: number; entryTargetX: number; entryTargetY: number;
  entrySide: number; entryPattern: EntryPattern; entryStage: number; entryIndex: number;
  formationElapsed: number; formationDuration: number; attackPattern: AttackPattern | null; attackDelay: number;
  attackLane: number; attackElapsed: number; returnElapsed: number; firedThisAttack: boolean; collidedThisAttack: boolean;
  fireCycle: number; fireProgress?: EnemyFireProgress; visualMotion: ShipMotion;
};
export const RETURN_DURATION_MS = 3_500;
export function formation(stage: number, field: Field, count = 6, offset = 0): FormationSlot[] {
  const slots = formationSlotsForCount(formationLayout(stage, field.width, field.height, stage), count);
  const radii = slots.map((_, index) => combatCryptoid(stage, index + offset).radius);
  return formationBelowHud(arrangeFormationBySize(slots, radii), radii.map(r => r === 25 ? r * 1.5 : r), field.width, field.hudBottom, field.playerDiameter);
}
export function createEnemy(id: number, stage: number, index: number, offset: number, field: Field, slots: readonly FormationSlot[]): Enemy {
  const profile = combatCryptoid(stage, index + offset), target = slots[index];
  if (!target) throw new RangeError('Missing formation slot');
  const flight = Math.floor(offset / 6), entrySide = target.entrySide * (flight % 2 ? -1 : 1);
  const choreography = combatEntryStage(stage, flight), pattern = entryPatternForSector(choreography + flight * 3);
  const startX = entryStartX(pattern, index, field.width, profile.radius, entrySide, choreography, target.x);
  const startY = field.hudBottom + profile.radius + 8;
  return { ...profile, id, x: startX, y: startY, maxHealth: profile.health, cloaked: false, escort: false, appearanceIndex: index + offset,
    entryDuration: Math.round((combatTiming(stage).entryMs + (profile.shipClass === 'heavy' ? 600 : 0)) * 1.1), entryElapsed: 0,
    entryStartX: startX, entryStartY: startY, entryTargetX: target.x, entryTargetY: target.y, entrySide,
    entryPattern: pattern, entryStage: choreography, entryIndex: index, formationElapsed: 0, formationDuration: 180,
    attackPattern: null, attackDelay: 0, attackLane: 0, attackElapsed: 0, returnElapsed: 0, firedThisAttack: false,
    collidedThisAttack: false, fireCycle: 0, visualMotion: idleShipMotion() };
}
export const attackTime = (enemy: Enemy) => enemy.attackPattern === null ? 0 : attackDuration(enemy.attackPattern) * enemy.attackPace;
export const enemyReady = (enemy: Enemy) => enemy.entryElapsed >= enemy.entryDuration && enemy.formationElapsed >= enemy.formationDuration;
export function moveEnemy(enemy: Enemy, delta: number, field: Field): Enemy {
  const { width, height } = field, radius = enemy.radius;
  const clampX = (x: number) => Math.max(radius, Math.min(width - radius, x));
  let next: Enemy;
  if (enemy.entryElapsed >= enemy.entryDuration && enemy.formationElapsed < enemy.formationDuration) {
    next = { ...enemy, x: clampX(enemy.entryTargetX), y: enemy.entryTargetY, formationElapsed: Math.min(enemy.formationDuration, enemy.formationElapsed + delta) };
  } else if (enemy.entryElapsed >= enemy.entryDuration) {
    if (enemy.attackPattern === null) {
      const elapsed = enemy.formationElapsed + delta;
      const drift = enemy.escort ? 0 : Math.sin(Math.max(0, elapsed - enemy.formationDuration) * .0009) * Math.min(12, width * .025);
      next = { ...enemy, formationElapsed: elapsed, x: clampX(enemy.entryTargetX + drift), y: enemy.entryTargetY };
    } else if (enemy.attackDelay > 0) next = { ...enemy, attackDelay: Math.max(0, enemy.attackDelay - delta) };
    else if (enemy.attackElapsed < attackTime(enemy)) {
      const duration = attackTime(enemy), elapsed = Math.min(duration, enemy.attackElapsed + delta);
      next = { ...enemy, ...attackPosition({ pattern: enemy.attackPattern, progress: elapsed / duration, startX: enemy.entryTargetX,
        startY: enemy.entryTargetY, width, height, radius, side: enemy.entrySide, lane: enemy.attackLane }), attackElapsed: elapsed };
    } else {
      const elapsed = Math.min(RETURN_DURATION_MS, enemy.returnElapsed + delta), progress = elapsed / RETURN_DURATION_MS;
      const diveX = enemy.entryTargetX + (width / 2 - enemy.entryTargetX) * .45, diveY = height - 75 + radius;
      next = elapsed === RETURN_DURATION_MS
        ? { ...enemy, x: clampX(enemy.entryTargetX), y: enemy.entryTargetY, formationElapsed: 0, attackPattern: null,
          attackDelay: 0, attackLane: 0, attackElapsed: 0, returnElapsed: 0, firedThisAttack: false, fireProgress: undefined, collidedThisAttack: false }
        : { ...enemy, x: clampX(diveX + (enemy.entryTargetX - diveX) * progress - enemy.entrySide * Math.min(width * .09, 85) * Math.sin(Math.PI * progress)),
          y: diveY + (enemy.entryTargetY - diveY) * progress, returnElapsed: elapsed };
    }
  } else {
    const entryDelta = Math.min(delta, enemy.entryDuration - enemy.entryElapsed), elapsed = Math.min(enemy.entryDuration, enemy.entryElapsed + delta);
    next = { ...enemy, ...entryPosition({ pattern: enemy.entryPattern, progress: elapsed / enemy.entryDuration,
      startX: enemy.entryStartX, startY: enemy.entryStartY, targetX: enemy.entryTargetX, targetY: enemy.entryTargetY,
      width, height, radius, side: enemy.entrySide, index: enemy.entryIndex, stage: enemy.entryStage }),
      entryElapsed: elapsed, formationElapsed: Math.min(enemy.formationDuration, delta - entryDelta) };
  }
  return { ...next, visualMotion: advanceShipMotion(enemy.visualMotion, next.x - enemy.x, next.y - enemy.y, delta) };
}
