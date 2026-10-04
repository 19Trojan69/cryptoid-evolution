import { bossWeapons } from './bossWeapons.ts';
import type { SectorBoss } from './sectorBoss.ts';

export type TurretBarPosition = { index: number; x: number; y: number; gunX: number; gunY: number; width: number };

// Stable positions include destroyed guns, so surviving bars never jump around.
// A compact grid keeps densely mounted batteries readable on narrow phones.
export function turretBarPositions(boss: SectorBoss): TurretBarPosition[] {
  const scale = boss.width / boss.config.sourceWidth;
  const width = Math.max(24, Math.min(36, boss.width * .12));
  const bars: TurretBarPosition[] = [];
  const columns = Math.max(1, Math.floor(boss.width / (width + 4)));
  const rows = Math.max(1, Math.floor((boss.height - 10) / 12) + 1);
  const slots = Array.from({ length: columns * rows }, (_, index) => ({
    x: (index % columns + .5) * boss.width / columns,
    y: 5 + Math.floor(index / columns) * 12,
  }));
  const guns = bossWeapons[boss.config.id - 1].map((gun, index) => ({
    index, gunX: gun.sourceX / boss.config.sourceWidth * boss.width,
    gunY: gun.sourceY / boss.config.sourceHeight * boss.height,
    back: gun.back * scale,
  })).sort((a, b) => a.gunY - b.gunY || a.gunX - b.gunX);
  for (const gun of guns) {
    const idealY = Math.max(5, gun.gunY - gun.back - 10);
    const distance = (slot: { x: number; y: number }) => (slot.x - gun.gunX) ** 2 + (slot.y - idealY) ** 2;
    const closest = slots.reduce((best, slot, index) => distance(slot) < distance(slots[best]) ? index : best, 0);
    const [slot] = slots.splice(closest, 1);
    bars.push({ ...gun, ...slot, width });
  }
  return bars;
}
