import { test } from "node:test";
import assert from "node:assert/strict";
import { GameAudio, hasPrimedGameAudio, primeGameAudio, takePrimedGameAudio } from "./gameAudio.ts";
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

test("boss warning uses only the recorded alarm, without the old synthesized tones", async () => {
  const previous = { AudioContext: globalThis.AudioContext, fetch: globalThis.fetch };
  const samples = [];
  let oscillators = 0;
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
  globalThis.AudioContext = class {
    state = "running";
    currentTime = 0;
    destination = {};
    async resume() {}
    async close() {}
    async decodeAudioData() { return { duration: 4.83 }; }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: output => output }; }
    createOscillator() {
      oscillators++;
      return { connect: output => output, start() {}, stop() {} };
    }
    createBufferSource() { return { playbackRate: { value: 1 }, connect: output => output, start: () => samples.push(true) }; }
  };
  const audio = new GameAudio();
  try {
    assert.equal(await audio.start(), true);
    audio.play("boss");
    assert.equal(oscillators, 0);
    await new Promise(resolve => setImmediate(resolve));
    audio.play("boss");
    assert.equal(samples.length, 1);
    assert.equal(oscillators, 0);
  } finally {
    audio.close();
    globalThis.AudioContext = previous.AudioContext;
    globalThis.fetch = previous.fetch;
  }
});

test("boss explosion is louder than player destruction while both obey the effects slider", async () => {
  const previous = { AudioContext: globalThis.AudioContext, fetch: globalThis.fetch };
  const gains = [];
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
  globalThis.AudioContext = class {
    state = "running";
    destination = {};
    async resume() {}
    async close() {}
    async decodeAudioData() { return { duration: 1 }; }
    createGain() {
      const node = { gain: { value: 1 }, connect: output => output, disconnect() {} };
      gains.push(node);
      return node;
    }
    createBufferSource() { return { playbackRate: { value: 1 }, connect: output => output, start() {}, disconnect() {} }; }
  };
  const audio = new GameAudio();
  try {
    assert.equal(await audio.start(), true);
    await new Promise(resolve => setImmediate(resolve));
    audio.setEffectsVolume(35);
    audio.play("playerDestroy");
    audio.play("bossDestroy");
    assert.equal(gains[0].gain.value, .35);
    assert.equal(gains[1].gain.value, .107);
    assert.equal(gains[2].gain.value, .18);
    audio.setEffectsVolume(0);
    assert.equal(gains[0].gain.value, 0);
  } finally {
    audio.close();
    globalThis.AudioContext = previous.AudioContext;
    globalThis.fetch = previous.fetch;
  }
});

test("effects remain recoverable when the initial fullscreen audio resume never settles", async () => {
  const previous = globalThis.AudioContext;
  let starts = 0;
  let tones = 0;
  globalThis.AudioContext = class {
    state = "suspended";
    currentTime = 0;
    destination = {};
    resume() {
      starts++;
      if (starts === 1) return new Promise(() => {});
      this.state = "running";
      return Promise.resolve();
    }
    async close() {}
    createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: output => output }; }
    createOscillator() {
      tones++;
      return { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: output => output, start() {}, stop() {} };
    }
  };
  try {
    primeGameAudio();
    assert.equal(hasPrimedGameAudio(), true);
    const audio = takePrimedGameAudio();
    assert.ok(audio instanceof GameAudio);
    assert.equal(hasPrimedGameAudio(), false);
    assert.equal(await audio.start(), true);
    audio.play("laser");
    assert.equal(tones, 1);
    audio.close();
  } finally {
    globalThis.AudioContext = previous;
  }
});
