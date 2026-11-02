import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export const originalBlobs = { BossHullView: '68dd74e598caa060ae8825d3c56b199ba0d08449', BossReactorView: '0d92e39aba2eb68aa25ba6239932cd4437f4ebf7' };
const blob = source => createHash('sha1').update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');
const thrust = '`${6 + (model.height * engineFlamePercent(model.visualMotion?.thrust ?? 0, model.elapsed < BOSS_ENTRY_MS ? "launch" : "idle")) / 100}px`';
const chargeLeaves = `const LocalBossChargeContext = createContext({ charge: 0, firing: false });
function LocalBossChargePath(props: SVGProps<SVGPathElement>) {
  const { charge, firing } = useContext(LocalBossChargeContext);
  return <path {...props} style={{ opacity: firing && props.className === 'boss-special-muzzle' ? 1 : .25 + charge * .75 }} />;
}

`;
const replacements = {
  BossHullView: [
    ['  const className = fall', '  const engineThrust = fall ? undefined : ' + thrust + ';\n  const className = fall'],
    ['        "--boss-thrust": ' + thrust + ',\n', ''],
    ['style={{ left: `${x * 100}%`, top: `${y * 100}%` }}', 'style={{ left: `${x * 100}%`, top: `${y * 100}%`, height: engineThrust }}'],
  ],
  BossReactorView: [
    ["import { useId, useMemo, type CSSProperties } from 'react';", "import { createContext, useContext, useId, useMemo, type CSSProperties, type SVGProps } from 'react';"],
    ['/** A recessed, hull-textured weapons bay; no floating reactor disc. */', chargeLeaves + '/** A recessed, hull-textured weapons bay; no floating reactor disc. */'],
    ['<path d="M47 33V67M53 33V67" className="boss-special-conductor"/>', '<LocalBossChargePath d="M47 33V67M53 33V67" className="boss-special-conductor"/>'],
    ['<path d="M45 82V136M55 82V136" className="boss-special-conductor"/>', '<LocalBossChargePath d="M45 82V136M55 82V136" className="boss-special-conductor"/>'],
    ['<path d="M49 74V110" className="boss-special-conductor"/>', '<LocalBossChargePath d="M49 74V110" className="boss-special-conductor"/>'],
    ['<path key={x} className="boss-special-muzzle"', '<LocalBossChargePath key={x} className="boss-special-muzzle"'],
    ['  return <svg className=', '  return <LocalBossChargeContext.Provider value={{ charge, firing }}><svg className='],
    [",'--weapon-charge':charge", ''],
    ['  </svg>;', '  </svg></LocalBossChargeContext.Provider>;'],
  ],
};
export function localStyleSource(source, component, condition) {
  assert.ok(Object.hasOwn(originalBlobs, component)); assert.equal(blob(source), originalBlobs[component], 'Exact original component');
  assert.ok(['control', 'leaves'].includes(condition)); if (condition === 'control') return source;
  let changed = source;
  for (const [before, after] of replacements[component]) {
    assert.equal(changed.split(before).length, 2, 'Unique exact replacement'); changed = changed.replace(before, after);
  }
  let restored = changed;
  for (const [before, after] of [...replacements[component]].reverse()) {
    if (after === '') {
      // The removed line has an exact retained neighbouring source anchor.
      const anchor = component === 'BossHullView' ? '        "--boss-image": `url(\'${model.config.image}\')`,\n' : ",'--weapon-energy':energy";
      assert.equal(restored.split(anchor).length, 2); restored = restored.replace(anchor, anchor + before);
    } else { assert.equal(restored.split(after).length, 2); restored = restored.replace(after, before); }
  }
  assert.equal(restored, source, 'Only the declared reversible replacements'); return changed;
}
export function localStyleProof(sources, condition) {
  return { version: 1, condition, originalBlobs, transformedBlobs: Object.fromEntries(Object.entries(sources).map(([name, source]) =>
    [name, blob(localStyleSource(source, name, condition))])),
    originalFormulasAndFiringOverrideRetained: true, originalMemoizedArtworkRetained: true,
    onlyExistingConsumersReceiveDirectProperties: true, newDomNodes: false, newTimersOrFrames: false,
    newEffectsOrGlobalListeners: false, gameOrAnimationClocksChanged: false,
    runtimeSourceFilesEdited: false, physicalDevice: false, whiteScreenFixed: false };
}
export function localStyleConfig(env = process.env) {
  if (env.CRYPTOID_LOCAL_STYLE_SCOPE === undefined) return null;
  assert.ok(['control', 'leaves'].includes(env.CRYPTOID_LOCAL_STYLE_SCOPE));
  assert.equal(env.CRYPTOID_LIFETIME_ATTRIBUTION, '1'); assert.equal(env.CRYPTOID_SOAK_CONDITION, 'original');
  const allowed = ['CRYPTOID_LOCAL_STYLE_SCOPE', 'CRYPTOID_LOCAL_STYLE_REPLICA', 'CRYPTOID_LOCAL_STYLE_FIDELITY',
    'CRYPTOID_LIFETIME_ATTRIBUTION', 'CRYPTOID_SOAK_CONDITION', 'CRYPTOID_ATTRIBUTION_SECONDS', 'CRYPTOID_INACTIVE_NATIVE_TRACE'];
  for (const key of Object.keys(env)) if (key.startsWith('CRYPTOID_')) assert.ok(allowed.includes(key), 'No other diagnostic controls');
  const replica = Number(env.CRYPTOID_LOCAL_STYLE_REPLICA || '1'); assert.ok([1, 2].includes(replica));
  if (env.CRYPTOID_LOCAL_STYLE_FIDELITY !== undefined) assert.ok(['0', '1'].includes(env.CRYPTOID_LOCAL_STYLE_FIDELITY));
  const fidelity = env.CRYPTOID_LOCAL_STYLE_FIDELITY === '1';
  if (fidelity) assert.equal(env.CRYPTOID_ATTRIBUTION_SECONDS, '60', 'Reversible native checks only after short runs');
  return { condition: env.CRYPTOID_LOCAL_STYLE_SCOPE, replica, fidelity };
}
