import { useLocale } from "../i18n";
import type { User } from "../types/pi.ts";
import { Link } from "react-router-dom";
import BlockchainIcon from "./BlockchainIcon";

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
  authPending?: boolean;
  onOpenQuickAccess?: () => void;
  quickAccessOpen?: boolean;
}

const Header = ({ user, serviceRank, onSignIn, onSignOut, onSendTestNotification, canAdmin, adminMode, onToggleAdmin, isLoading, authPending, onOpenQuickAccess, quickAccessOpen }: HeaderProps) => {
  const { t } = useLocale();
  return (
    <header className={`site-header${onOpenQuickAccess ? " header-with-quick-access" : ""}`}>
      {onOpenQuickAccess && <button className="button button-secondary quick-access-trigger" type="button" onClick={onOpenQuickAccess} aria-expanded={quickAccessOpen} aria-controls="quick-access-menu" aria-haspopup="dialog"><span aria-hidden="true"><BlockchainIcon kind="network" /></span><b>{t("Quick access")}</b></button>}
      <a className="brand-mark" href="/" aria-label="Cryptoid Evolution – Trojan Wolf Games"><img className="brand-wolf-logo" src="/trojan-wolf-games.webp" alt="Trojan Wolf Games" width="148" height="74" /><span className="brand-copyright" aria-hidden="true">©</span></a>
      <div className="user-section">
        {user && onOpenQuickAccess ? (
          <div className="header-account" role="status" title={`${t("Signed in as")} @${user.username}`}>
            <span className="header-account-copy">
              <small>{t("Signed in as")}</small>
              <b>@{user.username}</b>
            </span>
          </div>
        ) : user ? (
          <>
            <span className="user-name">@{user.username}{serviceRank && <span className="header-service-rank" title={t(serviceRank.name)}><b aria-hidden="true">{serviceRank.symbol}</b> {t(serviceRank.name)}</span>}</span>
            {canAdmin && <Link className="header-action" to="/admin">{t("Admin center")}</Link>}
            {canAdmin && adminMode && <button className="header-action" type="button" onClick={onToggleAdmin} disabled={isLoading}>{t("End test mode")}</button>}
            <button className="header-action" type="button" onClick={onSignOut} disabled={isLoading}>{t('Sign out')}</button>
            {user.roles.includes("core_team") && (
              <button className="header-action" onClick={onSendTestNotification}>{t('Notify')}</button>
            )}
          </>
        ) : authPending || isLoading ? (
          <span className="header-auth-status" role="status">{t("Signing in…")}</span>
        ) : (
          <button className="header-action header-signin" onClick={onSignIn}>{t('Sign in with Pi')}</button>
        )}
      </div>
    </header>
  );
};

export default Header;
