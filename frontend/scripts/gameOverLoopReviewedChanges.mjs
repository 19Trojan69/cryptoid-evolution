import { restoreReadableTransitionGameChanges } from './readableTransitionReviewedChanges.mjs';
// Only the terminal Game Over state may sleep with old effect records. Paused
// effect clocks and the active destruction reveal retain their original policy.
export const gameOverLoopChange = {
  before: "      sleepWhenInactive: () => stateRef.current.status !== 'destroying' && stateRef.current.effects.length === 0,",
  after: "      sleepWhenInactive: () => stateRef.current.status === 'game-over' || (stateRef.current.status !== 'destroying' && stateRef.current.effects.length === 0),",
};
export function restoreGameOverLoopGameChange(source) {
  source = restoreReadableTransitionGameChanges(source);
  const { before, after } = gameOverLoopChange;
  if (source.split(after).length !== 2) throw Error('Expected one exact terminal loop change');
  return source.replace(after, before);
}
