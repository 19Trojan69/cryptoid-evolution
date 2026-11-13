import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../i18n';
import { axiosClient } from '../lib/axiosClient';
import GalaxyBossArt from './GalaxyBossArt';
import GalaxyArcadePanel from './GalaxyArcadePanel';
import { arcadeStickerAlbumName, retroMiniGameName, type ArcadeLabels, type ArcadeRecord, type ArcadeStation } from './galaxyArcadeRecords';
import { galaxyBossState, galaxyPoint, type GalaxyProgress, type GalaxySelection } from './galaxyModel';

export type GalaxyArcadeLaunch = { game: ArcadeStation; ticket: string } | { path: string };
type Props = { selection: GalaxySelection; progress: GalaxyProgress; miniGameName?: string; lockedRetro?: 'level' | 'sign-in'; onEnterTestCode?: () => void; onLaunch: (target: GalaxyArcadeLaunch, signal: AbortSignal) => Promise<void>; onClose: () => void; onShop: (view: 'shop' | 'hangar') => void; onCards: () => void;
  arcade?: { game: ArcadeStation; labels: ArcadeLabels; record: ArcadeRecord | null; owner: string | null; openAlbum: () => void } };
export default function GalaxyInfoDialog({ selection, progress, miniGameName, lockedRetro, arcade, onEnterTestCode, onLaunch, onClose, onShop, onCards }: Props) {
  const { t } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const [launch, setLaunch] = useState<'idle' | 'loading' | 'error'>('idle');
  const game = arcade?.game;
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    element?.querySelector<HTMLButtonElement>('.galaxy-dialog-close')?.focus({ preventScroll: true });
    return () => { element?.close(); previous?.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    if (launch !== 'loading' || !miniGameName) return;
    const controller = new AbortController();
    const path = `${game ? '' : '/admin'}/galaxy-minigames/${selection.level}`;
    void axiosClient.post<{ ticket?: string }>(`${path}/launch`, null, { baseURL: '/api', signal: controller.signal }).then(({ status, data }) => {
      if (controller.signal.aborted) return;
      if (game) {
        const ticket = data?.ticket;
        if (status !== 200 || typeof ticket !== 'string' || !/^\d{13}\.[a-f0-9]{64}$/.test(ticket)) throw new Error('Invalid arcade ticket');
        return onLaunch({ game, ticket }, controller.signal);
      }
      if (status !== 204) throw new Error('Invalid arcade launch response');
      return onLaunch({ path: `/api${path}/play` }, controller.signal);
    }).catch(() => { if (!controller.signal.aborted) setLaunch('error'); });
    return () => controller.abort();
  }, [launch, selection.level, game, onLaunch, miniGameName]);
  const station = galaxyPoint(selection.level);
  const boss = selection.kind === 'boss' ? station.boss : undefined;
  const state = boss ? galaxyBossState(progress, boss.id) : undefined;
  const title = boss ? station.name : selection.kind === 'mini' ? miniGameName ?? (lockedRetro ? retroMiniGameName : onEnterTestCode ? t('Private mini-game test') : `${t('Mini-game')} · ${t('In development')}`) : selection.kind === 'trade' ? t('Trading station') : `${t('Campaign stage')} ${selection.level}`;
  const playLabel = t(launch === 'loading' ? 'Loading…' : launch === 'error' ? 'Retry' : 'Play');
  return <dialog ref={dialog} className="galaxy-dialog" aria-labelledby="galaxy-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="galaxy-dialog-content">
      <header><span>{miniGameName ? `${retroMiniGameName} · ` : ''}{t('Campaign stage')} {selection.level}</span><button className="galaxy-dialog-close" type="button" onClick={onClose} aria-label={t('Close')}>×</button></header>
      <h2 id="galaxy-dialog-title">{title}</h2>
      {arcade ? <>
        {launch === 'error' && <p role="alert">{t('This page could not be loaded.')}</p>}
        <button type="button" className="galaxy-primary" disabled={launch === 'loading'} onClick={() => setLaunch('loading')}>{playLabel}</button>
        <GalaxyArcadePanel key={arcade.owner ?? 'guest'} game={arcade.game} labels={arcade.labels} record={arcade.record} canRate={!!arcade.owner}/>
        <button type="button" className="galaxy-secondary" aria-haspopup="dialog" onClick={arcade.openAlbum}>{arcadeStickerAlbumName}</button>
      </> : lockedRetro ? <>
        <div className="galaxy-dialog-portal" aria-hidden="true">✧</div>
        <p className="galaxy-note">{t('Reach campaign stage {stage} to unlock this game.', { stage: selection.level })}</p>
        {lockedRetro === 'sign-in' && <p>{t('Sign in with Pi')}</p>}
      </> : miniGameName ? <>
        <div className="galaxy-dialog-portal" aria-hidden="true">✧</div>
        <p className="galaxy-note">{t('Scores only count in this test round.')}</p>
        {launch === 'error' && <p role="alert">{t('Private test access is unavailable.')}</p>}
        <button type="button" className="galaxy-primary" disabled={launch === 'loading'} onClick={() => setLaunch('loading')}>{playLabel}</button>
      </> : onEnterTestCode ? <>
        <div className="galaxy-dialog-portal" aria-hidden="true">✧</div>
        <p className="galaxy-note">{t('Use your personal test code to unlock all available mini-games.')}</p>
        <button type="button" className="galaxy-primary" onClick={onEnterTestCode}>{t('Enter test code')}</button>
      </> : selection.kind === 'mini' ? <>
        <div className="galaxy-dialog-portal" aria-hidden="true">✧</div>
      </> : boss && state ? <>
        <div className="galaxy-dialog-boss"><GalaxyBossArt key={boss.id} id={boss.id} defeated={state.defeated} large/></div>
        <p className="galaxy-note">{t(state.defeated ? 'Boss defeated' : 'Boss not yet defeated')}</p>
        {state.cardAvailable ? <button type="button" className="galaxy-primary" onClick={onCards}>{t('Open card collection')}</button> : <p>{t('Card availability follows the existing release and ownership rules.')}</p>}
      </> : selection.kind === 'trade' ? <>
        <div className="galaxy-dialog-station" aria-hidden="true">◇</div>
        <button type="button" className="galaxy-primary" onClick={() => onShop('shop')}>{t('Ship shop')}</button>
        <button type="button" className="galaxy-secondary" onClick={() => onShop('hangar')}>{t('Hangar')}</button>
      </> : <>
        <p>{t(selection.level <= progress.completedLevel ? 'Stage completed' : 'Stage not yet completed')}</p>
        {station.boss && <button type="button" className="galaxy-secondary" onClick={onClose}>{t('Close')}</button>}
        <p>{t('Exploring the map does not start a mission or change your progress.')}</p>
      </>}
    </div>
  </dialog>;
}
