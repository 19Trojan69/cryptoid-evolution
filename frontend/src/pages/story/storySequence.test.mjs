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
    `,
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  write: false,
});
const { bossOutroAtSector, bossStoryAtSector, levelStoryAtSector, storyScenes,
  storyCues, storySubtitle, supportedLanguages } = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].contents).toString('base64'));

test('Korvessa’s victory, the next level, and Drelvorn use their own story scenes', () => {
  assert.equal(bossStoryAtSector(20), 'korvessa');
  assert.equal(bossOutroAtSector(20), 'korvessa-outro');
  assert.equal(levelStoryAtSector(21), 'level-three');
  assert.equal(bossStoryAtSector(30), 'drelvorn');
  assert.equal(bossOutroAtSector(30), undefined);
  assert.equal(storyScenes.drelvorn.boss.id, 3);
  assert.equal(storyScenes.drelvorn.boss.name, 'Drelvorn');
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
  ];
  for (const [scene, stop, next] of boundaries) {
    const words = storyScenes[scene].timing.groups.flatMap(group => group.words);
    const index = words.findIndex((word, i) => word.text === stop && words[i + 1]?.text === next);
    assert.ok(index >= 0, `${scene} is missing ${stop} ${next}`);
    assert.ok(words[index + 1].start - words[index].end >= .4, `${scene} needs a pause after ${stop}`);
  }
});
