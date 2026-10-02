import { axiosClient } from "./axiosClient";
import type { PlayerSave, Snapshot } from "../../../backend/src/playerSave";
import { allPlayerColors, playerSkins, readShipFleet, shardBalance, SHARD_BALANCE_KEY, SHIP_COLOR_KEY, SHIP_COLORS_KEY, SHIP_FLEET_KEY, SHIP_OWNED_KEY, SHIP_SKIN_KEY } from "../pages/shipFleet";
import { shipSaveNetwork } from "../pages/shipFleet";
export type AccountSave = Pick<PlayerSave, "version" | "balance" | "fleet" | "skin" | "color" | "mission" | "highestSector" | "totalDestroyed" | "totalShardsEarned" | "totalShardsSpent" | "legacyImported" | "updatedAt">;
export type { Snapshot };
export const loadAccountSave = async () => (await axiosClient.get<{ save: AccountSave }>("/progress/me")).data.save;
export const accountSelection = (save: AccountSave) => ({ skin: playerSkins.find(s => s.id === save.skin) || playerSkins[0], color: allPlayerColors.find(c => c.id === save.color) || allPlayerColors.find(c => c.id === "grey")! });
export const localInventory = () => ({ balance: shardBalance(localStorage.getItem(SHARD_BALANCE_KEY)), fleet: readShipFleet(localStorage.getItem(SHIP_FLEET_KEY), localStorage.getItem(SHIP_OWNED_KEY), localStorage.getItem(SHIP_COLORS_KEY)), skin: localStorage.getItem(SHIP_SKIN_KEY) || "grey-scout", color: localStorage.getItem(SHIP_COLOR_KEY) || "grey" });
export const mutateAccountInventory = async (save: AccountSave, command: object) => (await axiosClient.post<{ save: AccountSave }>("/progress/inventory", { version: save.version, ...command })).data.save;
export const snapshotOf = (s: Snapshot): Snapshot => {
  const keys = ["score", "shards", "destroyed", "hearts", "paidWeaponLevel", "paidWeaponMs", "pickupWeaponLevel", "pickupWeaponMs", "shieldCharges", "shieldMs", "purchasedShieldMs", "overdriveMs", "overdriveTotalMs", "rapidFireMs", "rapidFireTotalMs", "empMs"] as const;
  return { ...Object.fromEntries(keys.map(key => [key, Math.max(0, Math.round(s[key]))])), weaponSource: s.weaponSource, shieldActive: s.shieldActive, weaponTimers: s.weaponTimers.map(n => Math.round(n)) } as Snapshot;
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

type PendingSave = { path: "/rewards/event" | "/leaderboard/score"; body: Record<string, unknown> & { runId: string } };
export function createSaveQueue(uid: string) {
  const key = `cryptoid_save_outbox_v1_${shipSaveNetwork}_${uid}`;
  let entries: PendingSave[] = [];
  try { const parsed = JSON.parse(localStorage.getItem(key) || "[]"); if (Array.isArray(parsed)) entries = parsed.filter(e => ["/rewards/event", "/leaderboard/score"].includes(e.path) && typeof e.body?.runId === "string"); } catch { /* Preserve malformed backup separately; never grant its data. */ }
  let inflight: Promise<void> | null = null;
  let durable = true;
  const persist = () => { try { localStorage.setItem(key, JSON.stringify(entries)); } catch { durable = false; } };
  const drain = (): Promise<void> => {
    if (inflight) return inflight;
    inflight = (async () => {
      while (entries.length) {
        const entry = entries[0];
        await retrySave(() => axiosClient.post(entry.path, entry.body));
        entries.shift(); persist();
      }
    })().finally(() => { inflight = null; });
    return inflight;
  };
  return {
    enqueue(entry: PendingSave) { entries.push(entry); persist(); return drain(); },
    drain,
    get durable() { return durable; },
    async recover() {
      if (!entries.length) return;
      const { data } = await retrySave(() => axiosClient.post<{ finished?: boolean }>("/progress/recover", { runId: entries[0].body.runId }));
      if (data.finished) {
        const finishedRun = entries[0].body.runId;
        entries = entries.filter(entry => entry.body.runId !== finishedRun); persist();
        if (entries.length) await this.recover();
        return;
      }
      await drain();
    },
    archive() { try { localStorage.setItem(`${key}_unconfirmed`, JSON.stringify(entries)); } catch { durable = false; } entries = []; persist(); },
  };
}
