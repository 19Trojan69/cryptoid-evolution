import { memo } from 'react';

// Read-only visual replacements. No state writes, effects, animation frames,
// timers, image preparation, input handlers, audio or network operations.
export const Starfield = () => null;
export const SectorBackdrop = () => null;

export const GameShipVisual = memo(function GameShipVisual({ variant }) {
  return <i className={'diagnostic-flat-ship diagnostic-flat-' + variant} aria-hidden="true" />;
});

export function bossLayout(boss, fall) {
  return fall ? { left: fall.x, top: fall.y, width: fall.bossShipWidth, height: fall.bossHeight }
    : { left: boss.x, top: boss.y, width: boss.width, height: boss.height, transform: 'translate(-50%, -50%)' };
}
export const BossHullView = memo(function BossHullView({ boss, fall, ready, title }) {
  const model = fall?.bossModel ?? boss;
  if (!model) return null;
  const percent = model.maxHealth > 0 ? Math.ceil(Math.max(0, Math.min(1, model.health / model.maxHealth)) * 100) : 0;
  return <div className={(fall ? 'boss-falling-hull' : 'asteroid sector-boss') + ' diagnostic-flat-boss'}
    style={bossLayout(model, fall)} data-hull-ready={fall ? undefined : ready} title={fall ? undefined : title}
    aria-hidden={fall ? 'true' : undefined}>
    <b className="diagnostic-flat-boss-label">BOSS {model.config.id}</b>
    {!fall && <span className="health-bar diagnostic-flat-boss-health" role="progressbar" aria-label="Boss-Panzerung"
      aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><b style={{ width: percent + '%' }} /></span>}
  </div>;
});

export const BonusRockLayer = memo(function BonusRockLayer({ rocks, effects }) {
  return <div className="diagnostic-flat-rock-layer" aria-hidden="true">
    {rocks.map(rock => <i key={rock.id} className="diagnostic-flat-rock" style={{ left: rock.x, top: rock.y,
      width: rock.radius * 2, height: rock.radius * 2 }} />)}
    {effects.map(effect => <i key={effect.id} className="diagnostic-flat-rock-hit" style={{ left: effect.x, top: effect.y }} />)}
  </div>;
});
