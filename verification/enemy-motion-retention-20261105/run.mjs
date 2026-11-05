import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {retentionRunner} from './transform.mjs';
const path=new URL('../enemy-motion-direct-20261105/run.mjs',import.meta.url).pathname;
const original=readFileSync(path,'utf8'),changed=retentionRunner(original),temporary=path.replace(/\.mjs$/,`.retention-${process.pid}.mjs`);
try{writeFileSync(temporary,changed);execFileSync(process.execPath,[temporary,...process.argv.slice(2)],{stdio:'inherit'});}
finally{unlinkSync(temporary);assert.equal(readFileSync(path,'utf8'),original);}
