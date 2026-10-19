import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

// Compare the complete GamePage to the V4 release, removing only this branch's
// observation calls. This protects its JSX, timing, sound and combat logic.
const baseline = 'f600735a0b1957fdbfc8a45fb3daf993819ae76c';
const before = execFileSync('git', ['show', `${baseline}:frontend/src/pages/GamePage.tsx`], { encoding: 'utf8' });
let after = fs.readFileSync(new URL('../src/pages/GamePage.tsx', import.meta.url), 'utf8');
for (const line of [
  "import { createBossBoundaryDiagnostics } from './bossBoundaryDiagnostics';\n",
  '  const bossBoundaryRef = useRef<ReturnType<typeof createBossBoundaryDiagnostics> | null>(null);\n',
  '    const bossBoundary = ownerDiagnostics ? createBossBoundaryDiagnostics(recordOwnerResourceSnapshot) : null;\n',
  '    bossBoundaryRef.current = bossBoundary;\n',
  '      if (bossBoundaryRef.current === bossBoundary) bossBoundaryRef.current = null;\n',
  '            bossBoundaryRef.current?.beforeCore(state.boss, state.sector, delta, coreCapacity);\n',
  '            const firstCoreShot = bossBoundaryRef.current?.afterCore(pulses.length) ?? false;\n',
  '            bossBoundaryRef.current?.afterAudio(firstCoreShot);\n',
]) { assert.ok(after.includes(line), line.trim()); after = after.replace(line, ''); }
after = after.replace('  useLayoutEffect(() => {\n    bossBoundaryRef.current?.sceneCommitted(game.boss, game.sector);\n  }, [game]);\n', '');
after = after.replace('[diagnosticContext, ownerDiagnostics, ownerResourceContext, recordOwnerResourceSnapshot]', '[diagnosticContext, ownerDiagnostics, ownerResourceContext]');
after = after.replace('            const coreCapacity = enemyShotLimit(width, elapsedRef.current, state.sector) - state.enemyShots.length;\n', '');
after = after.replace('delta, coreCapacity, nextIdRef.current)', 'delta, enemyShotLimit(width, elapsedRef.current, state.sector) - state.enemyShots.length, nextIdRef.current)');
assert.equal(after, before, 'entire GamePage unchanged after removing optional observation');
console.log(JSON.stringify({ passed: true, baseline, gameJSXAndSimulationPreserved: true }));
