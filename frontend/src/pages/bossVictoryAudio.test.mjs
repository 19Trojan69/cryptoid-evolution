import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { MusicPlayer } from './musicPlayback.ts';
import { technicalContext } from './stabilityReport.mjs';
import { reloadTechnicalContext } from './reloadDiagnostics.ts';

const text = fs.readFileSync(new URL('./GamePage.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('GamePage.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const expressions = new Map();
function visit(node) {
  if (ts.isVariableDeclaration(node) && ['victoryStillPlaying', 'clearFinished'].includes(node.name.getText(ast)))
    expressions.set(node.name.getText(ast), node.initializer.getText(ast));
  ts.forEachChild(node, visit);
}
visit(ast);
function ready(player, elapsed) {
  const context = { state: { encounter: 'boss-clear' }, musicRef: { current: player },
    clearTimerRef: { current: elapsed }, BOSS_CLEAR_DURATION_MS: 9350, timing: { clearMs: 1750 } };
  return vm.runInNewContext(`const victoryStillPlaying = ${expressions.get('victoryStillPlaying')}; ${expressions.get('clearFinished')}`, context);
}
function host(t) {
  const previous = { Audio: globalThis.Audio, AudioContext: globalThis.AudioContext };
  const contexts = [];
  globalThis.Audio = class {
    paused = true; ended = false; currentTime = 0; volume = 1;
    constructor(src) { this.src = src; }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    load() { this.currentTime = 0; this.ended = false; }
    removeAttribute() {} addEventListener() {} removeEventListener() {}
  };
  globalThis.AudioContext = class {
    state = 'running'; currentTime = 0; destination = {};
    constructor() { contexts.push(this); }
    createMediaElementSource() { return { connect: gain => gain, disconnect() {} }; }
    createGain() { return { gain: { value: 1 }, connect() {}, disconnect() {} }; }
    resume() { return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
  };
  t.after(() => Object.assign(globalThis, previous));
  const player = new MusicPlayer('/audio/boss-victory-v2.mp3', 25);
  t.after(() => player.close());
  return { player, contexts };
}

test('the actual boss-clear gate releases a running but motionless jingle after its normal clear duration', async t => {
  const { player } = host(t);
  await player.play();
  assert.equal(player.playing, true);
  assert.equal(ready(player, 5663), false);
  for (let elapsed = 5680; elapsed < 9350; elapsed += 17) assert.equal(ready(player, elapsed), false);
  assert.equal(ready(player, 9350), true);
  assert.equal(ready(player, 16367), true);
});

test('a jingle with measured media progress keeps its complete playback even after the nominal clear duration', async t => {
  const { player, contexts } = host(t);
  await player.play();
  for (let elapsed = 5663; elapsed < 12000; elapsed += 17) {
    player.audio.currentTime += .017;
    contexts[0].currentTime += .017;
    assert.equal(ready(player, elapsed), false);
  }
  player.audio.ended = true;
  assert.equal(ready(player, 12000), true);
});

test('an advancing Web Audio clock cannot disguise a frozen media position', async t => {
  const { player, contexts } = host(t);
  await player.play();
  for (let elapsed = 5663; elapsed < 9400; elapsed += 17) {
    contexts[0].currentTime += .017;
    ready(player, elapsed);
  }
  assert.equal(ready(player, 9400), true);
});

test('a native play promise that never settles cannot hold the boss transition open', t => {
  const { player } = host(t);
  player.audio.play = () => { player.audio.paused = false; return new Promise(() => {}); };
  void player.play();
  assert.equal(ready(player, 5663), false);
  assert.equal(ready(player, 9350), true);
});

test('a media stall after initial playback is bounded while pause and source changes reset observation', async t => {
  const { player } = host(t);
  await player.play();
  ready(player, 5663);
  player.audio.currentTime = .5;
  assert.equal(ready(player, 7500), false);
  assert.equal(ready(player, 9400), false);
  assert.equal(ready(player, 9500), true);
  player.pause();
  await player.play();
  assert.equal(ready(player, 9500), false, 'a resumed clip has a fresh active-play grace period');
  player.setSource('/audio/battle-orbit.mp3');
  await player.play();
  assert.equal(ready(player, 9600), true, 'the normal soundtrack never blocks the boss gate');
  player.setSource('/audio/boss-victory-v2.mp3');
  await player.play();
  assert.equal(ready(player, 9600), false);
  assert.equal(ready(player, 11600), true);
});

test('music progress and physical-heart state survive both bounded owner-report sanitizers without arbitrary data', () => {
  const fields = { musicState: 'running', musicClockMs: 0, musicMediaMs: 0,
    musicPaused: false, musicEnded: false, musicTrack: 'victory', bossHeartCollected: false };
  assert.deepEqual(technicalContext(reloadTechnicalContext(fields)), fields);
  const invalid = { musicState: 'private value', musicTrack: '/private/url', musicClockMs: Infinity,
    musicMediaMs: -1, musicPaused: 'false', musicEnded: 1, bossHeartCollected: 'false', account: 'secret' };
  assert.equal(technicalContext(reloadTechnicalContext(invalid)), null);
});

test('the whole GamePage retains published b92 behavior outside the exact audio wait and owner-counter additions', () => {
  const ref = 'ac9525d8094bf1ad527d018b2bdc79f28a56c92d';
  assert.equal(execFileSync('git', ['rev-parse', ref + '^{tree}'], { encoding: 'utf8' }).trim(),
    '9f68861ff277ef7a4b92da7392d82611333c6a29');
  const baseline = execFileSync('git', ['show', ref + ':frontend/src/pages/GamePage.tsx'], { encoding: 'utf8' });
  const normalized = text.replace('    const music = musicRef.current?.audioAuditSnapshot;\n', '')
    .replace(',\n      musicState: music?.musicState, musicClockMs: music?.musicClockMs, musicMediaMs: music?.musicMediaMs,\n      musicPaused: music?.musicPaused, musicEnded: music?.musicEnded, musicTrack: music?.musicTrack,\n      bossHeartCollected: stateRef.current.encounter === \'boss-clear\' ? !!stateRef.current.bossHeartCollected : undefined', '')
    .replace('musicRef.current.waitingForEnd(clearTimerRef.current)', 'musicRef.current.playing && !musicRef.current.audio.ended');
  assert.equal(normalized, baseline);
});
