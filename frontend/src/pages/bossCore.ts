import { chooseInsectLane, insectDifficulty, insectProjectile, insectShotAdmitted } from './insectBoss.ts';
import type { SectorBoss } from './sectorBoss.ts';
import { bossDifficulty } from './bossDifficulty.ts';
import { bossVulnerable, bossHullExposed } from './sectorBoss.ts';
import type { EnemyShot } from './enemyFire.ts';
import type { PlayerPosition } from './playerCombat.ts';
import { specialWeaponMuzzle, specialWeaponMount } from './bossSpecialWeapon.ts';

export type BossCoreState = { elapsed: number; volley: number; lastShotColor?: string };
export const CORE_WARNING_MS = 1800;
export const coreActive = bossHullExposed;
export const coreInterval = (boss: SectorBoss) => boss.core?.volley ? (boss.insect ? insectDifficulty(boss.config.level).coreInterval : bossDifficulty(boss.config.id).coreInterval) : CORE_WARNING_MS;

// The concealed centreline weapon deploys after the last turret falls.
// Directions lock on launch; fans leave a central gap and share the escort cap.
export function advanceBossCore(boss: SectorBoss, player: PlayerPosition, width: number, height: number, delta: number, available: number, firstId: number, liveShots:readonly EnemyShot[]=[]): EnemyShot[] {
  if (!coreActive(boss) || !bossVulnerable(boss) || delta <= 0) return [];
  const core = boss.core ??= { elapsed: 0, volley: 0 };
  core.elapsed = Math.min(coreInterval(boss), core.elapsed + Math.min(80, delta));
  const slots = Math.max(0, Math.floor(available));
  if (core.elapsed < coreInterval(boss) || slots < 1) return [];
  const tier = boss.config.id <= 10 ? 0 : boss.config.id <= 30 ? 1 : 2;
  const {x,y} = specialWeaponMuzzle(boss);
  const aim = Math.max(-.65, Math.min(.65, Math.atan2(player.x * width - x, Math.max(80, player.y * height - y))));
  const fan = tier > 0 && core.volley % 2 === 1;
  const angles = boss.insect ? [aim] : fan ? (tier === 2 ? [-.60, -.24, .24, .60] : [-.34, .34]) : [aim];
  const speed = boss.insect ? insectDifficulty(boss.config.level).coreSpeed : bossDifficulty(boss.config.id).coreSpeed;
  if(boss.insect)chooseInsectLane(boss,player.x,liveShots);
  let shots = angles.slice(0, slots).map((a, i): EnemyShot => ({ id: firstId + i, ...specialWeaponMuzzle(boss,i), vx: Math.sin(a) * speed, vy: Math.cos(a) * speed, radius: 6, bossKind: 'pulse', weaponKind: 'pulse', weaponColor: specialWeaponMount(boss).energy, weaponWidth: 5, caliber: 8 }));
  if(boss.insect){
    shots=shots.slice(0,Math.max(0,3-liveShots.length)).map(s=>insectProjectile({...s,weaponKind:'siege'},30,true)).filter(s=>insectShotAdmitted(boss,s,width,height));
    if(!shots.length)return [];
  }
  core.lastShotColor = shots[0]?.weaponColor;
  core.elapsed = 0;
  core.volley++;
  return shots;
}
