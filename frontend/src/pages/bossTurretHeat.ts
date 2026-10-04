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
  const hot = heat > .75 ? '#ffb12b' : heat > .4 ? '#ff7908' : '#ee4605';
  gradient.addColorStop(0, '#bc2902');
  gradient.addColorStop(.35, hot);
  gradient.addColorStop(.58, heat > .75 ? '#ffd052' : '#ff920a');
  gradient.addColorStop(1, '#db3b03');
  context.globalAlpha = .5 + heat * .45;
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}
