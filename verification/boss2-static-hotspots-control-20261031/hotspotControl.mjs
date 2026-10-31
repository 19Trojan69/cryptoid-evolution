import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const originalHullDamageBlob = '50616cc7bb7f0f419c0bcc3b6303a57d47e62439';
const normalizedSha256 = 'a122571e460098df2a7102a2ac807424037a22b434c8f41d82ce042442709549';
const original = '{sites.map(site =>';
const omitted = '{!boss && sites.map(site =>';
export function omitStaticBossHotspots(source) {
  assert.equal(createHash('sha256').update(source.replace(/\r\n/g, '\n').trimEnd()).digest('hex'), normalizedSha256,
    'Exact original HullDamage text required (line endings/final newline normalized only)');
  assert.equal(source.split(original).length, 2);
  const changed = source.replace(original, omitted);
  assert.equal(restoreStaticBossHotspots(changed), source, 'Only the boss static hotspot child guard changes');
  return changed;
}
export function restoreStaticBossHotspots(source) {
  assert.equal(source.split(omitted).length, 2);
  return source.replace(omitted, original);
}
