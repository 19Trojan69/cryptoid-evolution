import { useMemo, useState } from 'react';
import { useLocale } from '../i18n';
import { createSectorBoss } from './sectorBoss';
import BossHealthView from './BossHealthView';
import BossReactorView from './BossReactorView';
import BossWeaponsView from './BossWeaponsView';

export default function BossPhaseGuide() {
  const { t } = useLocale();
  const [exposed, setExposed] = useState(false);
  const boss = useMemo(() => {
    const model = createSectorBoss(10, 300, 0, 760);
    model.elapsed = 3000;
    if (exposed) {
      model.turrets.forEach(gun => gun.health = 0);
      model.core = { elapsed: 1500, volley: 0 };
    }
    return model;
  }, [exposed]);
  return <div className="boss-phase-guide">
    <div className="boss-phase-guide-tabs" role="group" aria-label={t('Boss')}>
      <button type="button" aria-pressed={!exposed} onClick={() => setExposed(false)}>{t('Boss turrets')}</button>
      <button type="button" aria-pressed={exposed} onClick={() => setExposed(true)}>{t('Reactor exposed')}</button>
    </div>
    <div className="boss-phase-guide-stage">
      <div className="asteroid sector-boss" style={{ left: '50%', top: 125, width: boss.width, height: boss.height, transform: 'translate(-50%,-50%)' }}>
        <img className="boss-hull" src={boss.config.image} alt="" draggable={false}/>
        <BossWeaponsView boss={boss}/>
        <BossReactorView boss={boss}/>
        <BossHealthView boss={boss}/>
      </div>
    </div>
  </div>;
}
