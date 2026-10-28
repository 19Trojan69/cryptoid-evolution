import { useLayoutEffect } from 'react';
import { useLocale } from '../i18n';
import './weaponNotices.css';

// Only a paid expiry, shown once in an existing safe break between Blocks.
export default function WeaponSpentNotice({ expiredWeaponName, onShown }: {
  expiredWeaponName: string; onShown: () => void;
}) {
  const { t } = useLocale();
  useLayoutEffect(onShown, [onShown]);
  return <div className="weapon-transition-notice" role="status" aria-live="polite" aria-label={t('Expired')}>
    <strong>{expiredWeaponName} · {t('Expired')}</strong>
  </div>;
}
