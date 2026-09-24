import { useLocale } from "../i18n";
interface SignInProps {
  onSignIn: () => void;
  onModalClose: () => void;
  disabled?: boolean;
}

const SignIn = ({ onSignIn, onModalClose, disabled }: SignInProps) => {
  const { t } = useLocale();
  return (
    <div className="signin-overlay">
      <div className="signin-modal" role="dialog" aria-modal="true" aria-labelledby="signin-title">
        <button className="close-button" onClick={onModalClose} aria-label={t("Close")}>×</button>
        <p className="eyebrow">{t('SECURE ACCESS')}</p>
        <h2 id="signin-title">{t('Connect your Pi wallet')}</h2>
        <p>{t('Sign in to save your progress and access the power lab.')}</p>
        <div className="modal-actions">
          <button className="button button-primary" onClick={onSignIn} disabled={disabled}>{t('Sign in with Pi')}</button>
          <button className="text-button" onClick={onModalClose}>{t('Maybe later')}</button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
