import { useLayoutEffect } from 'react';
import { useLocale } from '../i18n';
import './weaponNotices.css';

// Mounted only alongside the existing formation binary stream. Pausing hides
// both, while keeping the pending name for the rest of that same window.
export default function WeaponSpentNotice({ expiredWeaponName, weaponName, onShown }: {
  expiredWeaponName: string; weaponName: string; onShown: () => void;
}) {
  const { t } = useLocale();
  useLayoutEffect(onShown, [onShown]);
  return <div className="weapon-transition-notice" role="status" aria-live="polite" aria-label={t('Active weapon')}>
    {expiredWeaponName !== weaponName && <span>{expiredWeaponName} · {t('Expired')}</span>}
    <strong>{expiredWeaponName !== weaponName && <i aria-hidden="true">→ </i>}{weaponName}</strong>
  </div>;
}
