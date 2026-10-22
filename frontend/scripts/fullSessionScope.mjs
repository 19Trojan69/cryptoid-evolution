import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';

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
    children.length ? null : node.text ?? node.getText(), children];
}
export function canonicalScopeSource(source, path, strip = false) {
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
  // Portable fingerprints keep the build gate usable in shallow/Git-free builds.
  const baseline = {
    'src/pages/GamePage.tsx': '4e32ac6081d4b1fd773d70f78e1fc78d32c15c6a45c984136213c19c2a3e8d62',
    'src/lib/accountSave.ts': '9f2aae9ee49b64336e767e4b51ef01455ffedd18b0ffc4b07e3a22a702c67b64',
    'src/lib/axiosClient.ts': '44db97150678cc301a3873c793d64771a1d0693cdf85520816a62a7a32843e66',
    'src/pages/usePreparedGameHulls.ts': 'ae6ccd40a7d89daa63bdf596c0aa86f5da0a0947b6f6ad149dc8ae49666402f0',
  };
  for (const path of Object.keys(additions)) {
    const after = overrides[path] ?? readFileSync(new URL('../' + path, import.meta.url), 'utf8');
    assert.equal(createHash('sha256').update(canonicalScopeSource(after, path, true)).digest('hex'), baseline[path],
      `${path}: only exact observation additions`);
  }
}
