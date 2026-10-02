import { Link } from "react-router-dom";
import privacyText from "../../../PRIVACY_POLICY.md?raw";
import termsText from "../../../TERMS_OF_SERVICE.md?raw";
import { useLocale } from "../i18n";

const LegalPage = ({ kind }: { kind: "privacy" | "terms" }) => {
  const isPrivacy = kind === "privacy";
  const { t } = useLocale();
  return <main className="legal-page">
    <header className="legal-page-header">
      <Link to="/" state={{ openQuickMenu: true }} className="legal-back">← {t("Back to quick access")}</Link>
      <strong>{isPrivacy ? "Privacy Policy / Datenschutzerklärung" : "Terms of Service / Nutzungsbedingungen"}</strong>
    </header>
    <article className="legal-document"><pre>{isPrivacy ? privacyText : termsText}</pre></article>
  </main>;
};

export default LegalPage;
