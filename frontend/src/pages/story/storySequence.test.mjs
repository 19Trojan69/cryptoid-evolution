import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

const { outputFiles } = buildSync({
  stdin: {
    contents: `
      export { bossOutroAtSector, bossStoryAtSector, levelStoryAtSector, storyScenes } from './storyScenes';
      export { storyCues, storySubtitle } from './storyCaptions';
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
  storyCues, storySubtitle, supportedLanguages, BOSS_NAMES } = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].contents).toString('base64'));

test('each registered boss story and briefing appears at the correct campaign sector', () => {
  const briefings = [undefined, 'level-two', 'level-three', 'level-four', 'level-five'];
  for (const [index, name] of BOSS_NAMES.entries()) {
    const level = index + 1;
    const sector = level * 10;
    const intro = bossStoryAtSector(sector);
    const outro = bossOutroAtSector(sector);
    const briefing = levelStoryAtSector(sector - 9);
    assert.equal(briefing, briefings[index]);
    assert.equal(bossStoryAtSector(sector - 1), undefined);
    assert.equal(bossOutroAtSector(sector - 1), undefined);
    if (level > 5) {
      assert.equal(intro, undefined);
      assert.equal(outro, undefined);
      continue;
    }
    assert.equal(intro, name.toLowerCase());
    assert.equal(outro, intro + '-outro');
    assert.equal(storyScenes[intro].boss.id, level);
    assert.equal(storyScenes[intro].boss.name, name);
    if (intro === 'zeraveth') {
      for (const [scene, title] of [[intro, 'Intro Zeraveth'], [outro, 'Outro Zeraveth']]) {
        assert.equal(storyScenes[scene].title, title);
        assert.equal(storyScenes[scene].chapterTitle, title);
        assert.equal(storyScenes[scene].heading, title);
      }
    } else {
      assert.ok(storyScenes[outro].title.startsWith(name + ' · '));
    }
  }
  assert.equal(levelStoryAtSector(501), undefined);
});

test('every voice track has complete timed captions in every selectable language', () => {
  for (const [scene, { audio, timing }] of Object.entries(storyScenes)) {
    assert.ok(statSync(new URL('../../../public/story/' + audio, import.meta.url)).size > 0);
    const cues = storyCues(scene, timing);
    assert.equal(cues.map(cue => cue.text).join(' '), timing.groups.flatMap(group => group.words).map(word => word.text).join(' '));
    for (const [index, cue] of cues.entries()) {
      assert.ok(cue.start < cue.end && cue.end <= timing.duration);
      assert.ok(!index || cues[index - 1].end <= cue.start);
      for (const locale of Object.keys(supportedLanguages)) {
        const text = storySubtitle(scene, locale, index);
        if (locale === 'en') assert.equal(text, undefined);
        else assert.ok(text?.trim(), `${scene} is missing ${locale} cue ${index + 1}`);
      }
    }
  }
});

test('corrected sentence pauses separate the spoken phrases on the caption clock', () => {
  const boundaries = [
    ['campaign', 'spam.', 'Forged'],
    ['campaign', 'accounts.', 'With'],
    ['varneth', 'confirmed.', 'Varneth.'],
    ['level-two', 'there.', 'Pilot,'],
    ['level-three', 'down.', 'Every'],
    ['level-five', 'reach…', 'Pilot.'],
  ];
  for (const [scene, stop, next] of boundaries) {
    const words = storyScenes[scene].timing.groups.flatMap(group => group.words);
    const index = words.findIndex((word, i) => word.text === stop && words[i + 1]?.text === next);
    assert.ok(index >= 0, `${scene} is missing ${stop} ${next}`);
    assert.ok(words[index + 1].start - words[index].end >= .4, `${scene} needs a pause after ${stop}`);
  }
});

test('the new recordings give each sentence its own audible pause', () => {
  for (const scene of ['varneth-outro', 'drelvorn-outro', 'level-four', 'talvrek', 'talvrek-outro', 'level-five', 'zeraveth', 'zeraveth-outro']) {
    const words = storyScenes[scene].timing.groups.flatMap(group => group.words);
    for (const [index, word] of words.slice(0, -1).entries()) {
      if (/[.!?]$/.test(word.text)) {
        assert.ok(words[index + 1].start - word.end >= .5, `${scene} needs a pause after ${word.text}`);
      }
    }
  }
});
