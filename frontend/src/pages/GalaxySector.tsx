import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocale } from '../i18n';
import BlockchainIcon from '../components/BlockchainIcon';
import GalaxyBossArt from './GalaxyBossArt';
import { GALAXY_REGION_HEIGHT, galaxyBossState, galaxyRegions, galaxyRoute, galaxyStations, type GalaxyProgress, type GalaxySelection } from './galaxyModel';

type Props = { region: number; progress: GalaxyProgress; onSelect: (selection: GalaxySelection) => void };
export default memo(function GalaxySector({ region, progress, onSelect }: Props) {
  const { t } = useLocale();
  const root = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!root.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)), { rootMargin: '500px' });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  const [name, color] = galaxyRegions[region], stations = galaxyStations[region];
  const route = galaxyRoute(stations);
  return <section ref={root} className="galaxy-sector" data-region={region + 1} data-visible={visible} aria-labelledby={`galaxy-region-${region}`} style={{ '--galaxy-accent': color } as CSSProperties}>
    {visible && <img className="galaxy-background" src={`/galaxy/region-${String(region + 1).padStart(2, '0')}.jpg`} alt="" decoding="async" aria-hidden="true" />}
    <div className="galaxy-scenery" aria-hidden="true">
      <i className="galaxy-nebula"/><i className="galaxy-stars"/>
      <i className="galaxy-planet"/><i className="galaxy-planet galaxy-ring-planet"/>
      <i className="galaxy-rift"/><i className="galaxy-wormhole"/>
      <div className="galaxy-asteroids">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ '--rock': i } as CSSProperties}/>)}</div>
      <div className="galaxy-crystals">{Array.from({ length: 5 }, (_, i) => <i key={i} style={{ '--rock': i } as CSSProperties}/>)}</div>
      <i className="galaxy-wreck"/><i className="galaxy-ruin"/><i className="galaxy-comet"/>
    </div>
    <header className="galaxy-region-heading"><small>{t('Map region')} {String(region + 1).padStart(2, '0')}</small><h2 id={`galaxy-region-${region}`}>{name}</h2><span>{t('Level')} {region * 50 + 1}–{(region + 1) * 50}</span></header>
    <svg className="galaxy-route" viewBox={`0 0 100 ${GALAXY_REGION_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true"><path className="galaxy-route-shadow" d={route}/><path className="galaxy-route-glow" d={route}/><path className="galaxy-route-line" d={route}/><path className="galaxy-route-impulse" d={route} pathLength="1000"/></svg>
    {stations.map(station => {
      const { level, x, y, mini, boss, trade } = station;
      const won = boss ? galaxyBossState(progress, boss.id).defeated : false;
      return <div key={level} className="galaxy-junction" data-level={level} style={{ '--station-x': `${x}%`, '--station-y': `${y}px` } as CSSProperties}>
        <button type="button" className="galaxy-level" data-level={level} data-completed={level <= progress.completedLevel} aria-current={level === progress.currentLevel ? 'step' : undefined} aria-label={`${t('Level')} ${level}`} onClick={() => onSelect({ kind: 'level', level })}>{level}</button>
        {mini && <button type="button" className="galaxy-mini" data-mini-level={level} onClick={() => onSelect({ kind: 'mini', level })} aria-label={`${t('Mini-game')} · ${t('Level')} ${level}`}><span className="galaxy-mini-orbit" aria-hidden="true">✧</span><strong>{t('Mini-game')}</strong><small>{t('Level')} {level}</small></button>}
        {boss && <button type="button" className="galaxy-boss" data-boss-level={level} data-defeated={won} onClick={() => onSelect({ kind: 'boss', level })} aria-label={`${t('Boss station')} · ${station.name} · ${t('Level')} ${level} · ${t(won ? 'Unlocked' : 'Locked')}`}><span className="galaxy-boss-frame">{visible ? <GalaxyBossArt key={boss.id} id={boss.id} defeated={won}/> : <span aria-hidden="true">◇</span>}<i aria-hidden="true">{won ? '✓' : '⌑'}</i></span><strong>{station.name}</strong><small>{t('Boss station')}</small></button>}
        {trade && <button type="button" className="galaxy-trade" data-trade-level={level} onClick={() => onSelect({ kind: 'trade', level })}><BlockchainIcon kind="fleet"/><span><strong>{t('Trading station')}</strong><small>{t('Shop')} · {t('Hangar')}</small></span><i aria-hidden="true">›</i></button>}
      </div>;
    })}
  </section>;
});
