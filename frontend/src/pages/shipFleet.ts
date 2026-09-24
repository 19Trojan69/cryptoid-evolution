import type { CSSProperties } from "react";
import type { CryptoidClass } from "./cryptoidRoster";

export const FLEET_IMAGE = "/ships/cryptoid-fleet.png";
export const SHIP_SKIN_KEY = "cryptoid_player_ship_skin";
export const SHIP_COLOR_KEY = "cryptoid_player_ship_color";

export const playerSkins = [
  { id: "pi-vanguard", name: "Pi Vanguard", sprite: 18 },
  { id: "nova-wing", name: "Nova Wing", sprite: 0 },
  { id: "vector", name: "Vector", sprite: 6 },
  { id: "striker", name: "Striker", sprite: 13 },
] as const;

export const playerColors = [
  { id: "violet", name: "Violet", hue: "0deg", glow: "#a56fe2" },
  { id: "cyan", name: "Cyan", hue: "-100deg", glow: "#61d6e9" },
  { id: "rose", name: "Rose", hue: "75deg", glow: "#e477ab" },
  { id: "amber", name: "Amber", hue: "-225deg", glow: "#e5b75e" },
] as const;

export type PlayerSkinId = (typeof playerSkins)[number]["id"];
export type PlayerColorId = (typeof playerColors)[number]["id"];

export const selectedShip = () => {
  const skin = playerSkins.find(item => item.id === localStorage.getItem(SHIP_SKIN_KEY)) ?? playerSkins[0];
  const color = playerColors.find(item => item.id === localStorage.getItem(SHIP_COLOR_KEY)) ?? playerColors[0];
  return { skin, color };
};

// The 20 cells retain the reference sheet's row-major order. Every enemy class has
// several silhouettes; the violet Pi Vanguard remains exclusive to the player.
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
