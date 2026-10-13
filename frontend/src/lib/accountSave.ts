import { axiosClient } from "./axiosClient";
import type { PlayerSave, Snapshot } from "../../../backend/src/playerSave";
import { allPlayerColors, playerSkins, readShipFleet, shardBalance, SHARD_BALANCE_KEY, SHIP_COLOR_KEY, SHIP_COLORS_KEY, SHIP_FLEET_KEY, SHIP_OWNED_KEY, SHIP_SKIN_KEY } from "../pages/shipFleet";
import { shipSaveNetwork } from "../pages/shipFleet";
import { BASE_MISSION_HEARTS, MAX_MISSION_HEARTS, cappedSnapshot } from "../../../backend/src/lifeRules";
import { appendPendingSave, type PendingSave } from './saveOutbox';
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
export async function retrySave<T>(request: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await request(); }
    catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (attempt >= 2 || status && status >= 400 && status < 500) throw error;
      await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
}

export function createSaveQueue(uid: string) {
  const key = `cryptoid_save_outbox_v1_${shipSaveNetwork}_${uid}`;
  let entries: PendingSave[] = [];
  let pendingBytes = 0;
  try { const serialized = localStorage.getItem(key) || "[]"; const parsed = JSON.parse(serialized); if (Array.isArray(parsed)) entries = parsed.filter(e => ["/rewards/event", "/leaderboard/score", "/progress/checkpoint"].includes(e.path) && typeof e.body?.runId === "string"); pendingBytes = serialized.length * 2; } catch { /* Preserve malformed backup separately; never grant its data. */ }
  let inflight: Promise<void> | null = null;
  let uploading: PendingSave | null = null;
  let durable = true;
  const persist = () => {
    try {
      const serialized = JSON.stringify(entries);
      pendingBytes = serialized.length * 2;
      localStorage.setItem(key, serialized);
      durable = true;
    } catch { durable = false; }
  };
  const drain = (): Promise<void> => {
    if (inflight) return inflight;
    inflight = (async () => {
      while (entries.length) {
        const entry = entries[0];
        uploading = entry;
        await retrySave(() => axiosClient.post(entry.path, entry.body));
        entries.shift(); persist();
      }
    })().finally(() => { inflight = null; uploading = null; });
    return inflight;
  };
  return {
    enqueue(entry: PendingSave) { appendPendingSave(entries, entry, uploading); persist(); return drain(); },
    drain,
    get durable() { return durable; },
    get pendingCount() { return entries.length; },
    get pendingBytes() { return pendingBytes; },
    // Preserve all queued reward barriers. Pause the producer, never discard
    // progress, when prolonged outages or denied storage exhaust the outbox.
    get underPressure() { return entries.length > 0 && (!durable || entries.length >= 32 || pendingBytes >= 2 * 1024 * 1024); },
    async recover() {
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
    archive() { try { localStorage.setItem(`${key}_unconfirmed`, JSON.stringify(entries)); } catch { durable = false; } entries = []; persist(); },
  };
}
