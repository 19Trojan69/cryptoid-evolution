import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../i18n';
import { axiosClient } from '../lib/axiosClient';
import GalaxyBossArt from './GalaxyBossArt';
import { galaxyBossState, galaxyPoint, type GalaxyProgress, type GalaxySelection } from './galaxyModel';

function GalaxyArcadeFrame({ level, name }: { level: number; name: string }) {
  const { t } = useLocale();
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void axiosClient.get<{ html?: string }>(`/admin/galaxy-minigames/${level}`, {
      baseURL: '/api', signal: controller.signal,
    }).then(({ data }) => {
      if (controller.signal.aborted) return;
      if (typeof data?.html !== 'string' || !data.html.startsWith('<!doctype html>')) throw new Error('Invalid arcade document');
      setHtml(data.html);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [level, attempt]);

  if (html) return <iframe className="galaxy-arcade-frame" title={name} srcDoc={html} sandbox="allow-scripts" referrerPolicy="no-referrer"/>;
  return <div className="galaxy-arcade-status">
    {failed ? <><p role="alert">{t('Could not load the test. Retry or sign in again.')}</p><button type="button" className="galaxy-secondary" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>{t('Retry')}</button></>
      : <p role="status">{t('Loading…')}</p>}
  </div>;
}

type Props = { selection: GalaxySelection; progress: GalaxyProgress; miniGameName?: string; onClose: () => void; onShop: (view: 'shop' | 'hangar') => void; onCards: () => void };
export default function GalaxyInfoDialog({ selection, progress, miniGameName, onClose, onShop, onCards }: Props) {
  const { t } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const returnButton = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    element?.querySelector<HTMLButtonElement>('.galaxy-dialog-close')?.focus({ preventScroll: true });
    return () => { element?.close(); previous?.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => { if (playing) returnButton.current?.focus({ preventScroll: true }); }, [playing]);
  const station = galaxyPoint(selection.level);
  const boss = selection.kind === 'boss' ? station.boss : undefined;
  const state = boss ? galaxyBossState(progress, boss.id) : undefined;
  const title = boss ? station.name : selection.kind === 'mini' ? miniGameName ?? `${t('Mini-game')} · ${t('In development')}` : selection.kind === 'trade' ? t('Trading station') : `${t('Level')} ${selection.level}`;
  const showArcade = playing && miniGameName;
  return <dialog ref={dialog} className={showArcade ? 'galaxy-dialog galaxy-arcade-dialog' : 'galaxy-dialog'} aria-labelledby="galaxy-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    {showArcade ? <div className="galaxy-arcade-content">
      <header><button ref={returnButton} type="button" className="galaxy-arcade-return" onClick={onClose}>‹ {t('Back')}</button><h2 id="galaxy-dialog-title">{title}</h2></header>
      <GalaxyArcadeFrame level={selection.level} name={showArcade}/>
    </div> : <div className="galaxy-dialog-content">
      <header><span>{t('Level')} {selection.level}</span><button className="galaxy-dialog-close" type="button" onClick={onClose} aria-label={t('Close')}>×</button></header>
      <h2 id="galaxy-dialog-title">{title}</h2>
      {miniGameName ? <>
        <div className="galaxy-dialog-portal" aria-hidden="true">✧</div>
        <p className="galaxy-note">{t('Scores only count in this test round.')}</p>
        <button type="button" className="galaxy-primary" onClick={() => setPlaying(true)}>{t('Play')}</button>
      </> : selection.kind === 'mini' ? <>
        <div className="galaxy-dialog-portal" aria-hidden="true">✧</div>
        <p>{t('A new challenge awaits here. Play varied mini-games, collect medals and earn additional Shards. This feature will be available in a future expansion.')}</p>
        <p className="galaxy-note">{t(selection.level <= progress.completedLevel ? 'Your saved completion already qualifies for this station when mini-games launch.' : 'Complete this level to qualify when mini-games launch.')}</p>
        <div className="galaxy-medals">{['Bronze', 'Silver', 'Gold'].map((medal, index) => <span key={medal} data-medal={index}><i aria-hidden="true">✦</i>{t(medal)}</span>)}</div>
        <p>{t('Future rule: replay freely. A limited Shards reward is granted only once per station and medal tier. No mini-game rewards are paid in this preview.')}</p>
      </> : boss && state ? <>
        <div className="galaxy-dialog-boss"><GalaxyBossArt key={boss.id} id={boss.id} defeated={state.defeated} large/></div>
        <p className="galaxy-note">{t(state.defeated ? 'Boss defeated' : 'Boss not yet defeated')}</p>
        {state.cardAvailable ? <button type="button" className="galaxy-primary" onClick={onCards}>{t('Open card collection')}</button> : <p>{t('Card availability follows the existing release and ownership rules.')}</p>}
      </> : selection.kind === 'trade' ? <>
        <div className="galaxy-dialog-station" aria-hidden="true">◇</div>
        <p>{t('Open the existing shop or hangar. Prices, ownership and Pi payment rules stay unchanged.')}</p>
        <button type="button" className="galaxy-primary" onClick={() => onShop('shop')}>{t('Ship shop')}</button>
        <button type="button" className="galaxy-secondary" onClick={() => onShop('hangar')}>{t('Hangar')}</button>
      </> : <>
        <p>{t(selection.level <= progress.completedLevel ? 'Completed level' : 'Level not yet completed')}</p>
        {station.boss && <button type="button" className="galaxy-secondary" onClick={onClose}>{t('Close')}</button>}
        <p>{t('Exploring the map does not start a mission or change your progress.')}</p>
      </>}
      {!miniGameName && <p className="galaxy-dialog-footer">{t('Preview · In development')}</p>}
    </div>}
  </dialog>;
}
