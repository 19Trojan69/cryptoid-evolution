import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../i18n';
import { arcadeRankIds, arcadeStickerAlbumName, type ArcadeSticker } from '../../../backend/src/galaxyArcadeStickerSchema.ts';
import { retroMiniGameName, type ArcadeLabels, type ArcadeStation } from './galaxyArcadeRecords';
import { readArcadeStickers } from './galaxyArcadeStickers';

// Shards, meteors, docking, rings, target practice, interception, rescue and escort.
const gameMarks = [
  'M24 3 41 24 24 45 7 24Z M24 3 19 24 24 45 M7 24h34',
  'm31 5-7 12m15-6-6 10M18 18l10 5 1 11-8 7-11-2-5-9 6-9Z',
  'M6 21V8h36v13M6 27v13h36V27M14 16h20M14 32h20M24 12v24',
  'M37 12a17 17 0 1 0 0 24M33 17a11 11 0 1 0 0 14M39 17l5 7-5 7',
  'M38 24a14 14 0 1 1-28 0 14 14 0 0 1 28 0ZM24 4v12m0 16v12M4 24h12m16 0h12',
  'm6 39 11-11m-7 15 11-11m-3 0 6-13L41 7l-3 17-13 13Z',
  'M10 16h28v23H10zM16 16v-6h16v6M24 21v13m-6-7h12',
  'm24 6 15 7v12c0 7-6 12-15 17-9-5-15-10-15-17V13Z M17 24l5 5 9-10',
];

type Props = {
  owner: string | null;
  stations: ArcadeStation[];
  stationCount: number;
  initialLevel?: number;
  labels: ArcadeLabels['stickers'];
  onClose: () => void;
};

export default function GalaxyStickerAlbum({ owner, stations, stationCount, initialLevel, labels, onClose }: Props) {
  const { t, locale } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const [result, setResult] = useState<ArcadeSticker[] | 'error' | null>(null);
  const [chosen, setChosen] = useState(initialLevel);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    close.current?.focus({ preventScroll: true });
    return () => { element?.close(); previous?.focus({ preventScroll: true }); };
  }, []);

  useEffect(() => {
    if (!owner) return;
    let active = true;
    void readArcadeStickers(owner).then(stickers => {
      if (active) setResult(stickers);
    }, () => {
      if (active) setResult('error');
    });
    return () => { active = false; };
  }, [owner]);

  const visibleLevels = new Set(stations.map(station => station.level));
  const stickers = Array.isArray(result) ? result.filter(sticker => visibleLevels.has(sticker.level)) : [];
  const level = chosen ?? stickers[0]?.level ?? stations[0]?.level;
  const station = stations.find(game => game.level === level) ?? stations[0];
  const count = labels.collected.replace('{count}', stickers.length.toLocaleString(locale))
    .replace('{total}', (stationCount * arcadeRankIds.length).toLocaleString(locale));
  const mark = station ? gameMarks[Math.floor((station.level - 5) / 25)] : undefined;
  const stationStickers = new Map(stickers.filter(sticker => sticker.level === station?.level).map(sticker => [sticker.rank, sticker]));

  return <dialog ref={dialog} className="galaxy-dialog galaxy-sticker-dialog" aria-labelledby="galaxy-sticker-title"
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="galaxy-dialog-content">
      <header><span>{t('Galaxy map')}</span><button ref={close} className="galaxy-dialog-close" type="button" onClick={onClose} aria-label={t('Close')}>×</button></header>
      <h2 id="galaxy-sticker-title">{arcadeStickerAlbumName}</h2>
      {!owner ? <p>{t('Sign in with Pi')}</p> : result === null ? <p role="status">{t('Loading…')}</p>
        : result === 'error' ? <p role="alert">{labels.unavailable}</p> : <>
          <p className="galaxy-sticker-count">{count}</p>
          <p className="galaxy-note">{labels.device}</p>
          {stickers.length === 0 && <p>{labels.empty}</p>}
          {station && <>
            <label className="galaxy-sticker-picker">
              <span>{retroMiniGameName}</span>
              <select value={station.level} onChange={event => setChosen(Number(event.currentTarget.value))}>
                {stations.map(game => <option key={game.level} value={game.level}>
                  {game.name} · {t('Level')} {game.level}
                </option>)}
              </select>
            </label>
            <ul className="galaxy-sticker-grid" aria-label={station.name}>
              {labels.ranks.map((name, index) => {
                const sticker = stationStickers.get(index + 1);
                const shipName = sticker?.shipName.split(' · ')[0];
                return <li key={arcadeRankIds[index]} data-arcade-rank={index + 1} data-earned={!!sticker}>
                  <div className="galaxy-sticker-art">
                    {mark && <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d={mark}/></svg>}
                    {sticker && <img src={sticker.image} alt="" draggable={false}/>}
                  </div>
                  <strong>{name}</strong>
                  <small title={sticker?.shipName}>{shipName || t('Locked')}</small>
                </li>;
              })}
            </ul>
          </>}
        </>}
      <aside className="galaxy-note galaxy-sticker-policy">{labels.freeInGame}</aside>
    </div>
  </dialog>;
}
