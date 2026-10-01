import { test } from "node:test";
import assert from "node:assert/strict";
import { CONTROL_HAND_KEY, readControlHand, readShipStart, SHIP_START_KEY, shipStartHeight } from "./controlPreferences.ts";
import { placePlayerFromPointer, TOUCH_SHIP_OFFSET_PX } from "./playerCombat.ts";

test("the above-finger position remains the default and touch mode follows the finger", () => {
  const previous = globalThis.localStorage;
  let saved = null;
  globalThis.localStorage = { getItem: key => key === SHIP_START_KEY ? saved : null };
  try {
    assert.equal(readShipStart(), "higher");
    assert.equal(shipStartHeight[readShipStart()], .78);
    const touchY = 500;
    const current = placePlayerFromPointer(200, touchY, 400, 800, readShipStart() !== "touch");
    saved = "touch";
    assert.ok(Math.abs(shipStartHeight[readShipStart()] - shipStartHeight.higher - .04) < .0001);
    const underFinger = placePlayerFromPointer(200, touchY, 400, 800, readShipStart() !== "touch");
    assert.equal(underFinger.y, touchY / 800);
    assert.ok(Math.abs((underFinger.y - current.y) * 800 - TOUCH_SHIP_OFFSET_PX) < .0001);
    for (const oldSetting of ["normal", "lower"]) {
      saved = oldSetting;
      assert.equal(readShipStart(), "higher");
    }
  } finally {
    globalThis.localStorage = previous;
  }
});

test("right-handed steering is the initial choice while an explicit left-handed choice persists", () => {
  const previous = globalThis.localStorage;
  let selected = null;
  globalThis.localStorage = { getItem: key => key === CONTROL_HAND_KEY ? selected : null };
  try {
    assert.equal(readControlHand(), "right");
    selected = "left";
    assert.equal(readControlHand(), "left");
    selected = "right";
    assert.equal(readControlHand(), "right");
  } finally {
    globalThis.localStorage = previous;
  }
});
