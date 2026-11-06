// Recolour the existing core only; no extra surface, animation or heat history.
export function reactorHeatColor(health: number, maxHealth: number): string | undefined {
  if (!(maxHealth > 0) || !Number.isFinite(health) || health <= 0 || health >= maxHealth * .5) return undefined;
  const heat = Math.min(1, Math.max(0, 1 - health / (maxHealth * .5)));
  return `rgb(255, ${Math.round(95 + heat * 130)}, ${Math.round(15 + heat * 105)})`;
}
