# Slowdown after preview 342f255 — 19 October 2026

The user reports marked slowdowns after playing the latest shared-resource
preview (342f255 / dpl_4v3xHTLQ7gZjJheDfaxJD82Lm6ox). Its bounded loading and rock
surface corrections do not establish stable iPhone frame rate. Do not describe
that preview, or this narrow follow-up, as a complete slowdown or crash fix.

## What source inspection explains

The existing main loop computes `delta = Math.min(34, frameGap)`. When callbacks
arrive 50 ms apart, it advances simulation by only 34 ms: 68% of elapsed real
time. Compact phones also request React scene commits at 32 ms intervals, or
50 ms after repeated frame gaps over 48 ms. Around a 60 Hz callback cadence,
these correspond roughly to 30 or 20 scene updates per second. Direct player
motion and simulation still run in RAF. These paths predate the latest preview.

This explains how poor frame cadence can become visible slow motion. It does
not establish what caused this user's frame-rate drop. Removing the delta cap
without collision/substep work would risk changed combat and tunneling, and
requesting more React work under load is not a measured correction. Both paths
remain unchanged in this follow-up.

The uncached material shader still runs synchronously during preparation. A
small native/server probe of four real 282×282 ship sources measured warmed
material passes mostly around 1.5–3 ms, with cold samples up to 9.57 ms. These
are not iPhone/WebKit timings and do not prove a sustained shader bottleneck.
Earlier device traces also showed poor frame cadence after preparation jobs
had finished; do not reduce the investigation to image loading alone.

## Two demonstrated redundant work paths corrected

- Reloading a source evicted from the eight-entry raw cache allocated a 240×240
  canvas/context even when its immutable visual center was already cached.
  Allocation now occurs only when that center is unknown; cold-source behavior,
  actual image loading and the optional visual-center fallback remain intact.
- A prepared group could lose all consumers while waiting for a source image.
  It then continued through full material, encoding and painted-Blob decoding.
  Recheck its existing cache retention after loading, before allocating/painting.
  An abandoned job now rejects and leaves no pending paint entry; a new consumer
  can request the same variant normally.

Both new regression tests fail against 057f075 / preview 342f255 and pass with
the correction. The all-stage actual-module source fixture completes 3,104 raw
image loads for 70 distinct addresses. Only 70 center canvases are now allocated,
rather than a canvas for every reload. This is a controlled lifecycle fixture,
not measured browser/GPU memory or device FPS.

## Verification and release boundary

63 focused tests pass: source queue/retention/priority/error retry, abandoned
preparation, visual-center reuse, material invariants, resource bounds, audio,
loop and rocks. Full frontend build (including 12 i18n tests and release gate)
and isolated playable build pass. `git diff --check` passes. The complete
material/Blob/decode/cache-admission path after the new cancellation guard is
byte-identical to 057f075. GamePage is byte-identical; there is no gameplay,
cadence, CSS, artwork, audio, account or diagnostic-sampler change.

This follow-up is reviewed source on an isolated branch. No further preview or
public alias is published for this narrow change. The existing preview remains
available with the user's slowdown finding recorded. Public Testnet 66eb357 and
Mainnet 907d2a7 have not been changed by this work. Physical iPhone/WebKit frame,
compositing, total/native memory and thermal behavior remain unmeasured. The
device-specific source of sustained frame-rate loss remains open; no full
campaign replay is required simply to repeat the existing partial counters.
