import type { StoryPresentation, StoryTiming } from './cinematic.js';
import { bossName } from '../bossNames';
import originalTiming from './storyTiming.json';
import chapterTwoTiming from './chapterTwoTiming.json';
import levelThreeTiming from './levelThreeTiming.json';
import continuationTiming from './continuationTiming.json';
import genesisTiming from './genesisTiming.json';
import varnethMuzzles from './muzzles.json';
import korvessaMuzzles from './korvessaMuzzles.json';

export type StoryScene =
  | 'campaign'
  | 'varneth' | 'varneth-outro'
  | 'level-two' | 'korvessa' | 'korvessa-outro'
  | 'level-three' | 'drelvorn' | 'drelvorn-outro'
  | 'level-four' | 'talvrek' | 'talvrek-outro';

type BossStory = NonNullable<StoryPresentation['boss']> & {
  outline: string;
  ship: string;
  muzzles?: typeof varnethMuzzles;
};

type StoryDefinition = StoryPresentation & {
  title: string;
  audio: string;
  timing: StoryTiming;
  boss?: BossStory;
};

const varneth: BossStory = {
  id: 1, name: bossName(1), subtitle: 'The Spam Broadcaster',
  outline: 'outline.webp', ship: 'ship.webp',
};
const korvessa: BossStory = {
  id: 2, name: bossName(2), subtitle: 'The Mask Bearer',
  outline: 'korvessa-outline.webp', ship: 'korvessa-ship.webp',
};
const drelvorn: BossStory = {
  id: 3, name: bossName(3), subtitle: 'The Seal Thief',
  outline: 'drelvorn-outline.webp', ship: '/ships/bosses/evolved/boss-03-hull.webp',
};
const talvrek: BossStory = {
  id: 4, name: bossName(4), subtitle: 'The Chronicle Forger',
  outline: 'talvrek-outline.webp', ship: '/ships/bosses/evolved/boss-04-hull.webp',
};

export const storyScenes: Record<StoryScene, StoryDefinition> = {
  campaign: {
    title: 'Cryptoid Evolution',
    heading: 'CRYPTOID EVOLUTION',
    audio: 'campaign-intro-phrased.mp3',
    timing: originalTiming.campaign,
  },
  varneth: {
    title: varneth.name,
    heading: 'CRYPTOID EVOLUTION',
    audio: 'varneth-intro-phrased.mp3',
    timing: originalTiming.varneth,
    boss: { ...varneth, muzzles: varnethMuzzles },
  },
  'varneth-outro': {
    title: `${varneth.name} · The First Reply`,
    heading: 'THE FIRST REPLY',
    audio: 'varneth-outro.mp3',
    timing: genesisTiming['varneth-outro'],
    boss: varneth,
  },
  'level-two': {
    title: 'Level 2',
    heading: 'LEVEL 02',
    audio: 'level-two-intro-phrased.mp3',
    timing: chapterTwoTiming['level-two'],
  },
  korvessa: {
    title: korvessa.name,
    heading: 'INCOMING TRANSMISSION',
    audio: 'korvessa-intro.mp3',
    timing: chapterTwoTiming.korvessa,
    boss: { ...korvessa, muzzles: korvessaMuzzles },
  },
  'korvessa-outro': {
    title: `${korvessa.name} · Clear the Route`,
    heading: 'CLEAR THE ROUTE',
    audio: 'korvessa-outro.mp3',
    timing: continuationTiming['korvessa-outro'],
  },
  'level-three': {
    title: 'Level 3',
    heading: 'LEVEL 03',
    audio: 'level-three-intro-phrased.mp3',
    timing: levelThreeTiming,
  },
  drelvorn: {
    title: drelvorn.name,
    heading: 'INCOMING TRANSMISSION',
    audio: 'drelvorn-intro.mp3',
    timing: continuationTiming.drelvorn,
    boss: drelvorn,
  },
  'drelvorn-outro': {
    title: `${drelvorn.name} · Seal Revoked`,
    heading: 'SEAL REVOKED',
    audio: 'drelvorn-outro.mp3',
    timing: genesisTiming['drelvorn-outro'],
    boss: drelvorn,
  },
  'level-four': {
    title: 'Level 4',
    heading: 'LEVEL 04',
    audio: 'level-four.mp3',
    timing: genesisTiming['level-four'],
  },
  talvrek: {
    title: talvrek.name,
    heading: 'INCOMING TRANSMISSION',
    audio: 'talvrek.mp3',
    timing: genesisTiming.talvrek,
    boss: talvrek,
  },
  'talvrek-outro': {
    title: `${talvrek.name} · Names on the Roll`,
    heading: 'NAMES ON THE ROLL',
    audio: 'talvrek-outro.mp3',
    timing: genesisTiming['talvrek-outro'],
    boss: talvrek,
  },
};

export function levelStoryAtSector(sector: number): StoryScene | undefined {
  if (sector === 11) return 'level-two';
  if (sector === 21) return 'level-three';
  if (sector === 31) return 'level-four';
}

export function bossStoryAtSector(sector: number): StoryScene | undefined {
  if (sector === 10) return 'varneth';
  if (sector === 20) return 'korvessa';
  if (sector === 30) return 'drelvorn';
  if (sector === 40) return 'talvrek';
}

export function bossOutroAtSector(sector: number): StoryScene | undefined {
  if (sector === 10) return 'varneth-outro';
  if (sector === 20) return 'korvessa-outro';
  if (sector === 30) return 'drelvorn-outro';
  if (sector === 40) return 'talvrek-outro';
}
