import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocale } from '../i18n';
import { arcadeRankIds, arcadeStickerAlbumName } from '../../../backend/src/galaxyArcadeStickerSchema.ts';
import { retroMiniGameName, type ArcadeLabels, type ArcadeStation } from './galaxyArcadeRecords';
import { syncArcadeStickerAlbum, type ArcadeStickerAlbum } from './galaxyArcadeStickers';
import { arcadeStickerMotifs } from './arcadeStickerMotifs';

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
  const [result, setResult] = useState<ArcadeStickerAlbum | 'error' | null>(null);
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
    const request = new AbortController();
    void syncArcadeStickerAlbum(owner, stations, request.signal).then(album => {
      if (!request.signal.aborted) setResult(album);
    }, () => {
      if (!request.signal.aborted) setResult('error');
    });
    return () => request.abort();
  }, [owner, stations]);

  const visibleLevels = new Set(stations.map(station => station.level));
  const stickers = result && result !== 'error' ? result.stickers.filter(sticker => visibleLevels.has(sticker.level)) : [];
  const level = chosen ?? stickers[0]?.level ?? stations[0]?.level;
  const station = stations.find(game => game.level === level) ?? stations[0];
  const count = labels.collected.replace('{count}', stickers.length.toLocaleString(locale))
    .replace('{total}', (stationCount * arcadeRankIds.length).toLocaleString(locale));
  const motif = station && arcadeStickerMotifs[station.level];
  const stationStickers = new Map(stickers.filter(sticker => sticker.level === station?.level).map(sticker => [sticker.rank, sticker]));

  return <dialog ref={dialog} className="galaxy-dialog galaxy-sticker-dialog" aria-labelledby="galaxy-sticker-title"
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="galaxy-dialog-content">
      <header><span>{t('Galaxy map')}</span><button ref={close} className="galaxy-dialog-close" type="button" onClick={onClose} aria-label={t('Close')}>×</button></header>
      <h2 id="galaxy-sticker-title">{arcadeStickerAlbumName}</h2>
      {!owner ? <p>{t('Sign in with Pi')}</p> : result === null ? <p role="status">{t('Loading…')}</p>
        : result === 'error' ? <p role="alert">{labels.unavailable}</p> : <>
          <p className="galaxy-sticker-count">{count}</p>
          {!result.savedToAccount && <p className="galaxy-note">{labels.device}</p>}
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
            <ul className="galaxy-sticker-grid" aria-label={station.name}
              style={motif ? { '--sticker-scene-color': motif.color } as CSSProperties : undefined}>
              {labels.ranks.map((name, index) => {
                const sticker = stationStickers.get(index + 1);
                const shipName = sticker?.shipName.split(' · ')[0];
                return <li key={arcadeRankIds[index]} data-arcade-rank={index + 1} data-earned={!!sticker}>
                  <div className="galaxy-sticker-art" aria-hidden="true">
                    {sticker ? <>
                      <div className="galaxy-sticker-print">
                        {motif && <svg className="galaxy-sticker-motif" viewBox="0 0 64 56" focusable="false">
                          <path className="galaxy-sticker-motif-shape" d={motif.shape}/>
                          <path className="galaxy-sticker-motif-details" d={motif.details}/>
                        </svg>}
                      </div>
                      <img className="galaxy-sticker-ship" src={sticker.image} alt="" draggable={false}/>
                    </> : <span className="galaxy-sticker-lock"/>}
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
