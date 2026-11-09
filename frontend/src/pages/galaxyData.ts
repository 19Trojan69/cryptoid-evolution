import { emptyGalaxyProgress, galaxyProgress, type GalaxyProgress } from './galaxyModel.ts';
import { readRewardProgress, REWARD_PROGRESS_KEY } from './rewardProgress.ts';
import type { AccountSave } from '../lib/accountSave.ts';

type Getter = <T>(path: string, config?: { baseURL: string }) => Promise<{ data: T }>;
type GalaxyMiniGame = { level: number; name: string };
export type GalaxySnapshot = { progress: GalaxyProgress; skin: string; color: string; upgrades: string[]; owner: string | null; miniGames?: GalaxyMiniGame[] };
export const emptyGalaxySnapshot = (): GalaxySnapshot => ({ progress: emptyGalaxyProgress(), skin: 'grey-scout', color: 'grey', upgrades: [], owner: null });

/** Existing guest records are origin-local. A runtime network override must not
 * reuse legacy records from a different origin network. No migration or writes. */
export function readGalaxyGuestProgress(storage: Pick<Storage, 'getItem'>, network: 'mainnet' | 'testnet', originNetwork: 'mainnet' | 'testnet') {
  const read = (key: string) => storage.getItem(`${key}_${network}`) ?? (network === originNetwork ? storage.getItem(key) : null);
  return galaxyProgress(readRewardProgress(read(REWARD_PROGRESS_KEY)), Number(read('cryptoid_highest_sector') || 1));
}

/** Every request is GET; no sign-in, outbox recovery, purchase or award calls. */
export async function loadGalaxySnapshot(get: Getter, network: 'mainnet' | 'testnet', guest: () => GalaxySnapshot, expectedOwner?: string): Promise<GalaxySnapshot> {
  let uid: string | undefined, canAdmin = false;
  try {
    const { data } = await get<{ user?: { uid: string }; canAdmin?: boolean }>('/user/me');
    uid = data.user?.uid;
    canAdmin = data.canAdmin === true;
  }
  catch (error) {
    if ((error as { response?: { status?: number } }).response?.status !== 401 || expectedOwner) throw error;
  }
  if (!uid) {
    if (expectedOwner) throw new Error('Account progress unavailable');
    return guest();
  }
  if (expectedOwner && expectedOwner !== uid) throw new Error('Account changed');
  const arcade = network === 'testnet' && canAdmin
    ? get<{ stations?: GalaxyMiniGame[] }>('/admin/galaxy-minigames', { baseURL: '/api' })
      .then(({ data }) => Array.isArray(data?.stations) ? data.stations : undefined)
      .catch(() => undefined)
    : undefined;
  const [save, rewards, inventory, miniGames] = await Promise.all([
    get<{ save: AccountSave }>('/progress/me'),
    get<{ network: string; progress: unknown }>('/rewards/me'),
    get<{ ownedShipUpgrades?: string[] }>('/hangar/inventory'),
    arcade,
  ]);
  if (rewards.data.network !== network) throw new Error('Progress network mismatch');
  const progress = readRewardProgress(JSON.stringify(rewards.data.progress));
  return { owner: uid, skin: save.data.save.skin, color: save.data.save.color, upgrades: inventory.data.ownedShipUpgrades ?? [], progress: galaxyProgress(progress, save.data.save.highestSector), miniGames };
}
