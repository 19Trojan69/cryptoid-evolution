import type { StoryPresentation, StoryTiming } from './cinematic.js';
import originalTiming from './storyTiming.json';
import chapterTwoTiming from './chapterTwoTiming.json';
import varnethMuzzles from './muzzles.json';
import korvessaMuzzles from './korvessaMuzzles.json';

export type StoryScene = 'campaign' | 'varneth' | 'level-two' | 'korvessa';

type BossStory = NonNullable<StoryPresentation['boss']> & {
  outline: string;
  ship: string;
  muzzles: typeof varnethMuzzles;
};

type StoryDefinition = StoryPresentation & {
  title: string;
  audio: string;
  timing: StoryTiming;
  boss?: BossStory;
};

export const storyScenes: Record<StoryScene, StoryDefinition> = {
  campaign: {
    title: 'Cryptoid Evolution',
    heading: 'CRYPTOID EVOLUTION',
    audio: 'campaign-intro.mp3',
    timing: originalTiming.campaign,
  },
  varneth: {
    title: 'Varneth',
    heading: 'CRYPTOID EVOLUTION',
    audio: 'varneth-intro.mp3',
    timing: originalTiming.varneth,
    boss: { id: 1, name: 'Varneth', subtitle: 'The Spam Broadcaster', outline: 'outline.webp', ship: 'ship.webp', muzzles: varnethMuzzles },
  },
  'level-two': {
    title: 'Level 2',
    heading: 'LEVEL 02',
    audio: 'level-two-intro.mp3',
    timing: chapterTwoTiming['level-two'],
  },
  korvessa: {
    title: 'Korvessa',
    heading: 'INCOMING TRANSMISSION',
    audio: 'korvessa-intro.mp3',
    timing: chapterTwoTiming.korvessa,
    boss: { id: 2, name: 'Korvessa', subtitle: 'The Mask Bearer', outline: 'korvessa-outline.webp', ship: 'korvessa-ship.webp', muzzles: korvessaMuzzles },
  },
};

export function bossStoryAtSector(sector: number): StoryScene | undefined {
  if (sector === 10) return 'varneth';
  if (sector === 20) return 'korvessa';
}
