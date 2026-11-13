import {
  arcadeRankIds, arcadeStickerImage, arcadeStickerSlot, arcadeStickerStore,
  type ArcadeSticker, type ArcadeStickerBackup,
} from '../../../backend/src/galaxyArcadeStickerSchema.ts';
import { axiosClient } from '../lib/axiosClient';
import { isPublicArcadeLevel } from './galaxyArcadeRecords';
import { shipEvolutionAsset } from './shipEvolution';
import { allPlayerColors, playerSkins, shipPaintAvailable } from './shipFleet';
import { isVanguardMetallic } from '../../../backend/src/shipLivery.ts';
import { staticHullAsset } from './staticHullAssets';

type StickerArtwork = Omit<ArcadeSticker, 'owner'> & { fallbackImage?: string };
export type ArcadeStickerAlbum = { stickers: StickerArtwork[]; savedToAccount: boolean };

function stickerArtwork(sticker: ArcadeStickerBackup, local?: ArcadeSticker): StickerArtwork | undefined {
  const skin = playerSkins.find(entry => entry.id === sticker.modelId);
  const color = allPlayerColors.find(entry => entry.id === sticker.colorId);
  if (!skin || !color || !shipPaintAvailable(skin.id, color.id)) return;
  const fallback = local?.image ?? shipEvolutionAsset(skin.sprite, sticker.stage, color.id);
  return {
    ...sticker,
    shipName: local?.shipName ?? skin.name,
    image: (sticker.stage === 1 && !isVanguardMetallic(skin.sprite, color.id) ? local?.image : undefined)
      ?? staticHullAsset(skin.sprite, color.id, sticker.stage)?.url ?? fallback,
    fallbackImage: local?.image,
  };
}

function readArcadeStickers(owner: string): Promise<ArcadeSticker[]> {
  const { database, version, store, keyPath } = arcadeStickerStore;
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(database, version);
    open.onupgradeneeded = () => open.result.createObjectStore(store, { keyPath });
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error('Arcade sticker album is blocked'));
    open.onsuccess = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(store)) {
        db.close();
        reject(new Error('Arcade sticker store is missing'));
        return;
      }
      const transaction = db.transaction(store);
      const range = IDBKeyRange.bound([owner, 0], [owner, Number.MAX_SAFE_INTEGER]);
      const request = transaction.objectStore(store).getAll(range);
      transaction.onabort = () => { db.close(); reject(transaction.error); };
      transaction.oncomplete = () => {
        db.close();
        resolve(request.result.filter((sticker: ArcadeSticker) => sticker?.owner === owner
          && isPublicArcadeLevel(sticker.level) && Number.isInteger(sticker.rank) && sticker.rank >= 1
          && sticker.rank <= arcadeRankIds.length && typeof sticker.shipName === 'string'
          && playerSkins.some(skin => skin.id === sticker.modelId)
          && allPlayerColors.some(color => color.id === sticker.colorId) && [1, 2, 3].includes(sticker.stage)
          && typeof sticker.image === 'string' && arcadeStickerImage.test(sticker.image)));
      };
    };
  });
}

const backupRoute = '/galaxy-minigames/stickers';

async function requestAccountAlbum(owner: string, signal: AbortSignal, stickers?: ArcadeStickerBackup[]) {
  const options = { baseURL: '/api', signal, timeout: 8_000 };
  type Response = { owner: string; stickers: ArcadeStickerBackup[] };
  const { data } = stickers
    ? await axiosClient.put<Response>(backupRoute, { owner, stickers }, options)
    : await axiosClient.get<Response>(backupRoute, options);
  if (data?.owner !== owner || !Array.isArray(data.stickers)) throw new Error('Unexpected arcade sticker album');
  return data.stickers;
}

export async function syncArcadeStickerAlbum(owner: string, stations: readonly { level: number }[], signal: AbortSignal): Promise<ArcadeStickerAlbum> {
  const [device, account] = await Promise.allSettled([readArcadeStickers(owner), requestAccountAlbum(owner, signal)]);
  const levels = new Set(stations.map(station => station.level));
  const local = device.status === 'fulfilled' ? device.value.filter(sticker => levels.has(sticker.level)) : [];
  const bySlot = new Map<string, StickerArtwork>();
  for (const sticker of local) {
    const artwork = stickerArtwork(sticker, sticker);
    if (artwork) bySlot.set(arcadeStickerSlot(sticker), artwork);
  }
  if (account.status === 'rejected') {
    if (bySlot.size === 0) throw account.reason;
    return { stickers: [...bySlot.values()], savedToAccount: false };
  }

  let saved = account.value;
  const savedSlots = new Set(saved.map(arcadeStickerSlot));
  const missing = local.filter(sticker => !savedSlots.has(arcadeStickerSlot(sticker)))
    .map(({ level, rank, modelId, stage, colorId }) => ({ level, rank, modelId, stage, colorId }));
  let savedToAccount = true;
  if (missing.length > 0) {
    try { saved = await requestAccountAlbum(owner, signal, missing); }
    catch { savedToAccount = false; }
  }

  for (const sticker of saved) {
    if (!levels.has(sticker.level)) continue;
    const slot = arcadeStickerSlot(sticker);
    const original = bySlot.get(slot);
    if (original?.modelId === sticker.modelId && original.stage === sticker.stage && original.colorId === sticker.colorId) continue;
    const artwork = stickerArtwork(sticker);
    if (artwork) bySlot.set(slot, artwork);
  }
  return { stickers: [...bySlot.values()].sort((a, b) => a.level - b.level || a.rank - b.rank), savedToAccount };
}
