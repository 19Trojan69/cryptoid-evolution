# iPhone Canvas surface reuse: reviewed isolated candidate, 19 October 2026

Source baseline: `f24ca60cb87d9442edf683f04b34b73670b56f45`.
Branch: `codex/iphone-canvas-surface-reuse-20261019`.
The earlier unverified checkpoint is preserved as `eb466cc82a4d080c956f411698ca5a1e01208d40`.

## Device evidence and limits

The supplied investigation checkpoint reports the same whitescreen followed by
Home in Pi Browser and Safari. The latest report reaches the bonus round after
the fourth boss (internal sector 40, bossId 4). A new document starts 2.572 seconds
after `resource-bonus-first-spawn`. Reactor shot creation, audio return, React
commit, five core volleys, boss defeat and the bonus transition had completed.
Known counters remained bounded, but omit native/GPU/total process memory. No
matching October 19 Jetsam/WebKit report was visible in the supplied iOS lists.
These observations do not establish the reason for the document restart.

## Final change

Only `frontend/src/pages/CanvasEffects.tsx` changes at runtime. When the final
ordinary effect ends, drawing stops immediately and the surface is cleared
using the identity transform. Its existing backing store is retained for a
nominal two-second idle timeout. A new burst cancels that timeout and reuses
the store if its original required dimensions match. Each dimension is assigned
only when it changes. Idle expiry returns to the existing tiny surface; context
loss and unmount cancel deferred cleanup and release the resources as before.

Logical effect bounds reset between bursts exactly as in f24. Keeping the old
origin, as eb466cc did, altered native raster rounding. That broader growth
strategy is discarded. Retaining storage while recomputing the original bounds
fixes the discrepancy without changing drawing code, artwork, scale, CSS,
coordinates, timing, input, sound, difficulty, rewards, accounts or saves.

The expanded native test also exposed incomplete idle clearing under the last
translated/scaled transform. Returning to the identity transform before clearing
makes every retained idle pixel transparent. The baseline obtained its empty
surface by resizing it immediately.

The tradeoff is retaining the last bounded backing store during a short idle
gap, instead of shrinking it immediately. No additional surface or resolution
is introduced, and no idle RAF runs. Timers can be delayed by browser scheduling;
this is not a guarantee that the OS frees native memory at exactly two seconds.

## Completed verification

- 275 exact RGBA comparisons against f24, using the actual component and native
  raster backend with real hull/fire/smoke assets and four original fragments.
  Eleven scenes cover centre/edges, fractional positions, repeated bursts,
  concurrent effects and idle expiry at five animation ages. DPR values: 1,
  1.5, 2, 2.625 and 3. Every retained idle surface is completely transparent.
- Native fixture dimension assignments: 50 to 26 at DPR 1; 52 to 28 at each
  other tested DPR, including setup and teardown. These are assignment counts,
  not native allocator, GPU memory or FPS measurements.
- Actual-component allocation host: 2,000 identical warm impacts perform zero
  additional dimension writes after initial setup. The 400 moving edge impacts
  perform 600 writes with the original per-burst bounds and playfield/DPR size
  limit. The prior checkpoint's four-write moving result is intentionally no
  longer applicable because that old-origin strategy failed pixel preservation.
- Idle release at two seconds, no idle RAF, at most one release timer, new-burst
  cancellation, pending-timer cancellation on context loss/unmount, null-context
  DOM fallback, and protection against reviving failed surfaces all pass.
- Existing texture/hull preparation, cache eviction, abort and cleanup checks
  pass. Thirteen artwork/math/bounds/ship-image tests pass. Full frontend build
  passes, including all 12 i18n tests and the localization release gate.
- Negative controls: f24 fails the allocation regression at immediate idle
  shrink. Reintroducing only the retained old origin fails strict RGBA equality
  at DPR 1 (scene 11: seven channels, max delta seven). The obsolete
  `CRYPTOID_PIXEL_MEASURE_ONLY` variable cannot bypass this failure: its bypass
  has been removed. A separate idle-transparency assertion caught pixel residue
  before the identity-transform cleanup correction.
- Final runtime diff against f24 is limited to CanvasEffects.tsx. No gameplay,
  audio, styles, assets, backend, login, purchase or save files changed.

Run from the repository root:

```sh
node frontend/scripts/verifyCanvasLifecycle.mjs
node frontend/scripts/verifyCanvasEffects.mjs
node frontend/scripts/verifyCanvasSurfacePixels.mjs
node --experimental-strip-types --test frontend/src/pages/normalEffectMath.test.mjs frontend/src/pages/normalEffectBounds.test.mjs frontend/src/pages/shipImageLifetime.test.mjs
npm --prefix frontend run build
git diff --check
```

The native raster test requires the QA runtime's `@napi-rs/canvas` through
`CODEX_PRIMARY_RUNTIME_NODE_MODULES`. It is not added as an application dependency.

## Remaining work and release boundary

This candidate reduces demonstrated canvas dimension churn while preserving
raster output in the tested host. No physical iPhone/WebKit process memory,
GPU allocation, FPS, or crash-reproduction verification exists. It is not a
proved native-crash cause or a complete whitescreen fix.

Public Testnet and Mainnet have not been changed by this continuation. The
checkpoint identifies official Testnet as the reactor diagnostic f24 source.
Do not move either alias without the separate explicit release authorization
required by `frontend/AGENTS.md`. The f24 baseline remains the rollback source.

The next useful validation is a focused isolated comparison around an affected
boss-to-bonus boundary and native memory/reload evidence where available.
Do not require another complete campaign merely to collect the same counters.
The ChatGPT message-stream failures are separate from the game's restart.
