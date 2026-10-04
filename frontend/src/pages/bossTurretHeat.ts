import type { BossTurretState } from './bossTurrets.ts';

export const turretHeatStep = (gun: Pick<BossTurretState, 'health' | 'maxHealth'>) => {
  if (gun.health <= 0 || gun.maxHealth <= 0) return 0;
  return Math.max(0, Math.min(8, Math.ceil((1 - gun.health / gun.maxHealth) * 8)));
};

/** Paint only existing sprite pixels. No blur, shadow, halo or outside glow. */
export function paintTurretHeat(context: CanvasRenderingContext2D, width: number, height: number, step: number) {
  const heat = Math.max(0, Math.min(1, step / 8));
  if (heat === 0) return;
  context.save();
  context.globalCompositeOperation = 'source-atop';
  const gradient = context.createLinearGradient(0, 0, width, height);
  const hot = heat > .75 ? '#fff2ab' : heat > .4 ? '#ff9827' : '#b5290e';
  gradient.addColorStop(0, '#60130b');
  gradient.addColorStop(.35, hot);
  gradient.addColorStop(.58, heat > .75 ? '#fffadc' : '#ff7a18');
  gradient.addColorStop(1, '#a52c0b');
  context.globalAlpha = .15 + heat * .68;
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}
