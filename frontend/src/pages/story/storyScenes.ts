import type { StoryPresentation, StoryTiming } from './cinematic.js';
import { bossName } from '../bossNames';
import originalTiming from './storyTiming.json';
import robotCampaign from './robotCampaign.json';
import varnethMuzzles from './muzzles.json';
import korvessaMuzzles from './korvessaMuzzles.json';

type RobotScene = keyof typeof robotCampaign;
export type StoryScene = 'campaign' | RobotScene;

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

type RobotRecording = Omit<StoryDefinition, 'boss'> & {
  level: number;
  kind: 'briefing' | 'intro' | 'outro';
  bossSubtitle?: string;
};

const sceneIds = {
  briefing: new Map<number, RobotScene>(),
  intro: new Map<number, RobotScene>(),
  outro: new Map<number, RobotScene>(),
};

function storyBoss(level: number, subtitle: string): BossStory {
  const name = bossName(level);
  if (level === 1) return { id: level, name, subtitle, outline: 'outline.webp', ship: 'ship.webp', muzzles: varnethMuzzles };
  if (level === 2) return { id: level, name, subtitle, outline: 'korvessa-outline.webp', ship: 'korvessa-ship.webp', muzzles: korvessaMuzzles };
  return {
    id: level,
    name,
    subtitle,
    outline: `${name.toLowerCase()}-outline.webp`,
    ship: `/ships/bosses/evolved/boss-${String(level).padStart(2, '0')}-hull.webp`,
  };
}

const recordings = Object.entries(robotCampaign) as [RobotScene, RobotRecording][];
const newScenes = Object.fromEntries(recordings.map(([id, { level, kind, bossSubtitle, ...definition }]) => {
  sceneIds[kind].set(level, id);
  return [id, kind === 'briefing' ? definition : { ...definition, boss: storyBoss(level, bossSubtitle ?? '') }];
})) as Record<RobotScene, StoryDefinition>;

export const storyScenes: Record<StoryScene, StoryDefinition> = {
  campaign: {
    title: 'Cryptoid Evolution',
    chapterTitle: 'Cleared for Launch',
    heading: 'CRYPTOID EVOLUTION',
    audio: 'campaign-intro-phrased-v2.mp3',
    timing: originalTiming.campaign,
  },
  ...newScenes,
};

export function levelStoryAtSector(sector: number): StoryScene | undefined {
  return sector % 10 === 1 ? sceneIds.briefing.get((sector - 1) / 10 + 1) : undefined;
}

export function bossStoryAtSector(sector: number): StoryScene | undefined {
  return sector % 10 === 0 ? sceneIds.intro.get(sector / 10) : undefined;
}

export function bossOutroAtSector(sector: number): StoryScene | undefined {
  return sector % 10 === 0 ? sceneIds.outro.get(sector / 10) : undefined;
}
