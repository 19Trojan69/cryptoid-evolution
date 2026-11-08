import { useEffect, useState } from 'react';
import { useLocale } from '../i18n';
import type { Locale } from '../locales/config';
import { supplementalCollectionLocales, type CollectionLore } from './collectionLore';

export function useCollectionLore(locale: Locale, enabled = true) {
  const requested = enabled && supplementalCollectionLocales.has(locale);
  const [loaded, setLoaded] = useState<{ locale: Locale; lore: CollectionLore | null }>();
  useEffect(() => {
    if (!requested || loaded?.locale === locale) return;
    const controller = new AbortController();
    const path = `${import.meta.env.BASE_URL}collection-lore/${locale}.json`;
    void fetch(path, { signal: controller.signal, cache: 'no-cache' })
      .then(async response => {
        if (!response.ok) throw new Error('Collection language file unavailable');
        const lore = await response.json() as CollectionLore;
        if (lore?.locale !== locale || !lore.bosses || !lore.ships) throw new Error('Invalid collection language file');
        return lore;
      })
      .then(
        lore => { if (!controller.signal.aborted) setLoaded({ locale, lore }); },
        () => { if (!controller.signal.aborted) setLoaded({ locale, lore: null }); },
      );
    return () => controller.abort();
  }, [requested, locale, loaded]);
  const result = requested && loaded?.locale === locale ? loaded : undefined;
  return {
    lore: result?.lore ?? undefined,
    pending: requested && !result,
    failed: result?.lore === null,
    retry: () => setLoaded(undefined),
  };
}

export function CollectionLoreStatus({ failed, retry }: { failed: boolean; retry: () => void }) {
  const { t } = useLocale();
  if (!failed) return <p role="status">{t('Loading collection …')}</p>;
  return <div role="alert">
    <p>{t('Could not load your collection.')}</p>
    <button type="button" onClick={retry}>{t('Retry')}</button>
  </div>;
}
