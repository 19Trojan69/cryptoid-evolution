import test from 'node:test';import assert from 'node:assert/strict';import {isActualProfiledWorker} from './processIdentity.mjs';
test('identifies the actual renamed ELF instead of a profiler shell mentioning its path',()=>{
 assert.equal(isActualProfiledWorker('/ms-playwright/webkit/libexec/WPEWebProcess.heaptrack-original'),true);
 assert.equal(isActualProfiledWorker('/usr/bin/bash'),false);assert.equal(isActualProfiledWorker('/usr/bin/python3'),false);assert.equal(isActualProfiledWorker('/path/MiniBrowser'),false);
});
