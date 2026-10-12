import { chooseCryptoid } from './cryptoidRoster.ts';
export type BonusRock = { id: number; x: number; y: number; radius: number; health: number; points: number; vx: number; vy: number; rotation: number; spin: number; seed: number; hitMs: number };
export type RockEffect = { id: number; x: number; y: number; radius: number; seed: number; age: number; points: number; final: boolean };
export const MAX_ROCKS = 2;
export const MAX_ROCK_EFFECTS = 6;
export const rockPoints = (stage: number, large: boolean) => Math.max(5, Math.round(chooseCryptoid(stage, 0).points * (large ? 1.5 : .75)));
export function spawnBonusRock(id: number, stage: number, width: number, height: number, top: number, roll: number, seed: number): BonusRock {
  const large = roll > .67, radius = large ? 25 : 17;
  return { id, x: width * (.18 + (seed % 997) / 997 * .64), y: top + radius + 12, radius, health: large ? 5 : 2,
    points: rockPoints(stage, large), vx: (seed % 2 ? 1 : -1) * .012, vy: Math.max(.033, height / 18000), rotation: seed % 6, spin: (seed % 2 ? 1 : -1) * .0006, seed, hitMs: 0 };
}
export const advanceBonusRock = (rock: BonusRock, delta: number) => ({ ...rock, x: rock.x + rock.vx * delta, y: rock.y + rock.vy * delta, rotation: rock.rotation + rock.spin * delta, hitMs: Math.max(0, rock.hitMs - delta) });
export const rockInField = (rock: BonusRock, width: number, height: number) => rock.y < height + rock.radius && rock.x > -rock.radius && rock.x < width + rock.radius;
export function hitBonusRock(rock: BonusRock, damage: number) {
  if (rock.health <= 0 || damage <= 0) return { rock, points: 0, final: false };
  const health = Math.max(0, rock.health - damage);
  return { rock: { ...rock, health, hitMs: 110 }, points: health === 0 ? rock.points : 0, final: health === 0 };
}
export const rockHitsShot = (rock: BonusRock, old: { x: number;y: number;radius?: number }, shot: {x: number;y: number;radius?: number}) => {
  const dx = shot.x - old.x, dy = shot.y - old.y, d = dx * dx + dy * dy;
  const p = d ? Math.max(0, Math.min(1, ((rock.x - old.x) * dx + (rock.y - old.y) * dy) / d)) : 0;
  return Math.hypot(rock.x - old.x - p * dx, rock.y - old.y - p * dy) < rock.radius + (shot.radius ?? 5);
};
export const nextRockEventMs = (roll: number) => 25_000 + Math.floor(Math.max(0, Math.min(1, roll)) * 25_000);
