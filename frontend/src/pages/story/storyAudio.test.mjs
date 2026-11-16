import assert from 'node:assert/strict';
import test from 'node:test';
import { componentHost } from '../../../scripts/componentTestHost.mjs';
import { storyFadeMs } from './storyFades.ts';

const definition = { title: 'Korvessa', audio: 'korvessa-intro.mp3', timing: { duration: 10 } };
const cues = [{ text: 'Pilot', start: .2, end: 10 }];
const source = '/story/' + definition.audio;

function setup({ preview, withAudio = true, startAudio, artwork = false, reducedMotion = false } = {}) {
  let time = 1000;
  let frameId = 0;
  const frames = new Map();
  const starts = [];
  const unlocks = [];
  const preparations = [];
  const covers = [];
  const transitions = [];
  const drawings = [];
  const window = Object.assign(new EventTarget(), { matchMedia: () => ({ matches: reducedMotion }) });
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
    scene: 'korvessa', preview, withAudio, volume: 60, unlocked: false,
    prepareAudio: path => {
      preparations.push(path);
      player.currentSource = path;
      player.pause();
      player.setVolume(0);
      audio.currentTime = 0;
      return player;
    },
    onCovered: () => covers.push(time),
    onReturn: () => {
      transitions.push('reveal');
      player.currentSource = '/audio/dreadnought-duel.mp3';
      player.playing = true;
    },
    onFinish: () => transitions.push('finish'),
  }, {
    useMemo: () => cues, useLocale: () => ({ locale: 'de' }),
    loadStorySubtitles: async () => undefined, storyCopy: () => ['Überspringen', 'Story-Vorspänne', 'Ton abspielen'],
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
    ...host, player, audio, starts, unlocks, preparations, covers, transitions, drawings,
    tick(ms) {
      time += ms;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback(time));
      host.render();
    },
    phase: () => find('story-briefing')['data-phase'],
    overlapping: () => find('story-briefing')['data-overlap'],
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

test('the briefing image starts blending in while the game is covered before the voice starts', async () => {
  const story = setup();
  story.tick(storyFadeMs.gameOut - storyFadeMs.briefingLead - 1);
  assert.equal(story.overlapping(), undefined);
  story.tick(1);
  assert.equal(story.phase(), 'covering');
  assert.equal(story.overlapping(), true);
  assert.deepEqual(story.starts, []);
  assert.deepEqual(story.covers, []);
  story.tick(storyFadeMs.briefingLead);
  await story.flush();
  assert.equal(story.phase(), 'briefing');
  assert.equal(story.overlapping(), undefined);
  assert.deepEqual(story.starts, [0]);
  assert.deepEqual(story.covers, [1000 + storyFadeMs.gameOut]);
  story.unmount();
});

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

test('reduced motion still gives audible tracks their full fade', async () => {
  const story = setup({ reducedMotion: true });
  story.tick(storyFadeMs.gameOut - 1);
  assert.deepEqual(story.starts, []);
  story.tick(1);
  await story.flush();
  story.audio.currentTime = .8;
  story.tick(800);
  assert.equal(story.player.volume, 60);
  story.skip();
  story.tick(storyFadeMs.briefingOut / 2);
  assert.equal(story.phase(), 'leaving');
  assert.ok(story.player.playing && story.player.volume > 0 && story.player.volume < 60);
  assert.deepEqual(story.transitions, []);
  story.tick(storyFadeMs.briefingOut / 2);
  assert.equal(story.phase(), 'returning');
  assert.deepEqual(story.transitions, ['reveal', 'finish']);
  story.unmount();
});

test('admin preview starts narration on the tap without muting the media element or rewinding', () => {
  const scene = 'korvessa-outro';
  const source = '/story/korvessa-outro.mp3';
  const playback = Promise.resolve(true);
  let primed;
  class PreviewPlayer {
    audio = { muted: false, loop: true, currentTime: 0 };
    constructor(src, volume) { this.currentSource = src; this.volume = volume; }
    play() {
      primed = { ...this.audio, volume: this.volume };
      this.audio.currentTime = .6;
      return playback;
    }
    close() {}
  }
  const preview = componentHost('src/pages/AdminStoryScenes.tsx', 'AdminStoryScenes', {
    onStartPreview() {},
  }, {
    adminText: text => text,
    BOSS_NAMES: ['Varneth', 'Korvessa'],
    levelStoryAtSector: () => undefined,
    bossStoryAtSector: () => undefined,
    bossOutroAtSector: sector => sector === 20 ? scene : undefined,
    storyScenes: {
      campaign: { chapterTitle: 'Campaign', timing: { duration: 70 } },
      [scene]: { audio: 'korvessa-outro.mp3', chapterTitle: 'Clear the Route', timing: { duration: 28.44 } },
    },
    localStorage: { getItem: () => null },
    MUSIC_STORAGE_KEY: 'music',
    readMusicVolume: () => 50,
    MusicPlayer: PreviewPlayer,
    StoryBriefing: Symbol('StoryBriefing'),
    useCallback: handler => handler,
    useLayoutEffect() {},
  });
  preview.nodes().find(node => node.type === 'button' &&
    node.props.children.some(child => child.props?.children.includes('Clear the Route'))).props.onClick();
  preview.render();
  const briefing = preview.nodes().find(node => node.type === preview.env.StoryBriefing);
  assert.equal(briefing.props.preview.playback, playback);
  assert.deepEqual(primed, { muted: false, loop: false, currentTime: 0, volume: 0 });
  const player = briefing.props.prepareAudio(source);
  assert.deepEqual(player.audio, { muted: false, loop: false, currentTime: .6 });
  assert.equal(briefing.props.prepareAudio('/other.mp3'), null);
  preview.unmount();
});

test('admin preview keeps its crawl and offers audio retry when the media ends too early', async () => {
  const story = setup({ preview: {}, artwork: true });
  await story.flush();
  assert.equal(story.phase(), 'briefing');
  assert.deepEqual(story.starts, [0]);
  story.audio.currentTime = .6;
  story.tick(600);
  story.audio.currentTime = definition.timing.duration;
  story.audio.ended = true;
  story.tick(16);
  assert.equal(story.phase(), 'briefing');
  story.audio.dispatchEvent(new Event('ended'));
  story.tick(1000);
  assert.ok(story.retry());
  assert.ok(story.drawings.at(-1) > .6 && story.drawings.at(-1) < 2);
  assert.deepEqual(story.transitions, []);
  story.tick(8400);
  assert.equal(story.phase(), 'leaving');
  story.tick(storyFadeMs.briefingOut);
  story.tick(storyFadeMs.gameIn);
  assert.deepEqual(story.transitions, ['reveal', 'finish']);
  story.unmount();
});

test('admin preview retains the tap playback request while a recording loads', async () => {
  let loaded;
  const playback = new Promise(resolve => { loaded = resolve; });
  const story = setup({ preview: { playback } });
  story.tick(5000);
  assert.equal(story.retry(), undefined);
  assert.deepEqual(story.starts, []);
  story.player.playing = true;
  loaded(true);
  await story.flush();
  story.audio.currentTime = 1;
  story.tick(1000);
  assert.equal(story.phase(), 'briefing');
  assert.equal(story.retry(), undefined);
  assert.ok(story.player.volume > 0);
  story.unmount();
});
