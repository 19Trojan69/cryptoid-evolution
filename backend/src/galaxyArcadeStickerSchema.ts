export const arcadeLaunchKey = "cryptoid_testnet_arcade_run";
export const arcadeRunId = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
export const arcadeRankIds = ["copper", "brass", "silver", "gold", "platinum", "diamond"] as const;
export const arcadeStickerAlbumName = "Retro Games Sticker Album";
export const arcadeStickerNftPricePi = 5;
export const arcadeStickerImage = /^data:image[/]png;base64,[a-z0-9+/=]{1,24000}$/i;
export const arcadeStickerStore = {
  database: "cryptoid_testnet_arcade_stickers",
  version: 1,
  store: "stickers",
  keyPath: ["owner", "level", "rank"],
};

export type ArcadeSticker = {
  owner: string;
  level: number;
  rank: number;
  modelId: string;
  shipName: string;
  stage: 1 | 2 | 3;
  colorId: string;
  image: string;
};
