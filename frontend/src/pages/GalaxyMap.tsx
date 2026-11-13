import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n';
import BlockchainIcon from '../components/BlockchainIcon';
import ShipPortrait from './ShipPortrait';
import { ADMIN_MODE_KEY, ADMIN_SHIP_STAGE_KEY, playerSkins, selectedShip, shipFactoryPaint, shipSaveNetwork } from './shipFleet';
import { selectedShipStage, shipEvolutionAsset, type ShipStage } from './shipEvolution';
import useGalaxyData from './useGalaxyData';
import GalaxySector from './GalaxySector';
import GalaxyInfoDialog, { type GalaxyArcadeLaunch } from './GalaxyInfoDialog';
import GalaxyArcadeAccess from './GalaxyArcadeAccess';
import GalaxyStickerAlbum from './GalaxyStickerAlbum';
import { axiosClient } from '../lib/axiosClient';
import { loadGalaxyEquipment, type GalaxyEquipment, type GalaxyMiniGame } from './galaxyData';
import { prepareArcadeFlightShip } from './galaxyArcadeEquipment';
import { arcadeStickerAlbumName, claimArcadeResult, markArcadeLaunch, readArcadeRecord, retroMiniGameName, retroMiniGamesName, type PublicArcade } from './galaxyArcadeRecords';
import { syncArcadeStickerAlbum } from './galaxyArcadeStickers';
import { emptyGalaxyProgress, galaxyPoint, galaxyShipPoint, galaxyRegions, type GalaxySelection } from './galaxyModel';
import { MOTION_STORAGE_KEY } from './displaySettings';
import { readControlHand } from './controlPreferences';
import './galaxyMap.css';
import './galaxyArt.css';
import { paceAnimation } from '../lib/cssFramePacing';
import { requestGameFrame } from '../lib/frameScheduler';

const arcadePositionKey = 'cryptoid_galaxy_arcade_position';

