import {enemyHullSpan} from './shipHullBounds.ts';

// Use the real CSS-rendered player size, including portrait, landscape and
// fullscreen rules. Physics radii and persisted encounter data stay unchanged.
const BASE_PLAYER_DIAMETER = 94;
export const enemyVisualDiameter = (radius: number, playerDiameter: number, enlargeSmall = false) =>
  radius * 2 * 1.1 * Math.max(1, playerDiameter / BASE_PLAYER_DIAMETER) * (enlargeSmall ? 1.5 : 1);

// Desired visible hull lengths: medium is 1.5x light, heavy 2x, elite 2.5x.
// The original full-resolution images and physical radii remain unchanged.
export const strengthVisualDiameter = (shipClass: 'light'|'medium'|'heavy'|'elite', playerDiameter:number) =>
  ({light:55,medium:82.5,heavy:110,elite:137.5}[shipClass]) * Math.max(1,playerDiameter/BASE_PLAYER_DIAMETER);

export const normalEnemyVisualDiameter=(shipClass:'light'|'medium'|'heavy'|'elite',playerDiameter:number,sprite:number,scale=1)=>
 strengthVisualDiameter(shipClass,playerDiameter)*scale/enemyHullSpan(sprite);

// Layout sizing, never a frame-time/quality governor. Keep one scale for the
// viewport so strength ratios do not change with blocks, kills or load.
export const normalEnemyLayoutScale=(height:number,hud:number,playerDiameter:number)=>
 Math.min(1,Math.max(0,height-hud)/980/Math.max(1,playerDiameter/BASE_PLAYER_DIAMETER));
