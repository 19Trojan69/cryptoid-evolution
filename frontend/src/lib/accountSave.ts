import { axiosClient } from "./axiosClient";
import type { PlayerSave, Snapshot } from "../../../backend/src/playerSave";
import { allPlayerColors, playerSkins, readShipFleet, shardBalance, SHARD_BALANCE_KEY, SHIP_COLOR_KEY, SHIP_COLORS_KEY, SHIP_FLEET_KEY, SHIP_OWNED_KEY, SHIP_SKIN_KEY } from "../pages/shipFleet";
import { shipSaveNetwork } from "../pages/shipFleet";
import { BASE_MISSION_HEARTS, MAX_MISSION_HEARTS, cappedSnapshot } from "../../../backend/src/lifeRules";
import { appendPendingSave, type PendingSave } from './saveOutbox';
import { sessionDiagnostic } from './sessionDiagnosticEvents';
export type AccountSave = Pick<PlayerSave, "cardReveals" | "usedShipSkins" | "version" | "balance" | "fleet" | "skin" | "color" | "mission" | "highestSector" | "totalDestroyed" | "totalShardsEarned" | "totalShardsSpent" | "legacyImported" | "updatedAt">;
export type { Snapshot };
export const loadAccountSave = async () => (await axiosClient.get<{ save: AccountSave }>("/progress/me")).data.save;
export const accountSelection = (save: AccountSave) => ({ skin: playerSkins.find(s => s.id === save.skin) || playerSkins[0], color: allPlayerColors.find(c => c.id === save.color) || allPlayerColors.find(c => c.id === "grey")! });
export const localInventory = () => ({ balance: shardBalance(localStorage.getItem(SHARD_BALANCE_KEY)), fleet: readShipFleet(localStorage.getItem(SHIP_FLEET_KEY), localStorage.getItem(SHIP_OWNED_KEY), localStorage.getItem(SHIP_COLORS_KEY)), skin: localStorage.getItem(SHIP_SKIN_KEY) || "grey-scout", color: localStorage.getItem(SHIP_COLOR_KEY) || "grey" });
export const mutateAccountInventory = async (save: AccountSave, command: object) => (await axiosClient.post<{ save: AccountSave }>("/progress/inventory", { version: save.version, ...command })).data.save;
export const snapshotOf = (s: Snapshot & { combo?: {total:number} }): Snapshot => {
  const keys = ["score", "shards", "destroyed", "hearts", "paidWeaponLevel", "paidWeaponMs", "pickupWeaponLevel", "pickupWeaponMs", "shieldCharges", "shieldMs", "purchasedShieldMs", "overdriveMs", "overdriveTotalMs", "rapidFireMs", "rapidFireTotalMs", "empMs"] as const;
  return { ...(s.damageCount===undefined?{}:{damageCount:s.damageCount}), ...(s.comboTotal===undefined?{}:{comboTotal:s.combo?.total ?? s.comboTotal}), ...Object.fromEntries(keys.map(key => [key, Math.max(0, Math.round(s[key]))])), weaponSource: s.weaponSource, shieldActive: s.shieldActive, weaponTimers: s.weaponTimers.map(n => Math.round(n)) } as Snapshot;
};
export async function retrySave<T>(request: () => Promise<T>, options: { retryInvalidSave?: boolean } = {}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await request(); }
    catch (error: unknown) {
      const response = (error as { response?: { status?: number; data?: { error?: unknown; reason?: unknown } } }).response;
      const status = response?.status;
      // The established server also uses invalid_save for its wall-clock score
      // budget. An unchanged reward can therefore be accepted seconds later.
      // Keep the same bounded three attempts and immutable queued payload.
      const pendingReward = options.retryInvalidSave && status === 400 && response?.data?.error === 'invalid_save'
        && (response.data.reason === undefined || response.data.reason === 'score_budget');
      if (attempt >= 2 || status && status >= 400 && status < 500 && !pendingReward) throw error;
      await new Promise(resolve => setTimeout(resolve, pendingReward ? 5_000 * (attempt + 1) : 600 * (attempt + 1)));
    }
  }
}

