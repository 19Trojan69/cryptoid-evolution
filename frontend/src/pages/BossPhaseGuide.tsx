import { useMemo, useState } from 'react';
import { useLocale } from '../i18n';
import { createSectorBoss } from './sectorBoss';
import BossHealthView from './BossHealthView';
import BossPortrait from './BossPortrait';
import BossReactorView from './BossReactorView';
import BossWeaponsView from './BossWeaponsView';
import { bossName } from './bossNames';
import { BOSS_STICKER_COUNT, type RewardProgress } from './rewardProgress';

export default function BossPhaseGuide({ bossWins }: { bossWins: RewardProgress['bossWins'] }) {
  const { t } = useLocale();
  const [exposed, setExposed] = useState(false);
  const [bossId, setBossId] = useState(1);
  const defeated = (bossWins[bossId] ?? 0) > 0;
  const boss = useMemo(() => {
    if (!defeated) return null;
    const model = createSectorBoss(bossId * 10, 300, 0, 760);
    model.elapsed = 3000;
    model.turrets.forEach(gun => gun.health = gun.maxHealth);
    if (exposed) {
      model.turrets.forEach(gun => gun.health = 0);
      model.core = { elapsed: 1500, volley: 0 };
    }
    return model;
  }, [exposed, bossId, defeated]);
  return <div className="boss-phase-guide">
    <label className="boss-phase-guide-picker">{t('Boss')}
      <select value={bossId} onChange={event => setBossId(Number(event.target.value))}>
        {Array.from({length:BOSS_STICKER_COUNT},(_,i)=><option key={i+1} value={i+1}>{String(i+1).padStart(2,'0')} · {bossName(i+1)}</option>)}
      </select>
    </label>
    <div className="boss-phase-guide-tabs" role="group" aria-label={t('Boss')}>
      <button type="button" disabled={!defeated} aria-pressed={!exposed} onClick={() => setExposed(false)}>{t('Boss turrets')}</button>
      <button type="button" disabled={!defeated} aria-pressed={exposed} onClick={() => setExposed(true)}>{t('Reactor weapon')}</button>
    </div>
    <div className="boss-phase-guide-stage">
      {boss ? <div className="asteroid sector-boss" style={{ left: '50%', top: 125, width: boss.width, height: boss.height, transform: 'translate(-50%,-50%)' }}>
        <img className="boss-hull" src={boss.config.image} alt="" draggable={false}/>
        <BossWeaponsView boss={boss} frozen/>
        <BossReactorView boss={boss}/>
        <BossHealthView boss={boss}/>
      </div> : <BossPortrait id={bossId} silhouette />}
    </div>
  </div>;
}
