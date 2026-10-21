import test from 'node:test';
import assert from 'node:assert/strict';
import { ResourceCache } from './resourceCache.ts';
import { gameRenderScale } from './renderResolution.ts';

test('normal raster scale preserves ordinary screens and caps high-density graphics at 1.5', () => {
  for (const ratio of [undefined, 0, -1, NaN, Infinity]) assert.equal(gameRenderScale(ratio), 1);
  for (const ratio of [0.75, 1, 1.25, 1.5]) assert.equal(gameRenderScale(ratio), ratio);
  for (const ratio of [2, 3, 4]) assert.equal(gameRenderScale(ratio), 1.5);
  assert.equal((gameRenderScale(3) / 3) ** 2, 0.25);
  assert.equal((gameRenderScale(3) / 2) ** 2, 0.5625);
});

test('unused LRU variants retire on release without touching mounted or preparing consumers', () => {
  const disposed = [], cache = new ResourceCache(24, 12000, value => disposed.push(value), 6);
  const releases = [];
  for (let i = 0; i < 13; i++) {
    releases.push(cache.retain(String(i)));
    cache.set(String(i), i, 100);
  }
  for (let i = 13; i < 100; i++) cache.set(String(i), i, 100);
  assert.equal(cache.size, 19);
  assert.equal(cache.retainedEntries, 13);
  assert.ok(disposed.every(value => value >= 13));
  cache.get('0');
  for (const release of releases) { release(); release(); }
  assert.equal(cache.size, 6);
  assert.equal(cache.retainedEntries, 0);
  assert.equal(cache.get('0'), 0, 'last-used released hull remains warm');
  assert.equal(disposed.length, 94);
});

test('pins may exceed the soft budget but are trimmed immediately after release', () => {
  const disposed = [], cache = new ResourceCache(1, 10, value => disposed.push(value), 0);
  const a = cache.retain('a'), b = cache.retain('b');
  cache.set('a', 'a', 20); cache.set('b', 'b', 20);
  assert.equal(cache.bytes, 40); assert.equal(disposed.length, 0);
  a(); assert.equal(cache.get('b'), 'b'); assert.deepEqual(disposed, ['a']);
  b(); assert.equal(cache.size, 0); assert.deepEqual(disposed, ['a', 'b']);
});
