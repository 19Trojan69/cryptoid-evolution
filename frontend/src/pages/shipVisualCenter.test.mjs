import assert from "node:assert/strict";
import { test } from "node:test";
import { shipVisualCenter } from "./shipVisualCenter.ts";

test("transparent margins do not pull a shield away from the visible hull", () => {
  const pixels = new Uint8ClampedArray(4 * 4 * 4);
  pixels[(0 * 4 + 0) * 4 + 3] = 255;
  assert.deepEqual(shipVisualCenter(pixels, 4, 4), { x: 37.5, y: 37.5 });
  pixels[(3 * 4 + 3) * 4 + 3] = 255;
  assert.deepEqual(shipVisualCenter(pixels, 4, 4), { x: 0, y: 0 });
  assert.deepEqual(shipVisualCenter(new Uint8ClampedArray(16), 2, 2), { x: 0, y: 0 });
});
