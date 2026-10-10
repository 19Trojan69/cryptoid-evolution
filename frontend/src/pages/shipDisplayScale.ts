// Use the real CSS-rendered player size, including portrait, landscape and
// fullscreen rules. Physics radii and persisted encounter data stay unchanged.
const BASE_PLAYER_DIAMETER = 94;
export const enemyVisualDiameter = (radius: number, playerDiameter: number) =>
  radius * 2 * 1.1 * Math.max(1, playerDiameter / BASE_PLAYER_DIAMETER);
