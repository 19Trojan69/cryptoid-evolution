import type { CSSProperties } from "react";
import type { CryptoidClass } from "./cryptoidRoster";

export const FLEET_IMAGE = "/ships/cryptoid-fleet.png";
export const SHIP_SKIN_KEY = "cryptoid_player_ship_skin";
export const SHIP_COLOR_KEY = "cryptoid_player_ship_color";
export const SHIP_COLORS_KEY = "cryptoid_player_ship_colors";
export const SHIP_OWNED_KEY = "cryptoid_owned_ship_skins";
export const SHIP_FLEET_KEY = "cryptoid_ship_fleet_v2";
export const SHARD_BALANCE_KEY = "cryptoid_shard_balance";
export const EXTRA_STARTER_PRICE = 20;

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

const legacyColors = [
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

// Stable IDs are stored with each ship. Old paint IDs remain readable, but are
// no longer offered for new purchases.
export const playerColors = [
  { id: "silver", name: "Silver", glow: "#b8c5ce", rgb: [184, 197, 206] },
  { id: "gold", name: "Gold", glow: "#cda757", rgb: [205, 167, 87] },
  { id: "anthracite", name: "Anthracite", glow: "#65717b", rgb: [101, 113, 123] },
  { id: "bronze", name: "Bronze", glow: "#ae8557", rgb: [174, 133, 87] },
  { id: "copper", name: "Copper", glow: "#bb795d", rgb: [187, 121, 93] },
  { id: "metallic-blue", name: "Metallic Blue", glow: "#5483b2", rgb: [84, 131, 178] },
  { id: "metallic-red", name: "Metallic Red", glow: "#ac5661", rgb: [172, 86, 97] },
  { id: "metallic-green", name: "Metallic Green", glow: "#5c9b79", rgb: [92, 155, 121] },
  { id: "pink", name: "Pink", glow: "#ce80aa", rgb: [206, 128, 170] },
] as const;

export const allPlayerColors = [...playerColors, ...legacyColors.filter(color => !playerColors.some(current => current.id === color.id))] as const;

export type PlayerSkinId = (typeof playerSkins)[number]["id"];
export type PlayerColorId = (typeof allPlayerColors)[number]["id"];
export type ShipFleet = Partial<Record<PlayerSkinId, Partial<Record<PlayerColorId, number>>>>;

export const fleetCount = (fleet: ShipFleet, skin: PlayerSkinId, color?: PlayerColorId) =>
  color ? fleet[skin]?.[color] ?? 0 : Object.values(fleet[skin] ?? {}).reduce((sum, count) => sum + (count ?? 0), 0);

export const repaintStarter = (fleet: ShipFleet, color: PlayerColorId): ShipFleet => {
  if (fleetCount(fleet, "grey-scout", color)) return fleet;
  const old = { ...(fleet["grey-scout"] ?? { grey: 1 }) };
  const previous = Object.keys(old).find(key => (old[key as PlayerColorId] ?? 0) > 0) as PlayerColorId | undefined;
  if (!previous) return fleet;
  old[previous] = (old[previous] ?? 0) - 1;
  if (old[previous] === 0) delete old[previous];
  old[color] = 1;
  return { ...fleet, "grey-scout": old };
};

export const readShipFleet = (raw: string | null, oldOwned: string | null, oldColors: string | null): ShipFleet => {
  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const input = parsed as Record<string, unknown>;
        const restored = Object.fromEntries(playerSkins.flatMap(skin => {
          const variants = Object.fromEntries(allPlayerColors.flatMap(color => {
            const value = (input[skin.id] as Record<string, unknown> | undefined)?.[color.id];
            return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? [[color.id, value]] : [];
          }));
          return Object.keys(variants).length ? [[skin.id, variants]] : [];
        })) as ShipFleet;
        if (!fleetCount(restored, "grey-scout")) restored["grey-scout"] = { grey: 1 };
        return restored;
      }
    } catch { /* Fall back to the old saved inventory. */ }
  }
  const previous = savedShipColors(oldColors);
  const result: ShipFleet = { "grey-scout": { grey: 1 } };
  for (const skin of ownedSkins(oldOwned)) {
    const color = previous[skin] ?? "grey";
    result[skin] = { [color]: 1 };
  }
  return result;
};

export const buyShipVariant = (skinId: PlayerSkinId, colorId: PlayerColorId, fleet: ShipFleet, balance: number) => {
  const skin = playerSkins.find(item => item.id === skinId);
  const price = skin?.price === 0 ? EXTRA_STARTER_PRICE : skin?.price;
  if (!skin || price === undefined || !allPlayerColors.some(color => color.id === colorId) || !Number.isSafeInteger(balance) || balance < price) return null;
  const count = fleetCount(fleet, skinId, colorId);
  if (!Number.isSafeInteger(count) || count >= Number.MAX_SAFE_INTEGER) return null;
  return { fleet: { ...fleet, [skinId]: { ...fleet[skinId], [colorId]: count + 1 } }, balance: balance - price };
};

