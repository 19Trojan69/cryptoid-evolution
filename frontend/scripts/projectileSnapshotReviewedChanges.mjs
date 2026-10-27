import {restoreGameOverLoopGameChange} from './gameOverLoopReviewedChanges.mjs';
// Restore only the two unused projectile-array copies for historical controller
// fingerprints. Direct projectile presentation and every simulation line stay.
export const projectileSnapshotChange = {
  before: '          setGame({ ...current, boss: current.boss ? { ...current.boss } : null, asteroids: [...current.asteroids], bonusTargets: [...current.bonusTargets], shots: [...current.shots], enemyShots: [...current.enemyShots], effects: [...current.effects], powerUps: [...current.powerUps] });',
  after: '          setGame({ ...current, boss: current.boss ? { ...current.boss } : null, asteroids: [...current.asteroids], bonusTargets: [...current.bonusTargets], effects: [...current.effects], powerUps: [...current.powerUps] });',
};
export function restoreProjectileSnapshotGameChange(source) {
  source = restoreGameOverLoopGameChange(source);
  const { before, after } = projectileSnapshotChange;
  if (source.split(after).length !== 2) throw Error('Expected one exact projectile snapshot change');
  return source.replace(after, before);
}
