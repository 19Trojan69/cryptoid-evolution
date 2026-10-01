import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameHaptics, readVibrationEnabled, VIBRATION_KEY } from './gameHaptics.ts';
test('explosions are throttled and cannot interrupt a boss finale', () => {
  let now = 0;
  const calls = [];
  const haptics = new GameHaptics(p => { calls.push(p); return true; }, () => true, () => now);
  assert.equal(haptics.explosion(), true);
  now = 50;
  assert.equal(haptics.explosion(), false);
  now = 120;
  assert.equal(haptics.explosion(), true);
  assert.equal(haptics.boss([140, 70, 230]), true);
  now = 500;
  assert.equal(haptics.explosion(), false);
  now = 560;
  assert.equal(haptics.explosion(), true);
  haptics.stop();
  assert.equal(calls.at(-1), 0);
});
test('disabled, background or reduced effects gate suppresses pulses; missing hardware is harmless', () => {
  let allowed = false;
  let count = 0;
  const haptics = new GameHaptics(() => { count++; return true; }, () => allowed);
  assert.equal(haptics.explosion(), false);
  assert.equal(haptics.boss([140]), false);
  assert.equal(count, 0);
  allowed = true;
  assert.equal(new GameHaptics(() => false, () => true).explosion(), false);
  assert.equal(new GameHaptics(() => { throw Error('unsupported'); }, () => true).explosion(), false);
});
test('vibration is enabled by default and the System choice persists', () => {
  const previous = globalThis.localStorage;
  let saved = null;
  globalThis.localStorage = { getItem: key => key === VIBRATION_KEY ? saved : null };
  try {
    assert.equal(readVibrationEnabled(), true);
    saved = 'off'; assert.equal(readVibrationEnabled(), false);
    saved = 'on'; assert.equal(readVibrationEnabled(), true);
  } finally { globalThis.localStorage = previous; }
});
