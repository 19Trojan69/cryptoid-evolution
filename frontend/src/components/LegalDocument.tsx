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
    <div className="legal-document-content" lang={german ? 'de' : 'en'}>
      {document.trim().split(/\n\s*\n/).map((paragraph, index) => {
        if (paragraph.startsWith('# ')) return <h2 key={index}>{paragraph.slice(2)}</h2>;
        if (/^#{2,3} /.test(paragraph)) return <h3 key={index}>{paragraph.replace(/^#{2,3} /, '')}</h3>;
        return <p key={index}>{paragraph.split(/\*\*([^*]+)\*\*/).map((part, i) => i % 2 ? <strong key={i}>{part}</strong> : part)}</p>;
      })}
    </div>
  </>;
}
