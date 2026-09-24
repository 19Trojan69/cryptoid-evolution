import type { CSSProperties } from "react";
import type { CryptoidClass } from "./cryptoidRoster";

export const FLEET_IMAGE = "/ships/cryptoid-fleet.png";
export const SHIP_SKIN_KEY = "cryptoid_player_ship_skin";
export const SHIP_COLOR_KEY = "cryptoid_player_ship_color";
export const SHIP_COLORS_KEY = "cryptoid_player_ship_colors";
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
  { id: "grey", name: "Graphite Grey", hue: "0deg", glow: "#a8b3c2" },
  { id: "violet", name: "Violet", hue: "0deg", glow: "#a56fe2" },
  { id: "cyan", name: "Cyan", hue: "-100deg", glow: "#61d6e9" },
  { id: "rose", name: "Rose", hue: "75deg", glow: "#e477ab" },
  { id: "amber", name: "Amber", hue: "-225deg", glow: "#e5b75e" },
  { id: "ruby", name: "Ruby Red", hue: "125deg", glow: "#dc5267" },
  { id: "scarlet", name: "Scarlet", hue: "150deg", glow: "#f64d48" },
  { id: "coral", name: "Coral", hue: "184deg", glow: "#fa8370" },
  { id: "orange", name: "Solar Orange", hue: "215deg", glow: "#f59942" },
  { id: "gold", name: "Gold", hue: "242deg", glow: "#e9ca64" },
  { id: "lemon", name: "Lemon", hue: "260deg", glow: "#e7e666" },
  { id: "lime", name: "Neon Lime", hue: "290deg", glow: "#a6dd56" },
  { id: "emerald", name: "Emerald", hue: "310deg", glow: "#51c780" },
  { id: "mint", name: "Mint", hue: "325deg", glow: "#79e6b4" },
  { id: "teal", name: "Teal", hue: "-64deg", glow: "#4bd2bc" },
  { id: "ice", name: "Ice Blue", hue: "-82deg", glow: "#a9e9f2" },
  { id: "azure", name: "Azure", hue: "-115deg", glow: "#5ba9ea" },
  { id: "cobalt", name: "Cobalt", hue: "-145deg", glow: "#5d82e5" },
  { id: "indigo", name: "Indigo", hue: "-25deg", glow: "#7062d3" },
  { id: "magenta", name: "Magenta", hue: "43deg", glow: "#d15ed6" },
  { id: "pink", name: "Hot Pink", hue: "90deg", glow: "#f16fbb" },
  { id: "white", name: "Pearl White", hue: "0deg", glow: "#e9edf5" },
] as const;

export type PlayerSkinId = (typeof playerSkins)[number]["id"];
export type PlayerColorId = (typeof playerColors)[number]["id"];

export const savedShipColors = (raw: string | null): Partial<Record<PlayerSkinId, PlayerColorId>> => {
  try {
    const saved: unknown = JSON.parse(raw || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.fromEntries(playerSkins.flatMap(skin => {
      const color = playerColors.find(item => item.id === (saved as Record<string, unknown>)[skin.id]);
      return color ? [[skin.id, color.id]] : [];
    })) as Partial<Record<PlayerSkinId, PlayerColorId>>;
  } catch { return {}; }
};

export const colorForSkin = (skinId: PlayerSkinId, saved: Partial<Record<PlayerSkinId, PlayerColorId>>, legacyColor?: string | null, selectedId?: PlayerSkinId) =>
  playerColors.find(item => item.id === saved[skinId]) ??
  (skinId === selectedId ? playerColors.find(item => item.id === legacyColor) : undefined) ?? playerColors[0];

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
  const color = colorForSkin(skin.id, savedShipColors(localStorage.getItem(SHIP_COLORS_KEY)), localStorage.getItem(SHIP_COLOR_KEY), skin.id);
  return { skin, color };
};

// The 20 cells retain the reference sheet's row-major order.
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

// Coordinates refer to visible nozzle exits within each atlas cell, not the
// transparent cell edges. Parent transforms carry the exhaust during attacks.
const hullAnchors = [
  [55, 61, 15], [53, 58, 17], [42, 61, 12], [43, 60, 12],
  [54, 53, 19], [53, 53, 19], [43, 51, 22], [43, 52, 21],
  [54, 44, 30], [54, 42, 32], [43, 44, 30], [44, 44, 29],
  [55, 52, 8], [53, 53, 8], [43, 52, 9], [44, 53, 8],
  [55, 30, 40], [53, 32, 36], [42, 33, 34], [43, 32, 37],
] as const;

const nozzlePairs = [
  [48, 62], [46, 60], [36, 52], [36, 51],
  [47, 61], [46, 60], [36, 51], [35, 51],
  [45, 63], [46, 62], [31, 56], [38, 49],
  [47, 62], [46, 60], [32, 55], [37, 51],
  [47, 63], [45, 60], [34, 51], [32, 54],
] as const;

export const shipNozzleStyle = (index: number, facesPlayer = false): CSSProperties => {
  const [center, , top] = hullAnchors[index] ?? hullAnchors[0];
  const [left, right] = nozzlePairs[index] ?? nozzlePairs[0];
  return {
    "--nozzle-left": `${facesPlayer ? 100 - right : left}%`,
    "--nozzle-right": `${facesPlayer ? 100 - left : right}%`,
    "--nozzle-y": `${facesPlayer ? top : 100 - top}%`,
    "--hull-x": `${facesPlayer ? 100 - center : center}%`,
  } as CSSProperties;
};
