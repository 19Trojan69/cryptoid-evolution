import { test } from "node:test";
import assert from "node:assert/strict";
import { ENTRY_PATTERNS, entryPatternForSector, entryPosition, entryStartX } from "./entryPatterns.ts";

test("nine normal sectors each have a distinct formation before every boss", () => {
  assert.equal(new Set(ENTRY_PATTERNS).size, 9);
  for (let chapter = 0; chapter < 50; chapter++) {
    assert.deepEqual(Array.from({ length: 9 }, (_, index) => entryPatternForSector(chapter * 10 + index + 1)), ENTRY_PATTERNS);
  }
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

test("arrivals make one restrained arc without loops or reversals", () => {
  for (const pattern of ENTRY_PATTERNS) {
    const startX = entryStartX(pattern, 0, 390, 25, 1);
    const flight = { pattern, startX, startY: 145, targetX: 270, targetY: 240, width: 390, height: 700, radius: 25, side: 1, index: 0 };
    const points = Array.from({ length: 101 }, (_, step) => entryPosition({ ...flight, progress: step / 100 }));
    assert.ok(points.every(point => point.x >= Math.min(startX, 270) - 36 && point.x <= Math.max(startX, 270) + 36));
    assert.ok(points.every((point, index) => index === 0 || point.y >= points[index - 1].y));
  }
});

test("arrival curves change direction smoothly without wall-clipping corners", () => {
  for (const pattern of ENTRY_PATTERNS) {
    for (const side of [-1, 1]) {
      const width = 375;
      const flight = { pattern, startX: entryStartX(pattern, 3, width, 36, side), startY: 140, targetX: side === 1 ? 280 : 95, targetY: 252, width, height: 700, radius: 36, side, index: 3 };
      const points = Array.from({ length: 1001 }, (_, index) => entryPosition({ ...flight, progress: index / 1000 }));
      // Adjacent frame velocities cannot jump by more than a small part of the hull.
      for (let index = 2; index < points.length; index++) {
        const acceleration = Math.hypot(points[index].x - 2 * points[index - 1].x + points[index - 2].x, points[index].y - 2 * points[index - 1].y + points[index - 2].y);
        assert.ok(acceleration < .12, `${pattern} side ${side} has a kink at ${index / 1000}: ${acceleration}`);
      }
    }
  }
});
