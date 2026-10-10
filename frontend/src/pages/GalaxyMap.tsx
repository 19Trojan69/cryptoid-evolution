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
import { emptyGalaxyProgress, galaxyPoint, galaxyShipPoint, galaxyRegions, type GalaxySelection } from './galaxyModel';
import { MOTION_STORAGE_KEY } from './displaySettings';
import './galaxyMap.css';
import './galaxyArt.css';

export default function GalaxyMap() {
  const { t } = useLocale();
  const navigate = useNavigate(), location = useLocation();
  const fromQuick = location.state?.fromQuick === true;
  const { snapshot, status } = useGalaxyData(typeof location.state?.owner === 'string' ? location.state.owner : undefined);
  const [selection, setSelection] = useState<GalaxySelection | null>(null);
  const scroll = useRef<HTMLDivElement>(null), ship = useRef<HTMLDivElement>(null);
  const previousLevel = useRef<number | null>(null);
  const close = useCallback(() => setSelection(null), []);
  const progress = status === 'ready' ? snapshot.progress : emptyGalaxyProgress();
  const point = galaxyShipPoint(progress.currentLevel);
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
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    const element = scroll.current;
    if (element) element.scrollTop = galaxyPoint(1).mapY - element.clientHeight * .55;
    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, []);
  useEffect(() => {
    if (status !== 'ready') return;
    const before = previousLevel.current;
    previousLevel.current = progress.currentLevel;
    if (before === null || before >= progress.currentLevel || !ship.current) return;
    if (document.documentElement.dataset.motion === 'reduced' || localStorage.getItem(MOTION_STORAGE_KEY) === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = galaxyShipPoint(before), b = galaxyShipPoint(progress.currentLevel);
    // Animate only a newly confirmed adjacent stage; never replay an entire career.
    if (progress.currentLevel - before !== 1) return;
    const width = ship.current.parentElement?.clientWidth ?? 0;
    const animation = ship.current.animate([{ transform: `translate(calc(-50% + ${(a.x - b.x) / 100 * width + a.dx - b.dx}px), calc(-50% + ${a.mapY + a.dy - b.mapY - b.dy}px))` }, { transform: 'translate(-50%, -50%)' }], { duration: 850, easing: 'ease-in-out' });
    return () => animation.cancel();
  }, [status, progress.currentLevel]);
  const home = (state: object = {}) => navigate('/', { state });
  return <main className="galaxy-page" data-progress-status={status} data-network={shipSaveNetwork}>
    <header className="galaxy-toolbar">
      <button type="button" className="galaxy-back" onClick={() => home({ openQuickMenu: fromQuick })}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14 6-6 6 6 6M8 12h12"/></svg><span>{t('Back')}</span></button>
      <div><p>CRYPTOID EVOLUTION</p><h1>{t('Galaxy map')}</h1></div>
      <span className="galaxy-preview-badge">{t('Preview · In development')}</span>
    </header>
    {status !== 'ready' && <p className="galaxy-data-status" role="status">{status === 'loading' ? t('Loading saved progress…') : t('Saved progress is unavailable. You can still explore; your data is unchanged.')}</p>}
    <div className="galaxy-scroll" ref={scroll} tabIndex={0} aria-label={t('Galaxy map')}>
      <div className="galaxy-map-world">
        {[...galaxyRegions.keys()].reverse().map(region => <GalaxySector key={region} region={region} progress={progress} onSelect={setSelection}/>)}
        {status === 'ready' && <div ref={ship} className="galaxy-player" data-player-level={progress.currentLevel} data-player-port={point.port} style={{ '--player-x': `calc(${point.x}% + ${point.dx}px)`, '--player-y': `${point.mapY + point.dy}px` } as CSSProperties}>
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
    <button type="button" className="galaxy-position" disabled={status !== 'ready'} onClick={() => goTo(progress.currentLevel)} title={status === 'ready' ? `${t('Level')} ${progress.currentLevel} · ${skin.name}` : undefined}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.5"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg><span>{t('To my position')}</span></button>
    {selection && <GalaxyInfoDialog key={`${selection.kind}:${selection.level}`} selection={selection} progress={progress} onClose={close} onShop={view => home({ openShopView: view })} onCards={() => home({ openCollection: true })}/>}
  </main>;
}
