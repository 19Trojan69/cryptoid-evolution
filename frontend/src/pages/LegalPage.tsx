import { Link } from "react-router-dom";
import privacyText from "../../../PRIVACY_POLICY.md?raw";
import termsText from "../../../TERMS_OF_SERVICE.md?raw";

const LegalPage = ({ kind }: { kind: "privacy" | "terms" }) => {
  const isPrivacy = kind === "privacy";
  return <main className="legal-page">
    <header className="legal-page-header">
      <Link to="/" className="legal-back">← Cryptoid Evolution</Link>
      <strong>{isPrivacy ? "Privacy Policy / Datenschutzerklärung" : "Terms of Service / Nutzungsbedingungen"}</strong>
    </header>
    <article className="legal-document"><pre>{isPrivacy ? privacyText : termsText}</pre></article>
  </main>;
};

export default LegalPage;
