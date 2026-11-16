import assert from 'node:assert/strict';
import test from 'node:test';
import { componentHost } from '../../../scripts/componentTestHost.mjs';
import { storyFadeMs } from './storyFades.ts';

const definition = { title: 'Korvessa', audio: 'korvessa-intro.mp3', timing: { duration: 10 } };
const cues = [{ text: 'Pilot', start: .2, end: 10 }];
const source = '/story/' + definition.audio;

function setup({ withAudio = true, startAudio, artwork = false } = {}) {
  let time = 1000;
  let frameId = 0;
  const frames = new Map();
  const starts = [];
  const unlocks = [];
  const preparations = [];
  const transitions = [];
  const drawings = [];
  const window = Object.assign(new EventTarget(), { matchMedia: () => ({ matches: false }) });
  const document = Object.assign(new EventTarget(), { hidden: false, documentElement: { dataset: {} },
    fonts: { load: async () => [] } });
  const canvas = Object.assign(new EventTarget(), { getBoundingClientRect: () => ({ width: 430, height: 932 }),
    getContext: () => ({}) });
  const audio = Object.assign(new EventTarget(), { currentTime: 0, ended: false, error: null, load() {} });
  const player = {
    audio,
    currentSource: '/audio/battle-orbit.mp3',
    playing: true,
    volume: 60,
    setVolume(value) { this.volume = value; },
    unlock(restart) { unlocks.push(restart); return Promise.resolve(true); },
    play() {
      starts.push(audio.currentTime);
      if (startAudio) return startAudio(this, starts.length);
      this.playing = true;
      return Promise.resolve(true);
    },
    pause() { this.playing = false; },
  };
  const elements = { section: { focus() {} }, canvas };
  const host = componentHost('src/pages/story/StoryBriefing.tsx', 'StoryBriefing', {
    scene: 'korvessa', withAudio, volume: 60, unlocked: false,
    prepareAudio: path => {
      preparations.push(path);
      player.currentSource = path;
      player.pause();
      player.setVolume(0);
      audio.currentTime = 0;
      return player;
    },
    onReturn: () => {
      transitions.push('reveal');
      player.currentSource = '/audio/dreadnought-duel.mp3';
      player.playing = true;
    },
    onFinish: () => transitions.push('finish'),
  }, {
    useMemo: () => cues, useLocale: () => ({ locale: 'de' }),
    storySubtitle: () => undefined, storyCopy: () => ['Überspringen', 'Story-Vorspänne', 'Ton abspielen'],
    storyScenes: { korvessa: definition }, storyFadeMs,
    performance: { now: () => time }, window, document, sessionStorage: new Map(),
    Image: class { async decode() { if (!artwork) throw new Error('Artwork unavailable in audio fixture'); } },
    createCinematic: () => ({ resize() {}, draw(seconds) { drawings.push(seconds); }, dispose() {} }),
    requestGameFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelGameFrame: id => frames.delete(id),
    element(type, props, ...children) {
      if (props?.ref) props.ref.current = elements[type];
      return { type, props: { ...props, children: children.flat(Infinity) } };
    },
  });
  const find = name => host.nodes().find(node => node.props.className === name)?.props;
  return {
    ...host, player, audio, starts, unlocks, preparations, transitions, drawings,
    tick(ms) {
      time += ms;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback(time));
      host.render();
    },
    phase: () => find('story-briefing')['data-phase'],
    retry: () => find('story-briefing-audio'),
    skip: () => find('story-briefing-skip').onClick(),
    hide() {
      document.hidden = true;
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('pagehide'));
    },
    show() {
      document.hidden = false;
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('pageshow'));
      window.dispatchEvent(new Event('focus'));
    },
  };
}

test('a briefing resumes the same recording at its position after returning to the app', async () => {
  const story = setup();
  story.tick(storyFadeMs.gameOut - 1);
  assert.deepEqual(story.starts, []);
  story.tick(1);
  await story.flush();
  assert.deepEqual(story.starts, [0]);
  story.audio.currentTime = 1.45;
  story.tick(1450);
  assert.equal(story.player.volume, 60);
  story.hide();
  assert.equal(story.player.playing, false);
  story.tick(25_000);
  story.show();
  await story.flush();
  assert.deepEqual(story.preparations, [source]);
  assert.deepEqual(story.starts, [0, 1.45]);
  assert.equal(story.player.playing, true);
  assert.equal(story.retry(), undefined);
  story.unmount();
});

test('blocked autoplay keeps the crawl moving and a tap rejoins at its current time', async () => {
  const story = setup({ startAudio(player, attempt) { return Promise.resolve(player.playing = attempt > 1); } });
  story.tick(storyFadeMs.gameOut);
  await story.flush();
  story.tick(1500);
  story.retry().onClick();
  await story.flush();
  assert.deepEqual(story.starts, [0, 1.5]);
  assert.deepEqual(story.unlocks, [true]);
  assert.equal(story.retry(), undefined);
  story.skip();
  story.tick(storyFadeMs.briefingOut);
  story.tick(storyFadeMs.gameIn);
  assert.deepEqual(story.transitions, ['reveal', 'finish']);
  story.unmount();
  assert.equal(story.player.currentSource, '/audio/dreadnought-duel.mp3');
  assert.equal(story.player.playing, true);
});

test('a stalled start falls back and its late failure cannot silence a newer attempt', async () => {
  let rejectStart;
  const story = setup({ startAudio(player, attempt) {
    if (attempt === 1) return new Promise((_, reject) => { rejectStart = reject; });
    player.playing = true;
    return Promise.resolve(true);
  } });
  story.tick(storyFadeMs.gameOut);
  story.tick(3200);
  assert.ok(story.retry());
  story.hide();
  story.tick(8000);
  story.show();
  rejectStart(new Error('Previous playback request failed'));
  await story.flush();
  assert.deepEqual(story.starts, [0, 0]);
  assert.equal(story.player.playing, true);
  assert.equal(story.retry(), undefined);
  story.unmount();
});

test('muted briefings finish without preparing or retrying audio', () => {
  const story = setup({ withAudio: false });
  story.tick(storyFadeMs.gameOut);
  story.hide();
  story.show();
  assert.deepEqual(story.preparations, []);
  assert.equal(story.retry(), undefined);
  story.tick(10_000);
  assert.equal(story.phase(), 'leaving');
  story.tick(storyFadeMs.briefingOut);
  story.tick(storyFadeMs.gameIn);
  assert.deepEqual(story.transitions, ['reveal', 'finish']);
  story.unmount();
});

test('the crawl advances between media time samples and continues through the fade', async () => {
  const story = setup({ artwork: true });
  await story.flush();
  story.tick(storyFadeMs.gameOut);
  await story.flush();
  let previous = 0;
  for (let frame = 1; frame <= 75; frame++) {
    const frameMs = frame * 1000 / 60;
    const reportedMs = Math.floor(frameMs / 24) * 24;
    story.audio.currentTime = reportedMs / 1000;
    story.tick(1000 / 60);
    const displayed = story.drawings.at(-1);
    assert.ok(displayed > previous, `Frame ${frame} did not move forward`);
    assert.ok(displayed * 1000 - reportedMs <= 56.01);
    assert.ok(reportedMs - displayed * 1000 <= 64.01);
    previous = displayed;
  }
  story.skip();
  story.tick(120);
  assert.equal(story.phase(), 'leaving');
  assert.ok(story.drawings.at(-1) > previous);
  story.unmount();
});