export default function GalaxyMap() {
  const { t, locale } = useLocale();
  const navigate = useNavigate(), location = useLocation();
  const fromQuick = location.state?.fromQuick === true;
  const { snapshot, status } = useGalaxyData(typeof location.state?.owner === 'string' ? location.state.owner : undefined);
  const [selection, setSelection] = useState<GalaxySelection | null>(null);
  const [previewGames, setPreviewGames] = useState<GalaxyMiniGame[]>();
  const [officialArcade, setOfficialArcade] = useState<PublicArcade>();
  const [previewLevels, setPreviewLevels] = useState<number[]>([]);
  const [arcadeListOpen, setArcadeListOpen] = useState(false);
  const [album, setAlbum] = useState<{ level?: number } | null>(null);
  const query = location.search ? new URLSearchParams(location.search) : undefined;
  const previewAccess = query?.get('admin-test') === '1';
  const returningFromArcade = query?.get('arcade-return') === '1';
  const scroll = useRef<HTMLDivElement>(null), ship = useRef<HTMLDivElement>(null);
  const previousLevel = useRef<number | null>(null);
  const close = useCallback(() => setSelection(null), []);
  const openAlbum = (level?: number) => {
    setSelection(null);
    setArcadeListOpen(false);
    setAlbum({ level });
  };
  const launchArcade = useCallback(async (target: GalaxyArcadeLaunch, signal: AbortSignal) => {
    let previewStage: ShipStage | undefined;
    if ('path' in target && sessionStorage.getItem(ADMIN_MODE_KEY) === '1') {
      const stage = Number(sessionStorage.getItem(ADMIN_SHIP_STAGE_KEY));
      previewStage = stage === 2 || stage === 3 ? stage : 1;
    }
    if (status !== 'ready' && previewStage === undefined) throw new Error('Galaxy equipment is unavailable');
    let equipment: GalaxyEquipment;
    if (snapshot.owner && previewStage === undefined) {
      // Re-read the Hangar selection at launch, including changes made in another tab.
      ({ equipment } = await loadGalaxyEquipment((path, config) => axiosClient.get(path, { ...config, signal })));
    } else {
      const { skin, color } = selectedShip();
      equipment = { skin: skin.id, color: color.id, upgrades: [] };
    }
    if (signal.aborted) return;
    const flightShip = await prepareArcadeFlightShip(equipment, t, previewStage);
    if (signal.aborted) return;

    const fields: Record<string, string> = { ship: JSON.stringify(flightShip) };
    const fragment = new URLSearchParams({ hand: readControlHand() });
    const path = 'game' in target ? `/galaxy/arcade/${target.game.level}?lang=${encodeURIComponent(locale)}` : target.path;
    if ('ticket' in target) fields.ticket = target.ticket;
    try {
      if (scroll.current) sessionStorage.setItem(arcadePositionKey, String(scroll.current.scrollTop));
      if ('game' in target) {
        const run = crypto.randomUUID();
        markArcadeLaunch(sessionStorage, target.game, snapshot.owner, run);
        fragment.set('arcade-run', run);
      }
    } catch { /* The minigame and its report still work without device storage. */ }
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${path}#${fragment}`;
    form.hidden = true;
    for (const [name, value] of Object.entries(fields)) {
      const field = document.createElement('input');
      field.type = 'hidden';
      field.name = name;
      field.value = value;
      form.append(field);
    }
    document.body.append(form);
    form.submit();
  }, [locale, snapshot.owner, status, t]);
  useEffect(() => {
    if (shipSaveNetwork !== 'testnet' || previewAccess) return;
    const request = new AbortController();
    void axiosClient.get<PublicArcade>('/galaxy-minigames', { baseURL: '/api', params: { lang: locale }, signal: request.signal })
      .then(({ data }) => {
        if (!request.signal.aborted && Array.isArray(data?.levels) && Array.isArray(data?.stations) && data.labels) setOfficialArcade(data);
      })
      .catch(() => undefined);
    return () => request.abort();
  }, [locale, previewAccess]);
  useEffect(() => {
    if (!returningFromArcade || !location.hash || shipSaveNetwork !== 'testnet') return;
    try {
      const level = claimArcadeResult(location.hash, sessionStorage, localStorage);
      if (level) setSelection({ kind: 'mini', level });
    } catch {
      // Browser storage can be disabled by the host WebView.
    } finally {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    }
  }, [location.hash, returningFromArcade]);
  const previewReady = useCallback((games: GalaxyMiniGame[], justUnlocked: boolean) => {
    setPreviewGames(games);
    if (justUnlocked) setArcadeListOpen(true);
  }, []);
  const enterTestCode = () => {
    close();
    requestGameFrame(() => document.getElementById('galaxy-preview-code')?.focus({ preventScroll: true }));
  };
  const progress = status === 'ready' ? snapshot.progress : emptyGalaxyProgress();
  const retroLevels = !previewAccess ? officialArcade?.levels : undefined;
  const unlocked = !previewAccess && status === 'ready' && officialArcade && officialArcade.owner === snapshot.owner ? officialArcade.stations : undefined;
  useEffect(() => {
    if (!returningFromArcade || !unlocked?.length || !snapshot.owner) return;
    const request = new AbortController();
    void syncArcadeStickerAlbum(snapshot.owner, unlocked, request.signal).catch(() => undefined);
    return () => request.abort();
  }, [returningFromArcade, snapshot.owner, unlocked]);
  const miniGames = retroLevels ? unlocked : previewGames ?? (status === 'ready' ? snapshot.miniGames : undefined);
  const picker = retroLevels?.map(level => ({ level, name: unlocked?.find(game => game.level === level)?.name })) ?? miniGames;
  const miniGame = selection?.kind === 'mini' ? miniGames?.find(game => game.level === selection.level) : undefined;
  const officialGame = selection?.kind === 'mini' ? unlocked?.find(game => game.level === selection.level) : undefined;
  const lockedRetro = selection?.kind === 'mini' && retroLevels?.includes(selection.level) && !officialGame
    ? status === 'ready' && !snapshot.owner ? 'sign-in' : 'level' : undefined;
  const lockedPortal = previewAccess && selection?.kind === 'mini' && !miniGame && previewLevels.includes(selection.level);
  const point = galaxyShipPoint(progress.currentLevel);
  const skin = playerSkins.find(entry => entry.id === snapshot.skin) ?? playerSkins[0];
  const color = shipFactoryPaint(skin.id);
  const stage = selectedShipStage(skin.sprite, snapshot.upgrades, snapshot.shipStage);
  const reduced = () => document.documentElement.dataset.motion === 'reduced' || localStorage.getItem(MOTION_STORAGE_KEY) === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const goTo = (level: number, smooth = true) => {
    const element = scroll.current;
    if (!element) return;
    element.scrollTo({ top: galaxyPoint(level).mapY - element.clientHeight * .55, behavior: smooth && !reduced() ? 'smooth' : 'instant' });
  };
  useEffect(() => {
    // Begin at Level 1 unless a game just returned to this map.
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    const element = scroll.current;
    let position: number | undefined;
    if (returningFromArcade) {
      try {
        const saved = sessionStorage.getItem(arcadePositionKey);
        if (saved !== null && Number.isFinite(Number(saved))) position = Number(saved);
      } catch { /* Use the normal initial position. */ }
    }
    if (element) element.scrollTop = position ?? galaxyPoint(1).mapY - element.clientHeight * .55;
    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, [returningFromArcade]);
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
    const animation = paceAnimation(ship.current.animate([{ transform: `translate(calc(-50% + ${(a.x - b.x) / 100 * width + a.dx - b.dx}px), calc(-50% + ${a.mapY + a.dy - b.mapY - b.dy}px))` }, { transform: 'translate(-50%, -50%)' }], { duration: 850, easing: 'ease-in-out' }));
    return () => animation.cancel();
  }, [status, progress.currentLevel]);
  const home = (state: object = {}) => navigate('/', { state });
  return <main className="galaxy-page" data-progress-status={status} data-network={shipSaveNetwork}>
    <header className="galaxy-toolbar">
      <button type="button" className="galaxy-back" onClick={() => home({ openQuickMenu: fromQuick })}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14 6-6 6 6 6M8 12h12"/></svg><span>{t('Back')}</span></button>
      <div><p>CRYPTOID EVOLUTION</p><h1>{t('Galaxy map')}</h1></div>
      <span className="galaxy-preview-badge">{officialArcade && !previewAccess ? officialArcade.labels.playable.replace('{count}', String(unlocked?.length ?? 0)) : miniGames?.length ? t('Admin test · {count} playable', { count: miniGames.length }) : t(previewAccess && previewLevels.length ? 'Private mini-game test' : 'Preview · In development')}</span>
    </header>
    {previewAccess && <GalaxyArcadeAccess onReady={previewReady} onLocked={setPreviewLevels}/>}
    {picker?.length ? <div className="galaxy-arcade-menu">
      <details className="galaxy-arcade-picker" open={arcadeListOpen} onToggle={event => setArcadeListOpen(event.currentTarget.open)}>
        <summary>{retroMiniGamesName} <span>{picker.length}</span></summary>
        <ul>{picker.map(game => <li key={game.level}><button type="button" onClick={() => {
          setArcadeListOpen(false);
          setSelection({ kind: 'mini', level: game.level });
        }}><span>{game.name ?? retroMiniGameName}</span><small>{t('Level')} {game.level}</small></button></li>)}</ul>
      </details>
      {retroLevels && officialArcade && <button type="button" className="galaxy-sticker-entry" aria-haspopup="dialog"
        disabled={!unlocked} onClick={() => openAlbum()}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 4h16v16H4zM9 4v16m4-10 2-2 2 2-2 2z"/></svg>
        <span>{arcadeStickerAlbumName}</span>
      </button>}
    </div> : null}
    {status !== 'ready' && <p className="galaxy-data-status" role="status">{status === 'loading' ? t('Loading saved progress…') : t('Saved progress is unavailable. You can still explore; your data is unchanged.')}</p>}
    <div className="galaxy-scroll" ref={scroll} tabIndex={0} aria-label={t('Galaxy map')}>
      <div className="galaxy-map-world">
        {[...galaxyRegions.keys()].reverse().map(region => <GalaxySector key={region} region={region} progress={progress} retroLevels={retroLevels} unlockedGames={unlocked} onSelect={setSelection}/>)}
        {status === 'ready' && <div ref={ship} className="galaxy-player" data-player-level={progress.currentLevel} data-player-port={point.port} style={{ '--player-x': `calc(${point.x}% + ${point.dx}px)`, '--player-y': `${point.mapY + point.dy}px` } as CSSProperties}>
          <ShipPortrait src={shipEvolutionAsset(skin.sprite, stage, color.id)} name={`${t('Your ship')} · ${skin.name}`}/><span aria-hidden="true" className="galaxy-engine"/><small>{t('Your ship')}</small>
        </div>}
      </div>
      <article className="galaxy-intro">
        <BlockchainIcon kind="galaxy"/>
        {officialArcade && !previewAccess ? <>
          <h2>{retroMiniGamesName}</h2>
          <p>{officialArcade.labels.playable.replace('{count}', (unlocked?.length ?? 0).toLocaleString(locale))}</p>
        </> : <>
          <p className="galaxy-eyebrow">{t('500 levels · 50 bosses · 100 mini-games')}</p>
          <h2>{`${t('Galaxy map')} · ${t('A glimpse of the future')}`}</h2>
          <p>{t('Explore the planned galaxy map of Cryptoid Evolution today. Discover a journey through 500 levels, legendary bosses, mysterious star systems and upcoming mini-games.')}</p>
          <p>{t('This interactive preview shows an expansion currently in development. More features, challenges and rewards will become available in future updates.')}</p>
          <p className="galaxy-note">{t('Exploring the map does not start a mission or change your progress.')}</p>
        </>}
      </article>
    </div>
    <button type="button" className="galaxy-position" disabled={status !== 'ready'} onClick={() => goTo(progress.currentLevel)} title={status === 'ready' ? `${t('Level')} ${progress.currentLevel} · ${skin.name}` : undefined}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.5"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg><span>{t('To my position')}</span></button>
    {selection && <GalaxyInfoDialog key={`${selection.kind}:${selection.level}`} selection={selection} progress={progress} miniGameName={miniGame?.name} lockedRetro={lockedRetro}
      arcade={officialGame && officialArcade ? { game: officialGame, labels: officialArcade.labels,
        record: readArcadeRecord(officialGame, snapshot.owner), owner: snapshot.owner,
        openAlbum: () => openAlbum(officialGame.level) } : undefined}
      onEnterTestCode={lockedPortal ? enterTestCode : undefined} onLaunch={launchArcade} onClose={close} onShop={view => home({ openShopView: view })} onCards={() => home({ openCollection: true })}/>}
    {album && officialArcade && unlocked && <GalaxyStickerAlbum key={snapshot.owner ?? 'guest'} owner={snapshot.owner}
      stations={unlocked} stationCount={officialArcade.levels.length} initialLevel={album.level}
      labels={officialArcade.labels.stickers} onClose={() => setAlbum(null)}/>}
  </main>;
}
