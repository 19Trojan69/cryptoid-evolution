export const COMBAT_STATE_KEYS = ["asteroids", "bonusTargets", "bonusHits", "boss", "shots", "enemyShots", "player", "powerUps", "pickupNotice", "combo", "chainBlocks", "chainResult", "bonusResult", "projectileGuard", "pendingStartPower", "playerHullFires", "playerHit", "phase"] as const;
export const COMBAT_REF_KEYS = ["nextId", "formationIndex", "formationOffset", "flight", "bonusIndex", "bossEscortWave", "bossEscortSpawned", "bossEscortTimer", "spawnTimer", "sectionElapsed", "clearTimer", "attackCooldown", "elapsed", "attackNumber", "dropsCreated", "impactCooldown", "fireTimer"] as const;
export type CombatCheckpoint = {
  version: 1; clock: number; sequence: number; stage: number; encounter: "normal" | "boss-intro" | "boss-fight" | "boss-clear" | "bonus";
  width: number; height: number; state: Record<string, any>; refs: Record<typeof COMBAT_REF_KEYS[number], number>;
  formationStarted: boolean; slots: any[] | null; escortSlots: any[] | null;
};
const finite = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const safeTree = (v: unknown, depth = 0): boolean => {
  if (depth > 10) return false;
  if (v === null || typeof v === "boolean") return true;
  if (typeof v === "number") return finite(v, -1e9, 1e9);
  if (typeof v === "string") return v.length <= 160 && !/[<>]/.test(v);
  if (Array.isArray(v)) return v.length <= 256 && v.every(x => safeTree(x, depth + 1));
  return !!v && typeof v === "object" && Object.entries(v).every(([k, value]) =>
    !["__proto__", "constructor", "prototype"].includes(k) && /^[a-zA-Z0-9_]+$/.test(k) && safeTree(value, depth + 1));
};
export function readCombatCheckpoint(input: unknown): CombatCheckpoint | null {
  if (!input || typeof input !== "object" || !safeTree(input)) return null;
  const c = input as CombatCheckpoint;
  if (JSON.stringify(c).length > 90_000 || c.version !== 1 || !finite(c.clock, 0, 1e9) || !Number.isSafeInteger(c.sequence) || c.sequence < 1
    || !Number.isInteger(c.stage) || c.stage < 1 || c.stage > 500 || !finite(c.width, 200, 10000) || !finite(c.height, 200, 10000)
    || !["normal", "boss-intro", "boss-fight", "boss-clear", "bonus"].includes(c.encounter) || typeof c.formationStarted !== "boolean"
    || !c.state || !c.refs || COMBAT_REF_KEYS.some(k => !finite(c.refs[k], 0, 1e9))
    || c.refs.flight > 2 || c.refs.formationIndex > 6 || c.refs.formationOffset > 12 || c.refs.bonusIndex > 12
    || !(c.encounter === 'boss-clear' ? c.state.phase === 'SECTOR_CLEAR' : ["SECTOR_INTRO", "ENTRY", "FORMATION", "ATTACK_CYCLE", "REFORM"].includes(c.state.phase))
    || (c.encounter === "normal") !== (c.stage % 10 !== 0)) return null;
  for (const [key, max] of Object.entries({ asteroids: 12, bonusTargets: 12, shots: 160, enemyShots: 160, powerUps: 12 })) {
    const list = c.state[key];
    if (!Array.isArray(list) || list.length > max || list.some((item: any) => !item || !finite(item.x, -10000, 10000) || !finite(item.y, -10000, 10000))) return null;
  }
  if (!c.state.player || !finite(c.state.player.x, 0, 1) || !finite(c.state.player.y, 0, 1)
    || !c.state.combo || !finite(c.state.combo.remainingMs, 0, 1e9) || !finite(c.state.projectileGuard, 0, 3)
    || !Number.isInteger(c.state.chainBlocks) || c.state.chainBlocks < 0 || c.state.chainBlocks > 9
    || ![null, "shield", "rapid", "overdrive", "bomb", "emp"].includes(c.state.pendingStartPower)) return null;
  for (const slots of [c.slots, c.escortSlots]) if (slots !== null && (!Array.isArray(slots) || slots.length > 12 || slots.some(s => !s || !finite(s.x, 0, 10000) || !finite(s.y, 0, 10000)))) return null;
  if (c.state.asteroids.some((e: any) => !finite(e.health, 1, 1000) || !finite(e.maxHealth, 1, 1000) || e.health > e.maxHealth || !finite(e.entryElapsed, 0, 1e9) || !finite(e.entryDuration, 1, 60000))) return null;
  if (['boss-intro', 'boss-fight'].includes(c.encounter) && (!c.state.boss || !finite(c.state.boss.health, 1, 10000) || c.state.boss.config?.level !== c.stage)) return null;
  // A defeated boss awaits its heart pickup; no live enemies or projectiles can survive here.
  if (c.encounter === 'boss-clear' && (c.state.boss !== null || c.state.asteroids.length || c.state.enemyShots.length || c.state.shots.length)) return null;
  const core = c.state.boss?.core;
  if (core !== undefined && (!core || !finite(core.elapsed, 0, 2800) || !Number.isSafeInteger(core.volley) || core.volley < 0 || core.volley > 1e9)) return null;
  return JSON.parse(JSON.stringify({ ...c, state: Object.fromEntries(COMBAT_STATE_KEYS.filter(k => c.state[k] !== undefined).map(k => [k, c.state[k]])), refs: Object.fromEntries(COMBAT_REF_KEYS.map(k => [k, c.refs[k]])) }));
}
