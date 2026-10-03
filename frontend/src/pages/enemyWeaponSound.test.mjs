import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateEnemyShotSound } from './enemyWeaponSound.ts';
import { generateBossSound, bossSoundReferences } from './bossWeaponSound.ts';

test('enemy discharge is finite, punchy and click-free at common device sample rates', () => {
  for (const rate of [22050, 44100, 48000, 96000]) {
    const pcm = generateEnemyShotSound(rate);
    assert.equal(pcm.length, Math.round(.14 * rate));
    assert.ok(pcm.every(Number.isFinite));
    const peak = pcm.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    const rms = Math.sqrt(pcm.reduce((sum, value) => sum + value * value, 0) / pcm.length);
    assert.ok(peak > .63 && peak <= .641);
    assert.ok(rms > .05 && rms < .25);
    assert.equal(Math.abs(pcm[0]), 0);
    assert.ok(Math.abs(pcm.at(-1)) < .0001);
    const energy = (from, to) => {
      const slice = pcm.subarray(Math.ceil(from * rate), Math.ceil(to * rate));
      return Math.sqrt(slice.reduce((sum, value) => sum + value * value, 0) / slice.length);
    };
    assert.ok(energy(.004, .02) > energy(.08, .11) * 3);
  }
});

test('enemy discharge is reproducible and differs from every boss calibre sound', () => {
  const enemy = generateEnemyShotSound();
  assert.deepEqual(enemy, generateEnemyShotSound());
  for (const kind of Object.keys(bossSoundReferences)) {
    for (let variant = 0; variant < 3; variant++) {
      const boss = generateBossSound(kind, variant);
      assert.notEqual(enemy.length, boss.length);
      let cross = 0, enemyEnergy = 0, bossEnergy = 0;
      for (let i = 0; i < enemy.length; i++) {
        cross += enemy[i] * boss[i];
        enemyEnergy += enemy[i] ** 2;
        bossEnergy += boss[i] ** 2;
      }
      assert.ok(Math.abs(cross / Math.sqrt(enemyEnergy * bossEnergy)) < .2, `${kind}/${variant} resembles enemy sound`);
    }
  }
});
