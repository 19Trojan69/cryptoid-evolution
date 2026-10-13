import { chooseCryptoid } from './cryptoidRoster.ts';
import { chooseAttackPattern, type AttackPattern } from './attackPatterns.ts';
import { MAX_ACTIVE_POWER_UPS, type PowerUpType } from './powerUps.ts';
import type { BonusRock } from './bonusRocks.ts';

// All existing finite flight plans and checkpoint indices stay unchanged.
export function combatCryptoid(stage: number, index: number) {
  if (stage % 10 === 0) return chooseCryptoid(stage, index);
  const block = (stage - 1) % 10 + 1;
  // Reorder the existing roster within each flight, retaining every profile,
  // class radius, health, reward and point value in later levels.
  const orders = [[0, 1, 2, 3, 4, 5], [4, 0, 1, 2, 3, 5], [2, 0, 5, 1, 4, 3]];
  const order = orders[(block + Math.floor((stage - 1) / 10)) % orders.length];
  return chooseCryptoid(stage, Math.floor(index / 6) * 6 + order[index % 6]);
}

export const combatEntryStage = (stage: number, flight: number) => {
  const block = (stage - 1) % 10 + 1;
  return stage === 1 ? 1 : (block - 1 + flight * 2 + Math.floor((stage - 1) / 30)) % 9 + 1;
};
export const combatTiming = (stage: number) => {
  const early = stage <= 29;
  const block = (stage - 1) % 10 + 1;
  return { introMs: early ? 550 : 850, gapMs: early ? 150 : 180,
    entryMs: early ? 1300 : Math.max(1600, 2400 - Math.floor(stage / 50) * 80),
    clearMs: early ? 1150 : 1750,
    breathingMs: [1, 3, 5, 6].includes(block) ? 650 : 150 };
};
const opening: readonly (readonly AttackPattern[])[] = [
  ['dive'], ['curve', 'dive'], ['side', 'curve'], ['curve', 'dive'],
  ['dive'], ['side'], ['curve', 'sCurve'], ['sCurve', 'side'], ['dive', 'curve'],
];
export const combatAttackPattern = (stage: number, cycle: number, elapsed: number): AttackPattern => {
  const block = (stage - 1) % 10;
  if (stage <= 29) {
    const choices = opening[block];
    if (stage >= 11 && [3, 6, 8].includes(block) && cycle % 4 === 3) return 'double';
    return choices[cycle % choices.length];
  }
  return chooseAttackPattern(cycle + block, elapsed, stage);
};

export type CombatVarietyRuntime = {
  version: 1; clock: number; weaponDue: number; weaponIssued: boolean;
  asteroidDue: number; asteroidEvents: number; asteroidStage: number; asteroidStageEvents: number; waveDamage: number;
  waveDestroyed: number; waveCombo: number; waveComplete: boolean;
  notice: string; noticeMs: number; rocks: BonusRock[];
};
export const createCombatVariety = (resumed = false): CombatVarietyRuntime => ({
  version: 1, clock: 0, weaponDue: 18000, weaponIssued: resumed,
  asteroidDue: 28000, asteroidEvents: 0, asteroidStage: 1, asteroidStageEvents: resumed ? 2 : 0, waveDamage: 0,
  waveDestroyed: 0, waveCombo: 0, waveComplete: false,
  notice: '', noticeMs: 0, rocks: [],
});
export function readCombatVariety(input: unknown): CombatVarietyRuntime | null {
  if (!input || typeof input !== 'object') return null;
  const v = input as CombatVarietyRuntime;
  if (v.version !== 1 || typeof v.weaponIssued !== 'boolean' || typeof v.waveComplete !== 'boolean'
    || typeof v.notice !== 'string' || v.notice.length > 80 || !Array.isArray(v.rocks) || v.rocks.length > 2) return null;
  for (const key of ['clock', 'weaponDue', 'asteroidDue', 'asteroidEvents', 'asteroidStage', 'asteroidStageEvents', 'waveDamage', 'waveDestroyed', 'waveCombo', 'noticeMs'] as const)
    if (!Number.isFinite(v[key]) || v[key] < 0 || v[key] > 1e9) return null;
  if (v.rocks.some(r => !r || Object.values(r).some(n => typeof n !== 'number' || !Number.isFinite(n))
    || ![17, 25].includes(r.radius) || r.health <= 0 || r.health > 5
    || !Number.isSafeInteger(r.points) || r.points < 5 || r.points > 200
    || Math.abs(r.vx) > .02 || r.vy <= 0 || r.vy > 1)) return null;
  return structuredClone(v);
}

export function safeEarlyPickup(state: { weaponLevel: number; rapidFireMs: number; overdriveMs: number;
  powerUpTypes: PowerUpType[]; powerUps: { x: number; y: number }[];
  asteroids: { x: number; y: number; radius: number }[]; player: { x: number; y: number } },
  effectiveWeapon: number, width: number, height: number, visibleTop: number) {
  if (state.powerUps.length >= MAX_ACTIVE_POWER_UPS) return null;
  // If the hull already supplies Twin, the unchanged one-level pickup would
  // sound and look the same. Prefer an existing useful temporary boost there.
  const choices = effectiveWeapon < 5 && state.weaponLevel === effectiveWeapon
    ? ['weapon', 'rapid', 'overdrive'] : ['rapid', 'overdrive'];
  const type = choices.find(kind => !state.powerUpTypes.includes(kind as PowerUpType)
    && !(kind === 'rapid' && state.rapidFireMs > 0) && !(kind === 'overdrive' && state.overdriveMs > 0)) as PowerUpType | undefined;
  if (!type) return null;
  const y = Math.max(visibleTop + 75, Math.min(height * .69, state.player.y * height - 75));
  for (const x of [state.player.x * width, width * .5, width * .3, width * .7]) {
    if (x < 38 || x > width - 38) continue;
    if (state.asteroids.some(e => Math.hypot(e.x - x, e.y - y) < e.radius + 85)) continue;
    if (state.powerUps.some(p => Math.hypot(p.x - x, p.y - y) < 80)) continue;
    return { type, x, y };
  }
  return null;
}
