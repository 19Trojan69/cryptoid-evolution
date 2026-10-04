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
  // Nine sectors gain pressure smoothly, then the next campaign level adds a
  // small step. Every tenth sector is a boss; no regular formation spawns there.
  const campaignStep = Math.floor((bounded - 1) / 10);
  const progress = .8 * (bounded - 1) / (MAX_DIFFICULTY_LEVEL - 1) + .2 * campaignStep / 49;
  return {
    level: bounded,
    progress,
    attackCooldownMs: 650 - Math.sqrt(progress) * 350,
    attackPaceScale: 1 - Math.sqrt(progress) * .32,
    entryPaceScale: 1 - Math.sqrt(progress) * .18,
    groupAttackInterval: Math.max(2, 6 - Math.floor(Math.sqrt(progress) * 4)),
    projectileBonus: Math.min(2, Math.floor(progress * 3)),
    bossHealth: (28 + progress * 52 + progress * progress * 40) * 3,
  };
};

// Across the complete curve, at most two bonus hull points are distributed over a formation
// before the roster applies its durability multiplier.
export const enemyHealthBonus = (level: number, formationIndex: number) => {
  const progress = levelDifficulty(level).progress;
  const healthCredits = Math.floor(progress * 30);
  return Math.floor(healthCredits / 15) + (formationIndex % 15 < healthCredits % 15 ? 1 : 0);
};
