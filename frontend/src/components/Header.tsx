import { useLocale } from "../i18n";
import type { User } from "../types/pi.ts";

interface HeaderProps {
  onSignIn: () => void;
  onSignOut: () => void;
  onSendTestNotification: () => void;
  user: User | null;
  isLoading?: boolean;
}

const Header = ({ user, onSignIn, onSignOut, onSendTestNotification, isLoading }: HeaderProps) => {
  const { t } = useLocale();
  return (
    <header className="site-header">
      <a className="brand-mark" href="/" aria-label="Cryptoid Evolution home"><span className="brand-symbol">C</span><span>CRYPTOID <b>EVOLUTION</b></span></a>
      <div className="user-section">
        {user ? (
          <>
            <span className="user-name">@{user.username}</span>
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
