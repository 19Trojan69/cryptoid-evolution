import { axiosClient } from '../../lib/axiosClient';
import { prepareBossOutroSound } from '../cardSound';
import type { StoryTiming } from './cinematic.js';

export type BossOutroReward = {
  bossId: number;
  owner: string;
  runId: string;
  saving: Promise<unknown>;
};

type OutroCard = { webp: string; newlyUnlocked: boolean };
type OutroCardResponse = { owner: string; id: number; card: OutroCard | null };

const turnMs = 1190;
const ease = (n: number) => n * n * (3 - 2 * n);

export function bossOutroReveal(timing: StoryTiming, readyAt: number, newlyUnlocked: boolean) {
  const earliest = Math.max(2000, readyAt) + turnMs;
  if (newlyUnlocked) {
    for (const [index, group] of timing.groups.entries()) {
      const spokenEnd = Math.round(group.words.at(-1)!.end * 1000);
      const faceAt = spokenEnd + 58;
      const nextLine = timing.groups[index + 1]?.words[0].start ?? timing.duration;
      const audioUntil = Math.round(nextLine * 1000) - 12;
      if (faceAt >= earliest && audioUntil - faceAt >= 630) {
        return { turnAt: faceAt - turnMs, faceAt, audioUntil };
      }
    }
  }
  const faceAt = Math.min(Math.max(4550, earliest), timing.duration * 1000 - 100);
  return { turnAt: Math.max(readyAt, faceAt - turnMs), faceAt, audioUntil: 0 };
}

async function loadCard(reward: BossOutroReward, signal: AbortSignal) {
  const load = () => axiosClient.get<OutroCardResponse>(`/boss-nft-preview/outro/${reward.bossId}`, {
    params: { run: reward.runId }, timeout: 4000, signal,
  }).then(({ data }) => data.owner === reward.owner && data.id === reward.bossId ? data.card : undefined);
  let card = await load();
  if (card === null) {
    await reward.saving;
    if (!signal.aborted) card = await load();
  }
  return card;
}

export function createBossOutroCard(image: HTMLImageElement, notice: HTMLParagraphElement, timing: StoryTiming, reward: BossOutroReward) {
  const controller = new AbortController();
  const { signal } = controller;
  let unlocked: boolean | undefined;
  let preparedSound: Awaited<ReturnType<typeof prepareBossOutroSound>>;
  let reveal: ReturnType<typeof bossOutroReveal> | undefined;
  let faceVisible = false;

  void loadCard(reward, signal).then(async card => {
    if (signal.aborted || !card || typeof card.webp !== 'string' || !card.webp.startsWith('UklGR')) return;
    image.src = 'data:image/webp;base64,' + card.webp;
    const newCard = card.newlyUnlocked === true;
    if (newCard) void prepareBossOutroSound(signal).then(sound => { preparedSound = sound; }).catch(() => {});
    await image.decode();
    if (signal.aborted) return;
    unlocked = newCard;
  }).catch(() => { /* The outro continues with the original narration and crawl. */ });

  return {
    draw(ms: number, reduced: boolean) {
      if (unlocked === undefined) return;
      reveal ??= bossOutroReveal(timing, ms, unlocked);
      if (ms < reveal.turnAt || (reduced && ms < reveal.faceAt)) return;
      if (!faceVisible) {
        image.hidden = false;
        if (ms < reveal.faceAt) {
          const open = ease((ms - reveal.turnAt) / (reveal.faceAt - reveal.turnAt));
          image.style.transform = `perspective(80vmin) translateY(${(1 - open) * 1.1}dvh) rotateY(${-88 * (1 - open)}deg)`;
          image.style.opacity = String(ease(Math.min(1, (ms - reveal.turnAt) / 470)));
          return;
        }
        faceVisible = true;
        image.style.removeProperty('transform');
        image.style.removeProperty('opacity');
        if (unlocked) {
          notice.hidden = false;
          try { preparedSound?.play(reveal.audioUntil - ms); } catch { /* Audio output is optional. */ }
        }
      }
      if (!notice.hidden) {
        const elapsed = ms - reveal.faceAt;
        if (elapsed >= 2850) notice.hidden = true;
        else if (!reduced) notice.style.opacity = String(Math.min(1, elapsed / 220, (2850 - elapsed) / 500));
      }
    },
    stopSound: () => preparedSound?.stop(),
    dispose() {
      controller.abort();
      preparedSound?.stop();
      image.hidden = notice.hidden = true;
      image.removeAttribute('src');
      image.removeAttribute('style');
      notice.removeAttribute('style');
    },
  };
}
