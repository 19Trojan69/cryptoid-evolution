import { useLocale } from "../i18n";
import type { User } from "../types/pi.ts";
import { Link } from "react-router-dom";

interface HeaderProps {
  onSignIn: () => void;
  onSignOut: () => void;
  onSendTestNotification: () => void;
  canAdmin?: boolean;
  adminMode?: boolean;
  onToggleAdmin?: () => void;
  user: User | null;
  serviceRank?: { name: string; symbol: string };
  isLoading?: boolean;
}

const Header = ({ user, serviceRank, onSignIn, onSignOut, onSendTestNotification, canAdmin, adminMode, onToggleAdmin, isLoading }: HeaderProps) => {
  const { t } = useLocale();
  return (
    <header className="site-header">
      <a className="brand-mark" href="/" aria-label="Cryptoid Evolution – Trojan Wolf Games"><img className="brand-wolf-logo" src="/trojan-wolf-games.webp" alt="Trojan Wolf Games" width="148" height="74" /><span className="brand-copyright" aria-label="Copyright">©</span></a>
      <div className="user-section">
        {user ? (
          <>
            <span className="user-name">@{user.username}{serviceRank && <span className="header-service-rank" title={t(serviceRank.name)}><b aria-hidden="true">{serviceRank.symbol}</b> {t(serviceRank.name)}</span>}</span>
            {canAdmin && <Link className="header-action" to="/admin">Admin-Zentrale</Link>}
            {canAdmin && adminMode && <button className="header-action" type="button" onClick={onToggleAdmin} disabled={isLoading}>Testmodus beenden</button>}
            <button className="header-action" type="button" onClick={onSignOut} disabled={isLoading}>{t('Sign out')}</button>
            {user.roles.includes("core_team") && (
              <button className="header-action" onClick={onSendTestNotification}>{t('Notify')}</button>
            )}
          </>
        ) : (
          <button className="header-action header-signin" onClick={onSignIn} disabled={isLoading}>{t('Connect Pi')}</button>
        )}
      </div>
    </header>
  );
};

export default Header;
