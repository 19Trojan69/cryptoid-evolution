import type { CSSProperties } from 'react';
import type { SectorBoss } from './sectorBoss';
import { coreActive, coreInterval } from './bossCore';

export default function BossReactorView({ boss }: { boss: SectorBoss }) {
  const exposed = coreActive(boss);
  const charge = exposed ? Math.min(1, (boss.core?.elapsed ?? 0) / coreInterval(boss)) : 0;
  const firing = exposed && (boss.core?.volley ?? 0) > 0 && (boss.core?.elapsed ?? 0) < 180;
  return <div className={`boss-reactor${exposed ? ' boss-reactor-exposed' : ''}${firing ? ' boss-reactor-firing' : ''}`} style={{ '--reactor-charge': charge } as CSSProperties} aria-hidden="true">
    <i className="boss-reactor-energy" />
    <i className="boss-reactor-ring" />
    <i className="boss-reactor-cover boss-reactor-cover-left" />
    <i className="boss-reactor-cover boss-reactor-cover-right" />
  </div>;
}
