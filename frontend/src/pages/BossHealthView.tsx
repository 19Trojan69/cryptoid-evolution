import { useMemo } from 'react';
import { turretBarPositionsForLayout } from './bossHealthLayout';
import { useLocale } from '../i18n';
import { bossHullExposed, type SectorBoss } from './sectorBoss';

export default function BossHealthView({ boss }: { boss: SectorBoss }) {
  const { t } = useLocale();
  const { id, sourceWidth, sourceHeight } = boss.config;
  const { width, height } = boss;
  const positions = useMemo(() => turretBarPositionsForLayout(id, sourceWidth, sourceHeight, width, height), [id, sourceWidth, sourceHeight, width, height]);
  if (boss.health <= 0) return null;
  if (!bossHullExposed(boss)) return <>{positions.map(bar => {
    const gun = boss.turrets[bar.index];
    if (!gun || gun.health <= 0) return null;
    const ratio = Math.max(0, Math.min(1, gun.health / gun.maxHealth));
    return <span key={bar.index} className="boss-turret-health" style={{ left: bar.x, top: bar.y, width: bar.width, height: bar.height }} role="progressbar" aria-label={t('Turret {number}', { number: bar.index + 1 })} aria-valuenow={Math.ceil(ratio * 100)} aria-valuemin={0} aria-valuemax={100}>
      <b style={{ width: `${ratio * 100}%`, backgroundColor: `hsl(${ratio * 120} 85% 58%)` }} />
    </span>;
  })}</>;
  const hullPercent = Math.ceil(boss.health / boss.maxHealth * 100);
  return <span className="health-bar" data-critical={boss.health / boss.maxHealth <= .3} role="progressbar" aria-label={t('Boss hull')} aria-valuenow={hullPercent} aria-valuemin={0} aria-valuemax={100}><b style={{ width: `${boss.health / boss.maxHealth * 100}%` }} /><small className="boss-health-readout">{hullPercent}%</small></span>;
}
