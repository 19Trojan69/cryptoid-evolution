import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { ISOLATED_AUTH_SOURCE, useIsolatedAuth } from './authFixture.mjs';
import { createDeviceReplay } from './controller.mjs';

test('the real GameEntry condition passes for the isolated settled guest',async()=>{
  const state=useIsolatedAuth();
  assert.equal(Boolean(state.authReady&&!state.isLoading&&!state.authError),true);
  assert.equal(state.isAuthenticated,false);assert.equal(state.user,null);
  await assert.rejects(state.signIn(),/No account/);
});
test('the exact injected auth module also passes the entry gate',()=>{
  const state=vm.runInNewContext(ISOLATED_AUTH_SOURCE.replace('export const useAuth=','const useAuth=')+'useAuth();',{});
  assert.equal(Boolean(state.authReady&&!state.isLoading&&!state.authError),true);
  assert.equal(state.isAuthenticated,false);
});
test('a fixture that never mounts still reports timeout or user stop exactly once',()=>{
  const reports=[];let time=10;
  const replay=createDeviceReplay({now:()=>time,onFinish:r=>reports.push(r)});
  time=5010;replay.abort('fixture-not-started');replay.abort('stopped');
  assert.equal(reports.length,1);assert.equal(reports[0].reason,'fixture-not-started');
  assert.equal(reports[0].elapsedWallMs,5000);assert.deepEqual(reports[0].phases,[]);
});
