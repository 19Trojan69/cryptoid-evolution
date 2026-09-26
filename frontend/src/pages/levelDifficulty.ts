export const MAX_DIFFICULTY_LEVEL = 500;

export type LevelDifficulty = {
  level: number;
  progress: number;
  attackCooldownMs: number;
  attackPaceScale: number;
  entryPaceScale: number;
  groupAttackInterval: number;
  projectileBonus: number;
  bossHealth: number;
};

const boundedLevel = (level: number) => Math.min(MAX_DIFFICULTY_LEVEL, Math.max(1, Math.floor(Number.isFinite(level) ? level : 1)));

// Difficulty grows every level, but movement and firing remain deliberately capped.
// Later levels become harder mainly through combined attacks, sturdier formations and bosses.
export const levelDifficulty = (level: number): LevelDifficulty => {
  const bounded = boundedLevel(level);
  const progress = (bounded - 1) / (MAX_DIFFICULTY_LEVEL - 1);
  return {
    level: bounded,
    progress,
    attackCooldownMs: 750 - progress * 220,
    attackPaceScale: 1 - progress * .12,
    entryPaceScale: 1 - progress * .08,
    groupAttackInterval: Math.max(4, 12 - Math.floor(progress * 9)),
    projectileBonus: Math.min(2, Math.floor(progress * 3)),
    bossHealth: 15 + progress * 60,
  };
};

// Across the complete curve, at most two extra hits are distributed over a formation.
// This avoids turning light ships into damage sponges while still strengthening every fleet.
export const enemyHealthBonus = (level: number, formationIndex: number) => {
  const progress = levelDifficulty(level).progress;
  const healthCredits = Math.floor(progress * 30);
  return Math.floor(healthCredits / 15) + (formationIndex % 15 < healthCredits % 15 ? 1 : 0);
};
