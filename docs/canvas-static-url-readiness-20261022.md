# Canvas static-URL readiness — 22 October 2026

Status: published to official Testnet after explicit approval; see
[release receipt](canvas-static-url-release-20261022.md).
Fixed source: `5d6e7cb703ef114ee4626c1fbb0e34a45b1667d8` on
`codex/canvas-static-url-readiness-20261022`; automatic deployment disabled.
Parent: local `4a9941b623225cbc6d66719604122106aa57f17a`, with the runtime
published as official Testnet `0bb35e5aeac49557edb8fd7379422066971e47de`.
The previous official release is preserved as the rollback source. Keep every
fixed source/rollback ref and Mainnet unchanged.

## Confirmed defect and incident limits

The 22 October v5 report is from the static-hull runtime. The final persisted
flight recording is at 14:31:58.552 Vienna and the replacement document starts at
14:32:05.098. The active second boss has an exposed reactor; this is not a defeat,
victory-audio wait or recorded normal Home exit. The first core projectile was
created, its audio request returned and its scene committed over twenty seconds
earlier. Effects/music clocks still advanced at the final resource sample.

The known-resource estimate of 16,223,075 bytes is only a partial counter. It does
not measure total WebContent/GPU/compositing memory or prove that the process was
below its native limit. The matched 21 October Jetsam event concerns a different
interruption. No matching 22 October native report was available in this review.

`CanvasImpact` compared `loaded.hull.src === url`. The current style hook returns
a root-relative static PNG URL, while the browser's Image.src getter resolves it
to an absolute URL. Prepared resources therefore silently failed the availability
check and the original HTML/CSS effect stayed mounted. The public Testnet bundle
was independently checked and contains the same comparison and static revision.
This fits zero registered Canvas impacts/effect paints despite prepared resources
in the supplied report. It is a reproducible integration defect, not proof of
the native termination cause or an explanation of every historical White Screen.

The preceding static-asset tests checked loading, style readiness and direct
Canvas image compatibility separately. Existing Canvas lifecycle tests supplied
a Blob-address hook. They did not exercise the complete relative-URL/reflected
Image.src boundary. That integration coverage gap is now closed.

HTML URL reflection specification consulted during the preceding investigation:
https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflecting-content-attributes-in-idl-attributes

## Isolated correction

Only `frontend/src/pages/CanvasEffects.tsx` changes application runtime behavior:

- Preserve `sourceUrl`, the exact requested cache/style key, in both cached and
  asynchronously completed resource bundles.
- Include that key in the no-op state-update comparison and availability guard.
- Keep the existing render-scale and resource-generation checks.

No origin hardcoding, URL normalization allocation, new timer, RAF, listener,
resource cache or increased budget is introduced. `drawImpact`, source loaders,
texture generation, source ownership, idle release, pause handling and original
fallback remain unchanged. Ship assets, painting/style hook, geometry, colours,
fragment paths/counts, durations, resolution, boss presentation, audio, simulation,
input, HUD, APIs, authentication, accounts, saves, rewards and economy are unchanged.

The manifest remains `91a72bc0c36be9407915`: 1740 PNGs, 95,450,326 encoded bytes,
original 282x282 ship resolution. Only on-demand requested variants are loaded.

## Regression and integration verification

Run `npm run test:canvas-static-url` in `frontend`. On a clean checkout, first
run `npm run prepare:hulls`; the normal build already does that in `prebuild`.

The suite bundles the actual CanvasEffects module together with the actual
paintedShip hook/cache and uses native Skia images/Canvas drawing plus a small
controlled React-hook host. Its Image.src getter implements browser URL reflection.
Only explicit address controls substitute the style hook; all main integration,
cold loading, failure, ownership and repeated-use cases use the actual hook.

The exact preceding CanvasEffects source is retained as a portable test fixture:
`frontend/scripts/fixtures/canvas-static-url-before-20261022.txt`.
Its SHA-256 is `f9f862bad6cc19968c46b13c6045e3317c7a4e10b9080dea7083be8c579fbbd1`,
equal to the parent source. The host verifies this digest before using the fixture.
The negative and pixel controls do not depend on unavailable Git history in a
shallow production build checkout.

