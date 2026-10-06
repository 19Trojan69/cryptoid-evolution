export type AutoReloadPreferences = Record<number, boolean>;
const products: Record<number, string> = { 2: 'weapon_twin', 3: 'weapon_rapid_twin', 4: 'weapon_triple', 5: 'weapon_plasma' };
export const autoReloadKey = (network: string, owner: string) => `cryptoid_auto_reload:${network}:${owner}`;
export function parseAutoReload(raw: string | null): AutoReloadPreferences {
  try { const value = JSON.parse(raw || '{}'); return Object.fromEntries([2, 3, 4, 5].map(level => [level, value?.[level] === true])); }
  catch { return {}; }
}
export function shouldAutoReload(level: number, source: string, beforeMs: number, afterMs: number, preferences: AutoReloadPreferences, stock: Record<string, number>, allowed: boolean) {
  return allowed && source === 'paid' && beforeMs > 0 && afterMs === 0 && preferences[level] === true && (stock[products[level]] || 0) > 0;
}
