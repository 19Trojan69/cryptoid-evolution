import { useLocale } from "../i18n";
import type { User } from "../types/pi.ts";

interface HeaderProps {
  onSignIn: () => void;
  onSignOut: () => void;
  onSendTestNotification: () => void;
  canAdmin?: boolean;
  adminMode?: boolean;
  onToggleAdmin?: () => void;
  user: User | null;
  isLoading?: boolean;
}

const Header = ({ user, onSignIn, onSignOut, onSendTestNotification, canAdmin, adminMode, onToggleAdmin, isLoading }: HeaderProps) => {
  const { t } = useLocale();
  return (
    <header className="site-header">
      <a className="brand-mark" href="/" aria-label="Cryptoid Evolution – Trojan Wolf Games"><img className="brand-wolf-logo" src="/trojan-wolf-games.webp" alt="Trojan Wolf Games" width="148" height="74" /></a>
      <div className="user-section">
        {user ? (
          <>
            <span className="user-name">@{user.username}</span>
            {canAdmin && <button className="header-action" type="button" aria-pressed={adminMode} onClick={onToggleAdmin} disabled={isLoading}>{adminMode ? "Admin: Ein" : "Admin: Aus"}</button>}
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
