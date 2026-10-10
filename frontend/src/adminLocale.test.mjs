import test from 'node:test';
import assert from 'node:assert/strict';
import { adminText } from './adminLocale.ts';
import { translate } from './i18n.ts';

test('admin keeps German authored labels instead of English catalog fallback', () => {
  for (const text of ['Admin-Zentrale', 'Zahlungseingänge', 'Aktualisieren', 'CSV herunterladen', 'Ungeklärt', 'Alle Vorgänge']) assert.equal(adminText(text), text);
  assert.equal(translate('en', 'Zahlungseingänge'), 'Incoming payments');
});
test('admin translates English payment and recovery keys to German', () => {
  assert.equal(adminText('Save CSV'), 'CSV speichern');
  assert.equal(adminText('Share CSV'), 'CSV teilen');
  assert.equal(adminText('This page could not be loaded.'), 'Diese Seite konnte nicht geladen werden.');
});
test('admin translates stage and dynamic audio names without changing identifiers', () => {
  assert.equal(adminText('Advanced'), 'Fortgeschritten');
  assert.equal(adminText('Overdrive'), 'Leistungsboost');
  assert.equal(adminText('Home-Musik'), 'Startseitenmusik');
  assert.equal(adminText('Wiedergabe: {value0}', {value0: adminText('Twin Laser')}), 'Wiedergabe: Doppellaser');
});
