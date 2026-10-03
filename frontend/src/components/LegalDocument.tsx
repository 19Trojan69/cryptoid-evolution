import privacyText from '../../../PRIVACY_POLICY.md?raw';
import termsText from '../../../TERMS_OF_SERVICE.md?raw';
import { useLocale } from '../i18n';

// Legal originals have an explicit language, separate from the app's UI language.
export default function LegalDocument({ kind }: { kind: 'privacy' | 'terms' }) {
  const { locale, t } = useLocale();
  const german = kind === 'terms' || locale === 'de';
  const text = kind === 'terms' ? termsText : german
    ? privacyText.split('## Deutsch\n')[1]
    : privacyText.split('## English\n')[1].split('\n---\n')[0];
  const document = kind === 'terms' ? text : privacyText.split('## English\n')[0] + text;
  return <>
    <p className="legal-document-language">{t(german ? 'Original document: German.' : 'Original document: English.')}</p>
    <pre lang={german ? 'de' : 'en'}>{document}</pre>
  </>;
}
