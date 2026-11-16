import type { Locale } from '../../locales/config';
import type { StoryTiming } from './cinematic.js';
import type { StoryScene } from './storyScenes';

const openingCueEnds = [9, 25, 33, 42, 44, 51, 65, 77, 84, 97, 106, 112];

export function storyCues(scene: StoryScene, timing: StoryTiming) {
  const words = timing.groups.flatMap(group => group.words);
  let wordCount = 0;
  const boundaries = scene === 'campaign' ? openingCueEnds : timing.groups.map(group => wordCount += group.words.length);
  return boundaries.map((end, index, cueBoundaries) => {
    const first = cueBoundaries[index - 1] ?? 0;
    return {
      text: words.slice(first, end).map(word => word.text).join(' '),
      start: words[first].start,
      end: Math.min(words[end - 1].end + .62, words[end]?.start ?? timing.duration),
    };
  });
}

export type StorySubtitles = Partial<Record<StoryScene, readonly string[]>>;

const subtitleLoaders: Partial<Record<Locale, () => Promise<{ default: StorySubtitles }>>> = {
  de: () => import('./subtitles/de.json'),
  es: () => import('./subtitles/es.json'),
  fr: () => import('./subtitles/fr.json'),
  pt: () => import('./subtitles/pt.json'),
  it: () => import('./subtitles/it.json'),
  pl: () => import('./subtitles/pl.json'),
  cs: () => import('./subtitles/cs.json'),
  sk: () => import('./subtitles/sk.json'),
  ru: () => import('./subtitles/ru.json'),
  uk: () => import('./subtitles/uk.json'),
  hr: () => import('./subtitles/hr.json'),
  sr: () => import('./subtitles/sr.json'),
  tr: () => import('./subtitles/tr.json'),
  hu: () => import('./subtitles/hu.json'),
  ro: () => import('./subtitles/ro.json'),
  th: () => import('./subtitles/th.json'),
  zh: () => import('./subtitles/zh.json'),
  vi: () => import('./subtitles/vi.json'),
};

export async function loadStorySubtitles(locale: Locale): Promise<StorySubtitles | undefined> {
  const load = subtitleLoaders[locale];
  return load ? (await load()).default : undefined;
}