export const savedShipColors = (raw: string | null): Partial<Record<PlayerSkinId, PlayerColorId>> => {
  try {
    const saved: unknown = JSON.parse(raw || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.fromEntries(playerSkins.flatMap(skin => {
      const color = allPlayerColors.find(item => item.id === (saved as Record<string, unknown>)[skin.id]);
      return color ? [[skin.id, color.id]] : [];
    })) as Partial<Record<PlayerSkinId, PlayerColorId>>;
  } catch { return {}; }
};

export const colorForSkin = (skinId: PlayerSkinId, saved: Partial<Record<PlayerSkinId, PlayerColorId>>, legacyColor?: string | null, selectedId?: PlayerSkinId) =>
  allPlayerColors.find(item => item.id === saved[skinId]) ??
  (skinId === selectedId ? allPlayerColors.find(item => item.id === legacyColor) : undefined) ?? legacyColors[0];

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
  const fleet = readShipFleet(localStorage.getItem(SHIP_FLEET_KEY), localStorage.getItem(SHIP_OWNED_KEY), localStorage.getItem(SHIP_COLORS_KEY));
  const skin = stored && fleetCount(fleet, stored.id) ? stored : playerSkins[0];
  const savedColor = colorForSkin(skin.id, savedShipColors(localStorage.getItem(SHIP_COLORS_KEY)), localStorage.getItem(SHIP_COLOR_KEY), skin.id);
  const color = fleetCount(fleet, skin.id, savedColor.id) || skin.price === 0 && localStorage.getItem(SHIP_FLEET_KEY) === null ? savedColor : allPlayerColors.find(item => fleetCount(fleet, skin.id, item.id)) ?? legacyColors[0];
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

// Visible hulls are not perfectly centered inside every transparent atlas cell.
// These offsets align formation guides with the actual painted hull centers.
const spriteCenterOffsets = [
  [5.4, -2.7], [5.4, .5], [-4.3, 15.4], [-1.8, 4.1],
  [3.2, -.5], [.4, -5.5], [0, .9], [.4, 5.2],
  [4.8, -1.6], [-4.1, 7], [-1.1, 4.8], [-6.6, -.4],
  [8.9, 2], [-1.4, .2], [-8.8, 0], [-10.2, .4],
  [5, -15.5], [-5.4, -2.5], [2.3, -3.9], [-5, -3.9],
] as const;

export const spriteVisualOffset = (index: number, renderedSize: number, facesPlayer = false) => {
  const [xPercent, yPercent] = spriteCenterOffsets[index] ?? spriteCenterOffsets[0];
  const direction = facesPlayer ? -1 : 1;
  return { x: xPercent / 100 * renderedSize * direction, y: yPercent / 100 * renderedSize * direction };
};

// Coordinates refer to the two primary visible engine exits in each original
// nose-up atlas cell. Gameplay deliberately renders exactly these two engines.
const hullCenters = [55, 53, 42, 43, 54, 53, 43, 43, 54, 54, 43, 44, 55, 53, 43, 44, 55, 53, 42, 43] as const;
const nozzleProfiles: readonly (readonly (readonly [number, number])[])[] = [
  [[49, 80], [60, 80]],
  [[49, 82], [61, 82]],
  [[35, 87], [52, 87]],
  [[34, 85], [56, 85]],
  [[28, 75], [74, 75]],
  [[43, 80], [62, 80]],
  [[28, 75], [72, 75]],
  [[22, 75], [78, 75]],
  [[46, 68], [62, 68]],
  [[46, 68], [60, 68]],
  [[37, 68], [54, 68]],
  [[41, 70], [47, 70]],
  [[45, 58], [63, 58]],
  [[46, 58], [60, 58]],
  [[35, 55], [64, 55]],
  [[43, 58], [54, 58]],
  [[35, 58], [69, 58]],
  [[29, 53], [75, 53]],
  [[43, 60], [57, 60]],
  [[45, 62], [56, 62]],
] as const;

// The Core Warden has two wing engines plus one larger axial main engine.
const bossNozzleProfile = [[27, 52], [50, 63], [72, 52]] as const;

export const shipNozzleStyles = (index: number, facesPlayer = false): CSSProperties[] =>
  (nozzleProfiles[index] ?? nozzleProfiles[0]).map(([x, y]) => ({
    "--nozzle-x": `${facesPlayer ? 100 - x : x}%`,
    "--nozzle-y": `${facesPlayer ? 100 - y : y}%`,
  } as CSSProperties));

export const bossNozzleStyles = (): CSSProperties[] =>
  bossNozzleProfile.map(([x, y]) => ({
    "--nozzle-x": `${x}%`,
    "--nozzle-y": `${y}%`,
  } as CSSProperties));

export const shipHullStyle = (index: number, facesPlayer = false): CSSProperties => {
  const center = hullCenters[index] ?? hullCenters[0];
  return { "--hull-x": `${facesPlayer ? 100 - center : center}%` } as CSSProperties;
};

// Kept for the compact home-screen preview and its fixed pair of engines.
export const shipNozzleStyle = (index: number, facesPlayer = false): CSSProperties => {
  const nozzles = nozzleProfiles[index] ?? nozzleProfiles[0];
  const [left, leftY] = nozzles[0];
  const [right, rightY] = nozzles[nozzles.length - 1];
  const nozzleY = (leftY + rightY) / 2;
  return {
    "--nozzle-left": `${facesPlayer ? 100 - right : left}%`,
    "--nozzle-right": `${facesPlayer ? 100 - left : right}%`,
    "--nozzle-y": `${facesPlayer ? 100 - nozzleY : nozzleY}%`,
    ...shipHullStyle(index, facesPlayer),
  } as CSSProperties;
};
