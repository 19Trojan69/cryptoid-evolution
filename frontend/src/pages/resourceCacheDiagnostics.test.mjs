import test from 'node:test';
import assert from 'node:assert/strict';
import { ResourceCache } from './resourceCache.ts';

test('read-only retention counters reflect pins without exposing keys',()=>{
  const cache=new ResourceCache(3,1000);
  cache.set('a','A',10);cache.set('b','B',20);
  const releaseA=cache.retain('a'),releaseB1=cache.retain('b'),releaseB2=cache.retain('b');
  assert.equal(cache.size,2);assert.equal(cache.bytes,30);assert.equal(cache.retainedEntries,2);assert.equal(cache.retainCount,3);
  releaseB1();assert.equal(cache.retainedEntries,2);assert.equal(cache.retainCount,2);
  releaseB2();assert.equal(cache.retainedEntries,1);assert.equal(cache.retainCount,1);
  releaseA();assert.equal(cache.retainedEntries,0);assert.equal(cache.retainCount,0);
});
