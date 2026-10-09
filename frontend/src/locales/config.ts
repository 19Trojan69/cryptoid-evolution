// Locale codes are the source of truth for the picker, resolution and QA.
export const languageLabels = {
  en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', pt: 'Português',
  it: 'Italiano', pl: 'Polski', tr: 'Türkçe', ru: 'Русский', hr: 'Hrvatski',
  cs: 'Čeština', sk: 'Slovenčina', hu: 'Magyar', ro: 'Română', sr: 'Српски',
  uk: 'Українська', th: 'ไทย', zh: '简体中文', vi: 'Tiếng Việt', id: 'Bahasa Indonesia',
  ko: '한국어', ja: '日本語', hi: 'हिन्दी', bn: 'বাংলা', ar: 'العربية',
  ur: 'اردو', fa: 'فارسی', fil: 'Filipino', sw: 'Kiswahili',
} as const;
export type Locale = keyof typeof languageLabels;
// Only these languages are offered and matched automatically. Other catalog copy stays archived.
export const supportedLanguages: Partial<Record<Locale, string>> = {
  en: languageLabels.en, de: languageLabels.de, es: languageLabels.es,
  zh: languageLabels.zh, vi: languageLabels.vi,
};
export const localeDirection = (locale: Locale): 'ltr' | 'rtl' => ['ar', 'ur', 'fa'].includes(locale) ? 'rtl' : 'ltr';
export const documentLanguage = (locale: Locale) => locale === 'zh' ? 'zh-Hans' : locale;
export const complexScript = (locale: Locale) => ['th', 'zh', 'ko', 'ja', 'hi', 'bn', 'ar', 'ur', 'fa'].includes(locale);

export const normalizeLocale = (tag: unknown): Locale | null => {
  if (typeof tag !== 'string') return null;
  const normalized = tag.trim().toLowerCase().replaceAll('_', '-');
  const [code, ...subtags] = normalized.split('-');
  // The Chinese catalog is Simplified only. Traditional device tags need a fallback.
  if (code === 'zh' && (subtags.includes('hant') || ['tw', 'hk', 'mo'].some(region => subtags.includes(region)))) return null;
  return Object.hasOwn(supportedLanguages, code) ? code as Locale : null;
};
export const resolveLocale = (preferred: readonly string[], override?: string | null): Locale => {
  const selected = normalizeLocale(override);
  if (selected) return selected;
  for (const tag of preferred) {
    const candidate = normalizeLocale(tag);
    if (candidate) return candidate;
  }
  return 'en';
};
