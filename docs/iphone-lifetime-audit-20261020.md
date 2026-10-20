# Official Testnet resource-lifetime audit, 20 October 2026

The owner no longer has a Mac. Continue the authorized investigation without
requiring another full manual campaign to collect the same existing counters.
This is an isolated preparation, not a new preview game or public release.

## Baseline and boundaries

The official Testnet alias was read afresh on 20 October and still resolves to
READY production deployment `dpl_DssUzk9j8fruG7HY7BNPUMfYZjmW`, source
`a889d22cc9c1142f51773e073c41b0a7c8aa13d8`, tree
`4836157c730cf5f056f693bbb1664b815fd46932`.
The isolated branch starts at that exact commit. No unofficial preview is used.
Automatic Vercel deployment is disabled for `codex/iphone-lifetime-audit-20261020`.
Public Testnet and Mainnet are unchanged by this audit.

## Confirmed finding and limited correction

`renderPaintedSprite` retained the full painting canvas until both the encoded
PNG image's load and its `decode()` completed. After the asynchronous `toBlob`
callback has returned the immutable Blob, that canvas is no longer read. A slow
or pending image decoder therefore kept an unnecessary second pixel surface.

Release the working canvas immediately after successful encoding. Capture its
original decoded byte size first so the existing cache limit and diagnostic
accounting remain correct. Failed encoding retains its existing final cleanup.
The same original hull, material calculation, full resolution, PNG, image
readiness gate, serialized queue, cache limits and URL ownership remain in use.

The first real hull fixture has a 282 by 282 working surface: 318,096 logical
RGBA bytes were unnecessarily retained across the decoder wait before this
change, versus zero after it. This is a canvas-lifetime result, not a measured
reduction in iPhone process memory or proof of the Whitescreen cause. No lasting
unbounded leak was demonstrated by this test; a surface could previously be
released normally once decoding completed.

Only `frontend/src/pages/paintedShip.ts` changes game runtime behavior. There are
no changes to navigation, gameplay, styles, timing, audio, login, owner-only
Admin, backend, accounts, saves or Highscores.

## Verification

`frontend/scripts/verifyPaintedShipLifetime.mjs` bundles the actual component
resource module and executes the original material operation and native PNG
encoding/decoding with controllable browser load/decode waits.

- The negative control against exact official `a889d22` fails the new lifetime
  assertion: 318,096 bytes remain when the decoder wait begins.
- Four candidate tests pass. The canvas remains intact until encoding returns,
  then releases before both image load and decode. A not-yet-ready image is not
  exposed. Cache accounting retains the original full decoded byte size.
- Three real hull/color/stage variants have exact RGBA equality before encoding
  and after PNG decoding versus official `a889d22`.
- Encode failure, image load failure and decode failure release the surface;
  failed output URLs are revoked, pending entries and preparation pins cleared.
- Sixty distinct hull preparations, including cancellation during encoding on
  alternate iterations, leave no working canvases or pins. The existing painted
  cache remains within 48 entries/24 MiB and its source cache within eight entries.
- Seventy existing input, guarded-loop, audio, music, hull-readiness, cache and
  boss-resource tests pass.
- The actual-component Canvas lifecycle host passes 2,000 warm impacts,
  400 moving impacts, idle timeout, null/lost context, fallback and unmount checks.
- Frontend build passes, including 12 i18n tests, the release gate and TypeScript.
  Vite reports its existing large-chunk warning. The repository has no frontend
  npm lockfile; dependency installation did not add one or edit package metadata.

Commands from `frontend`:

```sh
node --experimental-strip-types --test scripts/verifyPaintedShipLifetime.mjs
CRYPTOID_PAINTED_SOURCE_REF=a889d22cc9c1142f51773e073c41b0a7c8aa13d8 node --experimental-strip-types --test --test-name-pattern='painting surface is needed' scripts/verifyPaintedShipLifetime.mjs
node --experimental-strip-types --test src/pages/gameLoop.test.mjs src/pages/gameInput.test.mjs src/pages/gameAudio.test.mjs src/pages/gameAudioResume.test.mjs src/pages/musicPlayback.test.mjs src/pages/hullReadiness.test.mjs src/pages/resourceCacheDiagnostics.test.mjs src/pages/bossResourceDiagnostics.test.mjs
node scripts/verifyCanvasLifecycle.mjs
npm run build
```

The second command is expected to fail. Native raster QA uses `@napi-rs/canvas`
from the QA environment (or `CRYPTOID_NATIVE_CANVAS_MODULE`); it is not added to
application dependencies. No pixel assertion is bypassed or relaxed.

## Other audit results and remaining work

- Read the Home navigation and full-document reload paths in GamePage,
  RouteRecovery, useAuth, PiSignInCallback, axiosClient and the scene/loop error
  handlers. The inspected gameplay/error handlers do not automatically navigate
  Home: errors pause; Home/Back paths are explicit user actions. The separate
  OAuth callback has a successful-sign-in redirect, not a gameplay timer. This
  does not prove that no possible browser or external SDK navigation exists.
- Existing guarded-loop tests cover late cancelled RAF callbacks, strict-mode
  cleanup and loop-stall recovery without duplicated scheduling. Existing audio
  tests cover overlapping voices, pause/close and delayed browser promises.
- Existing painted/source caches are bounded in the tested preparations.
  These counts do not measure CSS compositing surfaces, browser image caches,
  GPU/native allocations, whole-process memory or OS memory pressure. Arbitrary
  slow-network pending-request growth was not measured in this audit.
- Physical iPhone/Pi Browser memory, frame pacing, thermal behavior and native
  process termination remain unverified. Neither a native crash cause nor a
  complete Whitescreen fix is established. Desktop/native host results cannot
  establish those device results.
- Further investigation should distinguish transient decode/compositing peaks,
  cumulative retention and cold-start work. Keep any experiment isolated and
  retain the official game appearance; a pause alone does not prove cleanup.

There is no new public deployment to roll back. The official deployment and its
existing prior-release rollback `dpl_7CGcYyrnLNXwkU8ychnkxfjqR198` at `f5be06d`
remain the established references. Any later public release needs a separate
explicit release instruction for the reviewed candidate.
