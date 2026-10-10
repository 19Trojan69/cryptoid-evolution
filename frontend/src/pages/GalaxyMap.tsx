import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n';
import BlockchainIcon from '../components/BlockchainIcon';
import ShipPortrait from './ShipPortrait';
import { allPlayerColors, playerSkins, shipSaveNetwork } from './shipFleet';
import { ownedShipStage, shipEvolutionAsset } from './shipEvolution';
import useGalaxyData from './useGalaxyData';
import GalaxySector from './GalaxySector';
import GalaxyInfoDialog from './GalaxyInfoDialog';
import { emptyGalaxyProgress, galaxyPoint, galaxyRegions, type GalaxySelection } from './galaxyModel';
import { MOTION_STORAGE_KEY } from './displaySettings';
import './galaxyMap.css';

export default function GalaxyMap() {
  const { t } = useLocale();
  const navigate = useNavigate(), location = useLocation();
  const fromQuick = location.state?.fromQuick === true;
  const { snapshot, status, refresh } = useGalaxyData(typeof location.state?.owner === 'string' ? location.state.owner : undefined);
  const [selection, setSelection] = useState<GalaxySelection | null>(null);
  const [jump, setJump] = useState('1');
  const scroll = useRef<HTMLDivElement>(null), ship = useRef<HTMLDivElement>(null);
  const previousLevel = useRef<number | null>(null);
  const close = useCallback(() => setSelection(null), []);
  const progress = status === 'ready' ? snapshot.progress : emptyGalaxyProgress();
  const point = galaxyPoint(progress.currentLevel);
  const skin = playerSkins.find(entry => entry.id === snapshot.skin) ?? playerSkins[0];
  const color = allPlayerColors.find(entry => entry.id === snapshot.color) ?? allPlayerColors.find(entry => entry.id === 'grey')!;
  const stage = ownedShipStage(skin.sprite, snapshot.upgrades);
  const reduced = () => document.documentElement.dataset.motion === 'reduced' || localStorage.getItem(MOTION_STORAGE_KEY) === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const goTo = (level: number, smooth = true) => {
    const element = scroll.current;
    if (!element) return;
    element.scrollTo({ top: galaxyPoint(level).mapY - element.clientHeight * .55, behavior: smooth && !reduced() ? 'smooth' : 'instant' });
  };
  useEffect(() => {
    // Always begin the first view at Level 1. No progress value is changed.
    const element = scroll.current;
    if (element) element.scrollTop = galaxyPoint(1).mapY - element.clientHeight * .55;
  }, []);
  useEffect(() => {
    if (status !== 'ready') return;
    const before = previousLevel.current;
    previousLevel.current = progress.currentLevel;
    if (before === null || before >= progress.currentLevel || !ship.current) return;
    if (document.documentElement.dataset.motion === 'reduced' || localStorage.getItem(MOTION_STORAGE_KEY) === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = galaxyPoint(before), b = galaxyPoint(progress.currentLevel);
    // Animate only a newly confirmed adjacent stage; never replay an entire career.
    if (progress.currentLevel - before !== 1) return;
    const width = ship.current.parentElement?.clientWidth ?? 0;
    const animation = ship.current.animate([{ transform: `translate(calc(-50% + ${(a.x - b.x) / 100 * width}px), calc(-50% + ${a.mapY - b.mapY}px))` }, { transform: 'translate(-50%, -50%)' }], { duration: 850, easing: 'ease-in-out' });
    return () => animation.cancel();
  }, [status, progress.currentLevel]);
  const home = (state: object = {}) => navigate('/', { state });
  return <main className="galaxy-page" data-progress-status={status} data-network={shipSaveNetwork}>
    <header className="galaxy-toolbar">
      <button type="button" className="galaxy-back" onClick={() => home({ openQuickMenu: fromQuick })}>← <span>{t('Back')}</span></button>
      <div><p>CRYPTOID EVOLUTION</p><h1>{t('Galaxy map')}</h1></div>
      <span className="galaxy-preview-badge">{t('Preview · In development')}</span>
    </header>
    <div className="galaxy-scroll" ref={scroll} tabIndex={0} aria-label={t('Galaxy map')}>
      <div className="galaxy-map-world">
        {[...galaxyRegions.keys()].reverse().map(region => <GalaxySector key={region} region={region} progress={progress} onSelect={setSelection}/>)}
        {status === 'ready' && <div ref={ship} className="galaxy-player" data-player-level={progress.currentLevel} style={{ '--player-x': `${point.x}%`, '--player-y': `${point.mapY + 42}px` } as CSSProperties}>
          <ShipPortrait src={shipEvolutionAsset(skin.sprite, stage)} color={color.id} name={`${t('Your ship')} · ${skin.name}`}/><span aria-hidden="true" className="galaxy-engine"/><small>{t('Your ship')}</small>
        </div>}
      </div>
      <article className="galaxy-intro">
        <BlockchainIcon kind="galaxy"/><p className="galaxy-eyebrow">{t('500 levels · 50 bosses · 100 mini-games')}</p>
        <h2>{`${t('Galaxy map')} · ${t('A glimpse of the future')}`}</h2>
        <p>{t('Explore the planned galaxy map of Cryptoid Evolution today. Discover a journey through 500 levels, legendary bosses, mysterious star systems and upcoming mini-games.')}</p>
        <p>{t('This interactive preview shows an expansion currently in development. More features, challenges and rewards will become available in future updates.')}</p>
        <p className="galaxy-note">{t('Exploring the map does not start a mission or change your progress.')}</p>
      </article>
    </div>
    <nav className="galaxy-navigation" aria-label={t('Game navigation')}>
      <div className="galaxy-progress-status" role="status">{status === 'loading' ? t('Loading saved progress…') : status === 'error' ? t('Saved progress is unavailable. You can still explore; your data is unchanged.') : `${t('Level')} ${progress.currentLevel} · ${skin.name}`}</div>
      <div className="galaxy-navigation-row"><button type="button" disabled={status !== 'ready'} onClick={() => goTo(progress.currentLevel)}>{t('To my position')}</button><button type="button" onClick={() => goTo(1)}>{t('Level')} 1</button><button type="button" onClick={() => goTo(500)}>{t('Level')} 500</button><button type="button" onClick={refresh} disabled={status === 'loading'} aria-label={t('Refresh progress')} title={t('Refresh progress')}>↻</button></div>
      <form onSubmit={event => { event.preventDefault(); const level = Number(jump); if (Number.isInteger(level) && level >= 1 && level <= 500) goTo(level); }}><label htmlFor="galaxy-jump">{t('Go to level')}</label><input id="galaxy-jump" type="number" inputMode="numeric" min="1" max="500" required value={jump} onChange={event => setJump(event.target.value)}/><button type="submit">→</button></form>
    </nav>
    {selection && <GalaxyInfoDialog key={`${selection.kind}:${selection.level}`} selection={selection} progress={progress} onClose={close} onShop={view => home({ openShopView: view })} onCards={() => home({ openCollection: true })}/>}
  </main>;
}
