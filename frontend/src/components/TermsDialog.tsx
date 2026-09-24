import termsText from "../../../TERMS_OF_SERVICE.md?raw";

const TermsDialog = ({ onClose }: { onClose: () => void }) => <div className="terms-overlay" role="dialog" aria-modal="true" aria-label="Nutzungsbedingungen / Terms of Service" data-terms-version="0.9">
  <section className="terms-dialog">
    <header><strong>Nutzungsbedingungen / Terms of Service · Entwurf 0.9</strong><button type="button" className="close-button" aria-label="Schließen" onClick={onClose}>×</button></header>
    <pre>{termsText}</pre>
  </section>
</div>;

export default TermsDialog;
