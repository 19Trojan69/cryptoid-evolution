import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
import {retentionRunner} from './transform.mjs';
const source=readFileSync(new URL('../enemy-motion-direct-20261105/run.mjs',import.meta.url),'utf8');
test('only the declared main memory duration changes, all old conditions reverse exactly',()=>{const c=retentionRunner(source);
 assert.equal(c.replace("kind==='memory'?600:60","kind==='memory'?180:60"),source);assert.throws(()=>retentionRunner(source+'\n'));});
test('both real nested collector layouts validate without starting a browser or game',()=>{for(const condition of ['control','candidate']){
 const x=execFileSync(process.execPath,[new URL('./run.mjs',import.meta.url).pathname,'memory','chromium',condition,'1','--check-generated'],{encoding:'utf8'});
 const d=JSON.parse(x.trim());assert.equal(d.generatedOnly,true);assert.equal(d.gameOrBrowserStarted,false);assert.equal(d.allOriginalCollectorAssertionsRetained,true);}});
