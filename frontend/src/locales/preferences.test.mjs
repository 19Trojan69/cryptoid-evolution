import test from 'node:test';
import assert from 'node:assert/strict';
import { supportedLanguages, normalizeLocale, resolveLocale, localeDirection, documentLanguage } from './config.ts';
import { createLanguagePreferences, LANGUAGE_STORAGE_KEY } from './preferences.ts';

test('original languages and Chinese/Vietnamese resolve device tags and manual choices', () => {
  assert.equal(Object.keys(supportedLanguages).length, 19);
  for (const locale of Object.keys(supportedLanguages)) {
    assert.equal(resolveLocale([`${locale}-XX`]), locale);
    assert.equal(resolveLocale(['en-US'], `${locale}-XX`), locale);
  }
  assert.equal(resolveLocale(['xx', 'vi-VN', 'en-US']), 'vi');
  assert.equal(resolveLocale(['de-AT'], 'th-TH'), 'th');
  assert.equal(resolveLocale(['zh-Hans-CN']), 'zh');
  assert.equal(resolveLocale(['zh-Hant-TW', 'fr-FR']), 'fr');
  assert.equal(resolveLocale(['zh-TW']), 'en');
  assert.equal(resolveLocale(['pt-BR']), 'pt');
  assert.equal(resolveLocale(['es-MX']), 'es');
  assert.equal(resolveLocale(['constructor', '__proto__', 'toString']), 'en');
  assert.equal(resolveLocale(['ar-EG'], 'not-a-locale'), 'en');
  assert.equal(resolveLocale([], null), 'en');
  assert.equal(normalizeLocale({}), null);
  assert.equal(normalizeLocale(''), null);
});

test('saved manual choice survives a new preference instance, automatic removes only the language key', () => {
  const data = new Map([['cryptoid_save', 'keep'], ['cryptoid_language', 'fr-CA']]);
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  const first = createLanguagePreferences(() => storage);
  assert.equal(first.read(), 'fr');
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
  preferences.write('th');
  assert.equal(preferences.read(), 'th');
  preferences.write(null);
  assert.equal(preferences.read(), null);
  const quota = createLanguagePreferences(() => ({ getItem: () => 'de', setItem() { throw new Error('Quota'); }, removeItem() { throw new Error('Denied'); } }));
  assert.equal(quota.read(), 'de');
  quota.write('fr');
  assert.equal(quota.read(), 'fr');
  quota.write(null);
  assert.equal(quota.read(), null);
});

test('selectable locales are LTR; Chinese declares the simplified script', () => {
  for (const locale of Object.keys(supportedLanguages)) {
    assert.equal(localeDirection(locale), 'ltr');
  }
  assert.equal(documentLanguage('zh'), 'zh-Hans');
  assert.equal(documentLanguage('vi'), 'vi');
});
