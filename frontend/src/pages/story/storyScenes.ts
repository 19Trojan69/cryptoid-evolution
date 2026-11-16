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
  | 'level-four' | 'talvrek' | 'talvrek-outro'
  | 'level-five' | 'zeraveth' | 'zeraveth-outro'
  | 'level-six' | 'orvask' | 'orvask-outro'
  | 'level-seven' | 'keldrava' | 'keldrava-outro'
  | 'level-eight' | 'veshkorn' | 'veshkorn-outro'
  | 'level-nine' | 'neravoss' | 'neravoss-outro';

type BossStory = NonNullable<StoryPresentation['boss']> & {
  outline: string;
  ship: string;
  muzzles?: typeof varnethMuzzles;
};

type StoryDefinition = StoryPresentation & {
  title: string;
  chapterTitle: string;
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
const zeraveth: BossStory = {
  id: 5, name: bossName(5), subtitle: 'The Node Besieger',
  outline: 'zeraveth-outline.webp', ship: '/ships/bosses/evolved/boss-05-hull.webp',
};
const zeravethIntroTitle = `Intro ${zeraveth.name}`;
const zeravethOutroTitle = `Outro ${zeraveth.name}`;
const orvask: BossStory = {
  id: 6, name: bossName(6), subtitle: 'The Echo Hunter',
  outline: 'orvask-outline.webp', ship: '/ships/bosses/evolved/boss-06-hull.webp',
};
const orvaskIntroTitle = `Intro ${orvask.name}`;
const orvaskOutroTitle = `Outro ${orvask.name}`;
const keldrava: BossStory = {
  id: 7, name: bossName(7), subtitle: 'The Shadow Bridge',
  outline: 'keldrava-outline.webp', ship: '/ships/bosses/evolved/boss-07-hull.webp',
};
const keldravaIntroTitle = `Intro ${keldrava.name}`;
const keldravaOutroTitle = `Outro ${keldrava.name}`;
const veshkorn: BossStory = {
  id: 8, name: bossName(8), subtitle: 'The Rumour Carrier',
  outline: 'veshkorn-outline.webp', ship: '/ships/bosses/evolved/boss-08-hull.webp',
};
const veshkornIntroTitle = `Intro ${veshkorn.name}`;
const veshkornOutroTitle = `Outro ${veshkorn.name}`;
const neravoss: BossStory = {
  id: 9, name: bossName(9), subtitle: 'The Balance Illusionist',
  outline: 'neravoss-outline.webp', ship: '/ships/bosses/evolved/boss-09-hull.webp',
};
const neravossIntroTitle = `Intro ${neravoss.name}`;
const neravossOutroTitle = `Outro ${neravoss.name}`;

export const storyScenes: Record<StoryScene, StoryDefinition> = {
  campaign: {
    title: 'Cryptoid Evolution',
    chapterTitle: 'Cleared for Launch',
    heading: 'CRYPTOID EVOLUTION',
    audio: 'campaign-intro-phrased.mp3',
    timing: originalTiming.campaign,
  },
  varneth: {
    title: varneth.name,
    chapterTitle: 'Cut That Signal',
    heading: 'CRYPTOID EVOLUTION',
    audio: 'varneth-intro-phrased.mp3',
    timing: originalTiming.varneth,
    boss: { ...varneth, muzzles: varnethMuzzles },
  },
  'varneth-outro': {
    title: `${varneth.name} · The First Reply`,
    chapterTitle: 'The First Reply',
    heading: 'THE FIRST REPLY',
    audio: 'varneth-outro.mp3',
    timing: genesisTiming['varneth-outro'],
    boss: varneth,
  },
  'level-two': {
    title: 'Level 2',
    chapterTitle: 'Bring Those Crews Home',
    heading: 'LEVEL 02',
    audio: 'level-two-intro-phrased.mp3',
    timing: chapterTwoTiming['level-two'],
  },
  korvessa: {
    title: korvessa.name,
    chapterTitle: 'Open a Way Home',
    heading: 'INCOMING TRANSMISSION',
    audio: 'korvessa-intro.mp3',
    timing: chapterTwoTiming.korvessa,
    boss: { ...korvessa, muzzles: korvessaMuzzles },
  },
  'korvessa-outro': {
    title: `${korvessa.name} · Clear the Route`,
    chapterTitle: 'Clear the Route',
    heading: 'CLEAR THE ROUTE',
    audio: 'korvessa-outro.mp3',
    timing: continuationTiming['korvessa-outro'],
  },
  'level-three': {
    title: 'Level 3',
    chapterTitle: 'Stay on the Trail',
    heading: 'LEVEL 03',
    audio: 'level-three-intro-phrased.mp3',
    timing: levelThreeTiming,
  },
  drelvorn: {
    title: drelvorn.name,
    chapterTitle: 'Buy Us Time',
    heading: 'INCOMING TRANSMISSION',
    audio: 'drelvorn-intro.mp3',
    timing: continuationTiming.drelvorn,
    boss: drelvorn,
  },
  'drelvorn-outro': {
    title: `${drelvorn.name} · Seal Revoked`,
    chapterTitle: 'Seal Revoked',
    heading: 'SEAL REVOKED',
    audio: 'drelvorn-outro.mp3',
    timing: genesisTiming['drelvorn-outro'],
    boss: drelvorn,
  },
  'level-four': {
    title: 'Level 4',
    chapterTitle: 'The Missing Ledger',
    heading: 'LEVEL 04',
    audio: 'level-four.mp3',
    timing: genesisTiming['level-four'],
  },
  talvrek: {
    title: talvrek.name,
    chapterTitle: 'What the Books Say',
    heading: 'INCOMING TRANSMISSION',
    audio: 'talvrek.mp3',
    timing: genesisTiming.talvrek,
    boss: talvrek,
  },
  'talvrek-outro': {
    title: `${talvrek.name} · Names on the Roll`,
    chapterTitle: 'Names on the Roll',
    heading: 'NAMES ON THE ROLL',
    audio: 'talvrek-outro.mp3',
    timing: genesisTiming['talvrek-outro'],
    boss: talvrek,
  },
  'level-five': {
    title: 'Level 5',
    chapterTitle: 'A Station in the Dark',
    heading: 'LEVEL 05',
    audio: 'level-five.mp3',
    timing: genesisTiming['level-five'],
  },
  zeraveth: {
    title: zeravethIntroTitle,
    chapterTitle: zeravethIntroTitle,
    heading: zeravethIntroTitle,
    audio: 'zeraveth-intro.mp3',
    timing: genesisTiming.zeraveth,
    boss: zeraveth,
  },
  'zeraveth-outro': {
    title: zeravethOutroTitle,
    chapterTitle: zeravethOutroTitle,
    heading: zeravethOutroTitle,
    audio: 'zeraveth-outro.mp3',
    timing: genesisTiming['zeraveth-outro'],
    boss: zeraveth,
  },
  'level-six': {
    title: 'Level 6',
    chapterTitle: 'An Old Clearance',
    heading: 'LEVEL 06',
    audio: 'level-six.mp3',
    timing: genesisTiming['level-six'],
  },
  orvask: {
    title: orvaskIntroTitle,
    chapterTitle: orvaskIntroTitle,
    heading: orvaskIntroTitle,
    audio: 'orvask-intro.mp3',
    timing: genesisTiming.orvask,
    boss: orvask,
  },
  'orvask-outro': {
    title: orvaskOutroTitle,
    chapterTitle: orvaskOutroTitle,
    heading: orvaskOutroTitle,
    audio: 'orvask-outro.mp3',
    timing: genesisTiming['orvask-outro'],
    boss: orvask,
  },
  'level-seven': {
    title: 'Level 7',
    chapterTitle: 'Two Ends of the Route',
    heading: 'LEVEL 07',
    audio: 'level-seven.mp3',
    timing: genesisTiming['level-seven'],
  },
  keldrava: {
    title: keldravaIntroTitle,
    chapterTitle: keldravaIntroTitle,
    heading: keldravaIntroTitle,
    audio: 'keldrava-intro.mp3',
    timing: genesisTiming.keldrava,
    boss: keldrava,
  },
  'keldrava-outro': {
    title: keldravaOutroTitle,
    chapterTitle: keldravaOutroTitle,
    heading: keldravaOutroTitle,
    audio: 'keldrava-outro.mp3',
    timing: genesisTiming['keldrava-outro'],
    boss: keldrava,
  },
  'level-eight': {
    title: 'Level 8',
    chapterTitle: 'Two People Who Were There',
    heading: 'LEVEL 08',
    audio: 'level-eight.mp3',
    timing: genesisTiming['level-eight'],
  },
  veshkorn: {
    title: veshkornIntroTitle,
    chapterTitle: veshkornIntroTitle,
    heading: veshkornIntroTitle,
    audio: 'veshkorn-intro.mp3',
    timing: genesisTiming.veshkorn,
    boss: veshkorn,
  },
  'veshkorn-outro': {
    title: veshkornOutroTitle,
    chapterTitle: veshkornOutroTitle,
    heading: veshkornOutroTitle,
    audio: 'veshkorn-outro.mp3',
    timing: genesisTiming['veshkorn-outro'],
    boss: veshkorn,
  },
  'level-nine': {
    title: 'Level 9',
    chapterTitle: 'No Weight on the Scales',
    heading: 'LEVEL 09',
    audio: 'level-nine.mp3',
    timing: genesisTiming['level-nine'],
  },
  neravoss: {
    title: neravossIntroTitle,
    chapterTitle: neravossIntroTitle,
    heading: neravossIntroTitle,
    audio: 'neravoss-intro.mp3',
    timing: genesisTiming.neravoss,
    boss: neravoss,
  },
  'neravoss-outro': {
    title: neravossOutroTitle,
    chapterTitle: neravossOutroTitle,
    heading: neravossOutroTitle,
    audio: 'neravoss-outro.mp3',
    timing: genesisTiming['neravoss-outro'],
    boss: neravoss,
  },
};

export function levelStoryAtSector(sector: number): StoryScene | undefined {
  if (sector === 11) return 'level-two';
  if (sector === 21) return 'level-three';
  if (sector === 31) return 'level-four';
  if (sector === 41) return 'level-five';
  if (sector === 51) return 'level-six';
  if (sector === 61) return 'level-seven';
  if (sector === 71) return 'level-eight';
  if (sector === 81) return 'level-nine';
}

export function bossStoryAtSector(sector: number): StoryScene | undefined {
  if (sector === 10) return 'varneth';
  if (sector === 20) return 'korvessa';
  if (sector === 30) return 'drelvorn';
  if (sector === 40) return 'talvrek';
  if (sector === 50) return 'zeraveth';
  if (sector === 60) return 'orvask';
  if (sector === 70) return 'keldrava';
  if (sector === 80) return 'veshkorn';
  if (sector === 90) return 'neravoss';
}

export function bossOutroAtSector(sector: number): StoryScene | undefined {
  if (sector === 10) return 'varneth-outro';
  if (sector === 20) return 'korvessa-outro';
  if (sector === 30) return 'drelvorn-outro';
  if (sector === 40) return 'talvrek-outro';
  if (sector === 50) return 'zeraveth-outro';
  if (sector === 60) return 'orvask-outro';
  if (sector === 70) return 'keldrava-outro';
  if (sector === 80) return 'veshkorn-outro';
  if (sector === 90) return 'neravoss-outro';
}