Before the runtime correction, the first twelve integration cases produced
four passes and eight failures: the real relative-PNG path never registered.
An earlier host setup attempt failed because esbuild conflated the distinct
existing `paintedShip.ts`/`PaintedShip.tsx` names; explicit test-host resolution
corrected that setup error before the meaningful red/green run. No application
module was renamed and no assertion was removed to make the suite pass.

The final suite passes **15 tests**, covering:

- Actual preceding-source negative control: prepared image/textures, zero Canvas
  registrations, visible original fallback and no recorded preparation failure.
- Actual prepared style hook → relative PNG → absolute reflected image URL →
  registered effect and nontransparent native Canvas output.
- Cold readiness and original visible fallback; relative, absolute,
  query/fragment and historical Blob-address controls.
- Source replacement while loading; failure/retry on remount; late completion
  after unmount and after resource-generation retirement.
- Pause/resume, disabled optional surface, null drawing context, context-loss
  fallback, render-scale changes and two simultaneous owners sharing resources.
- 1000 further warm actual-hook impacts: no extra image requests or backing-store
  size writes, one bounded idle timer, no idle RAF and complete final cleanup.
- **54 exact native RGBA comparisons** against the unchanged preceding renderer's
  working absolute-URL control: three hulls/stages/colours, device ratios 1/1.5/3
  (existing 1.5 render-scale cap), six original fire/smoke/debris ages.

The suite is now an obligatory step of `npm run build`, before TypeScript/Vite.
Its host and fixture are test-only and are not imported by application modules.
No runtime dependency was added; it reuses the already pinned build-only
`@napi-rs/canvas` 0.1.100.

## Existing checks rerun

- 154 focused audio, progress, owner-recorder and sanitized-report tests pass.
  The same two unavailable historical-source comparisons remain excluded, not
  counted as passes. Whole-GamePage parity is in the passing set.
- All eleven static-hull tests pass, including byte equality of every one of the
  1740 PNGs to the preceding native encoder, cancellation/failure/actual style-hook
  tests and 1100 preparation changes over 500 sector/escort/bonus plans.
- `verifyCanvasLifecycle.mjs` passes: 2000 warm/400 moving impacts, no redundant
  warm resizing, two-second idle release, cancellation and original-display
  fallback on context loss/null contexts.
- `verifyCanvasEffectCadence.mjs` passes: original drawing code/commands, pause,
  completion/sleep/wake, cleanup and existing 60-Hz own-paint cadence retained.
  These counters are not measured screen presentation FPS.
- `verifyCanvasEffects.mjs` passes: pending/completed release, bounded hull and
  texture caches, active ownership, capacity fallback and transient retry.
- Full `npm run build` passes: hull generation, twelve locale tests, release
  language gate, all fifteen integration tests, TypeScript and Vite.
- All 403 other tracked frontend source files match the parent. CanvasEffects
  matches exactly the four reviewed readiness substitutions plus their comment.
  Asset sources are unchanged, the built bundle contains the new requested-key
  guard, and test-host/fixture markers are absent from application chunks.
- Targeted CanvasEffects ESLint has exactly the same twenty pre-existing findings
  as the parent, with both versions exiting 1. No clean whole-project lint claim.
  Existing npm proxy-config, backend module-type, isolated CJS import.meta and
  large-bundle warnings remain.

The older static-hull preparation scope script intentionally requires
CanvasEffects to be unchanged; it describes that historical patch, not this one.
Do not weaken its assertions and present it as a passing scope check for this
new change. Check this candidate's four readiness substitutions and unchanged
runtime/assets directly instead.

## Preparation boundary (historical)

The following records the boundary at the end of local preparation. The later
explicitly approved Testnet preview and production release are documented in
[the release receipt](canvas-static-url-release-20261022.md).

No preview, Testnet or Mainnet deployment was performed. No runtime logs, drains,
protection bypass, credentials or new account permissions were requested. Earlier
permission denials remain in force. No physical iPhone, WebKit native memory,
audible-output, heat, screen FPS or final White Screen fix has been demonstrated.

The verification workflow covers the local image/hook/resource/drawing boundary;
there is no changed server or account data flow. Local browser installation and
previously denied localhost/file access were not retried or bypassed. Publication
and a normally served browser/device check require the next explicit release
instruction. Any device follow-up should target the existing mission/boss rather
than require another full campaign merely to collect already established counters.
