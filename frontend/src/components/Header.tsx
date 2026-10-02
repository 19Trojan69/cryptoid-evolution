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
  onOpenQuickAccess?: () => void;
  onOpenAccount?: () => void;
  quickAccessOpen?: boolean;
}

const Header = ({ user, serviceRank, onSignIn, onSignOut, onSendTestNotification, canAdmin, adminMode, onToggleAdmin, isLoading, onOpenQuickAccess, onOpenAccount, quickAccessOpen }: HeaderProps) => {
  const { t } = useLocale();
  return (
    <header className={`site-header${onOpenQuickAccess ? " header-with-quick-access" : ""}`}>
      {onOpenQuickAccess && <button className="button button-secondary quick-access-trigger" type="button" onClick={onOpenQuickAccess} aria-expanded={quickAccessOpen} aria-controls="quick-access-menu" aria-haspopup="dialog"><span aria-hidden="true">☰</span><b>{t("Quick access")}</b></button>}
      <a className="brand-mark" href="/" aria-label="Cryptoid Evolution – Trojan Wolf Games"><img className="brand-wolf-logo" src="/trojan-wolf-games.webp" alt="Trojan Wolf Games" width="148" height="74" /><span className="brand-copyright" aria-label="Copyright">©</span></a>
      <div className="user-section">
        {user && onOpenAccount ? <button className="header-action header-account" type="button" onClick={onOpenAccount} aria-label={t("Account & legal")} title={`@${user.username}`}><span aria-hidden="true">◎</span><b>@{user.username}</b></button> : user ? (
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
