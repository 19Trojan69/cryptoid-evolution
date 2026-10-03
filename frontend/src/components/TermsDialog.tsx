import LegalDocument from "./LegalDocument";
import { useLocale } from "../i18n";

const TermsDialog = ({ onClose, onBack }: { onClose: () => void; onBack?: () => void }) => { const { t } = useLocale(); return <div className="terms-overlay" role="dialog" aria-modal="true" aria-label={t("Terms of service")} data-terms-version="0.11">
  <section className="terms-dialog">
    {onBack && <button className="text-button menu-return" type="button" onClick={onBack}>← {t("Back to quick access")}</button>}
    <header><strong>{t("Terms of service")} · Testnet-Beta 0.11</strong><button type="button" className="close-button" aria-label={t("Close")} onClick={onClose}>×</button></header>
    <LegalDocument kind="terms" />
  </section>
</div>; };

export default TermsDialog;
