# Finished hit, debris and flame cleanup — 21 October 2026

Prepared against exact official Testnet runtime
`171cb5c4507a1530a9bbb080d61805be0da545f7`, tree
`490b444be6bb87e8a4438c06b3c4bc86114a486f`.
The owner requested combining the finished-hit cleanup with investigation of
debris/flames that might remain visible too long, preserving the game's visuals.
This candidate is prepared and tested, not published. Automatic deployment is
disabled for `codex/finished-hit-debris-cleanup-20261021`.

## Findings

These are authored upper bounds from animation start, before any pause. Fragment
delays are deterministic integers from 0 through 44 ms. Boss times below start
at the final detonation, following the existing fall/detonation delay.

| Effect | Visible animation duration | Existing logical ownership |
| --- | --- | --- |
| Normal explosion fire | 880 ms | Part of the 2250-ms effect |
| Normal explosion smoke | 1450 ms | Part of the 2250-ms effect |
| Normal scattered debris | 2120 ms + up to 44 ms delay | 2250 ms |
| Player explosion debris | 2080 ms + up to 44 ms delay | 2250 ms |
| Boss final fire / smoke | 1350 / 1500 ms | Part of the final 3400-ms effect |
| Boss final debris | 2550 ms + up to 44 ms delay | 3400 ms |
| Hull hit burst and sparks | Parent 380 ms; individual spark profiles finish separately | Last invisible hit subtree previously remained until replacement/removal |

No unbounded visible debris or flame lifetime was reproduced. Normal debris has
at least 86 ms of wholly invisible ownership afterward; boss final debris has
at least 806 ms. The exact gap can be longer when the last actual fragment's
delay is below 44 ms. These gaps are not evidence of a memory leak or the cause
of the owner's interruption. Live ship-engine flames and damage embers have
their own intentional lifetime and are outside this cleanup.

## Change

`FinishedEffect` preserves the original intrinsic DOM host, attributes and
children. On a native animation-end event, it checks animations on that host,
descendants and pseudo-elements. Only when every returned animation is finished
or idle does it release the rendered subtree. Running, delayed, paused and
infinite children prevent early removal. Unsupported or throwing native
inspection retains the existing parent-owned lifetime. There is no new timer,
RAF, animation, global listener or dependency. The caller's existing hit key
starts each replacement burst independently.

HullDamage uses this for its transient burst only; damage heat sites and their
mask remain. The DOM impact renderer uses the same helper for completed effects,
including final boss debris; the falling boss renderer stays unchanged.

The normal Canvas impact loop records its existing final visible age from smoke
and fragment durations/delays. It draws every original visible frame, clears the
last image once, then stops requesting empty draw callbacks. A newly registered
burst wakes the existing frame chain. Registered ownership, bounds, pins,
surface dimensions and the existing two-second idle-release grace remain intact
until the original parent cleanup. The actual `drawImpact` function is byte
identical to the official baseline.

The entire `GamePage` component declaration is byte identical to the baseline:
effect state lifetimes, pause shifts, input, collision, recovery, transition,
reward and audio behavior are unchanged. All CSS and artwork remain unchanged;
no visible duration is shortened in this step. Thus the candidate addresses
invisible retained work, not a decision to shorten visible debris for taste.

## Verification and limits

Evidence is under `finished-hit-debris-cleanup-20261021/`.

* Production build, TypeScript, twelve locale tests and translation release gate
  pass. Twenty-six focused effect/resource/realism tests pass.
* Actual React reconciliation: 5000 hits across fifty bosses, at most eight heat
  sites and 23 intrinsic host nodes. Synthetic finish/cancel delivery releases
  all CSS pacing entries after 16,025 creations.
* Native Chromium 153: 600 exact visible DOM comparisons across fifty bosses,
  three widths and four effect kinds. All 120 strict PNG pairs match at two
  controlled phases with GPU/accelerated 2D disabled (240 individual captures).
* Fresh native clocks separately pass pause/resume, 100 hit replacements, normal,
  player and boss final cleanup, including delayed boss detonation. The extra
  lifetime-edge run confirms fragments remain mounted after fire/smoke finish,
  infinite children remain, and missing/throwing inspection preserves fallback.
  Complete unmount leaves zero native animations and zero pacing entries, with
  no page errors in either run.
* 275 exact native Canvas RGBA comparisons pass at five DPRs with the existing
  1.5 cap. Surface dimension writes match. Controlled cadence tests preserve the
  official frame sequence and pause behavior, cover maximum 44-ms fragment delay,
  verify one final clear, no empty draws while sleeping, and wake on a new burst.
* Canvas lifecycle checks pass 2000 warm and 400 moving impacts, release grace,
  pending cleanup, context-loss/null-context DOM fallback and unmount disposal.
* FinishedEffect and HullDamage lint are clean. GamePage retains its four
  baseline warnings; CanvasEffects retains the same twenty baseline errors.
  No new diagnostics. Preservation hashes cover simulation, fragment creation,
  falling boss, CSS, reactor, hull and weapons.

Native phase snapshots pause and seek animations only for equality capture;
lifetime checks use a fresh document with uninterrupted native event delivery.
The DOM pixel fixture uses the original atlas fallback for normal debris;
painted hull generation is unchanged and the Canvas raster test covers painted
hulls. Native browser tests use Linux Chromium, not physical iPhone/WebKit.
No whole-process/GPU memory, temperature, FPS improvement or interruption-fix
claim follows from these checks.

Reproduce from `frontend`, with the same installed QA dependencies/runtime:

```sh
CRYPTOID_SCENE_QA=/tmp/cryptoid-boss-effect-qa node scripts/verifyBossEffectLifetime.cjs
node scripts/verifyFinishedEffectsBrowser.cjs
CRYPTOID_FINISHED_LIFETIME_ONLY=1 node scripts/verifyFinishedEffectsBrowser.cjs
CRYPTOID_CANVAS_PIXEL_BASE=171cb5c4507a1530a9bbb080d61805be0da545f7 CRYPTOID_CANVAS_PIXEL_SAME_SURFACE_LIFETIME=1 node scripts/verifyCanvasSurfacePixels.mjs
node scripts/verifyCanvasEffectCadence.mjs
node scripts/verifyCanvasLifecycle.mjs
```

## Release context

Official Testnet remains READY `dpl_729MdmJke7jMhhX28Ukh8EqbXo8T`, runtime
171cb5c, ready 21 October 2026 13:28:11 Europe/Vienna. Completed release receipt
is `65e05fd340febf8d04cb4e9d95cfc4571abd10b5` on
`codex/reactor-door-reuse-release-record-20261021`. Fixed runtime source remains
`codex/reactor-door-reuse-20261021`; rollback remains
`backup/testnet-before-reactor-door-reuse-20261021` at 540d73e.

The preceding reflection-mask prototype was rejected: its native resource
measurement was unavailable and its strict pixels differed. That audit is
`e1d163e267762fd319a46899adf04713634557ae` on
`codex/boss-reflection-audit-20261021`; none of that prototype enters this
candidate. Keep every fixed source/rollback ref and Mainnet unchanged. No
deployment or production request was performed for this preparation.
