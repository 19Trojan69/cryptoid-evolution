import { damageBossTurret } from './bossTurrets.ts';
import { damageSectorBoss, bossHullExposed, type SectorBoss } from './sectorBoss.ts';

// The first battery is cleared in one blast. Later batteries withstand an
// increasing number of blasts; the existing turret HP remains authoritative.
export const bombTurretDamage = (bossId: number) => Math.round(24 + Math.min(49, Math.max(0, bossId - 1)) * .22);

export const EMP_DURATION_MS = 7_000;
export function disableEnemyWeapons(state: { empMs: number }) {
  // The same entity and projectile arrays remain alive and keep moving.
  state.empMs = EMP_DURATION_MS;
}

export type BombTurretImpact = { index: number; destroyed: boolean; bonus: number };
export function detonateBossBomb(boss: SectorBoss, time: number) {
  const impacts: BombTurretImpact[] = [];
  for (let index = 0; index < boss.turrets.length; index++) {
    const turret = boss.turrets[index];
    if (turret.health <= 0) continue;
    const bonus = damageBossTurret(boss, index, bombTurretDamage(boss.config.id));
    if (turret.health < turret.maxHealth) impacts.push({ index, destroyed: turret.health === 0, bonus });
  }
  // The blast can reach the exposed hull, but can never end the boss fight.
  const before = boss.health;
  if (bossHullExposed(boss) && boss.health > 1) {
    damageSectorBoss(boss, Math.min(18, (boss.health - 1) / 2), time, true);
  }
  return { impacts, hullDamage: before - boss.health };
}
