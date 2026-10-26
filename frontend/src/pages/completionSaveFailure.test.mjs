import test from 'node:test';
import assert from 'node:assert/strict';
import {completionSaveFailure} from './completionSaveFailure.ts';
import {completionRecoveryTranslations} from '../locales/completionRecovery.ts';

test('completion failure feedback distinguishes pending effects, confirmation, session and rejected saves',()=>{
  const cases=[
    [null,'effects','Effects are still being released. Retry preparation.'],
    [null,'confirmation','The next level or its rewards are not confirmed. Retry save.'],
    [{response:{status:403}},'save','The active run needs to be confirmed again. Retry save.'],
    [{response:{status:409,data:{error:'run_expired'}}},'save','This run is no longer active on the server. Pending data is kept on this device.'],
    [{response:{status:400,data:{error:'invalid_save'}}},'save','The server rejected this save. Pending data is kept on this device.'],
    [new Error('private response data'),'save','Save not confirmed. Please retry.'],
  ];
  for(const [error,phase,expected] of cases) {
    assert.equal(completionSaveFailure(error,phase),expected);
    if(expected==='Save not confirmed. Please retry.')continue;
    for(const locale of ['en','de','es','zh','vi'])assert.ok(completionRecoveryTranslations[locale][expected]);
  }
});
