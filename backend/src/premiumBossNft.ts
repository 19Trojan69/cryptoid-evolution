import { premiumBossScenes } from "./premiumBossScenes";
import { standardShips } from "./playerSave";
import { BOSS_STICKER_COUNT, readRewardProgress } from "./rewardRules";

export const premiumBossEditions = {
  platinum: { name: "Platinum Edition", pricePi: 25, supply: 628, requiredWins: 2, stage: 2 },
  diamond: { name: "Diamond Edition", pricePi: 50, supply: 314, requiredWins: 3, stage: 3 },
} as const;

export type PremiumBossEdition = keyof typeof premiumBossEditions;

export const isPremiumBossEdition = (edition: string): edition is PremiumBossEdition =>
  edition === "platinum" || edition === "diamond";

const platinumFleet = standardShips.filter(ship => ship !== "pi-vanguard");
export function premiumBossCard(bossId: number, edition: PremiumBossEdition) {
  if (!Number.isInteger(bossId) || bossId < 1 || bossId > BOSS_STICKER_COUNT) return;
  const diamond = edition === "diamond";
  const slot = bossId - 1;
  const platinumShip = bossId === 1 ? "solar-lance" : platinumFleet[(slot * 5 + 2) % platinumFleet.length];
  const candidate = standardShips[(slot * 7 + 6) % standardShips.length];
  const shipId = diamond
    ? bossId === 1 ? "pi-vanguard" : candidate === platinumShip ? standardShips[(slot * 7 + 7) % standardShips.length] : candidate
    : platinumShip;
  const [platinumBattle, platinumStory, diamondBattle, diamondStory] = premiumBossScenes[slot];
  const battle = diamond ? diamondBattle : platinumBattle;
  const story = diamond ? diamondStory : platinumStory;
  const battleIndex = slot * 3 + Number(diamond);
  return {
    id: `boss-${String(bossId).padStart(2, "0")}-${edition}`,
    bossId, edition, shipId, battle, story, battleIndex,
    showFullPreview: bossId === 1,
    ...premiumBossEditions[edition],
  };
}

export function premiumBossEligibility(bossId: number, edition: PremiumBossEdition, progress: unknown) {
  const wins = readRewardProgress(JSON.stringify(progress ?? {})).bossWins[bossId] ?? 0;
  return { wins, eligible: wins >= premiumBossEditions[edition].requiredWins };
}
