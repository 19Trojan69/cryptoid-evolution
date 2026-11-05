import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {viewportStyle,blob,originalBlob} from './transform.mjs';
const original=readFileSync(new URL('../../frontend/src/gameViewport.css',import.meta.url),'utf8');
test('only two fallback selector guards change; all declaration and control rules retain exact bytes',()=>{
 const changed=viewportStyle(original);assert.equal(blob(original),originalBlob);
 assert.equal(changed.replaceAll(':where(:not(.game-viewport-locked))',''),original);
 assert.equal((changed.match(/:where\(:not\(\.game-viewport-locked\)\)/g)||[]).length,2);
 assert.throws(()=>viewportStyle(original+'\n'));assert.throws(()=>viewportStyle(changed));});
