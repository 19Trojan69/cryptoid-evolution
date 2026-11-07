import { hangarCatalog } from "./hangarCatalog";
import type { PlayerSave, Snapshot } from "./playerSave";

export const missionPowerOffers = hangarCatalog.filter(offer => offer.kind === "power");
export type MissionPower = (typeof missionPowerOffers)[number]["powerUp"];
export type SingleUseMissionPower = "bomb" | "emp";
export type MissionPowerActivation = { id: string; power: MissionPower };
export type MissionPowerInventory = {
  stock: Partial<Record<MissionPower, number>>;
  pending: MissionPowerActivation | null;
  used: SingleUseMissionPower[];
};

export const isSingleUseMissionPower = (power: unknown): power is SingleUseMissionPower =>
  power === "bomb" || power === "emp";

export function usedMissionPowers(player: PlayerSave): SingleUseMissionPower[] {
  const used = new Set<SingleUseMissionPower>(player.mission?.snapshot.usedMissionPowers);
  const legacy = player.mission?.combat?.state.pendingStartPower ?? player.lastStart?.powerUp;
  if (isSingleUseMissionPower(legacy)) used.add(legacy);
  return [...used];
}

// A paid effect can be replayed from the confirmed save until a write includes
// that effect. Retire its receipt in the same write as the resulting progress.
export function saveMissionPower(player: PlayerSave, snapshot: Snapshot, id: unknown, key: string) {
  const pending = player.pendingPowerActivation;
  const applied = !!pending && id === pending.id;
  const used = usedMissionPowers(player);
  if (applied && isSingleUseMissionPower(pending.power) && !used.includes(pending.power)) used.push(pending.power);
  if (used.length) snapshot.usedMissionPowers = used;
  return applied ? { $unset: { [`${key}.pendingPowerActivation`]: "" } } : {};
}
