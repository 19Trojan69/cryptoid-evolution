import { useLocale } from '../i18n';
import { weaponSymbols } from './weaponSymbols';
import './weaponNotices.css';

// Only a confirmed positive charge creates this status. It never waits for a
// binary window or starts an animation, timer, purchase or combat resume.
export default function ReloadConfirmation({ level }: { level: number }) {
  const { t } = useLocale();
  const names = ['', 'Standard', 'Twin', 'Rapid', 'Triple', 'Plasma'];
  return <div className="weapon-reload-confirmation" role="status" aria-live="polite">
    <b><i aria-hidden="true">{weaponSymbols[level]} </i>{t(names[level])}</b>
    <span>{t('Weapon reloaded')}</span>
  </div>;
}
