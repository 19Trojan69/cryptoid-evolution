import type { Locale } from '../locales/config.ts';

export type CollectionLore = {
  locale: Locale;
  sourceHash: string;
  bosses: Record<number, [title: string, origin: string, current: string]>;
  ships: Record<string, [origin: string, capture: string, advanced: string, elite: string]>;
};

// The other five languages already have complete card stories in their catalogs.
export const supplementalCollectionLocales = new Set<Locale>([
  'fr', 'pt', 'it', 'pl', 'tr', 'ru', 'hr', 'cs', 'sk', 'hu', 'ro', 'sr', 'uk', 'th',
]);
