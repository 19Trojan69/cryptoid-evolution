import test from 'node:test';import assert from 'node:assert/strict';import {recordOnlyFlags} from './profilerMode.mjs';
test('supports the official older CLI without inventing a record-only flag',()=>assert.deepEqual(recordOnlyFlags('Usage: heaptrack [-o output] DEBUGGEE',false),[]));
test('uses the advertised newer flag and rejects old CLI with an automatic GUI',()=>{assert.deepEqual(recordOnlyFlags('Options: --record-only',true),['--record-only']);assert.throws(()=>recordOnlyFlags('older CLI',true),/automatic GUI/);});
