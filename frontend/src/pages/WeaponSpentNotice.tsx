import { useLayoutEffect } from 'react';
import { useLocale } from '../i18n';
import { weaponSymbols } from './weaponSymbols';
import type { SpentWeaponNotice } from './weaponSpentNotice';
import './weaponNotices.css';

// Mounted only alongside the existing formation binary stream. Pausing hides
// both, while keeping the pending name for the rest of that same window.
export default function WeaponSpentNotice({ expiredLevel, level, expiredWeaponName, weaponName, reload, onShown }: {
  expiredLevel: number; level: number; expiredWeaponName: string; weaponName: string; onShown: () => void;
  reload?: SpentWeaponNotice['reload'];
}) {
  const { t } = useLocale();
  useLayoutEffect(onShown, [onShown]);
  return <div className="weapon-transition-notice" role="status" aria-live="polite" aria-label={t('Active weapon')}>
    {expiredWeaponName !== weaponName && <span><i className="weapon-notice-symbol" data-level={expiredLevel} aria-hidden="true">{weaponSymbols[expiredLevel]}</i>{expiredWeaponName} · {t('Expired')}</span>}
    <strong>{expiredWeaponName !== weaponName && <i aria-hidden="true">→ </i>}<i className="weapon-notice-symbol" data-level={level} aria-hidden="true">{weaponSymbols[level]}</i>{weaponName}</strong>
    {reload && <small className="weapon-reload-status">{t(reload === 'pending' ? 'Reloading weapon…' : reload === 'complete' ? 'Weapon reloaded' : 'Reload not confirmed')}</small>}
  </div>;
}
