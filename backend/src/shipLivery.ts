export const originalLivery = { id: 'original', name: 'Original Livery', glow: '#c8d4df' } as const;
export const vanguardMetallic = { id: 'vanguard-metallic', name: 'Metallic Edition', glow: '#f6cc42' } as const;

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
