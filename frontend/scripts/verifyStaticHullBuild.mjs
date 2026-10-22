import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { allPlayerColors, playerSkins } from '../src/pages/shipFleet.ts';
import { staticHullAsset } from '../src/pages/staticHullAssets.ts';
import { paintedHullRevision } from '../src/generated/paintedHullManifest.ts';

const root = new URL('../', import.meta.url);
const expected = 'ab587934596011a05294ead81490ee510efac8a0';
const digest = value => createHash('sha256').update(value).digest('hex');
const unchanged = ['GamePage.tsx', 'usePreparedGameHulls.ts', 'hullSourcePlan.ts', 'resourceCache.ts', 'CanvasEffects.tsx',
  'gameAudio.ts', 'musicPlayback.ts', 'audioClockRecovery.ts', 'cardSound.ts', 'bossReward.ts', 'sectorBoss.ts',
  'bossWeaponRenderer.ts', 'bossWeaponTextures.ts', 'shipFleet.ts', 'shipMaterial.ts', 'shipTint.ts', 'shipEvolution.ts'];
for (const name of unchanged) {
  const current = await readFile(new URL(`src/pages/${name}`, root));
  const preceding = execFileSync('git', ['show', `${expected}:frontend/src/pages/${name}`], { cwd: root });
  assert.equal(digest(current), digest(preceding), `${name} must retain the preceding runtime`);
}
const assetDirectories = await readdir(new URL('dist/ships/painted/', root));
assert.deepEqual(assetDirectories, [paintedHullRevision], 'the build must contain only its current generated catalogue');
let variants = 0, bytes = 0;
for (let sprite = 0; sprite < playerSkins.length; sprite++) for (const stage of [1, 2, 3]) for (const color of allPlayerColors) {
  const asset = staticHullAsset(sprite, color.id, stage);
  const source = await readFile(new URL(`public${asset.url}`, root));
  const built = await readFile(new URL(`dist${asset.url}`, root));
  assert.equal(digest(source), digest(built)); assert.equal(built.length, asset.bytes);
  variants++; bytes += built.length;
}
const chunks = (await readdir(new URL('dist/assets/', root))).filter(name => name.endsWith('.js'));
const js = (await Promise.all(chunks.map(name => readFile(new URL(`dist/assets/${name}`, root), 'utf8')))).join('\n');
assert.ok(js.includes(paintedHullRevision), 'client bundle and generated assets must have the same revision');
assert.ok(js.includes('/ships/painted/'));
assert.ok(!js.includes('Ship encoding failed'), 'the old hull encoder must not remain in the client');
const config = JSON.parse(await readFile(new URL('../vercel.json', root), 'utf8'));
assert.equal(config.git.deploymentEnabled['codex/static-hull-memory-20261022'], false);
const changed = execFileSync('git', ['diff', expected, '--name-only'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
for (const name of changed) assert.ok(name === 'vercel.json' || name === 'frontend/.gitignore' || name === 'frontend/package.json'
  || name === 'frontend/AGENTS.md' || name === 'frontend/src/pages/paintedShip.ts'
  || name.startsWith('frontend/scripts/') || name.startsWith('frontend/src/generated/')
  || name === 'frontend/src/pages/staticHullAssets.ts' || name.startsWith('docs/static-hull-memory-20261022'), `Unrelated source change: ${name}`);
console.log(JSON.stringify({ passed: true, variants, bytes, revision: paintedHullRevision,
  unchangedRuntimeFiles: unchanged.length, staticFilesMatchSource: true,
  limits: 'Built artifact and source checks; no browser/iPhone/WebKit process-memory measurement.' }));
