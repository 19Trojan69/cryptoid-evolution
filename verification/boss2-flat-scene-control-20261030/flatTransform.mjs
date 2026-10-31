import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const flatSceneEnabled = () => process.env.CRYPTOID_FLAT_SCENE === '1';
export const originalBackgroundEnabled = () => flatSceneEnabled() && process.env.CRYPTOID_FLAT_BACKGROUND === '1';
export const originalBossEnabled = () => originalBackgroundEnabled() && process.env.CRYPTOID_ORIGINAL_BOSS === '1';
export const bossWeaponCanvasDisabled = () => originalBossEnabled() && process.env.CRYPTOID_BOSS_WEAPON_CANVAS_OFF === '1';
export const bossMaskedLayersHidden = () => bossWeaponCanvasDisabled() && process.env.CRYPTOID_BOSS_MASK_LAYERS_OFF === '1';
export const bossReflectionComparisonEnabled = () => bossWeaponCanvasDisabled()
  && process.env.CRYPTOID_BOSS_MASK_LAYERS_OFF !== '1' && process.env.CRYPTOID_BOSS_REFLECTION_CONTROL === '1';
export const bossReflectionRestored = () => bossReflectionComparisonEnabled() && process.env.CRYPTOID_BOSS_REFLECTION_ON === '1';
export const bossHeatComparisonEnabled = () => bossWeaponCanvasDisabled()
  && process.env.CRYPTOID_BOSS_MASK_LAYERS_OFF !== '1' && process.env.CRYPTOID_BOSS_REFLECTION_CONTROL !== '1'
  && process.env.CRYPTOID_BOSS_HEAT_CONTROL === '1';
export const bossHullHeatRestored = () => bossHeatComparisonEnabled() && process.env.CRYPTOID_BOSS_HEAT_ON === '1';
export const bossHullHeatUnmasked = () => bossHullHeatRestored() && process.env.CRYPTOID_BOSS_HEAT_UNMASKED === '1';
export const bossUnmaskedHeatReflectionRestored = () => bossHullHeatUnmasked() && process.env.CRYPTOID_UNMASKED_HEAT_REFLECTION === '1';
export const bossHullReflectionUnmasked = () => bossUnmaskedHeatReflectionRestored() && process.env.CRYPTOID_REFLECTION_IMAGE_MASK_OFF === '1';
export const diagnosticSceneName = () => !flatSceneEnabled() ? 'original-artwork'
  : bossHeatComparisonEnabled() ? bossHullHeatRestored()
    ? (bossUnmaskedHeatReflectionRestored()
      ? (bossHullReflectionUnmasked()
        ? 'flat-live-scene-original-background-original-boss-no-weapon-canvas-unmasked-hull-heat-unmasked-hull-reflection'
        : 'flat-live-scene-original-background-original-boss-no-weapon-canvas-unmasked-hull-heat-restored-hull-reflection')
      : 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-reflection' + (bossHullHeatUnmasked() ? '-unmasked-hull-heat' : ''))
    : 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-masks'
  : bossReflectionComparisonEnabled() ? bossReflectionRestored()
    ? 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-heat'
    : 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-masks'
  : bossMaskedLayersHidden() ? 'flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-masks'
  : bossWeaponCanvasDisabled() ? 'flat-live-scene-original-background-original-boss-no-weapon-canvas'
  : originalBossEnabled() ? 'flat-live-scene-original-background-original-boss'
  : originalBackgroundEnabled() ? 'flat-live-scene-original-background' : 'flat-live-scene';
export const GAME_SOURCE_BLOB = 'd73579b3f9abe575adacfa978259aec9bdb0e7fd';
export const visualExports = Object.freeze({
  'Starfield.tsx': 'Starfield', 'SectorBackdrop.tsx': 'SectorBackdrop',
  'GameShipVisual.tsx': 'GameShipVisual', 'BossHullView.tsx': 'BossHullView',
  'BonusRockLayer.tsx': 'BonusRockLayer',
});
export function flatVisualModule(path) {
  const prefix = '/frontend/src/pages/';
  if (!path.includes(prefix)) return null;
  const name = path.slice(path.lastIndexOf(prefix) + prefix.length);
  if (bossWeaponCanvasDisabled() && name === 'BossWeaponsView.tsx')
    return 'export default function DiagnosticBossWeaponsOff() { return null; }';
  if (!Object.hasOwn(visualExports, name)) return null;
  if (originalBackgroundEnabled() && ['Starfield.tsx', 'SectorBackdrop.tsx'].includes(name)) return null;
  if (originalBossEnabled() && name === 'BossHullView.tsx') return null;
  const target = fileURLToPath(new URL('./flatComponents.jsx', import.meta.url));
  return `export { ${visualExports[name]} as default } from ${JSON.stringify(target)};`;
}
export const originalImpact = `const ImpactEffectView = memo(({effect}:{effect:Effect}) => combatVarietyEnabled && (effect.kind === "explosion" || effect.kind === "shatter") && effect.sprite !== undefined && effect.debrisColor
  ? <CanvasImpact effect={effect} debris={shipDebris(effect)} original={<OriginalImpactEffectView effect={effect}/>} />
  : <OriginalImpactEffectView effect={effect}/>);`;
export const flatImpact = `const ImpactEffectView = memo(({effect}:{effect:Effect}) => {
  // Preserve the original definitions for exact reversal without mounting them.
  void CanvasImpact; void OriginalImpactEffectView;
  return <i className="diagnostic-flat-impact" style={{ left: effect.x, top: effect.y }} aria-hidden="true" />;
});`;
const oldRoot = '<main className="game-shell" data-effects-paused=';
const newRoot = '<main className="game-shell diagnostic-flat-scene" data-effects-paused=';
export function flatGameScene(source) {
  const bytes = Buffer.from(source);
  assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), GAME_SOURCE_BLOB,
    'Exact accepted game controller source required');
  assert.equal(source.split(originalImpact).length, 2); assert.equal(source.split(oldRoot).length, 2);
  const changed = source.replace(originalImpact, flatImpact).replace(oldRoot, newRoot);
  assert.equal(restoreFlatGameScene(changed), source, 'Only impact JSX and root marker change');
  return changed;
}
export function restoreFlatGameScene(source) {
  assert.equal(source.split(flatImpact).length, 2); assert.equal(source.split(newRoot).length, 2);
  return source.replace(flatImpact, originalImpact).replace(newRoot, oldRoot);
}

