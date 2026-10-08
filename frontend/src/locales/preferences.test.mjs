import test from 'node:test';
import assert from 'node:assert/strict';
import { languageLabels, normalizeLocale, resolveLocale, localeDirection, documentLanguage } from './config.ts';
import { createLanguagePreferences, LANGUAGE_STORAGE_KEY } from './preferences.ts';

test('29 language profiles resolve device/region tags in order and honor valid manual choices', () => {
  assert.equal(Object.keys(languageLabels).length, 29);
  for (const locale of Object.keys(languageLabels)) {
    assert.equal(resolveLocale([`${locale}-XX`]), locale);
    assert.equal(resolveLocale(['en-US'], `${locale}-XX`), locale);
  }
  assert.equal(resolveLocale(['xx', 'vi-VN', 'en-US']), 'vi');
  assert.equal(resolveLocale(['de-AT'], 'id-ID'), 'id');
  assert.equal(resolveLocale(['zh-Hans-CN']), 'zh');
  assert.equal(resolveLocale(['zh-Hant-TW']), 'zh'); // Supported simplified equivalent, clearly labelled.
  assert.equal(resolveLocale(['tl-PH']), 'fil');
  assert.equal(resolveLocale(['FIL_ph']), 'fil');
  assert.equal(resolveLocale(['pt-BR']), 'pt');
  assert.equal(resolveLocale(['es-MX']), 'es');
  assert.equal(resolveLocale(['constructor', '__proto__', 'toString']), 'en');
  assert.equal(resolveLocale(['ar-EG'], 'not-a-locale'), 'ar');
  assert.equal(resolveLocale([], null), 'en');
  assert.equal(normalizeLocale({}), null);
  assert.equal(normalizeLocale(''), null);
});

test('saved manual choice survives a new preference instance, automatic removes only the language key', () => {
  const data = new Map([['cryptoid_save', 'keep'], ['cryptoid_language', 'ja-JP']]);
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  const first = createLanguagePreferences(() => storage);
  assert.equal(first.read(), 'ja');
  first.write('zh');
  assert.equal(createLanguagePreferences(() => storage).read(), 'zh');
  first.write(null);
  assert.equal(first.read(), null);
  assert.equal(data.has(LANGUAGE_STORAGE_KEY), false);
  assert.equal(data.get('cryptoid_save'), 'keep');
  data.set(LANGUAGE_STORAGE_KEY, 'constructor');
  first.refresh();
  assert.equal(first.read(), null);
});

test('denied storage and failed writes retain the choice in the current tab without throwing', () => {
  const preferences = createLanguagePreferences(() => { throw new Error('Storage denied'); });
  assert.equal(preferences.read(), null);
  preferences.write('ur');
  assert.equal(preferences.read(), 'ur');
  preferences.write(null);
  assert.equal(preferences.read(), null);
  const quota = createLanguagePreferences(() => ({ getItem: () => 'de', setItem() { throw new Error('Quota'); }, removeItem() { throw new Error('Denied'); } }));
  assert.equal(quota.read(), 'de');
  quota.write('ar');
  assert.equal(quota.read(), 'ar');
  quota.write(null);
  assert.equal(quota.read(), null);
});

test('only Arabic, Urdu and Persian use RTL; Chinese declares the simplified script', () => {
  for (const locale of Object.keys(languageLabels)) {
    assert.equal(localeDirection(locale), ['ar', 'ur', 'fa'].includes(locale) ? 'rtl' : 'ltr');
  }
  assert.equal(documentLanguage('zh'), 'zh-Hans');
  assert.equal(documentLanguage('vi'), 'vi');
});
