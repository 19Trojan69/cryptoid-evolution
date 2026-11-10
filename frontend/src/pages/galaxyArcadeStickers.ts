import {
  arcadeRankIds, arcadeStickerImage, arcadeStickerStore,
  type ArcadeSticker,
} from '../../../backend/src/galaxyArcadeStickerSchema.ts';
import { isPublicArcadeLevel } from './galaxyArcadeRecords';

export function readArcadeStickers(owner: string): Promise<ArcadeSticker[]> {
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
          && typeof sticker.image === 'string' && arcadeStickerImage.test(sticker.image)));
      };
    };
  });
}
