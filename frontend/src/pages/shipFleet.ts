import type { CSSProperties } from "react";
import type { CryptoidClass } from "./cryptoidRoster";

export const FLEET_IMAGE = "/ships/cryptoid-fleet.png";
export const SHIP_SKIN_KEY = "cryptoid_player_ship_skin";
export const SHIP_COLOR_KEY = "cryptoid_player_ship_color";
export const SHIP_OWNED_KEY = "cryptoid_owned_ship_skins";
export const SHARD_BALANCE_KEY = "cryptoid_shard_balance";

export const playerSkins = [
  { id: "grey-scout", name: "Grey Scout", sprite: 1, price: 0 },
  { id: "nova-wing", name: "Nova Wing", sprite: 0, price: 25 },
  { id: "solar-lance", name: "Solar Lance", sprite: 2, price: 35 },
  { id: "dark-delta", name: "Dark Delta", sprite: 3, price: 45 },
  { id: "gold-streak", name: "Gold Streak", sprite: 4, price: 55 },
  { id: "iron-guard", name: "Iron Guard", sprite: 5, price: 55 },
  { id: "vector", name: "Vector", sprite: 6, price: 60 },
  { id: "verdant", name: "Verdant", sprite: 7, price: 65 },
  { id: "storm-wing", name: "Storm Wing", sprite: 8, price: 70 },
  { id: "red-comet", name: "Red Comet", sprite: 9, price: 70 },
  { id: "twin-core", name: "Twin Core", sprite: 10, price: 75 },
  { id: "orbit-arc", name: "Orbit Arc", sprite: 11, price: 85 },
  { id: "night-guard", name: "Night Guard", sprite: 12, price: 85 },
  { id: "striker", name: "Striker", sprite: 13, price: 90 },
  { id: "cargo-hawk", name: "Cargo Hawk", sprite: 14, price: 95 },
  { id: "ring-flare", name: "Ring Flare", sprite: 15, price: 105 },
  { id: "sky-breaker", name: "Sky Breaker", sprite: 16, price: 110 },
  { id: "olive-fortress", name: "Olive Fortress", sprite: 17, price: 115 },
  { id: "pi-vanguard", name: "Pi Vanguard", sprite: 18, price: 125 },
  { id: "core-carrier", name: "Core Carrier", sprite: 19, price: 140 },
] as const;

export const playerColors = [
  { id: "violet", name: "Violet", hue: "0deg", glow: "#a56fe2" },
  { id: "cyan", name: "Cyan", hue: "-100deg", glow: "#61d6e9" },
  { id: "rose", name: "Rose", hue: "75deg", glow: "#e477ab" },
  { id: "amber", name: "Amber", hue: "-225deg", glow: "#e5b75e" },
] as const;

export type PlayerSkinId = (typeof playerSkins)[number]["id"];
export type PlayerColorId = (typeof playerColors)[number]["id"];

export const ownedSkins = (raw: string | null): PlayerSkinId[] => {
  try {
    const ids: unknown = JSON.parse(raw || "[]");
    return Array.isArray(ids) ? playerSkins.filter(skin => skin.price > 0 && ids.includes(skin.id)).map(skin => skin.id) : [];
  } catch { return []; }
};

export const shardBalance = (raw: string | null) => {
  const amount = Number(raw);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : 0;
};

export const buySkin = (id: PlayerSkinId, owned: readonly PlayerSkinId[], balance: number) => {
  const skin = playerSkins.find(item => item.id === id);
  if (!skin || skin.price === 0 || owned.includes(id) || !Number.isSafeInteger(balance) || balance < skin.price) return null;
  return { owned: [...owned, id], balance: balance - skin.price };
};

export const selectedShip = () => {
  const stored = playerSkins.find(item => item.id === localStorage.getItem(SHIP_SKIN_KEY));
  const skin = stored && (stored.price === 0 || ownedSkins(localStorage.getItem(SHIP_OWNED_KEY)).includes(stored.id)) ? stored : playerSkins[0];
  const color = playerColors.find(item => item.id === localStorage.getItem(SHIP_COLOR_KEY)) ?? playerColors[0];
  return { skin, color };
};

// The 20 cells retain the reference sheet's row-major order. Enemy and
// player graphics share silhouettes, but only the player carries a π coin.
const enemySprites: Record<CryptoidClass, readonly number[]> = {
  light: [0, 2, 4, 6, 9, 13, 16],
  medium: [1, 5, 7, 8, 12, 14, 17],
  heavy: [10, 19],
  elite: [3, 11, 15],
};

export const enemySprite = (shipClass: CryptoidClass, formationSlot: number) => {
  const choices = enemySprites[shipClass];
  return choices[Math.abs(formationSlot) % choices.length];
};

export const spriteStyle = (index: number): CSSProperties => ({
  backgroundImage: `url(${FLEET_IMAGE})`,
  backgroundPosition: `${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 25}%`,
});
