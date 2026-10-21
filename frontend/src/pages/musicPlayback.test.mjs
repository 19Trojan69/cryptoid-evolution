import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handoffGameMusic, MusicPlayer, takeHandoffGameMusic } from './musicPlayback.ts';
import { readMusicVolume } from './musicPreferences.ts';

test('iOS-style fixed element volume still obeys Web Audio gain and the slider', async () => {
  const gainCalls = [];
  globalThis.localStorage = { getItem: () => null };
  globalThis.Audio = class {
    paused = true;
    loop = false;
    preload = '';
    volume = 1;
    constructor(src) { this.src = src; this.currentTime = 0; this.duration = 180; this.listeners = {}; }
    addEventListener(name, listener) { this.listeners[name] = listener; }
    removeEventListener(name, listener) { if (this.listeners[name] === listener) delete this.listeners[name]; }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute() {}
    load() { this.currentTime = 0; queueMicrotask(() => this.listeners.loadedmetadata?.()); }
  };
  globalThis.AudioContext = class {
    state = 'suspended';
    currentTime = 0;
    destination = {};
    createMediaElementSource() { return { connect: gain => ({ connect: destination => { assert.ok(gain); assert.ok(destination); } }) }; }
    createGain() { return { gain: { value: -1, setTargetAtTime: value => gainCalls.push(value) } }; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    close() { return Promise.resolve(); }
  };
  const player = new MusicPlayer('/audio/battle-orbit.mp3', readMusicVolume());
  assert.equal(await player.play(), true);
  assert.equal(player.audio.volume, 1);
  player.setVolume(25);
  player.setVolume(75);
  player.setVolume(0);
  assert.deepEqual(gainCalls.map(x => +x.toFixed(3)), [.25, .75, 0]);
  assert.equal(player.audio.volume, 1);
  player.close();
});

test('HTML audio fallback retains the same linear music slider when Web Audio is unavailable', async () => {
  const previousContext = globalThis.AudioContext;
  globalThis.AudioContext = undefined;
  try {
    const player = new MusicPlayer('/audio/light-the-void.mp3', 50);
    assert.equal(await player.play(), true);
    assert.equal(player.audio.volume, .5);
    player.setVolume(100);
    assert.equal(player.audio.volume, 1);
    player.setVolume(0);
    assert.equal(player.audio.volume, 0);
    player.close();
  } finally {
    globalThis.AudioContext = previousContext;
  }
});

test('blocked autoplay can start on a later gesture using the same player', async () => {
  const player = new MusicPlayer('/audio/light-the-void.mp3', 50);
  const originalPlay = player.audio.play.bind(player.audio);
  let attempts = 0;
  player.audio.play = () => ++attempts === 1 ? Promise.reject(new Error('gesture required')) : originalPlay();
  assert.equal(await player.play(), false);
  assert.equal(await player.play(), true);
  assert.equal(attempts, 2);
  player.close();
});

test('boss soundtrack switches on the same unlocked player and returns at normal-track position', async () => {
  const player = new MusicPlayer('/audio/battle-orbit.mp3', 25);
  assert.equal(await player.play(), true);
  const audio = player.audio;
  audio.currentTime = 42;
  player.setSource('/audio/dreadnought-duel.mp3');
  assert.strictEqual(player.audio, audio);
  assert.equal(player.currentSource, '/audio/dreadnought-duel.mp3');
  assert.equal(await player.play(), true);
  player.setSource('/audio/battle-orbit.mp3', 42);
  await Promise.resolve();
  assert.equal(audio.currentTime, 42);
  assert.equal(await player.play(), true);
  player.pause();
  assert.equal(audio.paused, true);
  player.close();
});

test('navigation transfers the unlocked home player into the game', async () => {
  const player = new MusicPlayer('/audio/home-galactic-chain.mp3', 50);
  assert.equal(await player.play(), true);
  const unlockedElement = player.audio;
  handoffGameMusic(player);
  assert.equal(player.currentSource, '/audio/battle-orbit.mp3');
  assert.strictEqual(takeHandoffGameMusic(), player);
  assert.strictEqual(player.audio, unlockedElement);
  assert.equal(await player.play(), true);
  assert.equal(player.playing, true);
  assert.equal(takeHandoffGameMusic(), null);
  player.close();
});

test('mute during pending autoplay cannot leave music playing behind an off label', async () => {
  const player = new MusicPlayer('/audio/battle-orbit.mp3', 50);
  let finish;
  player.audio.play = () => new Promise(resolve => { finish = () => { player.audio.paused = false; resolve(); }; });
  const pending = player.play();
  player.pause();
  finish();
  assert.equal(await pending, false);
  assert.equal(player.playing, false);
  player.close();
});

test('late success after a source switch or close cannot revive retired music', async () => {
  const player = new MusicPlayer('/audio/battle-orbit.mp3', 50);
  let finish;
  player.audio.play = () => new Promise(resolve => { finish = () => { player.audio.paused = false; resolve(); }; });
  const pending = player.play();
  player.setSource('/audio/dreadnought-duel.mp3');
  player.close();
  finish();
  assert.equal(await pending, false);
  assert.equal(player.playing, false);
});

function lifecycleAudio() {
  const previous = { Audio: globalThis.Audio, AudioContext: globalThis.AudioContext };
  const graph = { sources: [], gains: [], closes: 0 };
  globalThis.Audio = class {
    paused = true;
    currentTime = 0;
    duration = 180;
    listeners = new Set();
    constructor(src) { this.src = src; }
    addEventListener(name, fn) { assert.equal(name, 'loadedmetadata'); this.listeners.add(fn); }
    removeEventListener(name, fn) { assert.equal(name, 'loadedmetadata'); this.listeners.delete(fn); }
    metadata() { for (const fn of [...this.listeners]) fn(); }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute() { this.src = ''; }
    load() {}
  };
  globalThis.AudioContext = class {
    state = 'running';
    destination = {};
    createMediaElementSource() {
      const source = { disconnected: 0, connect: gain => gain, disconnect() { this.disconnected++; } };
      graph.sources.push(source); return source;
    }
    createGain() {
      const gain = { gain: { value: 0 }, connect() { return this; }, disconnected: 0, disconnect() { this.disconnected++; } };
      graph.gains.push(gain); return gain;
    }
    close() { graph.closes++; return Promise.resolve(); }
  };
  return { graph, restore() { globalThis.Audio = previous.Audio; globalThis.AudioContext = previous.AudioContext; } };
}

test('interrupted soundtrack loads retain one seek listener and retire it on switch/close', () => {
  const h = lifecycleAudio();
  try {
    const player = new MusicPlayer('/audio/battle-orbit.mp3', 25);
    for (let i = 0; i < 100; i++) {
      player.setSource(`/audio/track-${i}.mp3`, 42);
      assert.equal(player.audio.listeners.size, 1);
    }
    player.audio.metadata();
    assert.equal(player.audio.currentTime, 42);
    assert.equal(player.audio.listeners.size, 0);
    player.setSource('/audio/battle-orbit.mp3', 42);
    player.setSource('/audio/dreadnought-duel.mp3');
    assert.equal(player.audio.listeners.size, 0);
    player.setSource('/audio/battle-orbit.mp3', 42);
    player.close();
    assert.equal(player.audio.listeners.size, 0);
  } finally { h.restore(); }
});

test('closing music disconnects its graph and is idempotent', async () => {
  const h = lifecycleAudio();
  try {
    const player = new MusicPlayer('/audio/battle-orbit.mp3', 25);
    assert.equal(await player.play(), true);
    player.close(); player.close();
    assert.equal(h.graph.sources[0].disconnected, 1);
    assert.equal(h.graph.gains[0].disconnected, 1);
    assert.equal(h.graph.closes, 1);
    assert.equal(await player.play(), false);
  } finally { h.restore(); }
});

test('an unavailable AudioContext constructor preserves HTML audio playback', async () => {
  const h = lifecycleAudio();
  globalThis.AudioContext = class { constructor() { throw new Error('audio host unavailable'); } };
  try {
    const player = new MusicPlayer('/audio/battle-orbit.mp3', 25);
    assert.equal(await player.play(), true);
    assert.equal(player.audio.volume, .25);
    player.close();
  } finally { h.restore(); }
});

test('asynchronous context-close failures are consumed during cleanup', async () => {
  const h = lifecycleAudio();
  const Original = globalThis.AudioContext;
  globalThis.AudioContext = class extends Original {
    close() { h.graph.closes++; return Promise.reject(new Error('audio context already retired')); }
  };
  try {
    const player = new MusicPlayer('/audio/battle-orbit.mp3', 25);
    await player.play(); player.close();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.graph.closes, 1);
  } finally { h.restore(); }
});

