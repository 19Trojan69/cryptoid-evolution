import type { Locale } from '../../locales/config';
import type { StoryTiming } from './cinematic.js';
import type { StoryScene } from './storyScenes';
import translated from './storySubtitles.json';

const cueEnds: Record<StoryScene, readonly number[]> = {
  campaign: [9, 25, 33, 42, 44, 51, 65, 77, 84, 97, 106, 112],
  varneth: [3, 12, 18, 31, 35],
  'level-two': [11, 23, 30, 41, 46],
  korvessa: [7, 21, 30, 43, 50],
  'level-three': [10, 20, 37, 46, 51, 60],
};

export function storyCues(scene: StoryScene, timing: StoryTiming) {
  const words = timing.groups.flatMap(group => group.words);
  return cueEnds[scene].map((end, index, cueBoundaries) => {
    const first = cueBoundaries[index - 1] ?? 0;
    return {
      text: words.slice(first, end).map(word => word.text).join(' '),
      start: words[first].start,
      end: Math.min(words[end - 1].end + .62, words[end]?.start ?? timing.duration),
    };
  });
}

const translations: Partial<Record<Locale, Record<StoryScene, readonly string[]>>> = translated;
export const storySubtitle = (scene: StoryScene, locale: Locale, cue: number) => translations[locale]?.[scene][cue];
