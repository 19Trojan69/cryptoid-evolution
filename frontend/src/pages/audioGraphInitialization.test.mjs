import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { GameAudio } from './gameAudio.ts';
import { MusicPlayer } from './musicPlayback.ts';
import * as boss from './bossWeaponSound.ts';
import * as enemy from './enemyWeaponSound.ts';
import * as preferences from './musicPreferences.ts';
import * as audit from './ownerAudioAudit.ts';
import * as clock from './audioClockRecovery.ts';

// Exact locally verified equivalent of published 9b5f07c5, not a handwritten model.
const baseline = '759b63e853023a1c9bf44e91c69d6872cef9b029';
const deps = { './bossWeaponSound.ts': boss, './enemyWeaponSound.ts': enemy,
  './musicPreferences.ts': preferences, './ownerAudioAudit.ts': audit, './audioClockRecovery.ts': clock };
function preceding(file, name) {
  const source = execFileSync('git', ['show', `${baseline}:frontend/src/pages/${file}`], { encoding: 'utf8' });
  const exports = {};
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(js, { exports, require: key => { assert.ok(deps[key], key); return deps[key]; },
    Audio: globalThis.Audio, AudioContext: globalThis.AudioContext, DOMException, performance, Date, AbortController });
  return exports[name];
}

