import { Link } from "react-router-dom";
import LegalDocument from "../components/LegalDocument";
import { useLocale } from "../i18n";

const LegalPage = ({ kind }: { kind: "privacy" | "terms" }) => {
  const isPrivacy = kind === "privacy";
  const { t } = useLocale();
  return <main className="legal-page">
    <header className="legal-page-header">
      <Link to="/" state={{ openQuickMenu: true }} className="legal-back">← {t("Back to quick access")}</Link>
      <strong>{t(isPrivacy ? "Privacy policy" : "Terms of service")}</strong>
    </header>
    <article className="legal-document"><LegalDocument kind={kind} /></article>
  </main>;
};

export default LegalPage;
