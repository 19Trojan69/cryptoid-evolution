import type { Locale } from '../i18n.ts';

const lifeLabels: Record<Locale, Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }> = {
  en: { one: 'life', other: 'lives' }, de: { other: 'Leben' },
  es: { one: 'vida', other: 'vidas' }, fr: { one: 'vie', other: 'vies' },
  pt: { one: 'vida', other: 'vidas' }, it: { one: 'vita', other: 'vite' },
  pl: { one: 'życie', few: 'życia', other: 'żyć' }, tr: { other: 'can' },
  ru: { one: 'жизнь', few: 'жизни', other: 'жизней' },
  hr: { one: 'život', few: 'života', other: 'života' },
  cs: { one: 'život', few: 'životy', other: 'životů' },
  sk: { one: 'život', few: 'životy', other: 'životov' },
  hu: { other: 'élet' }, ro: { one: 'viață', other: 'vieți' },
  sr: { one: 'живот', few: 'живота', other: 'живота' },
  uk: { one: 'життя', few: 'життя', other: 'життів' }, th: { other: 'ชีวิต' },
};
const rules = new Map<Locale, Intl.PluralRules>();
export const formatLives = (locale: Locale, count: number) => {
  if (!rules.has(locale)) rules.set(locale, new Intl.PluralRules(locale));
  const category = count === 0 ? 'other' : rules.get(locale)!.select(count);
  const labels = lifeLabels[locale];
  return `${count} ${labels[category] ?? labels.other}`;
};
