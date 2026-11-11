import { arcadeLaunchKey, arcadeRankIds, arcadeStickerImage, arcadeStickerStore } from "./galaxyArcadeStickerSchema";

export function arcadeStickerAwardScript(level: number, enabled: boolean) {
  if (!enabled) return 'function reportArcadeStickers() {}';
  return `
    const stickerStore = ${JSON.stringify(arcadeStickerStore)};
    let pendingStickerSave = null;
    let leavingAfterSave = false;
    returnLink.addEventListener('click', event => {
      if (!pendingStickerSave) return;
      event.preventDefault();
      if (leavingAfterSave) return;
      leavingAfterSave = true;
      void pendingStickerSave.then(() => {
        leavingAfterSave = false;
        returnLink.click();
      });
    });
    async function saveArcadeStickers(tier) {
      const launch = JSON.parse(sessionStorage.getItem(${JSON.stringify(arcadeLaunchKey)}) ?? 'null');
      const ship = C.activeShip;
      const image = $('heroShip').getAttribute('src');
      if (!runId || launch?.run !== runId || launch.level !== ${level}
        || typeof launch.owner !== 'string' || !launch.owner
        || !ship || ![1, 2, 3].includes(ship.stage) || typeof ship.modelId !== 'string'
        || typeof ship.colorId !== 'string' || !image || !${arcadeStickerImage}.test(image)) {
        throw new Error('Arcade sticker is missing its completed launch or flown ship');
      }
      const shipName = typeof ship.name === 'string' && ship.name ? ship.name : ship.modelId;
      return new Promise((resolve, reject) => {
        const open = indexedDB.open(stickerStore.database, stickerStore.version);
        open.onupgradeneeded = () => open.result.createObjectStore(stickerStore.store, { keyPath: stickerStore.keyPath });
        open.onerror = () => reject(open.error);
        open.onblocked = () => reject(new Error('Arcade sticker album is blocked'));
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains(stickerStore.store)) {
            db.close();
            reject(new Error('Arcade sticker store is missing'));
            return;
          }
          const transaction = db.transaction(stickerStore.store, 'readwrite');
          const stickers = transaction.objectStore(stickerStore.store);
          const earned = [];
          transaction.oncomplete = () => { db.close(); resolve(earned); };
          transaction.onabort = () => { db.close(); reject(transaction.error); };
          for (let rank = 1; rank <= tier; rank++) {
            const key = [launch.owner, ${level}, rank];
            const existing = stickers.get(key);
            existing.onsuccess = () => {
              if (existing.result !== undefined) return;
              stickers.add({
                owner: launch.owner, level: ${level}, rank, modelId: ship.modelId,
                shipName, stage: ship.stage, colorId: ship.colorId, image,
              });
              earned.push(rank);
            };
          }
        };
      });
    }
    function reportArcadeStickers(tier) {
      if (!Number.isInteger(tier) || tier < 1 || tier > ${arcadeRankIds.length}) return;
      const note = $('resultMessage');
      const again = $('again');
      again.disabled = true;
      pendingStickerSave = saveArcadeStickers(tier).then(earned => {
        if (earned.length) {
          note.textContent = stickerWords.earned + ' · ' + earned.map(rank => stickerWords.ranks[rank - 1]).join(' · ');
          note.hidden = false;
        }
      }, () => {
        note.textContent = stickerWords.saveFailed;
        note.dataset.saveError = '';
        note.hidden = false;
      }).finally(() => {
        pendingStickerSave = null;
        again.disabled = false;
      });
    }
  `;
}
