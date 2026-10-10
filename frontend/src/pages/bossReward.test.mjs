import test from 'node:test';
import assert from 'node:assert/strict';
import { collectBossHeart, BOSS_HEART_POSITION } from './bossReward.ts';
import { bossDifficulty } from './bossDifficulty.ts';
import { paintTurretHeat } from './bossTurretHeat.ts';
test('a defeated boss awards no life until physical pickup, exactly once', () => {
  const state = { hearts: 2, maxHearts: 3, shards: 0, bossHeartCollected: false };
  assert.equal(collectBossHeart(state, {x:.1,y:.9},390,760),false);
  assert.equal(state.hearts,2);
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(collectBossHeart(restored, BOSS_HEART_POSITION,390,760),true);
  assert.equal(restored.hearts,3);
  assert.equal(collectBossHeart(restored, BOSS_HEART_POSITION,390,760),false);
  assert.equal(restored.hearts,3);
});
test('boss pickup restores one heart at every armor limit and remains reachable on all viewports', () => {
  for (const maxHearts of [3, 4, 5, 6]) {
    for (const [w,h] of [[320,568],[390,844],[1366,768]]) {
      const state = { hearts: maxHearts - 1, maxHearts, shards: 20 };
      assert.equal(collectBossHeart(state,BOSS_HEART_POSITION,w,h),true);
      assert.equal(state.hearts,maxHearts);
      assert.equal(state.shards,20);
    }
  }
});
test('full hearts grant five Shards once per boss and fifty bosses never exceed the armor limit', () => {
  for (const maxHearts of [3, 4, 5, 6]) {
    const state = { hearts: maxHearts, maxHearts, shards: 0 };
    for (let boss = 1; boss <= 50; boss++) {
      state.bossHeartCollected = false;
      assert.equal(collectBossHeart(state,BOSS_HEART_POSITION,390,844),true);
      assert.equal(state.hearts,maxHearts);
      assert.equal(state.bossHeartShards,5);
      assert.equal(state.shards,5*boss);
      assert.equal(collectBossHeart(state,BOSS_HEART_POSITION,390,844),false);
      assert.equal(state.shards,5*boss);
    }
  }
});
test('each of 50 bosses has strictly increasing bounded attack pressure', () => {
  let before=bossDifficulty(1);
  for(let id=2;id<=50;id++) {
    const now=bossDifficulty(id);
    for(const k of ['projectileScale','trackingScale','coreSpeed']) assert.ok(now[k]>before[k]);
    for(const k of ['cadenceScale','coreInterval']) assert.ok(now[k]<before[k]);
    assert.ok(now.projectileScale<=1.38 && now.coreSpeed<=.17 && now.coreInterval>=2100);
    before=now;
  }
});
test('orange heat is visible from first damage and remains clipped to metal', () => {
  for(let step=1;step<=8;step++) {
    const colors=[];
    const ctx={save(){},restore(){},createLinearGradient(){return {addColorStop(_,color){colors.push(color)}}},fillRect(){}};
    paintTurretHeat(ctx,32,48,step);
    assert.equal(ctx.globalCompositeOperation,'source-atop');
    assert.ok(ctx.globalAlpha>=.55 && ctx.globalAlpha<=.95);
    assert.ok(colors.includes('#db3b03'));
  }
});
