import { bossMasks } from "./bossMasks.ts";
import type { BossConfig } from "./bossManifest.ts";
import { createBossShot, type BossProjectileKind, type EnemyShot } from "./enemyFire.ts";
import type { PlayerPosition } from "./playerCombat.ts";
import type { SectorBoss } from "./sectorBoss.ts";

export const bossAnchorPosition = (boss: SectorBoss, [x, y]: readonly [number, number]) => ({
  x: boss.x + (x - .5) * boss.width,
  y: boss.y + (y - .5) * boss.height,
});

const decodedMasks = new Map<number, Uint8Array>();
export const bossHullContains = (boss: SectorBoss, x: number, y: number) => {
  const column = Math.floor((x - boss.x + boss.width / 2) / boss.width * 128);
  const row = Math.floor((y - boss.y + boss.height / 2) / boss.height * 48);
  if (column < 0 || column >= 128 || row < 0 || row >= 48) return false;
  let bytes = decodedMasks.get(boss.config.id);
  if (!bytes) {
    bytes = Uint8Array.from(atob(bossMasks[boss.config.id - 1]), char => char.charCodeAt(0));
    decodedMasks.set(boss.config.id, bytes);
  }
  const bit = row * 128 + column;
  return !!(bytes[bit >> 3] & (128 >> (bit & 7)));
};

// Fixed and readable attack phrase: outboard pair, rest, heavy core,
// three stations, rest, wing batteries, then an aimed impulse.
const PHRASE: readonly { kind: BossProjectileKind; station: "outer" | "center" | "triple" | "inner" | "single" }[] = [
  { kind: "double", station: "outer" },
  { kind: "orb", station: "center" },
  { kind: "burst", station: "triple" },
  { kind: "split", station: "outer" },
  { kind: "heavy", station: "center" },
  { kind: "pulse", station: "inner" },
  { kind: "lance", station: "single" },
  { kind: "rapid", station: "inner" },
];

export const bossVolley = (boss: SectorBoss, player: PlayerPosition, width: number, height: number, available: number, firstId: number): EnemyShot[] => {
  if (available <= 0) return [];
  const guns = boss.config.weaponAnchors;
  const phrase = PHRASE[boss.volley % PHRASE.length];
  const pool = boss.config.projectilePool;
  const kind = pool.includes(phrase.kind) ? phrase.kind : pool[boss.volley % pool.length];
  const positions = phrase.station === "center" || phrase.station === "single" ? [guns[Math.floor(guns.length / 2)]]
    : phrase.station === "triple" ? [guns[0], guns[Math.floor(guns.length / 2)], guns[guns.length - 1]]
    : phrase.station === "inner" ? [guns[Math.max(0, Math.floor(guns.length / 2) - 1)], guns[Math.min(guns.length - 1, Math.ceil(guns.length / 2))]]
    : [guns[0], guns[guns.length - 1]];
  const result: EnemyShot[] = [];
  for (const station of positions.slice(0, available)) {
    const point = bossAnchorPosition(boss, station);
    const shot = createBossShot(firstId + result.length, point.x, point.y, player, width, height, boss.volley, kind);
    if (shot) result.push(shot);
  }
  return result;
};

export const bossFireSite = (boss: SectorBoss, x: number, y: number, existing: readonly { x: number; y: number }[]) => {
  const localX = 50 + (x - boss.x) / boss.width * 100;
  const localY = 50 + (y - boss.y) / boss.height * 100;
  const sites = boss.config.fireSites;
  const free = sites.filter(([sx, sy]) => existing.every(fire => (fire.x - sx) ** 2 + (fire.y - sy) ** 2 > 14 ** 2));
  const [px, py] = (free.length ? free : sites).reduce((best, site) =>
    (site[0] - localX) ** 2 + (site[1] - localY) ** 2 < (best[0] - localX) ** 2 + (best[1] - localY) ** 2 ? site : best);
  return { x: px, y: py };
};

export const bossExplosionSize = (config: BossConfig, shipWidth: number) => Math.round(shipWidth * config.explosionScale);

export const bossFallTargetY = (boss: Pick<SectorBoss, "y" | "height">, fieldHeight: number) =>
  Math.min(fieldHeight * .58, Math.max(fieldHeight * .5, boss.y + boss.height * .3));
