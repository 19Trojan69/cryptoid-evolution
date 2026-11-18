import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

const { outputFiles } = buildSync({
  stdin: {
    contents: `
      export { bossOutroAtSector, bossStoryAtSector, levelStoryAtSector, storyScenes } from './storyScenes';
      export { loadStorySubtitles, storyCues } from './storyCaptions';
      export { supportedLanguages } from '../../locales/config';
      export { BOSS_NAMES } from '../bossNames';
    `,
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  write: false,
});
const { bossOutroAtSector, bossStoryAtSector, levelStoryAtSector, storyScenes,
  storyCues, loadStorySubtitles, supportedLanguages, BOSS_NAMES } =
  await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].contents).toString('base64'));

test('the campaign provides all 50 boss pairs and briefings 2 through 50 at their existing handoffs', () => {
  assert.equal(Object.keys(storyScenes).length, 150);
  assert.equal(levelStoryAtSector(1), undefined);
  assert.equal(storyScenes.campaign.audio, 'campaign-intro-phrased-v3.mp3');
  const openingBriefings = ['level-two', 'level-three', 'level-four', 'level-five', 'level-six', 'level-seven', 'level-eight', 'level-nine'];
  for (const [index, name] of BOSS_NAMES.entries()) {
    const level = index + 1;
    const sector = level * 10;
    const intro = bossStoryAtSector(sector);
    const outro = bossOutroAtSector(sector);
    const briefing = levelStoryAtSector(sector - 9);
    if (level > 1) assert.equal(briefing, openingBriefings[level - 2] ?? `level-${level}`);
    assert.equal(levelStoryAtSector(sector - 8), undefined);
    assert.equal(bossStoryAtSector(sector - 1), undefined);
    assert.equal(bossOutroAtSector(sector - 1), undefined);
    assert.equal(intro, name.toLowerCase());
    assert.equal(outro, intro + '-outro');
    assert.equal(storyScenes[intro].boss.id, level);
    assert.equal(storyScenes[intro].boss.name, name);
    assert.equal(storyScenes[outro].boss.id, level);
    assert.equal(storyScenes[outro].boss.name, name);
    const { outline, ship } = storyScenes[intro].boss;
    const publicPath = path => path.startsWith('/') ? path : '/story/' + path;
    for (const asset of [outline, ship]) {
      assert.ok(statSync(new URL('../../../public' + publicPath(asset), import.meta.url)).size > 0);
    }
  }
  assert.equal(levelStoryAtSector(501), undefined);
  assert.equal(bossStoryAtSector(510), undefined);
  assert.equal(bossOutroAtSector(510), undefined);
  assert.equal(storyScenes['drazevorn-outro'].chapterTitle, 'Earth, We Read You');
  assert.ok(storyScenes['drazevorn-outro'].timing.duration >= 65);
});

test('each recording has complete timed captions in every selectable language', async () => {
  const locales = Object.keys(supportedLanguages);
  const translations = new Map(await Promise.all(locales.map(async locale => [locale, await loadStorySubtitles(locale)])));
  assert.equal(locales.length, 19);
  assert.equal(translations.get('en'), undefined);
  const verified = new Set();
  for (const [scene, { audio, timing }] of Object.entries(storyScenes)) {
    assert.ok(statSync(new URL('../../../public/story/' + audio, import.meta.url)).size > 0);
    assert.ok(!verified.has(audio), scene + ' must have its own recording');
    verified.add(audio);
    const cues = storyCues(scene, timing);
    assert.equal(cues.map(cue => cue.text).join(' '), timing.groups.flatMap(group => group.words).map(word => word.text).join(' '));
    for (const [index, cue] of cues.entries()) {
      assert.ok(cue.start < cue.end && cue.end <= timing.duration, scene + ' has an invalid cue');
      assert.ok(!index || cues[index - 1].end <= cue.start);
    }
    for (const locale of locales.filter(locale => locale !== 'en')) {
      const text = translations.get(locale)?.[scene];
      assert.equal(text?.length, cues.length, `${scene} has incomplete ${locale} subtitles`);
      assert.ok(text.every(line => line.trim()), `${scene} has empty ${locale} subtitles`);
    }
  }
});

test('the campaign opening leaves a full speech pause after spam', () => {
  const words = storyScenes.campaign.timing.groups.flatMap(group => group.words);
  const stop = words.findIndex((word, index) => word.text === 'spam.' && words[index + 1]?.text === 'Forged');
  assert.ok(stop >= 0, 'the two original sentences must be consecutive');
  assert.ok(words[stop + 1].start - words[stop].end >= .85);
});

test('levels 13 through 32 use recorded narration at all three story handoffs', () => {
  for (let level = 13; level <= 32; level++) {
    const bossSector = level * 10;
    const handoffs = {
      briefing: levelStoryAtSector(bossSector - 9),
      intro: bossStoryAtSector(bossSector),
      outro: bossOutroAtSector(bossSector),
    };
    for (const [kind, scene] of Object.entries(handoffs)) {
      assert.equal(storyScenes[scene].audio, `recorded/level-${level}-${kind}.mp3`);
    }
  }
});

test('the voice tracks give cues audible separation and a quiet ending', () => {
  for (const [scene, { timing }] of Object.entries(storyScenes)) {
    if (scene === 'campaign') continue;
    const groups = timing.groups;
    assert.ok(groups[0].words[0].start >= .5, scene + ' has no lead-in');
    assert.ok(timing.duration - groups.at(-1).words.at(-1).end >= 1.6, scene + ' has no ending tail');
    for (const [index, group] of groups.slice(0, -1).entries()) {
      const next = groups[index + 1];
      assert.ok(next.words[0].start - group.words.at(-1).end >= .5, scene + ' needs an audible pause');
    }
  }
});
