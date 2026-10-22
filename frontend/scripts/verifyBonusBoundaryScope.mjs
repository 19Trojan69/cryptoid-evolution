import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../../', import.meta.url);
const baseline = '94825bdcc78c7be27632a12340732a27088aebe2';
const original = path => execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' });
const current = path => readFileSync(new URL(path, root), 'utf8');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const additions = [
  "import { createBonusBoundaryDiagnostics } from './bonusBoundaryDiagnostics';\n",
  '  const bonusBoundaryRef = useRef<ReturnType<typeof createBonusBoundaryDiagnostics> | null>(null);\n',
  '    bonusBoundaryRef.current?.sceneCommitted(game);\n',
  "    const bonusBoundary = ownerDiagnostics && shipSaveNetwork === 'testnet' ? createBonusBoundaryDiagnostics((kind, context) =>\n      recordReloadSnapshot(kind, { ...diagnosticContext(), ...context })) : null;\n    bonusBoundaryRef.current = bonusBoundary;\n",
  '      if (bonusBoundaryRef.current === bonusBoundary) bonusBoundaryRef.current = null;\n',
  '          bonusBoundaryRef.current?.observedClear(state);\n',
  '          bonusBoundaryRef.current?.rewardsCompleted(state);\n',
  '      bonusBoundaryRef.current?.frame(state);\n',
  '          bonusBoundaryRef.current?.sceneRequested(current);\n',
];
let normalized = current('frontend/src/pages/GamePage.tsx');
for (const addition of additions) {
  assert.equal(normalized.split(addition).length, 2, 'each reviewed addition occurs exactly once');
  normalized = normalized.replace(addition, '');
}
assert.equal(normalized, original('frontend/src/pages/GamePage.tsx'), 'all game behavior outside the observer additions is byte-identical');
assert.equal(current('frontend/src/pages/reloadDiagnostics.ts')
  .replace("import type { BonusBoundaryKind } from './bonusBoundaryDiagnostics.ts';\n", '')
  .replace('  | BonusBoundaryKind\n', ''), original('frontend/src/pages/reloadDiagnostics.ts'));
assert.equal(current('frontend/src/pages/stabilityReport.mjs')
  .replace("  'bonus-clear-rewards-complete','bonus-clear-scene-requested',\n  'bonus-clear-scene-committed','bonus-clear-frame-after-commit',\n", ''),
original('frontend/src/pages/stabilityReport.mjs'));
const allowed = new Set(['frontend/src/pages/GamePage.tsx', 'frontend/src/pages/reloadDiagnostics.ts',
  'frontend/src/pages/stabilityReport.mjs', 'frontend/src/pages/bonusBoundaryDiagnostics.ts',
  'frontend/src/pages/bonusBoundaryDiagnostics.test.mjs']);
const changed = execFileSync('git', ['diff', '--name-only', baseline, '--', 'frontend/src', 'assets', 'backend', 'api'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'frontend/src', 'assets', 'backend', 'api'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
for (const path of [...changed, ...untracked]) assert.ok(allowed.has(path), `unexpected source change: ${path}`);
const report = { baseline, passed: true, gamePageBaseSha256: sha256(original('frontend/src/pages/GamePage.tsx')),
  normalizedGamePageSha256: sha256(normalized), reviewedGamePageAddedLines: additions.join('').split('\n').length - 1,
  changedSourcePaths: [...new Set([...changed, ...untracked])].sort(),
  limits: 'Exact source scope and unchanged simulation/rewards/rendering outside passive owner observations; no device/native crash-cause proof.' };
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
