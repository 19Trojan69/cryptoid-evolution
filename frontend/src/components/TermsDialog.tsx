import termsText from "../../../TERMS_OF_SERVICE.md?raw";
import { useLocale } from "../i18n";

const TermsDialog = ({ onClose, onBack }: { onClose: () => void; onBack?: () => void }) => { const { t } = useLocale(); return <div className="terms-overlay" role="dialog" aria-modal="true" aria-label="Nutzungsbedingungen / Terms of Service" data-terms-version="0.11">
  <section className="terms-dialog">
    {onBack && <button className="text-button menu-return" type="button" onClick={onBack}>← {t("Back to quick access")}</button>}
    <header><strong>Nutzungsbedingungen / Terms of Service · Testnet-Beta 0.11</strong><button type="button" className="close-button" aria-label="Schließen" onClick={onClose}>×</button></header>
    <pre>{termsText}</pre>
  </section>
</div>; };

export default TermsDialog;
