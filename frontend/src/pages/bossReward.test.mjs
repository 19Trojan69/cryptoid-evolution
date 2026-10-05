import test from 'node:test';
import assert from 'node:assert/strict';
import { collectBossHeart, BOSS_HEART_POSITION } from './bossReward.ts';
import { bossDifficulty } from './bossDifficulty.ts';
import { paintTurretHeat } from './bossTurretHeat.ts';
test('a defeated boss awards no life until physical pickup, exactly once', () => {
  const state = { hearts: 2, bossHeartCollected: false };
  assert.equal(collectBossHeart(state, {x:.1,y:.9},390,760),false);
  assert.equal(state.hearts,2);
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(collectBossHeart(restored, BOSS_HEART_POSITION,390,760),true);
  assert.equal(restored.hearts,3);
  assert.equal(collectBossHeart(restored, BOSS_HEART_POSITION,390,760),false);
  assert.equal(restored.hearts,3);
});
test('extra life exceeds initial three and pickup is reachable on all viewports', () => {
  for(const [w,h] of [[320,568],[390,844],[1366,768]]) {
    const state={hearts:4};
    assert.equal(collectBossHeart(state,BOSS_HEART_POSITION,w,h),true);
    assert.equal(state.hearts,5);
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
