import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
test('actual GamePage issues floating power-ups only from lethal enemy shots and does not replay them on restore',()=>{
 execFileSync(process.execPath,['checks/build.mjs'],{cwd:root,stdio:'pipe'});
 const report=JSON.parse(execFileSync(process.execPath,['checks/verify-pickup-origin.cjs'],{cwd:root,encoding:'utf8'}));
 assert.equal(report.passed,true);assert.equal(report.checks.length,5);
});
