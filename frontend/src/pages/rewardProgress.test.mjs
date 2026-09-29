import test from 'node:test';
import assert from 'node:assert/strict';
import { awardBonusMedal, awardBossSticker, awardChain, emptyRewardProgress, readRewardProgress, rewardRank } from './rewardProgress.ts';

test('boss victories unlock unique stickers, improve stars, and advance ranks', () => {
  let progress = emptyRewardProgress();
  assert.equal(rewardRank(progress), 'Rookie');
  for (let win = 0; win < 4; win++) {
    const result = awardBossSticker(progress, 1);
    assert.equal(result.newSticker, win === 0);
    progress = result.progress;
  }
  assert.equal(progress.bossWins[1], 3);
  assert.equal(rewardRank(progress), 'Pilot');
  progress = awardBossSticker(awardBossSticker(progress, 2).progress, 3).progress;
  assert.equal(rewardRank(progress), 'Navigator');
  assert.equal(awardBossSticker(progress, 51).progress, progress);
});

test('chain awards are once per level, with milestones after unique completions', () => {
  let progress = emptyRewardProgress();
  const first = awardChain(progress, 1);
  assert.equal(first.milestone, 1);
  progress = first.progress;
  assert.equal(awardChain(progress, 1).milestone, 0);
  assert.equal(awardChain(progress, 2).milestone, 0);
  assert.equal(awardChain(awardChain(progress, 2).progress, 3).milestone, 3);
});

test('bonus medals preserve the best result and count perfect runs', () => {
  let progress = emptyRewardProgress();
  progress = awardBonusMedal(progress, 1, 5).progress;
  progress = awardBonusMedal(progress, 1, 12).progress;
  const repeat = awardBonusMedal(progress, 1, 9);
  assert.equal(repeat.improved, false);
  assert.equal(repeat.progress.bonusMedals[1], 'gold');
  assert.equal(repeat.progress.perfectBonuses, 1);
  assert.equal(awardBonusMedal(repeat.progress, 1, 12).progress.perfectBonuses, 2);
});

test('saved progress ignores invalid IDs and damaged data', () => {
  const progress = readRewardProgress(JSON.stringify({ bossWins: { 1: 20, 99: 1 }, completedChains: [1, 1, 51], bonusMedals: { 1: 'gold', 60: 'gold' } }));
  assert.deepEqual(progress.bossWins, { 1: 3 });
  assert.deepEqual(progress.completedChains, [1]);
  assert.deepEqual(progress.bonusMedals, { 1: 'gold' });
  assert.deepEqual(readRewardProgress('{broken'), emptyRewardProgress());
});
