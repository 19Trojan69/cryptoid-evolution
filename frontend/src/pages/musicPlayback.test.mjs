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
