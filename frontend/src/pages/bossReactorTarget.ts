import type { SectorBoss } from './sectorBoss.ts';
import { bossHullExposed } from './sectorBoss.ts';
import { bossHullContains } from './bossCombat.ts';
import { reactorDoorOpen, specialWeaponBox } from './bossSpecialWeapon.ts';

type Point = { x: number; y: number };
const finitePoint = (point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y);
// The complete 100x160 reactor assembly, plus the two actual moving door
// polygons from BossReactorView. Empty space outside the moving doors is not
// added to the target. These small constants are shared by every projectile.
const assembly: readonly (readonly [number, number])[] = [[0,0],[100,0],[100,160],[0,160]];
const leftDoor: readonly (readonly [number, number])[] = [[22,9],[50,9],[50,151],[27,151],[7,125],[7,28]];
const rightDoor: readonly (readonly [number, number])[] = [[50,9],[78,9],[93,28],[93,125],[73,151],[50,151]];

// Clip a swept point against a convex polygon. No per-shot sampling array,
// image readback, native path, canvas, timer or retained collision history.
function entry(polygon: readonly (readonly [number, number])[], x: number, y: number,
  dx: number, dy: number, shiftX: number, shiftY: number, padding = 0) {
  let enter = 0, leave = 1;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const ex = b[0] - a[0], ey = b[1] - a[1];
    const start = ex * (y - shiftY - a[1]) - ey * (x - shiftX - a[0]) + padding * Math.hypot(ex, ey);
    const delta = ex * dy - ey * dx;
    if (Math.abs(delta) < 1e-12) { if (start < -1e-9) return Infinity; }
    else if (delta > 0) enter = Math.max(enter, -start / delta);
    else leave = Math.min(leave, -start / delta);
    if (enter > leave) return Infinity;
  }
  return enter;
}

export function bossReactorContact(boss: SectorBoss, from: Point, to: Point): Point | null {
  const box = specialWeaponBox(boss);
  if (!(box.width > 0 && box.height > 0)
    || !finitePoint(from) || !finitePoint(to)) return null;
  const left = boss.x - boss.width / 2 + box.left;
  const top = boss.y - boss.height / 2 + box.top;
  const x = (from.x - left) / box.width * 100;
  const y = (from.y - top) / box.height * 160;
  const dx = (to.x - from.x) / box.width * 100;
  const dy = (to.y - from.y) / box.height * 160;
  const open = reactorDoorOpen(bossHullExposed(boss), boss.core?.elapsed ?? 0, boss.core?.volley ?? 0);
  const t = Math.min(entry(assembly, x, y, dx, dy, 0, 0),
    // The visible door outline has SVG strokeWidth=1.3, half on either side.
    entry(leftDoor, x, y, dx, dy, -32 * open, -4 * open, .65),
    entry(rightDoor, x, y, dx, dy, 32 * open, -4 * open, .65));
  return Number.isFinite(t) ? { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t } : null;
}

// Hull-only projectiles keep travelling so armour below the reactor cannot
// make it unreachable. Show one existing transient mark on hull entry, never
// add a permanent heat patch or change any damage/weapon/campaign value.
export function recordBossHullImpact(boss: SectorBoss, from: Point, shot: Point & { id: number; damage?: number }) {
  if (boss.health <= 0 || !finitePoint(from) || !finitePoint(shot)
    || bossHullContains(boss, from.x, from.y)) return false;
  const dx = shot.x - from.x, dy = shot.y - from.y;
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || !(boss.width > 0 && boss.height > 0)) return false;
  // Misses leave before any mask sampling. Clip long sweeps to the actual boss
  // rectangle so even an off-screen path cannot create an unbounded scan.
  const bx = (from.x - boss.x + boss.width / 2) / boss.width * 100;
  const by = (from.y - boss.y + boss.height / 2) / boss.height * 160;
  const vx = dx / boss.width * 100, vy = dy / boss.height * 160;
  const start = entry(assembly, bx, by, vx, vy, 0, 0);
  const end = 1 - entry(assembly, bx + vx, by + vy, -vx, -vy, 0, 0);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) return false;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx * (end - start), dy * (end - start)) / 2));
  for (let step = 0; step <= steps; step++) {
    const time = start + (end - start) * step / steps;
    const x = from.x + dx * time, y = from.y + dy * time;
    if (!bossHullContains(boss, x, y)) continue;
    boss.hit = { id: shot.id, x: (x - boss.x) / boss.width * 100 + 50,
      y: (y - boss.y) / boss.height * 100 + 50, impactPower: shot.damage };
    return true;
  }
  return false;
}
