import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MusicPlayer } from './musicPlayback.ts';
import { readMusicVolume } from './musicPreferences.ts';

test('iOS-style fixed element volume still obeys Web Audio gain and the slider', async () => {
  const gainCalls = [];
  globalThis.localStorage = { getItem: () => null };
  globalThis.Audio = class {
    paused = true;
    loop = false;
    preload = '';
    volume = 1;
    constructor(src) { this.src = src; }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute() {}
    load() {}
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
  player.setVolume(25);
  player.setVolume(75);
  player.setVolume(0);
  assert.deepEqual(gainCalls.map(x => +x.toFixed(3)), [.02, .06, 0]);
  player.close();
});
