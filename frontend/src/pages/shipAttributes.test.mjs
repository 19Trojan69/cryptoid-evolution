import assert from 'node:assert/strict';
import test from 'node:test';
import { playerSkins } from './shipFleet.ts';
import { attributesForHull, hullAttributes, makeShipVolley, shipBaseFirepower, shipFireInterval } from './shipAttributes.ts';
import { fireInterval, makeVolley } from './playerCombat.ts';
import { stageDamageMultiplier, stageWeaponLevel } from './shipEvolution.ts';
import { createSectorBoss, damageSectorBoss, BOSS_ENTRY_MS } from './sectorBoss.ts';
import { damageBossTurret } from './bossTurrets.ts';
import { languages, hasExplicitTranslation, translate } from '../i18n.ts';
import { shipAttributeKeys } from '../locales/shipAttributes.ts';

test('every priced hull has distinct bonuses and increases firepower in price order within a bounded range', () => {
  assert.deepEqual(Object.keys(hullAttributes), playerSkins.map(skin => skin.id));
  const configurations = new Set();
  let previous = 0;
  for (const skin of playerSkins) {
    const stats = attributesForHull(skin.id);
    configurations.add(`${stats.damageBonus}:${stats.fireRateBonus}`);
    const firepower = shipBaseFirepower(skin.id, 1);
    assert.ok(firepower > previous, skin.id);
    assert.ok(firepower / shipBaseFirepower('grey-scout', 1) <= 1.5);
    if (skin.price > 0) { assert.ok(stats.damageBonus > 0); assert.ok(stats.fireRateBonus > 0); }
    previous = firepower;
  }
  assert.equal(configurations.size, 20);
  assert.deepEqual(attributesForHull('unknown-legacy-hull'), attributesForHull('grey-scout'));
  assert.deepEqual(attributesForHull('__proto__'), attributesForHull('grey-scout'));
});

test('Standard starter retains its original damage and each upgrade is bounded at every weapon level', () => {
  for (const stage of [1, 2, 3]) for (let level = 1; level <= 5; level++) for (const overdrive of [false, true]) {
    let a = 0, b = 0;
    const effective = stageWeaponLevel(stage, level);
    const shots = makeShipVolley('grey-scout', stage, level, 100, 200, overdrive, () => ++a);
    const original = makeVolley(effective, 100, 200, overdrive, () => ++b);
    const factor = stageDamageMultiplier(stage) / (stage > 1 && level === 1 ? 2 : 1);
    assert.deepEqual(shots, original.map(shot => ({ ...shot, empowered: shot.empowered || stage === 3, damage: Math.round(shot.damage * factor * 1e6) / 1e6 })));
    for (const rapid of [0, 10000]) assert.equal(shipFireInterval('grey-scout', effective, rapid), fireInterval(effective, rapid));
  }
});

test('hull bonuses compose once with every permanent stage, paid/pickup weapon and power-up', () => {
  for (const skin of playerSkins) for (const stage of [1, 2, 3]) for (let level = 1; level <= 5; level++) for (const overdrive of [false, true]) {
    const attributes = attributesForHull(skin.id);
    const effective = stageWeaponLevel(stage, level);
    const baseline = makeVolley(effective, 100, 200, overdrive, () => 1);
    const shots = makeShipVolley(skin.id, stage, level, 100, 200, overdrive, () => 1);
    assert.equal(shots.length, baseline.length);
    shots.forEach((shot, i) => {
      assert.equal(shot.damage, Math.round(baseline[i].damage * (1 + attributes.damageBonus / 100) * stageDamageMultiplier(stage) / (stage > 1 && level === 1 ? 2 : 1) * 1e6) / 1e6);
      assert.equal(shot.empowered, baseline[i].empowered || stage === 3);
      assert.equal(shot.visualLevel, baseline[i].visualLevel);
      assert.equal(shot.x, baseline[i].x);
    });
    for (const rapid of [0, 10000]) {
      assert.ok(Math.abs(fireInterval(effective, rapid) / shipFireInterval(skin.id, effective, rapid) - (1 + attributes.fireRateBonus / 100)) < 1e-12);
    }
    if (level === 1 && !overdrive) {
      const actual = shots.reduce((sum, shot) => sum + shot.damage, 0) * 1000 / shipFireInterval(skin.id, effective, 0);
      assert.ok(Math.abs(actual - shipBaseFirepower(skin.id, stage)) < 1e-10);
    }
  }
});

test('bonus damage works on boss turrets and the exposed core without leaving rounding ghosts', () => {
  const boss = createSectorBoss(10, 390, 90, 760);
  boss.elapsed = BOSS_ENTRY_MS;
  boss.turrets[0].health = 10.8;
  const damage = makeShipVolley('red-comet', 1, 1, 100, 200, false, () => 1)[0].damage;
  for (let shot = 0; shot < 10; shot++) damageBossTurret(boss, 0, damage);
  assert.equal(boss.turrets[0].health, 0);
  assert.equal(damageSectorBoss(boss, damage, 1000), false, 'other turrets still protect the core');
  boss.turrets.forEach(turret => { turret.health = 0; });
  boss.health = 2.16;
  assert.equal(damageSectorBoss(boss, damage, 1000), true);
  assert.equal(boss.health, 0);
});

test('new hull copy is translated in every selectable language', () => {
  for (const locale of Object.keys(languages)) for (const key of shipAttributeKeys) {
    assert.equal(hasExplicitTranslation(locale, key), true, `${locale}: ${key}`);
    assert.ok(translate(locale, key).trim());
    if (locale !== 'en') assert.notEqual(translate(locale, key), key);
  }
});
