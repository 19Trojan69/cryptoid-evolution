import {restoreHullPrefetchChanges} from './hullPrefetchReviewedChanges.mjs';
import {restoreCompletionRecoveryChanges} from './completionRecoveryReviewedChanges.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { restoreControlCenterGameChanges } from './controlCenterReviewedChanges.mjs';

// Exact, reviewable additions only. Removing a named call indiscriminately would
// hide an accidental mutation in its arguments or enclosing branch.
const additions = {
  'src/pages/GamePage.tsx': [
    "import { sessionDiagnostic } from '../lib/sessionDiagnosticEvents';",
    "const lastSessionSceneRef = useRef('');",
    `useLayoutEffect(() => {
      if (!ownerDiagnostics || !performanceProbeRef.current) return;
      const state = game;
      const signature = \`${'${state.sector}:${state.encounter}:${state.phase}:${state.status}'}\`;
      if (lastSessionSceneRef.current === signature) return;
      lastSessionSceneRef.current = signature;
      sessionDiagnostic('boundary', { operation: 'scene-committed', sector: state.sector, phase: state.phase,
        encounter: state.encounter, status: state.status });
    });`,
    `fullContext: () => ({ ...diagnosticContext(),
      weaponLevel: stateRef.current.weaponLevel, weaponSource: stateRef.current.weaponSource,
      paidWeaponMs: stateRef.current.paidWeaponMs, pickupWeaponMs: stateRef.current.pickupWeaponMs })`,
    "if (ownerDiagnostics) sessionDiagnostic('weapon', { operation: 'expired', level: expiringLevel, weaponSource: expiringSource });",
    "if (ownerDiagnostics) sessionDiagnostic('boundary', { operation: 'transition-before', sector: state.sector, encounter: state.encounter, phase: state.phase });",
    "if (ownerDiagnostics) sessionDiagnostic('boundary', { operation: 'transition-reset-done', sector: state.sector, encounter: state.encounter, phase: state.phase });",
    "if (firstNormalSpawn && ownerDiagnostics) sessionDiagnostic('boundary', { operation: 'first-spawn-before', sector: state.sector, encounter: state.encounter, phase: state.phase });",
    "if (firstNormalSpawn && ownerDiagnostics) sessionDiagnostic('boundary', { operation: 'first-spawn-created', sector: state.sector, encounter: state.encounter, phase: state.phase });",
    "if (ownerDiagnostics) sessionDiagnostic('weapon', { operation: automatic ? 'automatic-reload' : 'manual-selection', level, weaponSource: state.weaponSource });",
  ],
  'src/lib/accountSave.ts': [
    "import { sessionDiagnostic } from './sessionDiagnosticEvents';",
    "sessionDiagnostic('queue', { operation: 'persist', depth: entries.length, success: durable });",
    "sessionDiagnostic('queue', { operation: 'drain', depth: entries.length });",
    "sessionDiagnostic('queue', { operation: 'enqueue', depth: entries.length });",
    "sessionDiagnostic('queue', { operation: 'recover', depth: entries.length });",
    "sessionDiagnostic('queue', { operation: 'archive', depth: entries.length });",
  ],
  'src/lib/axiosClient.ts': [
    "import { installSessionRequestDiagnostics } from './sessionRequestDiagnostics';",
    'installSessionRequestDiagnostics(axiosClient);',
  ],
  'src/pages/usePreparedGameHulls.ts': [
    "import { sessionDiagnostic } from '../lib/sessionDiagnosticEvents';",
    "sessionDiagnostic('boundary', { operation: 'hull-plan-start', sector, encounter });",
    `void next.settled.then(results => {
      if (current.current === next) sessionDiagnostic('boundary', { operation: 'hull-plan-settled', sector, encounter,
        requested: results.length, prepared: results.filter(Boolean).length, readinessFailures: results.filter(value => !value).length });
    });`,
    "import { hullPreparationStep } from './hullPreparationDiagnostics';",
    "hullPreparationStep('plan-preloaded', { sector, encounter });",
    "hullPreparationStep('plan-retain-before', { sector, encounter });",
    "hullPreparationStep('plan-retained', { sector, encounter });",
    "if (previous) hullPreparationStep('plan-release-before', { sector, encounter });",
    "if (previous) hullPreparationStep('plan-released', { sector, encounter });",
  ],
  'src/pages/paintedShip.ts': [
    "import { hullSourceJob, hullVariantJob, hullPreparationStep } from './hullPreparationDiagnostics';",
    'const diagnostic = hullSourceJob(url);',
    'const diagnostic = hullVariantJob(index, colorId, stage);',
    "hullPreparationStep('source-create-before', diagnostic);",
    "hullPreparationStep('source-loaded', diagnostic);",
    "hullPreparationStep('source-center-before', diagnostic);",
    "hullPreparationStep('source-center-failed', diagnostic);",
    "hullPreparationStep('source-center-after', diagnostic);",
    "hullPreparationStep('source-ready', diagnostic);",
    "hullPreparationStep('source-work-failed', diagnostic);",
    "if (canvas) hullPreparationStep('source-surface-release-before', diagnostic);",
    "if (canvas) hullPreparationStep('source-surface-released', diagnostic);",
    "hullPreparationStep('source-load-failed', diagnostic);",
    "hullPreparationStep('source-load-start', diagnostic);",
    "hullPreparationStep('variant-cancelled', diagnostic);",
    "if (!asset) hullPreparationStep('variant-unavailable', diagnostic);",
    "hullPreparationStep('variant-create-before', diagnostic);",
    "hullPreparationStep('variant-loaded', diagnostic);",
    "hullPreparationStep('variant-load-failed', diagnostic);",
    "hullPreparationStep('variant-load-start', diagnostic);",
    "hullPreparationStep('variant-decode-skipped', diagnostic);",
    "hullPreparationStep('variant-ready', diagnostic);",
  ],
};
const compact = text => text.replace(/\s+/g, '');
function structure(node) {
  const children = [];
  ts.forEachChild(node, child => { children.push(structure(child)); });
  // Syntax semantics, including declaration flags and unary operators. Positions,
  // comments and multiline printer flags do not change game behavior.
  return [node.kind, node.flags & (ts.NodeFlags.Let | ts.NodeFlags.Const | ts.NodeFlags.Using | ts.NodeFlags.AwaitUsing),
    node.operator ?? null, node.isTypeOnly ?? null, node.isExportEquals ?? null,
    children.length ? null : node.kind === ts.SyntaxKind.Block ? '{}' : node.text ?? node.getText(), children];
}
export function canonicalScopeSource(source, path, strip = false) {
  if (strip) source = restoreHullPrefetchChanges(source, path);
  if (strip && path === 'src/lib/accountSave.ts') source = restoreCompletionRecoveryChanges(source, path);
  if (strip && path === 'src/pages/GamePage.tsx') source = restoreControlCenterGameChanges(source);
  // The comparison has one reviewed behavior change beyond observations.
  // Restore precisely the removed conditional to compare the complete loader
  // with its original fingerprint; any other functional change still fails.
  if (strip && path === 'src/pages/paintedShip.ts') source = source.replace(
    "hullPreparationStep('variant-decode-skipped', diagnostic);",
    "hullPreparationStep('variant-decode-skipped', diagnostic);\n  if (typeof decoded.decode === 'function') await decoded.decode();");
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  if (!strip) return JSON.stringify(structure(ast));
  const allowed = new Map(additions[path].map(text => [compact(text), 0]));
  const result = ts.transform(ast, [context => root => {
    const visit = node => {
      const key = compact(node.getText(ast));
      if (allowed.has(key)) { allowed.set(key, allowed.get(key) + 1); return undefined; }
      return ts.visitEachChild(node, visit, context);
    };
    return ts.visitNode(root, visit);
  }]);
  try {
    for (const [code, count] of allowed) assert.equal(count, 1, `one exact diagnostic addition in ${path}: ${code}`);
    return JSON.stringify(structure(result.transformed[0]));
  } finally { result.dispose(); }
}
export function assertObservationOnly(overrides = {}) {
  // Verified against c62efe2a9e6f4bf249e83b1e3a7a2c997d27be89, tree
  // f2f84ac11f4d86cecbbe9a0338095b96bce769b8, using TypeScript 5.9.3.
  // The 2026-10-25 user-authorized revision updates only GamePage and paintedShip
  // for tested weapon recovery, manual boss intermission and unused-cache release.
  // The 2026-10-26 save correction permits exactly the bounded legacy reward
  // retry in accountSave; its server checks and queued payload stay unchanged.
  // The reviewed mobile-cockpit revision changes entry/menu markup and moves the
  // statistics stop after the bonus; ordinary steering no longer asks for fullscreen.
  // mobileCockpitScope.test.mjs permits only the exact reviewed source hunks.
  // Other fingerprints and all diagnostic-argument negative controls remain unchanged.
  // Portable fingerprints keep the build gate usable in shallow/Git-free builds.
  const baseline = {
    'src/pages/GamePage.tsx': '9466013fff2ab03a82f0ce35a68628c6beb4447fd5c58ed8a46731f4cbbcc6c1',
    'src/lib/accountSave.ts': 'f21526dfa375b9f2699ea4a13b82e85fbf9ac8b61d60f06613ccf31de14e01e7',
    'src/lib/axiosClient.ts': '44db97150678cc301a3873c793d64771a1d0693cdf85520816a62a7a32843e66',
    'src/pages/usePreparedGameHulls.ts': 'ae6ccd40a7d89daa63bdf596c0aa86f5da0a0947b6f6ad149dc8ae49666402f0',
    // Same prepared-image implementation in c62efe2a and the supplied 73dfffee run.
    'src/pages/paintedShip.ts': 'fdd9da888d25b18d0b899e1067d6320588bcefd0b52dd97c3683274e786f675e',
  };
  for (const path of Object.keys(additions)) {
    const after = overrides[path] ?? readFileSync(new URL('../' + path, import.meta.url), 'utf8');
    assert.equal(createHash('sha256').update(canonicalScopeSource(after, path, true)).digest('hex'), baseline[path],
      `${path}: only exact observation additions and the reviewed weapon recovery, boss intermission, unused-cache release and bounded reward retry`);
  }
}

