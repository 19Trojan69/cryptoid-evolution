import type { CombatCheckpoint } from "./combatCheckpoint";
export const standardShips = ["grey-scout", "nova-wing", "solar-lance", "dark-delta", "gold-streak", "iron-guard", "vector", "verdant", "storm-wing", "red-comet", "twin-core", "orbit-arc", "night-guard", "striker", "cargo-hawk", "ring-flare", "sky-breaker", "olive-fortress", "pi-vanguard", "core-carrier"];
export const shipColors = ["silver", "gold", "anthracite", "bronze", "copper", "metallic-blue", "metallic-red", "metallic-green", "pink", "grey", "violet", "cyan", "rose", "amber", "ruby", "scarlet", "coral", "orange", "lemon", "lime", "emerald", "mint", "teal", "ice", "azure", "cobalt", "indigo", "magenta", "white"];
export type Fleet = Record<string, Record<string, number>>;
export type Snapshot = { damageCount?: number; comboTotal?: number; score: number; shards: number; destroyed: number; hearts: number; weaponSource: "standard" | "paid" | "pickup"; paidWeaponLevel: number; paidWeaponMs: number; pickupWeaponLevel: number; pickupWeaponMs: number; weaponTimers: number[]; shieldCharges: number; shieldMs: number; purchasedShieldMs: number; shieldActive: boolean; overdriveMs: number; overdriveTotalMs: number; rapidFireMs: number; rapidFireTotalMs: number; empMs: number };
export type Mission = { damageAtStart?: number; destroyedAtStart?: number; rulesVersion?: 1 | 2; combat?: CombatCheckpoint; sector: number; phase: "normal" | "boss" | "bonus"; snapshot: Snapshot; savedAt: string };
export type PlayerSave = { cardReveals?: string[]; usedShipSkins?: string[]; version: number; balance: number; fleet: Fleet; skin: string; color: string; mission: Mission | null; activeRunId: string | null; highestSector?: number; totalDestroyed?: number; totalShardsEarned?: number; totalShardsSpent?: number; creditedDestroyed?: number; creditedShards?: number; startKey?: string; pendingPower?: string | null; pendingPowerOrderId?: unknown; lastStart?: any; legacyImported: boolean; updatedAt: string };
export const emptyPlayerSave = (): PlayerSave => ({ version: 0, balance: 0, fleet: { "grey-scout": { grey: 1 } }, skin: "grey-scout", color: "grey", mission: null, activeRunId: null, highestSector: 1, totalDestroyed: 0, totalShardsEarned: 0, totalShardsSpent: 0, legacyImported: false, updatedAt: new Date().toISOString() });
export const firstMissionSnapshot = (hearts: number): Snapshot => ({ damageCount: 0, comboTotal: 0, score: 0, shards: 0, destroyed: 0, hearts, weaponSource: "standard", paidWeaponLevel: 1, paidWeaponMs: 0, pickupWeaponLevel: 1, pickupWeaponMs: 0, weaponTimers: [0, 0, 0, 0, 0, 0], shieldCharges: 0, shieldMs: 0, purchasedShieldMs: 0, shieldActive: true, overdriveMs: 0, overdriveTotalMs: 20_000, rapidFireMs: 0, rapidFireTotalMs: 20_000, empMs: 0 });
export const publicSave = (s: PlayerSave) => ({ cardReveals: s.cardReveals || [], usedShipSkins: s.usedShipSkins || [], version: s.version, balance: s.balance, fleet: s.fleet, skin: s.skin, color: s.color, mission: s.mission, highestSector: s.highestSector || 1, totalDestroyed: s.totalDestroyed || 0, totalShardsEarned: s.totalShardsEarned || 0, totalShardsSpent: s.totalShardsSpent || 0, legacyImported: s.legacyImported, updatedAt: s.updatedAt });
export const shipPrice = (skin: string) => { const index = standardShips.indexOf(skin); return index < 0 || index >= 10 ? null : index <= 1 ? 150 : 150 + (index - 1) * 250; };
export const validSelection = (s: PlayerSave, skin: unknown, color: unknown) => typeof skin === "string" && typeof color === "string" && (s.fleet[skin]?.[color] ?? 0) > 0;
const integer = (value: unknown, max: number) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= max;
export function readSnapshot(input: unknown): Snapshot | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const s = input as Snapshot;
  const limits: Record<string, number> = { score: 10_000_000, shards: 10_000_000, destroyed: 1_000_000, hearts: 56, paidWeaponLevel: 5, paidWeaponMs: 300_000, pickupWeaponLevel: 5, shieldCharges: 20, pickupWeaponMs: 300_000, shieldMs: 300_000, purchasedShieldMs: 300_000, overdriveMs: 300_000, overdriveTotalMs: 300_000, rapidFireMs: 300_000, rapidFireTotalMs: 300_000, empMs: 300_000 };
  if (Object.entries(limits).some(([key, max]) => !integer((s as any)[key], max))) return null;
  if (typeof s.shieldActive !== "boolean" || !Array.isArray(s.weaponTimers) || s.weaponTimers.length !== 6 || s.weaponTimers.some(v => v !== -1 && !integer(v, 300_000))) return null;
  if (s.paidWeaponLevel < 1 || s.pickupWeaponLevel < 1) return null;
  if (!["standard", "paid", "pickup"].includes(s.weaponSource)) return null;
  if ([s.damageCount,s.comboTotal].some(v=>v!==undefined&&!integer(v,1_000_000)) || s.comboTotal !== undefined && s.comboTotal > Math.floor(s.destroyed/2)) return null;
  return { ...(s.damageCount===undefined?{}:{damageCount:s.damageCount}), ...(s.comboTotal===undefined?{}:{comboTotal:s.comboTotal}), ...Object.fromEntries(Object.keys(limits).map(key => [key, (s as any)[key]])), weaponSource: s.weaponSource, shieldActive: s.shieldActive, weaponTimers: [...s.weaponTimers] } as Snapshot;
}
export const missionAfter = (event: { kind: string; stage: number }, snapshot: Snapshot): Mission | null => {
  if (event.kind === "bonus" && event.stage === 500) return null;
  const phase = event.kind === "boss" ? "bonus" : (event.kind === "chain" || event.kind === "block" && event.stage % 10 === 9) ? "boss" : "normal";
  const sector = event.kind === "boss" ? event.stage : event.kind === "chain" ? event.stage + 1 : event.stage + 1;
  return { sector, phase, snapshot, ...(snapshot.damageCount===undefined?{}:{damageAtStart:snapshot.damageCount,destroyedAtStart:snapshot.destroyed}), savedAt: new Date().toISOString() };
};

// Existing browser data is explicitly imported once, never merged on login.
// It is grandfathered data, not retrospectively verified gameplay or Pi ownership.
export function legacyInventory(body: any) {
  if (!integer(body?.balance, 10_000_000) || !body?.fleet || typeof body.fleet !== "object") return null;
  const fleet: Fleet = {};
  for (const skin of standardShips) {
    for (const color of shipColors) {
      const count = body.fleet[skin]?.[color];
      if (count !== undefined && !integer(count, 1000)) return null;
      if (count > 0) { fleet[skin] ??= {}; fleet[skin][color] = count; }
    }
  }
  if (!Object.values(fleet["grey-scout"] || {}).some(n => n > 0)) fleet["grey-scout"] = { grey: 1 };
  const skin = validSelection({ fleet } as PlayerSave, body.skin, body.color) ? body.skin : "grey-scout";
  const color = skin === body.skin ? body.color : Object.keys(fleet["grey-scout"])[0];
  return { balance: body.balance, fleet, skin, color };
}
