import { memo, type CSSProperties } from 'react';
import ShipPreview from './ShipPreview';
import { fireInterval, volleyOffsets } from './playerCombat';
import type { PlayerColorId } from './shipFleet';
import type { ShipStage } from './shipEvolution';
import { useLocale } from '../i18n';
import './weaponPreview.css';

const WeaponPreview = memo(function WeaponPreview({ offerId, sprite, color, stage = 1 }: { offerId: string; sprite: number; color: PlayerColorId; stage?: ShipStage }) {
  const { t } = useLocale();
  const level = offerId.includes('plasma') ? 5 : offerId.includes('triple') ? 4 : offerId.includes('rapid') ? 3 : offerId === 'standard' ? 1 : 2;
  const interval = fireInterval(level, 0);
  return <div className={`weapon-fire-preview weapon-fire-preview-level-${level}`} role="img" aria-label={t('Live fire test')} style={{ '--burst-cycle': `${interval * 4}ms` } as CSSProperties}>
    <span className="weapon-fire-preview-ship"><ShipPreview sprite={sprite} color={color} stage={stage} /></span>
    {[0, 1, 2, 3].map(burst => <span className="weapon-fire-preview-volley" key={burst} aria-hidden="true">
      {volleyOffsets(level).map((offset, index) => <i key={index} style={{ '--shot-x': `${offset}px`, '--shot-spread': `${level >= 4 ? (index - 1) * 14 : 0}px`, animationDelay: `${-burst * interval}ms` } as CSSProperties} />)}
    </span>)}
    <small>{t('Live fire test')}</small>
  </div>;
});
export default WeaponPreview;
