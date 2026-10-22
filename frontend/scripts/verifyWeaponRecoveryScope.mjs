import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../../', import.meta.url);
const baseline = '94825bdcc78c7be27632a12340732a27088aebe2';
const original = path => execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' });
const current = path => readFileSync(new URL(path, root), 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');
const stripHandlers = source => {
  const start = source.indexOf('  const selectWeaponLevel ='), end = source.indexOf('  const restart =', start);
  const request = source.indexOf('  reloadRequestRef.current =', start);
  const pickup = source.indexOf('  const selectPickupWeapon =', request);
  assert.ok(start > 0 && request > start && pickup > request && end > pickup);
  return source.slice(0, start) + source.slice(request, pickup) + source.slice(end);
};
const game = 'frontend/src/pages/GamePage.tsx', menu = 'frontend/src/pages/MissionWeaponShop.tsx';
assert.equal(stripHandlers(current(game)), stripHandlers(original(game)), 'the entire simulation/render/reward/save code outside weapon selection is byte-identical');
const menuLines = source => source.split('\n').filter(line => !line.includes('className="mission-select"') && !line.includes('className="mission-pickup-select"')).join('\n');
assert.equal(menuLines(current(menu)), menuLines(original(menu)), 'only the two selection buttons change in the existing menu');
const allowed = new Set([game, menu]);
const changed = execFileSync('git', ['diff', '--name-only', baseline, '--', 'frontend/src', 'backend', 'api', 'assets'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
for (const path of changed) assert.ok(allowed.has(path), `unexpected runtime change: ${path}`);
const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'frontend/src', 'backend', 'api', 'assets'], { cwd: root, encoding: 'utf8' }).trim();
assert.equal(untracked, '', 'no untracked runtime source/assets');
const config = JSON.parse(current('vercel.json'));
assert.equal(config.git.deploymentEnabled['codex/weapon-reload-recovery-20261022'], false);
const report = { baseline, passed: true, gameOutsideSelectionSha256: sha(stripHandlers(original(game))),
  currentGameOutsideSelectionSha256: sha(stripHandlers(current(game))), changedRuntimePaths: changed.sort(),
  menuChangedLines: 2, automaticDeploymentEnabled: false,
  limits: 'Preserves all source outside the reviewed weapon selection handlers/two menu buttons. No physical PiBrowser or live account proof.' };
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
