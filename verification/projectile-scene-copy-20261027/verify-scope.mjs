import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { restoreProjectileSnapshotGameChange } from '../../frontend/scripts/projectileSnapshotReviewedChanges.mjs';

const root = new URL('../..', import.meta.url).pathname;
const base = '9d0ac5ba60d9b25170176700a3c1efaa355be290';
const at = name => execFileSync('git', ['show', `${base}:${name}`], { cwd: root });
const now = name => readFileSync(root + '/' + name);
const game = 'frontend/src/pages/GamePage.tsx';
assert.equal(restoreProjectileSnapshotGameChange(now(game).toString()), at(game).toString());
const runtime = execFileSync('git', ['diff', '--name-only', base], { cwd: root, encoding: 'utf8' }).trim().split('\n')
  .filter(name => name.startsWith('frontend/src/') && /\.(?:ts|tsx)$/.test(name));
assert.deepEqual(runtime, [game]);
assert.equal(execFileSync('git', ['diff', '--name-only', base, '--', 'backend', 'api'], { cwd: root, encoding: 'utf8' }), '');
const protectedFiles = ['frontend/src/pages/gameLoop.ts', 'frontend/src/pages/projectilePresentation.ts',
  'frontend/src/lib/frameScheduler.ts', 'frontend/src/pages/GameHudStats.tsx', 'frontend/src/pages/gameAudio.ts',
  'frontend/src/lib/accountSave.ts', 'frontend/src/pages/CanvasEffects.tsx', 'frontend/src/pages/BossWeaponsView.tsx',
  'frontend/src/pages/bossWeaponRenderer.ts', 'frontend/src/pages/renderResolution.ts', 'frontend/src/pages/BonusRockLayer.tsx',
  'frontend/src/pages/LevelCompletion.tsx', 'frontend/src/pages/shipFleet.ts', 'frontend/src/pages/HomeEarthNetwork.tsx',
  'frontend/src/pages/HomeCombatPreview.tsx', 'frontend/src/index.css', 'frontend/src/cockpitMenus.css',
  'frontend/src/generated/paintedHullManifest.ts', 'frontend/yarn.lock', 'backend/yarn.lock', 'frontend/eslint.config.js'];
const hashes = {};
for (const name of protectedFiles) {
  assert.ok(now(name).equals(at(name)), name);
  hashes[name] = createHash('sha256').update(now(name)).digest('hex');
}
const record = { baseline: base, runtimeFiles: runtime, exactControllerRestoration: true,
  restoredControllerSha256: createHash('sha256').update(at(game)).digest('hex'),
  protectedSourcesSha256: hashes, backendUnchanged: true, frameRateOrQualityChange: false };
writeFileSync(new URL('./results/scope.json', import.meta.url), JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ complete: true, reviewedRuntimeLines: 1, protectedFiles: protectedFiles.length }));
