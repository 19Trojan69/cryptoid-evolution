import test from 'node:test';
import assert from 'node:assert/strict';
import { languages, translate, hasExplicitTranslation } from '../i18n.ts';
import { collectionEquipmentKeys } from './collectionEquipment.ts';
import { wrapCardText } from '../pages/cardTextLayout.ts';

test('every language preserves card equipment values and placeholders', () => {
  for (const locale of Object.keys(languages)) {
    for (const key of collectionEquipmentKeys) {
      if (locale !== 'en') assert.equal(hasExplicitTranslation(locale, key), true, `${locale}: ${key}`);
      const text = translate(locale, key, { value0: 7.5 });
      assert.doesNotMatch(text, /\{value0\}/);
      if (key.includes('{value0}')) assert.ok(text.includes('7.5'), `${locale}: numeric value changed`);
    }
  }
  const chinese = translate('zh', collectionEquipmentKeys[2], { value0: 2 });
  assert.match(chinese, /2/);
  assert.match(chinese, /不能.*碰撞/);
});

test('English fallback does not count untranslated German admin copy as explicit translation', () => {
  assert.equal(hasExplicitTranslation('en', 'Diese deutsche Prüfmeldung ist noch nicht übersetzt.'), false);
  assert.equal(translate('en', 'Play'), 'Play');
});

test('card wrapping keeps combining characters and joined symbols together', () => {
  const cluster = 'e\u0301';
  assert.deepEqual(wrapCardText(cluster.repeat(3), 2, text => [...text].length), [cluster, cluster, cluster]);
  const family = '👩‍👩‍👧‍👦';
  assert.deepEqual(wrapCardText(family.repeat(2), 1, text => [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].length), [family, family]);
  const lines = wrapCardText('飞船故事和当前装备', 3, text => [...text].length);
  assert.equal(lines.join(''), '飞船故事和当前装备');
  assert.ok(lines.every(line => [...line].length <= 3));
});
