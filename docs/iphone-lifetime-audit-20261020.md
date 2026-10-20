# Official Testnet resource-lifetime audit, 20 October 2026

## Released result

Official Testnet now serves READY production deployment
`dpl_BvFoZifj5ZFqEqCTEBixwfoUPpcH`, exact source
`51e59c3373a8dd4ba4985d5a9559acdcf2d6755a`, reviewed tree
`9a614fc69e88f6c8a55954c72131bb6df16a5798`.
Released at 08:17:44.097 Europe/Vienna on 20 October. The fixed branch
`codex/testnet-image-lifetime-release-20261020` preserves that runtime.

Home, API root, boss-7 atlas and anonymous Admin rejection checks pass. All
three public Highscore responses match the immediate before-release responses
exactly (2 legacy, 17 V2 and 7 career entries). Fourteen new-deployment request
records between 06:17:45.725Z and 06:19:34.103Z contain no warning/error/fatal
console records. This bounded scan is not device stability verification.

Immediate rollback is still READY `dpl_DssUzk9j8fruG7HY7BNPUMfYZjmW` at `a889d22`,
preserved by `backup/testnet-before-image-lifetime-20261020`. Mainnet remains
`dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe` at `907d2a7`. No account, save or Highscore
data was reset. See [release receipt](image-lifetime-release-20261020/release.json)
and [dashboard proof](image-lifetime-release-20261020/testnet-ready.jpg).

The following source diagnosis and host-test limits remain applicable. The
next physical iPhone check should use the official Pi Browser game: a direct
normal-block test followed by boss 2 through destroyed turrets/reactor opening.
Use the existing owner Admin direct-start controls; no full campaign is needed.
If an interruption occurs, the existing owner-only Technical Report can be
copied from that same Pi Browser tab. A successful short test is not proof that
all possible iOS terminations have been eliminated.

The owner no longer has a Mac. Continue the authorized investigation without
requiring another full manual campaign to collect the same existing counters.
The user subsequently accepted the proposed sequence with "Und dann machen wir
das. Sag mir step by step, was ich tun muss oder ob du das allein machen kannst."
The sequence explicitly includes publishing tested corrections to the existing
Testnet with a rollback point, followed by a targeted iPhone check. This approval
is applied only to the reviewed image-lifetime changes described here. Mainnet
and all account/data/security behavior are excluded. The actual release receipt
must distinguish preparation from a completed public deployment.

## Baseline and boundaries

The official Testnet alias was read afresh on 20 October and still resolves to
READY production deployment `dpl_DssUzk9j8fruG7HY7BNPUMfYZjmW`, source
`a889d22cc9c1142f51773e073c41b0a7c8aa13d8`, tree
`4836157c730cf5f056f693bbb1664b815fd46932`.
The isolated branch starts at that exact commit. No unofficial preview is used.
Automatic Vercel deployment is disabled for `codex/iphone-lifetime-audit-20261020`.
At the pre-release read, public Testnet remains on the source above; Mainnet
remains READY `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe`, source `907d2a7`.

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

The delayed-response continuation identified two additional issues in that same
resource module:

1. A preparation lost its last consumer while waiting for a source image,
   encoder, replacement load or decoder, but resumed obsolete work afterwards.
   Recheck the existing consumer pins at those four asynchronous boundaries.
   Cancel only when no consumer needs the variant. Retire its rejected promise
   before another consumer can inherit it, and revoke unused output URLs.
2. Evicting an unfinished source from the eight-entry cache did not cancel its
   Image operation. Repeated real block plans with responses held back created
   162 Image objects for 20 URLs, while the reported cache stayed at eight.
   Share one pending promise per URL until success/failure. Delete pending
   entries when settled; completed images still use only the existing cache.
   Loading concurrency and image quality are not reduced.

Those Image counts come from the controlled host, not network-transfer counts
or decoded iPhone memory. Browsers may share network/image resources themselves.
The correction does not impose an eight-request concurrency limit: twenty
different still-pending URLs can legitimately have twenty different operations.

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
- Thirteen candidate tests pass. The canvas remains intact until encoding returns,
  then releases before both image load and decode. A not-yet-ready image is not
  exposed. Cache accounting retains the original full decoded byte size.
- Three real hull/color/stage variants have exact RGBA equality before encoding
  and after PNG decoding versus official `a889d22`.
- Encode failure, image load failure and decode failure release the surface;
  failed output URLs are revoked, pending entries and preparation pins cleared.
- Sixty distinct live hull preparations leave no working canvases or pins.
  Separate cancellation cases test every asynchronous boundary, a shared live
  consumer and a remount during cancellation/finally microtasks. The painted
  cache remains within 48 entries/24 MiB and its source cache within eight entries.
- All four obsolete-work assertions fail against exact official `a889d22`.
  The delayed source-sharing assertion also fails there: 162 objects versus the
  required 20. The candidate creates 20, supports ordinary retry after failure
  and drops completed pending entries rather than retaining an extra image cache.
