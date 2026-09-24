import assert from "node:assert/strict";
import test from "node:test";
import { attackDuration, attackGroupSize, attackPosition, chooseAttackPattern } from "./attackPatterns.ts";

const patterns = ["dive", "curve", "sCurve", "loop", "side", "double", "vDive"];

test("early attacks stay solo and group patterns unlock later", () => {
  for (let index = 0; index < 25; index++) assert.equal(attackGroupSize(chooseAttackPattern(index, 299_999)), 1);
  assert.equal(chooseAttackPattern(5, 300_000), "double");
  assert.equal(chooseAttackPattern(6, 300_000), "vDive");
  assert.equal(attackGroupSize("double"), 2);
  assert.equal(attackGroupSize("vDive"), 3);
});

test("every attack starts in formation, stays on screen and reaches the same impact point", () => {
  for (const [width, height, startX, startY, radius] of [[1363, 936, 272, 365, 50], [390, 720, 80, 240, 25]]) {
    for (const pattern of patterns) {
      let previous;
      for (let frame = 0; frame <= 100; frame++) {
        const point = attackPosition({ pattern, progress: frame / 100, startX, startY, width, height, radius, side: -1, lane: -1 });
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y), `${pattern}: finite position`);
        assert.ok(point.x >= radius && point.x <= width - radius, `${pattern}: horizontal bounds`);
        assert.ok(point.y >= 72 && point.y <= height, `${pattern}: vertical bounds`);
        if (previous) assert.ok(Math.hypot(point.x - previous.x, point.y - previous.y) < 24, `${pattern}: no jump`);
        previous = point;
      }
      const start = attackPosition({ pattern, progress: 0, startX, startY, width, height, radius, side: -1, lane: -1 });
      assert.deepEqual(start, { x: startX, y: startY });
      assert.ok(Math.abs(previous.x - (startX + (width / 2 - startX) * 0.45)) < 0.001);
      assert.equal(previous.y, height - 75 + radius);
      assert.ok(attackDuration(pattern) >= 5_000);
    }
  }
});

test("the S-curve changes sides, the loop reverses height, and V lanes separate", () => {
  const base = { startX: 280, startY: 300, width: 1000, height: 800, radius: 25, side: 1, lane: 0 };
  const dive = progress => attackPosition({ ...base, pattern: "dive", progress });
  const sCurve = progress => attackPosition({ ...base, pattern: "sCurve", progress });
  assert.ok(sCurve(0.25).x > dive(0.25).x && sCurve(0.75).x < dive(0.75).x);
  const loop = progress => attackPosition({ ...base, pattern: "loop", progress });
  assert.ok(loop(0.4).y < loop(0.3).y);
  const left = attackPosition({ ...base, pattern: "vDive", progress: 0.5, lane: -1 });
  const right = attackPosition({ ...base, pattern: "vDive", progress: 0.5, lane: 1 });
  assert.ok(left.x < right.x);
});
