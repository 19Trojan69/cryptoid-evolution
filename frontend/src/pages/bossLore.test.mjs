import test from 'node:test';
import assert from 'node:assert/strict';
import { bossLore, bossLoreDe, bossLoreEn } from './bossLore.ts';
import { BOSS_NAMES } from './bossNames.ts';
import { bossManifest } from './bossManifest.ts';
import { bossWeapons } from './bossWeapons.ts';

for (const [locale, records] of Object.entries({ de: bossLoreDe, en: bossLoreEn })) {
  test(`${locale}: all 50 bosses have distinct, correctly mapped, substantial stories`, () => {
    assert.equal(records.length, 50);
    assert.equal(new Set(records.map(record => record.title)).size, 50);
    assert.equal(new Set(records.map(record => record.story.join(' '))).size, 50);
    assert.equal(new Set(records.flatMap(record => record.story)).size, 100);
    records.forEach((record, index) => {
      assert.equal(record.story.length, 2);
      assert.ok(record.story.join(' ').length >= 330);
      assert.ok(record.story.join(' ').includes(BOSS_NAMES[index]));
      assert.equal(bossLore(index + 1, locale), record);
      assert.equal(bossManifest[index].id, index + 1);
      assert.ok(bossWeapons[index].length > 0);
      for (const gun of bossWeapons[index]) {
        assert.ok(gun.caliber > 0 && gun.interval > 0 && gun.barrels.length > 0 && gun.rows > 0);
      }
    });
  });
}
test('locale fallback and invalid ids', () => {
  assert.equal(bossLore(1, 'de-AT'), bossLoreDe[0]);
  assert.equal(bossLore(50, 'fr'), bossLoreEn[49]);
  assert.equal(bossLore(0, 'de'), undefined);
  assert.equal(bossLore(51, 'en'), undefined);
});
