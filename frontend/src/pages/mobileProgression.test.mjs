import assert from "node:assert/strict";
import test from "node:test";
import { isSmartphonePlayfield, smartphoneAttackLimit, smartphoneEnemyCount, smartphoneShipScale, smartphoneSpecialty } from "./mobileProgression.ts";
import { arrangeFormationBySize, formationLayout } from "./sectorManager.ts";

test("only a phone gets the gradual 6–9–12 enemy cap", () => {
  assert.equal(isSmartphonePlayfield(390, 390, true), true);
  assert.equal(isSmartphonePlayfield(390, 1440, true), false);
  assert.equal(isSmartphonePlayfield(390, 390, false), false);
  let previous = 6;
  for (let level = 1; level <= 500; level++) {
    const count = smartphoneEnemyCount(level);
    assert.ok(count >= previous && count <= previous + 1 && count <= 12);
    previous = count;
  }
  assert.equal(smartphoneEnemyCount(1), 6);
  assert.equal(smartphoneEnemyCount(120), 9);
  assert.equal(smartphoneEnemyCount(180), 10);
  assert.equal(smartphoneEnemyCount(360), 12);
  assert.equal(formationLayout(1, 390, 700).length, 6);
  assert.equal(formationLayout(1, 1200, 800).length, 15);
});

test("phone hulls fit their slots above the midpoint at each size milestone", () => {
  for (const [width, height, visibleTop] of [[390, 700, 55], [375, 700, 55], [320, 650, 50]]) {
    for (const level of [1, 40, 80, 120, 180, 260, 360, 500]) {
      const count = smartphoneEnemyCount(level);
      const scale = smartphoneShipScale(count);
      const radii = Array.from({ length: count }, (_, index) => [25, 36, 25, 50, 36][index % 5] * scale);
      const slots = formationLayout(1, width, height, { enemyCount: count, visibleTop, maxRadius: 50 * scale });
      const arranged = arrangeFormationBySize(slots, radii);
      assert.equal(arranged.length, count);
      assert.equal(new Set(arranged.map(slot => `${slot.x}:${slot.y}`)).size, count);
      for (let index = 0; index < count; index++) {
        assert.ok(arranged[index].y - radii[index] >= visibleTop, `level ${level}: above HUD`);
        assert.ok(arranged[index].y + radii[index] <= height * .5, `level ${level}: below midpoint`);
        assert.ok(arranged[index].x - radii[index] >= 0 && arranged[index].x + radii[index] <= width, `level ${level}: horizontal bounds`);
        for (let other = index + 1; other < count; other++) {
          const separation = Math.hypot(arranged[index].x - arranged[other].x, arranged[index].y - arranged[other].y) - radii[index] - radii[other];
          assert.ok(separation >= 3, `level ${level}: ships ${index} and ${other} overlap by ${separation}`);
        }
      }
    }
  }
});

test("phone attackers and specials unlock progressively", () => {
  assert.equal(smartphoneAttackLimit(1, 0), 1);
  assert.equal(smartphoneAttackLimit(30, 0), 2);
  assert.equal(smartphoneAttackLimit(180, 9), 3);
  assert.equal(smartphoneAttackLimit(180, 10), 2);
  assert.deepEqual(smartphoneSpecialty(149, 3), { shield: false, armed: false });
  assert.deepEqual(smartphoneSpecialty(150, 3), { shield: true, armed: false });
  assert.deepEqual(smartphoneSpecialty(260, 8), { shield: false, armed: true });
});
