import { test } from "node:test";
import assert from "node:assert/strict";
import { ENTRY_PATTERNS, entryPatternForSection, entryPosition, entryStartX } from "./entryPatterns.ts";

test("nine arrival choreographies cycle across consecutive sections", () => {
  assert.equal(new Set(ENTRY_PATTERNS).size, 9);
  assert.deepEqual(Array.from({ length: 9 }, (_, index) => entryPatternForSection(index + 1)), ENTRY_PATTERNS);
  assert.equal(entryPatternForSection(10), ENTRY_PATTERNS[0]);
});

test("each route stays within the mobile playfield and docks at its assigned slot", () => {
  for (const pattern of ENTRY_PATTERNS) {
    for (const width of [375, 800]) {
      const radius = 36;
      const startX = entryStartX(pattern, 2, width, radius, 1);
      const flight = { pattern, startX, startY: 140, targetX: width * .7, targetY: 252, width, height: 700, radius, side: 1, index: 2 };
      assert.deepEqual(entryPosition({ ...flight, progress: 0 }), { x: startX, y: 140 });
      assert.deepEqual(entryPosition({ ...flight, progress: 1 }), { x: width * .7, y: 252 });
      for (let step = 1; step < 100; step++) {
        const { x, y } = entryPosition({ ...flight, progress: step / 100 });
        assert.ok(x >= radius && x <= width - radius && y >= radius && y <= 700 * .62, `${pattern} at ${step}% (${width}px)`);
      }
    }
  }
});

test("opposing cross wings exchange sides before docking", () => {
  const width = 390;
  const flight = { pattern: "cross", progress: .5, startY: 145, targetY: 240, width, height: 700, radius: 25, index: 0 };
  const left = entryPosition({ ...flight, startX: entryStartX("cross", 0, width, 25, 1), targetX: 100, side: 1 });
  const right = entryPosition({ ...flight, startX: entryStartX("cross", 1, width, 25, -1), targetX: 290, side: -1 });
  assert.ok(left.x > right.x, "the wings should pass each other in the middle");
});

test("the nine patterns draw visibly different paths", () => {
  const paths = ENTRY_PATTERNS.map(pattern => {
    const startX = entryStartX(pattern, 0, 390, 25, 1);
    return [20, 35, 50, 65, 80].map(percent => {
      const { x, y } = entryPosition({ pattern, progress: percent / 100, startX, startY: 145, targetX: 270, targetY: 240, width: 390, height: 700, radius: 25, side: 1, index: 0 });
      return `${Math.round(x)},${Math.round(y)}`;
    }).join(";");
  });
  assert.equal(new Set(paths).size, 9);
});
