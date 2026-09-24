import { test } from "node:test";
import assert from "node:assert/strict";
import { GameAudio } from "./gameAudio.ts";

test("music toggle stops the beat without silencing game effects", async () => {
  const previous = { AudioContext: globalThis.AudioContext, window: globalThis.window };
  let nextTimer = 0;
  const intervals = new Set();
  let playedTones = 0;
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
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: output => output };
    }
  };
  const audio = new GameAudio();
  try {
    assert.equal(await audio.start(), true);
    assert.equal(intervals.size, 1);
    audio.setMusicEnabled(false);
    assert.equal(intervals.size, 0);
    audio.play("laser");
    audio.play("collision");
    assert.equal(playedTones, 2);
    audio.setMusicEnabled(true);
    assert.equal(intervals.size, 1);
  } finally {
    audio.close();
    globalThis.AudioContext = previous.AudioContext;
    globalThis.window = previous.window;
  }
});
