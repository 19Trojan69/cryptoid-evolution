import { test } from "node:test";
import assert from "node:assert/strict";
import { GameAudio } from "./gameAudio.ts";

test("game audio plays effects without scheduling background music", async () => {
  const previous = { AudioContext: globalThis.AudioContext, window: globalThis.window };
  let nextTimer = 0;
  const intervals = new Set();
  let playedTones = 0;
  const buses = [];
  globalThis.window = {
    setInterval: () => { intervals.add(++nextTimer); return nextTimer; },
    clearInterval: timer => intervals.delete(timer),
  };
  globalThis.AudioContext = class {
    state = "running";
    currentTime = 0;
    destination = {};
    async resume() {}
    async close() {}
    createOscillator() {
      playedTones++;
      return { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: output => output, start() {}, stop() {} };
    }
    createGain() {
      const bus = { gain: { value: 1, setValueAtTime(value) { this.value = value; }, exponentialRampToValueAtTime() {} }, connect: output => output };
      buses.push(bus);
      return bus;
    }
  };
  const audio = new GameAudio();
  try {
    assert.equal(await audio.start(), true);
    assert.equal(intervals.size, 0);
    assert.equal(buses.length, 1);
    assert.equal(buses[0].gain.value, 1);
    audio.setEffectsVolume(25);
    assert.equal(buses[0].gain.value, .25);
    audio.setEffectsVolume(0);
    assert.equal(buses[0].gain.value, 0);
    audio.setEffectsVolume(100);
    assert.equal(buses[0].gain.value, 1);
    audio.play("laser");
    audio.play("collision");
    assert.equal(playedTones, 2);
    assert.equal(intervals.size, 0);
  } finally {
    audio.close();
    globalThis.AudioContext = previous.AudioContext;
    globalThis.window = previous.window;
  }
});
