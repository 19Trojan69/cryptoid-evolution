import { test } from "node:test";
import assert from "node:assert/strict";
import { joystickVector, readTouchMode, TOUCH_MODE_KEY } from "./touchControls.ts";

test("saved thumb layout accepts left, right and classic drag", () => {
  const saved = new Map();
  globalThis.localStorage = { getItem: key => saved.get(key) ?? null };
  assert.equal(readTouchMode(), "left");
  saved.set(TOUCH_MODE_KEY, "right");
  assert.equal(readTouchMode(), "right");
  saved.set(TOUCH_MODE_KEY, "drag");
  assert.equal(readTouchMode(), "drag");
  saved.set(TOUCH_MODE_KEY, "invalid");
  assert.equal(readTouchMode(), "left");
});

test("joystick is proportional near its center and capped beyond its edge", () => {
  assert.deepEqual(joystickVector(100, 100, 100, 100, 40), { x: 0, y: 0 });
  assert.deepEqual(joystickVector(120, 100, 100, 100, 40), { x: .5, y: 0 });
  assert.deepEqual(joystickVector(200, 100, 100, 100, 40), { x: 1, y: 0 });
});
