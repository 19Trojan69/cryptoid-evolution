# Isolated boss stability and playability review — 19 October 2026

## User scope and release boundary

The user wants a playable preview before publication, larger minimum turret
bodies with the existing small barrels, and a more thorough targeted stability
investigation. This branch retains the account-free, fixed-viewport preview and
existing persistent level summary/Next Mission button. It grants no Admin role and
does not enable owner diagnostics for an unverified guest. Normal authentication,
backend, account permissions and saves are unchanged.

Official Testnet remains source 66eb357 and Mainnet remains its previous release.
The previous playable preview remains available at deployment
`dpl_6XDUeYNH2j9D2gsWMh9hkARNtQdf`, source 8c2e870, local equivalent f5e8a47.
Returning to that immutable preview is a rollback; no account migration exists.

## Findings and changes

| Area | Evidence | Result |
| --- | --- | --- |
| Tiny turret bodies | Boss 2 bodies are about 6.1–8.1 CSS px at the reported 430 px field width. | Minimum armoured body width 12 CSS px. Only the original elliptical body and socket are enlarged. Original shafts, shadows, muzzles, recoil, projectile sizes, HP and fire logic remain. The added body ellipse receives matching swept collision, including aim and recoil; the distant barrel hit area is not widened. |
| Reactor phase weapon canvas | After all guns are destroyed, the old component still clears/repaints a static image every commit. | Retain the final pixels until size/config/image/context changes. Context restoration discards base/heat caches and repaints even with unchanged props. Live guns remain dynamic. |
| Failed backing contexts | A newly allocated base/heat canvas could remain nonzero after a null context. | Failed surfaces receive release assignments; missing heat context falls back to the original atlas instead of drawing an empty canvas. |
| Flare/meteor | Actual component has one meteor, at most one flare and one timer. Hidden/reduced-motion/pause/unmount paths are bounded. No growing collection found. | Preview defaults both decorations off and can re-enable them independently of the turret-size comparison. Normal game default is unchanged. No broad quality reduction. |
| Music | One media element/context; final turret destruction does not switch the music track. | No audio change. This does not rule out every native audio failure. |
| Native graphics resources | Existing byte counters omit or incompletely cover full-view SVG/blurred backgrounds, reactor hull clips/images and weapon canvases, as well as native/GPU/process overhead. | Stable recorded subsets cannot prove total memory stability or identify the process exit cause. No physical-device memory/FPS evidence is available. |

The recent user report includes an interruption while fighting after the last
turrets were destroyed. Earlier reports also reached boss clear and bonus. No
single crash location or native cause is proved. A sector pause alone cannot
address a failure in combat. No additional full campaign is required for the
next targeted comparison: the preview can start directly at boss 2.

## Verification

- Static correction before the intentional turret artwork change: 3,000 exact
  RGBA comparisons across all 50 bosses and five DPRs, against f5e8a47. No
  tolerance or assertion bypass. Historical isolated candidate: dcd4c13.
- Final current-art cache comparison: 3,000 exact RGBA comparisons with the same
  enlarged artwork in old/new components, including live heat/flash, last turret,
  2,000 reactor frames, frozen hull, logical/pixel resize, context loss/restore,
  unchanged-prop restoration, null-context retry, restored live gun and config
  identity. Zero extra clears/draws/dimension writes during static frames.
- Body-only native comparison: 400 frames, 50 real atlases, DPR 1 and 2,
  normal/heat/flash/dead. All 763,021,228 channels outside the intended enlarged
  body/socket regions remain exactly equal. Deliberately enlarged regions are
  not claimed to be pixel-identical. No new body textures or per-frame canvases.
- 15 combat/body tests, including all 392 guns, 320/390/430/1024 px fields,
  rotated/recoiling swept hits, larger-gun preservation and existing fire/HP gates.
- Three resource-failure/cache-replacement tests pass.
- Actual Starfield host: 50 sectors/2,000 callbacks, one timer/flare maximum;
  quiet mode creates neither component; all listeners/observers/timers released.
- 21 summary/Continue, fullscreen helper and boss diagnostic regression tests pass.
- Full normal frontend build passes, including 12 i18n tests and release gate;
  final TypeScript check and isolated preview build pass.

Commands, from frontend:

```
node --expose-gc --experimental-strip-types scripts/verifyBossWeaponStaticPixels.mjs --current-art
node --expose-gc --experimental-strip-types scripts/verifyTurretBodyPixels.mjs
node scripts/verifyStarfieldLifecycle.mjs
node --experimental-strip-types --test src/pages/bossTurretBody.test.mjs src/pages/bossWeaponResources.test.mjs src/pages/bossCore.test.mjs src/pages/bossTurrets.test.mjs src/pages/bossTurretDamage.test.mjs
node --experimental-strip-types --test src/pages/levelSummaryGate.test.mjs src/pages/gameFullscreen.test.mjs src/pages/bossBoundaryDiagnostics.test.mjs
npm run build
node scripts/buildPlayablePreview.mjs /tmp/cryptoid-investigation-preview
```

The existing boss damage test needs its backend playerSave build dependency.
If absent, bundle it locally with the frontend esbuild executable; no backend
source change is needed. Native raster/hook hosts are not a WebKit substitute.
No complete whitescreen fix, native fullscreen support or physical iPhone FPS /
GPU-memory improvement is asserted by these results.

The React review checked hook lifetimes, cleanup, memo invalidation for the new
ambient-events prop, unchanged control accessibility and absence of extra
per-frame body surfaces or global quality overrides.

The owner subsequently chose “Next Mission” instead of “Weiter” on the summary.
Only that action label changes; the gate, wait and cleanup semantics stay intact.
EN and DE use the requested English label; other supported locales retain localized navigation.