test('Resume gesture recovers interrupted music without playing during its countdown', async () => {
  const h = lifecycleAudio();
  const Base = globalThis.AudioContext;
  let gesture = false, context, resumes = 0;
  globalThis.AudioContext = class extends Base {
    state = 'suspended';
    constructor() { super(); context = this; }
    resume() {
      resumes++;
      if (!gesture) return Promise.reject(new Error('gesture required'));
      this.state = 'running'; return Promise.resolve();
    }
  };
  try {
    const player = new MusicPlayer('/audio/battle-orbit.mp3', 25);
    gesture = true; const initial = player.play(); gesture = false;
    assert.equal(await initial, true);
    player.pause(); player.audio.currentTime = 42; context.state = 'interrupted';
    assert.equal(await player.unlock(), false, 'a timer alone cannot unlock the interrupted host');
    gesture = true; const resume = player.unlock(); gesture = false;
    assert.equal(await resume, true);
    assert.equal(player.audio.paused, true, 'countdown remains silent');
    assert.equal(player.playing, false);
    assert.equal(player.audio.currentTime, 42);
    assert.equal(h.graph.gains[0].gain.value, 0, 'countdown keeps the graph silent');
    assert.equal(h.graph.sources.length, 1);
    assert.equal(await player.play(), true, 'previously unlocked element can play after the countdown');
    assert.equal(h.graph.gains[0].gain.value, .25);
    assert.equal(resumes, 3);
    player.close();
  } finally { h.restore(); }
});

test('a pending Resume unlock cannot revive a music player after navigation closes it', async () => {
  const h = lifecycleAudio();
  const Base = globalThis.AudioContext;
  let finish;
  globalThis.AudioContext = class extends Base {
    state = 'interrupted';
    resume() { return new Promise(resolve => { finish = () => { this.state = 'running'; resolve(); }; }); }
  };
  try {
    const player = new MusicPlayer('/audio/battle-orbit.mp3', 50);
    const pending = player.unlock();
    assert.equal(player.audio.paused, true);
    player.close(); finish();
    assert.equal(await pending, false);
    assert.equal(player.playing, false);
    assert.equal(player.audio.paused, true);
    assert.equal(h.graph.closes, 1);
  } finally { h.restore(); }
});

