import { PLAYER_CONTACT_RADIUS, type PlayerPosition } from './playerCombat.ts';

type Hull = { x: number; y: number; width: number; height: number };

// A width-based circle invents damaging hull below wide, short boss artwork.
// Sweep the existing contact radius against both actual rendered extents.
export function contactWithBoss(player: PlayerPosition, width: number, height: number,
  boss: Hull, cooldownMs: number, previous: Hull = boss, previousPlayer: PlayerPosition = player) {
  const radiusX = boss.width / 2 + PLAYER_CONTACT_RADIUS;
  const radiusY = boss.height / 2 + PLAYER_CONTACT_RADIUS;
  const startX = (previous.x - previousPlayer.x * width) / radiusX;
  const startY = (previous.y - previousPlayer.y * height) / radiusY;
  const endX = (boss.x - player.x * width) / radiusX;
  const endY = (boss.y - player.y * height) / radiusY;
  const dx = endX - startX, dy = endY - startY;
  const travel = dx * dx + dy * dy;
  const progress = travel ? Math.max(0, Math.min(1, -(startX * dx + startY * dy) / travel)) : 0;
  const connected = Math.hypot(startX + dx * progress, startY + dy * progress) < 1;
  return { connected, damage: connected && cooldownMs <= 0 ? 1 : 0 };
}