- 1,100 rapid preparation-plan changes use the real plans for all 500 sectors
  and 50 bosses, covering normal groups, boss intro/fight/escorts and both bonus
  groups behind a delayed first source. Obsolete work settles; only variants
  needed by the final scene are painted, and its required variants all complete.
  This is not a 500-sector gameplay replay, combat simulation or device FPS test.
- Seventy existing input, guarded-loop, audio, music, hull-readiness, cache and
  boss-resource tests pass.
- The actual-component Canvas lifecycle host passes 2,000 warm impacts,
  400 moving impacts, idle timeout, null/lost context, fallback and unmount checks.
- Frontend build passes, including 12 i18n tests, the release gate and TypeScript.
  Vite reports its existing large-chunk warning. The repository has no frontend
  npm lockfile; dependency installation did not add one or edit package metadata.
  After the delayed-source changes, the eight directly relevant existing hull/
  readiness/cache tests and the complete frontend build were rerun and pass.

Commands from `frontend`:

```sh
node --experimental-strip-types --test scripts/verifyPaintedShipLifetime.mjs
CRYPTOID_PAINTED_SOURCE_REF=a889d22cc9c1142f51773e073c41b0a7c8aa13d8 node --experimental-strip-types --test --test-name-pattern='painting surface is needed' scripts/verifyPaintedShipLifetime.mjs
CRYPTOID_PAINTED_SOURCE_REF=a889d22cc9c1142f51773e073c41b0a7c8aa13d8 node --experimental-strip-types --test --test-name-pattern='cancellation during|delayed source requests' scripts/verifyPaintedShipLifetime.mjs
node --experimental-strip-types --test src/pages/gameLoop.test.mjs src/pages/gameInput.test.mjs src/pages/gameAudio.test.mjs src/pages/gameAudioResume.test.mjs src/pages/musicPlayback.test.mjs src/pages/hullReadiness.test.mjs src/pages/resourceCacheDiagnostics.test.mjs src/pages/bossResourceDiagnostics.test.mjs
node scripts/verifyCanvasLifecycle.mjs
npm run build
```

Both baseline assertion commands are expected to fail. Native raster QA uses `@napi-rs/canvas`
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
  slow-network native memory behavior was not measured. The controlled pending
  Image duplication finding and its limits are described above.
- Physical iPhone/Pi Browser memory, frame pacing, thermal behavior and native
  process termination remain unverified. Neither a native crash cause nor a
  complete Whitescreen fix is established. Desktop/native host results cannot
  establish those device results.
- Further investigation should distinguish transient decode/compositing peaks,
  cumulative retention and cold-start work. Keep any experiment isolated and
  retain the official game appearance; a pause alone does not prove cleanup.

Before releasing this candidate, preserve the freshly verified current Testnet
source `a889d22` and READY deployment `dpl_DssUzk9j8fruG7HY7BNPUMfYZjmW` as its
immediate rollback. The older rollback `dpl_7CGcYyrnLNXwkU8ychnkxfjqR198` at
`f5be06d` must also remain available. Record the exact new runtime commit, build,
post-release checks and proof separately; this document alone is not evidence
that a new version has been published.

## First owner feedback after release, 20 October 2026

At 08:46 Europe/Vienna the owner confirmed that he chose the exit himself and
that slowdown was less severe than before. This clarifies the V4 report generated
at 06:37:48.618 UTC: do not classify its final Home return as another unexpected
restart. The report has one boot ID, both boss fights complete, and `home-intent`
at 06:36:59.969 UTC followed by `game-monitor-stop` five milliseconds later.
There is no recorded unexpected document restart in this supplied run. This is
one successful observed run, not proof of permanent Whitescreen resolution.

The report was collected after official Testnet release `51e59c3`; V4 contains no
runtime commit or deployment ID, so the JSON alone cannot independently attest
which bundle was running. Known resource estimates settle around 39–45 MB after
warmup and return to 38,912,959 bytes after boss 2. Painted entries plateau at 48,
source/texture entries at eight, and the idle effect surface returns to 36 bytes.
The counters show no sustained accumulation in this run; native/GPU/process
memory remains unmeasured. Sparse frame snapshots include 51–65 ms gaps and
cannot establish average FPS, percentile frame pacing or the cost responsible.

Read-only follow-up inspection of the released GamePage code confirms an existing
compact-screen presentation limit: width <=700 uses a minimum 32 ms scene-request
interval, increasing to 50 ms when `slowFramesRef` reaches six. RAF quantization,
commit scheduling and paint time mean these are request thresholds, not a promise
of exactly 31.25 or 20 presented FPS. Simulation and direct player movement keep
their existing RAF path. The simulation also caps each delta at 34 ms; sustained
long frame gaps can therefore reduce simulated progress relative to wall time.
These are pre-existing timing rules, not introduced by the image-lifetime patch.
The V4 export does not include the slow-frame counter, selected scene interval,
scene-commit timing or simulation-section costs, so it cannot attribute the
remaining subjective slowdown to one of these paths.

Keep the distinction between fewer abrupt exits, remaining frame delays, scene
presentation cadence and simulation timing explicit. Do not remove the existing
load limit, alter combat timing or reduce visual/audio quality on the strength of
this report. This follow-up changed documentation only and made no deployment.
