import { useMemo } from 'react';
import { useLocale } from '../i18n';
import { bossHullExposed, type SectorBoss } from './sectorBoss';
import { turretBarPositions } from './bossHealthLayout';

export default function BossHealthView({ boss }: { boss: SectorBoss }) {
  const { t } = useLocale();
  const exposed = bossHullExposed(boss);
  const positions = useMemo(() => turretBarPositions(boss), [boss.config.id, boss.width, boss.height]);
  const remaining = boss.turrets.filter(gun => gun.health > 0).length;
  const hullPercent = Math.ceil(boss.health / boss.maxHealth * 100);
  return <>
    {!exposed && <div className="boss-turret-bars">
      <svg className="boss-turret-bar-leaders" width={boss.width} height={boss.height} aria-hidden="true">
        {positions.map(bar => boss.turrets[bar.index].health > 0 && <line key={bar.index} x1={bar.x} y1={bar.y} x2={bar.gunX} y2={bar.gunY} />)}
      </svg>
      {positions.map(bar => {
        const gun = boss.turrets[bar.index];
        if (gun.health <= 0) return null;
        const percent = Math.max(0, Math.min(100, gun.health / gun.maxHealth * 100));
        return <span key={bar.index} className="boss-turret-health" style={{ left: bar.x, top: bar.y, width: bar.width }} role="progressbar" aria-label={t('Turret {number}', { number: bar.index + 1 })} aria-valuenow={Math.ceil(percent)} aria-valuemin={0} aria-valuemax={100}>
          <b style={{ width: `${percent}%` }} />
        </span>;
      })}
    </div>}
    {exposed && <span className="health-bar" data-critical={boss.health / boss.maxHealth <= .3} role="progressbar" aria-label={t('Boss hull')} aria-valuenow={hullPercent} aria-valuemin={0} aria-valuemax={100}><b style={{ width: `${boss.health / boss.maxHealth * 100}%` }} /><small className="boss-health-readout">{hullPercent}%</small></span>}
    {!exposed && <small className="boss-turret-count">{t('Boss turrets')}: {remaining}/{boss.turrets.length}</small>}
    <small className={`boss-phase-hint${exposed ? ' boss-phase-reactor' : ''}`} role="status">
      {exposed
        ? t(boss.config.id === 1 ? 'Reactor exposed — attack the hull and dodge pulses!' : 'Reactor exposed')
        : t(boss.config.id === 1 ? 'Destroy every turret first — hull protected.' : 'Hull protected')}
    </small>
  </>;
}
