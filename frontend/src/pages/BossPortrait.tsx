import { memo, useMemo } from 'react';
import { createSectorBoss } from './sectorBoss';
import { bossName } from './bossNames';
import BossWeaponsView from './BossWeaponsView';
import './bossPortrait.css';

/** Shared fleet identity for guide and collection; never remap saved sticker ids. */
export default memo(function BossPortrait({ id }: { id: number }) {
  const boss = useMemo(() => createSectorBoss(id * 10, 768, 0, 1200), [id]);
  return <div className="boss-portrait" role="img" aria-label={bossName(id)}>
    <div className="boss-portrait-model" style={{ aspectRatio: String(boss.width / boss.height) }}>
      <img className="boss-portrait-hull" src={boss.config.image} alt="" loading="lazy" draggable={false} />
      <BossWeaponsView boss={boss} frozen />
    </div>
  </div>;
});
