import type { BossGunConfig } from './bossWeapons.ts';

// CSS pixels, independent of DPR. Only the armoured body/socket grows;
// barrel geometry, muzzle coordinates, ammunition and HP keep their size.
export const MIN_TURRET_BODY_DIAMETER = 12;
export const turretBodyScale = (gun: BossGunConfig, scale: number) =>
 Math.max(1, MIN_TURRET_BODY_DIAMETER / (2 * gun.halfWidth * scale));

export const turretBodyEllipse = (gun: BossGunConfig, scale: number) => {
 const factor = turretBodyScale(gun, scale);
 return {factor, x:gun.halfWidth * scale * factor, y:gun.back * .85 * scale * factor, centerY:-3 * scale * factor};
};
