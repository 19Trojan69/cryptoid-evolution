export const originalLivery = { id: 'original', name: 'Original Livery', glow: '#c8d4df' } as const;
export const vanguardMetallic = { id: 'vanguard-metallic', name: 'Metallic Edition', glow: '#f6cc42' } as const;

export const shopShipPaints = [
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

export const shipFactoryPaint = (skin: string) => skin === 'pi-vanguard' ? vanguardMetallic : originalLivery;

// The Testnet account service still stores hull counts under a paint key.
export const standardHullInventoryColor = 'grey';

export const isVanguardMetallic = (sprite: number, color: string | undefined) => sprite === 18 && color === vanguardMetallic.id;

export const hasBakedLivery = (sprite: number, color: string | undefined) =>
  color === undefined || color === originalLivery.id || isVanguardMetallic(sprite, color);

export function shipLiveryAssetPath(sprite: number, stage: 1 | 2 | 3, color?: string) {
  const metallic = isVanguardMetallic(sprite, color);
  const directory = stage > 1 && !metallic ? 'evolution/liveries' : 'evolution';
  return `ships/${directory}/ship_${String(sprite + 1).padStart(2, '0')}_stage_${stage}${metallic ? '_metallic' : ''}.png`;
}

export const shipPaintMatchesHull = (skin: string, color: string) => color !== vanguardMetallic.id || skin === 'pi-vanguard';

export function hullCanUsePaint(skin: string, color: string, inventory: Readonly<Record<string, number | undefined>> | undefined) {
  if (!inventory || !shipPaintMatchesHull(skin, color)) return false;
  if ((inventory[color] ?? 0) > 0) return true;
  const availableOnOwnedHull = color === originalLivery.id || color === shipFactoryPaint(skin).id
    || shopShipPaints.some(paint => paint.id === color);
  return availableOnOwnedHull && Object.values(inventory).some(count => (count ?? 0) > 0);
}
