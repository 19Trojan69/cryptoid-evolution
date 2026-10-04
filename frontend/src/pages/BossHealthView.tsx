import { useLocale } from '../i18n';
import { bossHullExposed, type SectorBoss } from './sectorBoss';

export default function BossHealthView({ boss }: { boss: SectorBoss }) {
  const { t } = useLocale();
  if (!bossHullExposed(boss)) return null;
  const hullPercent = Math.ceil(boss.health / boss.maxHealth * 100);
  return <span className="health-bar" data-critical={boss.health / boss.maxHealth <= .3} role="progressbar" aria-label={t('Boss hull')} aria-valuenow={hullPercent} aria-valuemin={0} aria-valuemax={100}><b style={{ width: `${boss.health / boss.maxHealth * 100}%` }} /><small className="boss-health-readout">{hullPercent}%</small></span>;
}
