// Use the real CSS-rendered player size, including portrait, landscape and
// fullscreen rules. Physics radii and persisted encounter data stay unchanged.
const BASE_PLAYER_DIAMETER = 94;
export const enemyVisualDiameter = (radius: number, playerDiameter: number, enlargeSmall = false) =>
  radius * 2 * 1.1 * Math.max(1, playerDiameter / BASE_PLAYER_DIAMETER) * (enlargeSmall ? 1.5 : 1);

// Preserve the approved light size, with a distinct hierarchy for actual
// strength classes. Physics radii and the original HD pixels are untouched.
export const strengthVisualDiameter = (shipClass: 'light'|'medium'|'heavy'|'elite', playerDiameter:number) =>
  ({light:82.5,medium:110,heavy:137.5,elite:165}[shipClass]) * Math.max(1,playerDiameter/BASE_PLAYER_DIAMETER);
