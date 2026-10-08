import { bossWeapons } from './bossWeapons.ts';
import type { SectorBoss } from './sectorBoss.ts';

export type TurretBarPosition = { index: number; x: number; y: number; gunX: number; gunY: number; width: number; height: number };

// Stable positions include destroyed guns, so surviving bars never jump around.
// A compact grid keeps densely mounted batteries readable on narrow phones.
export function turretBarPositionsForLayout(id: number, sourceWidth: number, sourceHeight: number, bossWidth: number, bossHeight: number): TurretBarPosition[] {
  const scale = bossWidth / sourceWidth;
  const count = bossWeapons[id - 1].length;
  const width = Math.max(14, Math.min(count <= 4 ? 32 : count <= 8 ? 26 : count <= 12 ? 21 : 16, bossWidth * .12));
  const height = count <= 4 ? 3 : count <= 8 ? 2.5 : 2;
  const bars: TurretBarPosition[] = [];
  const columns = Math.max(1, Math.floor(bossWidth / (width + 4)));
  const rows = Math.max(1, Math.floor((bossHeight - 10) / 12) + 1);
  const slots = Array.from({ length: columns * rows }, (_, index) => ({
    x: (index % columns + .5) * bossWidth / columns,
    y: 5 + Math.floor(index / columns) * 12,
  }));
  const guns = bossWeapons[id - 1].map((gun, index) => ({
    index, gunX: gun.sourceX / sourceWidth * bossWidth,
    gunY: gun.sourceY / sourceHeight * bossHeight,
    back: gun.back * scale,
  })).sort((a, b) => a.gunY - b.gunY || a.gunX - b.gunX);
  for (const gun of guns) {
    const idealY = Math.max(5, gun.gunY - gun.back - 10);
    const distance = (slot: { x: number; y: number }) => (slot.x - gun.gunX) ** 2 + (slot.y - idealY) ** 2;
    const closest = slots.reduce((best, slot, index) => distance(slot) < distance(slots[best]) ? index : best, 0);
    const [slot] = slots.splice(closest, 1);
    bars.push({ ...gun, ...slot, width, height });
  }
  return bars;
}

export function turretBarPositions(boss: SectorBoss): TurretBarPosition[] {
  return turretBarPositionsForLayout(boss.config.id, boss.config.sourceWidth, boss.config.sourceHeight, boss.width, boss.height);
}
