import { test } from "node:test";
import assert from "node:assert/strict";
import { GameAudio } from "./gameAudio.ts";
import { DEFAULT_EFFECTS_VOLUME } from "./musicPreferences.ts";

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
    assert.equal(buses[0].gain.value, DEFAULT_EFFECTS_VOLUME / 100);
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

test("boss warning rises in three pulses and finishes before the boss enters", async () => {
  const previous = globalThis.AudioContext;
  const pulses = [];
  globalThis.AudioContext = class {
    state = "running";
    currentTime = 0;
    destination = {};
    async resume() {}
    async close() {}
    createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: output => output }; }
    createOscillator() {
      const pulse = { frequency: 0, at: 0, end: 0 };
      pulses.push(pulse);
      return {
        frequency: { setValueAtTime: value => { pulse.frequency = value; }, exponentialRampToValueAtTime: (_value, at) => { pulse.end = at; } },
        connect: output => output,
        start: at => { pulse.at = at; }, stop() {},
      };
    }
  };
  const audio = new GameAudio();
  try {
    assert.equal(await audio.start(), true);
    audio.play("boss");
    assert.equal(pulses.length, 3);
    assert.deepEqual(pulses.map(pulse => pulse.frequency), [420, 490, 560]);
    assert.ok(pulses[0].at < pulses[1].at && pulses[1].at < pulses[2].at);
    assert.ok(pulses[2].end < 3.2);
  } finally {
    audio.close();
    globalThis.AudioContext = previous;
  }
});
