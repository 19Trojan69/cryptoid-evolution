import { normalizeLocale, type Locale } from './config.ts';
export const LANGUAGE_STORAGE_KEY = 'cryptoid_language';
type LanguageStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

// Keep the choice in this tab when browser storage is denied or full.
export const createLanguagePreferences = (getStorage: () => LanguageStorage | undefined) => {
  let memory: Locale | null = null;
  let memoryOnly = false;
  return {
    read(): Locale | null {
      if (memoryOnly) return memory;
      try {
        const storage = getStorage();
        if (storage) memory = normalizeLocale(storage.getItem(LANGUAGE_STORAGE_KEY));
      } catch { /* Private/embedded browsers may deny storage access. */ }
      return memory;
    },
    write(next: Locale | null) {
      memory = normalizeLocale(next);
      memoryOnly = true;
      try {
        const storage = getStorage();
        if (!storage) return;
        if (memory) storage.setItem(LANGUAGE_STORAGE_KEY, memory);
        else storage.removeItem(LANGUAGE_STORAGE_KEY);
        memoryOnly = false;
      } catch { /* The current tab still uses the selected language. */ }
    },
    refresh() { memoryOnly = false; },
  };
};
export const languagePreferences = createLanguagePreferences(() => typeof window === 'undefined' ? undefined : window.localStorage);
export const deviceLanguages = (): readonly string[] => {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages?.length ? navigator.languages : navigator.language ? [navigator.language] : [];
};
