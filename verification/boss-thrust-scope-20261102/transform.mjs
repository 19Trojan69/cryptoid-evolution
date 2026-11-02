import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const originalBlob = '68dd74e598caa060ae8825d3c56b199ba0d08449';
const blob = source => createHash('sha1').update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');
const expression = '`${6 + (model.height * engineFlamePercent(model.visualMotion?.thrust ?? 0, model.elapsed < BOSS_ENTRY_MS ? "launch" : "idle")) / 100}px`';
const rootLine = '        "--boss-thrust": ' + expression + ',\n';
const imageLine = '        "--boss-image": `url(\'${model.config.image}\')`,\n';
const classLine = '  const className = fall';
const addedLine = '  const engineThrust = fall ? undefined : ' + expression + ';\n';
const engineLine = '            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}';
const scopedLine = '            style={{ left: `${x * 100}%`, top: `${y * 100}%`, "--boss-thrust": engineThrust } as CSSProperties}';

export function restoreThrustScope(source) {
  for (const token of [addedLine, scopedLine, imageLine]) assert.equal(source.split(token).length, 2);
  assert.equal(source.includes(rootLine), false);
  return source.replace(addedLine, '').replace(scopedLine, engineLine).replace(imageLine, imageLine + rootLine);
}
export function thrustSource(source, condition) {
  assert.equal(blob(source), originalBlob, 'Exact unchanged BossHullView source');
  assert.ok(['control', 'leaf'].includes(condition));
  if (condition === 'control') return source;
  for (const token of [rootLine, classLine, engineLine]) assert.equal(source.split(token).length, 2);
  const changed = source.replace(classLine, addedLine + classLine).replace(rootLine, '').replace(engineLine, scopedLine);
  assert.equal(restoreThrustScope(changed), source, 'Only the exact thrust expression changes declaration scope');
  return changed;
}
export function thrustProof(source, condition) {
  const changed = thrustSource(source, condition);
  return { version: 1, condition, originalBlob, transformedBlob: blob(changed),
    onlyExistingThrustDeclarationScopeChanged: condition === 'leaf',
    sameExpressionEvaluatedOnce: true, originalEngineNodesAndAnchorsRetained: true,
    originalCssAndAnimationsRetained: true, originalArtworkRetained: true,
    allEarlierVisualControlsOff: true, gameClocksChanged: false, newTimersOrFrames: false,
    runtimeSourceFilesEdited: false, physicalDevice: false, whiteScreenFixed: false };
}
export function thrustConfig(env = process.env) {
  if (env.CRYPTOID_THRUST_SCOPE === undefined) return null;
  assert.ok(['control', 'leaf'].includes(env.CRYPTOID_THRUST_SCOPE));
  assert.equal(env.CRYPTOID_LIFETIME_ATTRIBUTION, '1'); assert.equal(env.CRYPTOID_SOAK_CONDITION, 'original');
  assert.notEqual(env.CRYPTOID_STYLE_WRITE_PROBE, '1');
  for (const key of Object.keys(env)) assert.ok(!/^CRYPTOID_(ISOLATED_|FLAT|BOSS_|CANVAS_|CSS_FILTER)/.test(key));
  const replica = Number(env.CRYPTOID_THRUST_REPLICA || '1'); assert.ok([1, 2].includes(replica));
  if (env.CRYPTOID_THRUST_FIDELITY !== undefined) assert.ok(['0', '1'].includes(env.CRYPTOID_THRUST_FIDELITY));
  const fidelity = env.CRYPTOID_THRUST_FIDELITY === '1';
  if (fidelity) assert.equal(env.CRYPTOID_ATTRIBUTION_SECONDS, '60', 'Inactive redistribution proof only in short controls');
  return { condition: env.CRYPTOID_THRUST_SCOPE, replica, fidelity };
}
