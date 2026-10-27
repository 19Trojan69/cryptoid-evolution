import { useLocale } from '../i18n';
import WeaponReloadNotice from './WeaponReloadNotice';
import type { SpentWeaponNotice } from './weaponSpentNotice';

export default function WeaponSpentNotice({ notice, weaponName, layoutKey, onOpen, onVisibleChange }: {
  notice: Pick<SpentWeaponNotice, 'level' | 'source'>; weaponName: string; layoutKey: string; onOpen: () => void; onVisibleChange: (visible: boolean) => void;
}) {
  const { t } = useLocale();
  return <WeaponReloadNotice layoutKey={layoutKey} onVisibleChange={onVisibleChange}>
    <strong className="weapon-spent-heading">{weaponName} · {t(notice.source === 'paid' ? 'Charge depleted' : 'Weapon pickup expired')}</strong>
    <button type="button" className="weapon-spent-action" onClick={onOpen}>{t('Switch weapon / buy charges')}</button>
  </WeaponReloadNotice>;
}
