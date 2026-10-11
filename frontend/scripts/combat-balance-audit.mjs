import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { playerSkins } from '../src/pages/shipFleet.ts';
import { chooseCryptoid } from '../src/pages/cryptoidRoster.ts';
import { enemyHealthBonus, levelDifficulty } from '../src/pages/levelDifficulty.ts';
import { makeShipVolley, shipFireInterval } from '../src/pages/shipAttributes.ts';
import { stageWeaponLevel } from '../src/pages/shipEvolution.ts';
import { createSectorBoss, damageSectorBoss, BOSS_ENTRY_MS } from '../src/pages/sectorBoss.ts';
import { damageBossTurret } from '../src/pages/bossTurrets.ts';
import { bossWeapons } from '../src/pages/bossWeapons.ts';

// Reproducible damage audit, not an autonomous player or an estimate of actual
// win rate. Every projectile connects; no travel, movement, escort distraction,
// incoming damage is simulated. Explicit timer scenarios model expiry; the
// main matrix holds weapons and powers active. One firing interval is charged
// for the first volley. Old formulas are pinned to release e633594 (#156).
export function simulateBossDamage({ level, hull = 'grey-scout', stage = 1, weapon = 1, rapid = false, overdrive = false, baseline = false, weaponDurationMs = Infinity, powerDurationMs = Infinity }) {
  const boss = createSectorBoss(level, 390, 90, 760);
  boss.elapsed = BOSS_ENTRY_MS;
  if (baseline) {
    const progress = levelDifficulty(level).progress;
    boss.health = boss.maxHealth = (28 + progress * 52 + progress * progress * 40) * 9;
    boss.turrets.forEach((turret, index) => {
      const gun = bossWeapons[boss.config.id - 1][index];
      turret.health = turret.maxHealth = 2 * Math.ceil(4 + gun.caliber / 4 + (boss.config.id - 1) * .15) + 2 * Math.floor((boss.config.id - 1) / 5);
    });
  }
  let volleys = 0, connected = 0, elapsed = 0, turretElapsed = 0;
  while (boss.health > 0 && volleys < 10000) {
    volleys++;
    const activeWeapon = elapsed < weaponDurationMs ? weapon : 1;
    const activeRapid = rapid && elapsed < powerDurationMs;
    const interval = shipFireInterval(hull, stageWeaponLevel(stage, activeWeapon), activeRapid ? 10000 : 0);
    const time = elapsed + interval;
    // Timers expire while the volley timer is accumulating, as in GamePage.
    // If a boundary is crossed, recompute the next volley at the new cadence.
    const firingWeapon = time < weaponDurationMs ? weapon : 1;
    const firingRapid = rapid && time < powerDurationMs;
    elapsed += shipFireInterval(hull, stageWeaponLevel(stage, firingWeapon), firingRapid ? 10000 : 0);
    const volley = makeShipVolley(hull, stage, firingWeapon, 100, 200, overdrive && elapsed < powerDurationMs, () => 1);
    for (const shot of volley) {
      if (boss.health <= 0) break;
      const turret = boss.turrets.findIndex(gun => gun.health > 0);
      if (turret >= 0) {
        damageBossTurret(boss, turret, shot.damage);
        turretElapsed = elapsed;
        connected++;
      } else if (!baseline || elapsed - boss.lastDamageAt >= 180) {
        if (damageSectorBoss(boss, shot.damage, elapsed)) connected++;
      }
    }
  }
  if (boss.health > 0) throw new Error(`Unfinished damage simulation at boss ${level}`);
  return { seconds: elapsed / 1000, coreSeconds: (elapsed - turretElapsed) / 1000, volleys, connected };
}

export function auditCombatBalance() {
  let scenarios = 0;
  for (let level = 10; level <= 500; level += 10) for (const hull of playerSkins) for (const stage of [1, 2, 3])
    for (let weapon = 1; weapon <= 5; weapon++) for (const rapid of [false, true]) for (const overdrive of [false, true]) {
      const result = simulateBossDamage({ level, hull: hull.id, stage, weapon, rapid, overdrive });
      if (!Number.isFinite(result.seconds) || result.seconds <= 0) throw new Error('Invalid duration');
      scenarios++;
    }
  const bosses = [10, 50, 100, 250, 480, 490, 500].map(level => {
    const boss = createSectorBoss(level, 390);
    return {
      level, guns: boss.turrets.length,
      turretHealth: Number(boss.turrets.reduce((sum, gun) => sum + gun.health, 0).toFixed(2)),
      coreHealth: Number(boss.maxHealth.toFixed(2)),
      greyStandardOld: Number(simulateBossDamage({ level, baseline: true }).seconds.toFixed(2)),
      greyStandard: Number(simulateBossDamage({ level }).seconds.toFixed(2)),
      greyAdvanced: Number(simulateBossDamage({ level, stage: 2 }).seconds.toFixed(2)),
      greyElite: Number(simulateBossDamage({ level, stage: 3 }).seconds.toFixed(2)),
      greyWeapon5Old: Number(simulateBossDamage({ level, weapon: 5, baseline: true }).seconds.toFixed(2)),
      greyWeapon5: Number(simulateBossDamage({ level, weapon: 5 }).seconds.toFixed(2)),
      redWeapon5: Number(simulateBossDamage({ level, hull: 'red-comet', weapon: 5 }).seconds.toFixed(2)),
      greyFreeTwin20s: Number(simulateBossDamage({ level, weapon: 2, weaponDurationMs: 20000 }).seconds.toFixed(2)),
    };
  });
  const enemyClasses = [];
  const seen = new Set();
  for (let slot = 0; slot < 26; slot++) {
    const enemy = chooseCryptoid(500, slot);
    if (seen.has(enemy.type)) continue;
    seen.add(enemy.type);
    const baseHealth = enemy.health / (1 + enemyHealthBonus(500, slot) / 4);
    enemyClasses.push({ type: enemy.type, class: enemy.shipClass, baseHealth, lateOldHealth: baseHealth + enemyHealthBonus(500, slot) * 2, lateHealth: enemy.health });
  }
  return { baseline: 'e633594', scenarios, assumptions: 'Ideal connected shots, sequential targets, firing intervals; excludes travel, aim, movement, incoming damage and escorts. Weapon-5 rows assume sustained fire; free-twin rows expire at 20 seconds.', enemyClasses, bosses };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(JSON.stringify(auditCombatBalance(), null, 2) + '\n');
}