function host(t, fault = '', failures = 1) {
  const previous = { Audio: globalThis.Audio, AudioContext: globalThis.AudioContext, localStorage: globalThis.localStorage };
  const contexts = [], elements = [], bindings = new WeakMap(), nodes = [];
  let left = failures, plays = 0, closes = 0, resumes = 0;
  const fail = stage => { if (stage === fault && left-- > 0) throw new Error(`injected ${stage}`); };
  const param = stage => {
    let value = 0;
    return { get value() { return value; }, set value(next) { fail(stage); value = next; },
      setTargetAtTime(next) { value = next; }, cancelScheduledValues() {},
      setValueAtTime(next) { value = next; }, exponentialRampToValueAtTime() {} };
  };
  function node(context, kind) {
    const value = { context, kind, outputs: new Set(), disconnects: 0,
      connect(target) { fail(`${kind}-connect`); this.outputs.add(target); return target; },
      disconnect() { this.disconnects++; this.outputs.clear(); },
    };
    nodes.push(value); return value;
  }
  globalThis.localStorage = { getItem: () => null };
  globalThis.Audio = class {
    paused = true; ended = false; muted = false; currentTime = 0; duration = 180; volume = 1;
    listeners = new Map();
    constructor(src) { this.src = src; elements.push(this); }
    play() { plays++; this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    load() {}
    removeAttribute() { this.src = ''; }
    addEventListener(name, fn) { this.listeners.set(name, fn); }
    removeEventListener(name, fn) { if (this.listeners.get(name) === fn) this.listeners.delete(name); }
  };
  globalThis.AudioContext = class {
    state = 'suspended'; currentTime = 0; destination = {};
    constructor() { fail('context-create'); contexts.push(this); }
    createGain() { fail('gain-create'); return Object.assign(node(this, 'gain'), { gain: param('gain-value') }); }
    createMediaElementSource(element) {
      fail('media-create');
      if (bindings.has(element)) throw new DOMException('media element already bound', 'InvalidStateError');
      const source = node(this, 'media'); bindings.set(element, source); return source;
    }
    createDynamicsCompressor() {
      fail('limiter-create');
      return Object.assign(node(this, 'limiter'), { threshold: param('limiter-config'), knee: param(),
        ratio: param(), attack: param(), release: param() });
    }
    createOscillator() {
      return Object.assign(node(this, 'oscillator'), { frequency: param(), start() {}, stop() {} });
    }
    resume() { resumes++; this.state = 'running'; return Promise.resolve(); }
    close() { closes++; this.state = 'closed'; return Promise.resolve(); }
  };
  t.after(() => Object.assign(globalThis, previous));
  const path = (source, seen = new Set()) => {
    if (!source || seen.has(source)) return false;
    seen.add(source);
    if (source === source.context?.destination) return false;
    return source.context.state === 'running' && [...source.outputs].some(target =>
      target === source.context.destination || path(target, seen));
  };
  return { contexts, elements, nodes, path, binding: element => bindings.get(element),
    output: element => !element.paused && (!bindings.has(element) || path(bindings.get(element))),
    get plays() { return plays; }, get closes() { return closes; }, get resumes() { return resumes; } };
}

test('initialization tests use the exact published source tree and preserve unrelated runtime', () => {
  assert.equal(execFileSync('git', ['rev-parse', `${baseline}^{tree}`], { encoding: 'utf8' }).trim(),
    'd92cd586d6257357de893c2357960e6c2cd116bc');
  for (const file of ['GamePage.tsx', 'audioClockRecovery.ts', 'cardSound.ts', 'bossReward.ts']) {
    assert.equal(fs.readFileSync(new URL(file, import.meta.url), 'utf8'),
      execFileSync('git', ['show', `${baseline}:frontend/src/pages/${file}`], { encoding: 'utf8' }), file);
  }
});

for (const fault of ['gain-create', 'limiter-connect']) test(`published effects negative control: ${fault} leaves a false-success path`, async t => {
  const h = host(t, fault), Before = preceding('gameAudio.ts', 'GameAudio'), player = new Before();
  await assert.rejects(player.start(), /injected/);
  assert.equal(await player.start(), true);
  assert.equal(h.nodes.some(n => n.kind === 'gain' && h.path(n)), false);
  player.close();
});

for (const fault of ['gain-create', 'gain-connect']) test(`published music negative control: ${fault} strands its bound media`, async t => {
  const h = host(t, fault), Before = preceding('musicPlayback.ts', 'MusicPlayer'), player = new Before('/audio/battle-orbit.mp3', 50);
  assert.equal(await player.play(), true);
  assert.equal(await player.play(), true);
  assert.equal(h.output(player.audio), false);
  assert.equal(h.binding(player.audio).context.state, 'closed');
  player.close();
});

for (const fault of ['context-create', 'gain-create', 'gain-value', 'limiter-create', 'limiter-config', 'gain-connect', 'limiter-connect']) {
  test(`effects ${fault}: no incomplete ready state; next gesture rebuilds on the same usable context`, async t => {
    const h = host(t, fault), player = new GameAudio();
    assert.equal(await player.start(), false);
    assert.equal(player.running, false);
    assert.equal(player.activeVoiceCount, 0);
    assert.equal(h.nodes.some(n => n.outputs.size), false, 'partial connections are disconnected');
    const count = h.contexts.length;
    assert.equal(await player.start(), true);
    assert.equal(h.contexts.length, count || 1);
    assert.equal(player.running, true);
    const gain = h.nodes.find(n => n.kind === 'gain' && h.path(n));
    assert.ok(gain);
    assert.equal(gain.gain.value, preferences.effectsGain(preferences.DEFAULT_EFFECTS_VOLUME));
    const limiter = h.nodes.find(n => n.kind === 'limiter' && h.path(n));
    assert.deepEqual([limiter.threshold.value, limiter.knee.value, limiter.ratio.value, limiter.attack.value, limiter.release.value],
      [-12, 12, 8, .003, .2]);
    player.play('collision');
    assert.equal(h.nodes.filter(n => n.kind === 'oscillator' && h.path(n)).length, 1);
    player.setPaused(true); assert.equal(player.activeVoiceCount, 0);
    player.close(); assert.equal(h.closes, 1);
    assert.equal(h.nodes.some(n => n.outputs.size), false);
  });
}

for (const fault of ['gain-create', 'gain-value', 'media-create', 'media-connect', 'gain-connect']) {
  test(`music ${fault}: failed unlock stays silent; retry preserves element, seek and one context`, async t => {
    const h = host(t, fault), player = new MusicPlayer('/audio/battle-orbit.mp3', 25), element = player.audio;
    element.currentTime = 42; player.pause();
    assert.equal(await player.unlock(true), false);
    assert.equal(player.playing, false);
    assert.equal(element.paused, true);
    assert.equal(h.plays, 0);
    assert.equal(h.closes, 0, 'never close a graph to which this media element may be bound');
    assert.equal(h.nodes.some(n => n.outputs.size), false);
    const bound = h.binding(element);
    assert.equal(await player.unlock(true), true);
    assert.equal(element.paused, true, 'countdown does not play');
    assert.equal(h.plays, 0);
    assert.equal(await player.play(), true);
    assert.equal(h.output(element), true);
    assert.equal(element.currentTime, 42);
    assert.equal(player.audio, element);
    assert.equal(h.contexts.length, 1);
    assert.equal(h.elements.length, 1);
    assert.equal(h.nodes.filter(n => n.kind === 'media').length, 1);
    if (bound) assert.equal(h.binding(element), bound);
    const gain = h.nodes.find(n => n.kind === 'gain' && h.path(n));
    assert.equal(gain.gain.value, .25);
    player.setSource('/audio/boss-victory-v2.mp3');
    assert.equal(await player.play(), true);
    assert.equal(h.output(element), true);
    player.pause(); assert.equal(h.output(element), false);
    player.close(); player.close();
    assert.equal(h.closes, 1);
    assert.equal(h.nodes.some(n => n.outputs.size), false);
  });
}

test('a failed music play does not call native play or report playing', async t => {
  const h = host(t, 'media-connect'), player = new MusicPlayer('/audio/boss-victory-v2.mp3', 50);
  assert.equal(await player.play(), false);
  assert.equal(h.plays, 0);
  assert.equal(player.playing, false);
  assert.equal(await player.play(), true);
  assert.equal(h.output(player.audio), true);
  player.close();
});

test('repeated music connection failures retain at most the original three graph objects and retire all on close', async t => {
  const h = host(t, 'gain-connect', 1000), player = new MusicPlayer('/audio/battle-orbit.mp3', 50);
  for (let i = 0; i < 1000; i++) assert.equal(await player.play(), false);
  assert.equal(h.contexts.length, 1); assert.equal(h.elements.length, 1); assert.equal(h.nodes.length, 2);
  assert.equal(h.plays, 0); assert.equal(h.closes, 0);
  assert.equal(h.nodes.some(n => n.outputs.size), false);
  assert.equal(await player.play(), true); assert.equal(h.output(player.audio), true);
  player.close(); assert.equal(h.closes, 1); assert.equal(h.nodes.some(n => n.outputs.size), false);
});

test('repeated effects initialization failures retire temporary nodes without replacing the context or allocating voices', async t => {
  const h = host(t, 'limiter-connect', 1000), player = new GameAudio();
  for (let i = 0; i < 1000; i++) assert.equal(await player.start(), false);
  assert.equal(h.contexts.length, 1); assert.equal(h.resumes, 0);
  assert.equal(player.activeVoiceCount, 0); assert.equal(h.nodes.some(n => n.outputs.size), false);
  assert.equal(await player.start(), true);
  assert.equal(h.contexts.length, 1);
  player.close(); assert.equal(h.closes, 1); assert.equal(h.nodes.some(n => n.outputs.size), false);
});

test('closing an incomplete music graph prevents retry from reviving it', async t => {
  const h = host(t, 'gain-connect'), player = new MusicPlayer('/audio/battle-orbit.mp3', 25);
  assert.equal(await player.play(), false);
  player.close();
  assert.equal(await player.play(), false); assert.equal(await player.unlock(true), false);
  assert.equal(h.contexts.length, 1); assert.equal(h.closes, 1); assert.equal(h.plays, 0);
});

test('healthy music uses the original single graph, exact gain and unchanged media through pause/resume and boss tracks', async t => {
  const h = host(t), player = new MusicPlayer('/audio/battle-orbit.mp3', 25), element = player.audio;
  assert.equal(await player.prime(), true); assert.equal(h.plays, 0);
  assert.equal(await player.play(), true);
  for (let i = 0; i < 100; i++) {
    player.audio.currentTime += .2; h.contexts[0].currentTime += .2;
    player.pause(); assert.equal(await player.unlock(true), true);
    assert.equal(h.plays, i + 1); assert.equal(element.paused, true);
    player.setSource(i % 2 ? '/audio/battle-orbit.mp3' : '/audio/boss-victory-v2.mp3');
    assert.equal(await player.play(), true); assert.equal(h.output(element), true);
  }
  assert.equal(h.contexts.length, 1); assert.equal(h.elements.length, 1); assert.equal(h.nodes.length, 2);
  assert.equal(h.nodes.find(n => n.kind === 'gain').gain.value, .25);
  player.close();
});
