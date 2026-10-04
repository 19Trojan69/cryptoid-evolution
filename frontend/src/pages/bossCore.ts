import type { SectorBoss } from './sectorBoss.ts';
import { bossVulnerable } from './sectorBoss.ts';
import type { EnemyShot } from './enemyFire.ts';
import type { PlayerPosition } from './playerCombat.ts';

export type BossCoreState = { elapsed: number; volley: number };
export const CORE_WARNING_MS = 1800;
export const coreActive = (boss: SectorBoss) => boss.health > 0 && boss.turrets.length > 0 && boss.turrets.every(g => g.health <= 0);
export const coreInterval = (boss: SectorBoss) => boss.core?.volley ? 2800 - Math.min(49, boss.config.id - 1) * 12 : CORE_WARNING_MS;

// A damaged ship can still pulse from its reactor. No turret is repaired.
// Directions lock on launch; fans leave a central gap and share the escort cap.
export function advanceBossCore(boss: SectorBoss, player: PlayerPosition, width: number, height: number, delta: number, available: number, firstId: number): EnemyShot[] {
  if (!coreActive(boss) || !bossVulnerable(boss) || delta <= 0) return [];
  const core = boss.core ??= { elapsed: 0, volley: 0 };
  core.elapsed = Math.min(coreInterval(boss), core.elapsed + Math.min(80, delta));
  const slots = Math.max(0, Math.floor(available));
  if (core.elapsed < coreInterval(boss) || slots < 1) return [];
  const tier = boss.config.id <= 10 ? 0 : boss.config.id <= 30 ? 1 : 2;
  const x = boss.x, y = boss.y + boss.height * .25;
  const aim = Math.max(-.65, Math.min(.65, Math.atan2(player.x * width - x, Math.max(80, player.y * height - y))));
  const fan = tier > 0 && core.volley % 2 === 1;
  const angles = fan ? (tier === 2 ? [-.60, -.24, .24, .60] : [-.34, .34]) : [aim];
  const speed = .12 + tier * .015;
  const shots = angles.slice(0, slots).map((a, i): EnemyShot => ({ id: firstId + i, x, y, vx: Math.sin(a) * speed, vy: Math.cos(a) * speed, radius: 6, bossKind: 'pulse', weaponKind: 'pulse', weaponColor: '#ff8adb', weaponWidth: 5, caliber: 8 }));
  core.elapsed = 0;
  core.volley++;
  return shots;
}
