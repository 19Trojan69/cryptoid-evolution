import { levelDifficulty } from "./levelDifficulty.ts";

export type AttackPattern = "dive" | "curve" | "sCurve" | "loop" | "side" | "double" | "vDive";

const soloPatterns: AttackPattern[] = ["curve", "dive", "sCurve", "loop", "side"];
const groupPatterns: AttackPattern[] = ["double", "vDive"];

export const chooseAttackPattern = (attackNumber: number, elapsedMs: number, level = 1): AttackPattern => {
  if (level <= 1 && elapsedMs < 5 * 60_000) return soloPatterns[attackNumber % soloPatterns.length];
  const groupInterval = levelDifficulty(level).groupAttackInterval;
  if (attackNumber > 0 && attackNumber % groupInterval === 0) {
    return groupPatterns[(Math.floor(attackNumber / groupInterval) - 1) % groupPatterns.length];
  }
  if (elapsedMs >= 5 * 60_000 && attackNumber % 7 >= 5) return groupPatterns[attackNumber % groupPatterns.length];
  return soloPatterns[attackNumber % soloPatterns.length];
};

export const attackGroupSize = (pattern: AttackPattern) => pattern === "vDive" ? 3 : pattern === "double" ? 2 : 1;
export const attackDuration = (pattern: AttackPattern) => pattern === "loop" ? 6_000 : pattern === "side" ? 5_500 : 5_000;

type AttackPath = {
  pattern: AttackPattern;
  progress: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
  radius: number;
  side: number;
  lane: number;
};

export const attackPosition = ({ pattern, progress, startX, startY, width, height, radius, side, lane }: AttackPath) => {
  const endX = startX + (width / 2 - startX) * 0.45;
  const endY = height - 75 + radius;
  const arc = Math.min(width * 0.12, 110);
  let x = startX + (endX - startX) * progress;
  let y = startY + (endY - startY) * progress;

  switch (pattern) {
    case "curve":
      x += side * arc * Math.sin(Math.PI * progress);
      break;
    case "sCurve":
      x += side * arc * 0.85 * Math.sin(2 * Math.PI * progress);
      break;
    case "loop": {
      const turn = Math.max(0, Math.min(1, (progress - 0.22) / 0.46));
      x += side * arc * 0.75 * Math.sin(2 * Math.PI * turn);
      y -= Math.min(height * 0.1, 70) * (1 - Math.cos(2 * Math.PI * turn));
      break;
    }
    case "side":
      x += side * Math.min(width * 0.2, 160) * Math.sin(Math.PI * progress);
      break;
    case "double":
      x += (side * arc * 0.5 + lane * Math.min(width * 0.07, 60)) * Math.sin(Math.PI * progress);
      break;
    case "vDive":
      x += lane * Math.min(width * 0.11, 90) * Math.sin(Math.PI * progress);
      break;
    case "dive":
      break;
  }

  return { x: Math.max(radius, Math.min(width - radius, x)), y };
};