export function createSaveQueue(uid: string) {
  const key = `cryptoid_save_outbox_v1_${shipSaveNetwork}_${uid}`;
  let entries: PendingSave[] = [];
  try { const parsed = JSON.parse(localStorage.getItem(key) || "[]"); if (Array.isArray(parsed)) entries = parsed.filter(e => ["/rewards/event", "/leaderboard/score", "/progress/checkpoint"].includes(e.path) && typeof e.body?.runId === "string"); } catch { /* Preserve malformed backup separately; never grant its data. */ }
  let inflight: Promise<void> | null = null;
  let uploading: PendingSave | null = null;
  let durable = true;
  const persist = () => { try { localStorage.setItem(key, JSON.stringify(entries)); } catch { durable = false; }
    sessionDiagnostic('queue', { operation: 'persist', depth: entries.length, success: durable }); };
  const drain = (): Promise<void> => {
    if (inflight) return inflight;
    inflight = (async () => {
      while (entries.length) {
        const entry = entries[0];
        uploading = entry;
        await retrySave(() => axiosClient.post(entry.path, entry.body), { retryInvalidSave: entry.path === '/rewards/event' });
        entries.shift(); persist();
        sessionDiagnostic('queue', { operation: 'drain', depth: entries.length });
      }
    })().finally(() => { inflight = null; uploading = null; });
    return inflight;
  };
  return {
    enqueue(entry: PendingSave) { appendPendingSave(entries, entry, uploading); persist();
      sessionDiagnostic('queue', { operation: 'enqueue', depth: entries.length }); return drain(); },
    drain,
    get durable() { return durable; },
    hasDurableReward(runId: string, stage: number, expected: Pick<Snapshot, "score" | "shards" | "hearts">) {
      if (!durable) return false;
      try {
        return localStorage.getItem(key) === JSON.stringify(entries) && entries.some(entry =>
          entry.path === "/rewards/event" && entry.body.runId === runId && entry.body.kind === "bonus" && entry.body.stage === stage
          && ["score", "shards", "hearts"].every(field => (entry.body.save as Partial<Snapshot> | undefined)?.[field as keyof Snapshot] === expected[field as keyof typeof expected]));
      } catch { return false; }
    },
    async recover() {
      sessionDiagnostic('queue', { operation: 'recover', depth: entries.length });
      // A pause-menu exit may occur while the current block is still uploading.
      // Let it finish before choosing the first pending run to recover.
      if (inflight) { try { await inflight; } catch { /* Recover the retained entry below. */ } }
      if (!entries.length) return;
      const recoveredRun = entries[0].body.runId;
      const { data } = await retrySave(() => axiosClient.post<{ finished?: boolean; maxHearts?: number }>("/progress/recover", { runId: recoveredRun }));
      if (data.finished) {
        const finishedRun = entries[0].body.runId;
        entries = entries.filter(entry => entry.body.runId !== finishedRun); persist();
        if (entries.length) await this.recover();
        return;
      }
      // Preserve queued earnings from the old accumulating-life rule. The
      // authenticated server supplies the current run's armor limit.
      const limit = data.maxHearts;
      if (typeof limit === "number" && Number.isInteger(limit) && limit >= BASE_MISSION_HEARTS && limit <= MAX_MISSION_HEARTS) {
        entries = entries.map(entry => {
          const save = entry.body.save;
          if (entry.body.runId !== recoveredRun || !save || typeof save !== "object" || !("hearts" in save) || typeof save.hearts !== "number") return entry;
          return { ...entry, body: { ...entry.body, save: cappedSnapshot(save as Snapshot, limit) } };
        });
        persist();
      }
      await drain();
    },
    archive() { try { localStorage.setItem(`${key}_unconfirmed`, JSON.stringify(entries)); } catch { durable = false; } entries = []; persist();
      sessionDiagnostic('queue', { operation: 'archive', depth: entries.length }); },
  };
}
