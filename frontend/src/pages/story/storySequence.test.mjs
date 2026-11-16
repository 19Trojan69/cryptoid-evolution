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

test('the new voice tracks have complete timed captions in every selectable language', () => {
  for (const scene of ['korvessa-outro', 'drelvorn']) {
    const { audio, timing } = storyScenes[scene];
    assert.ok(statSync(new URL('../../../public/story/' + audio, import.meta.url)).size > 0);
    const cues = storyCues(scene, timing);
    assert.equal(cues.length, 6);
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
