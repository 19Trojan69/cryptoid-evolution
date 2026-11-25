export const BOSS_NFT_PREVIEW_ART_REVISION = "weapon-clearance-20261112";

export const bossNftEditions = {
  victory: { name: "Victory Edition", supply: 31_415 },
  holo: { name: "Holo Edition", supply: 3_141, pricePi: 14.9 },
} as const;

export const retroNftTerms = {
  copper: { supply: 31_414, pricePi: 2 },
  brass: { supply: 15_707, pricePi: 4 },
  silver: { supply: 7_854, pricePi: 6 },
  gold: { supply: 3_141, pricePi: 8 },
  platinum: { supply: 1_570, pricePi: 10 },
  diamond: { supply: 314, pricePi: 12 },
} as const;
