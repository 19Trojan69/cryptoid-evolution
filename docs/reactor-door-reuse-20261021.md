# Step 2 — reuse unchanged reactor doors

The owner requests small, individually verified stability steps without optical
downgrades. This candidate starts at exact official Testnet runtime
`540d73e7b5a89a3098a6c6404bd3deac8f269cd3`, tree
`e2530e7824a44992e41b612153a48b9df2174345` (READY production
`dpl_NnTPP38Gm8UZUaAUzj7q4uCUq4U8`). Its completed release record is on
`codex/idle-rock-surface-release-record-20261021` at `f68eca3`.

## Change

The two textured reactor doors previously rebuilt their React elements whenever
charge or recoil changed, even with fully open doors. Retain those exact children
by their actual opening, image, dimensions, crop coordinates, metal colour and
SVG ID. Opening still updates on its original clock; charge, recoil and muzzle
flash update separately. Mutable boss/core object identities are not cache keys.

SVG structure, clipping, hull texture sampling, gradients, geometry, opacity and
draw order remain exact. The authored pulse, drop-shadow, animation phase,
colour, 1.1-second rhythm and reduced-motion preference remain in the original
CSS. No CSS, resolution, artwork, game rules, shot timing, audio or account code
changes. No timer, animation loop, persistent canvas or dependency is added.

## Verification

Actual React rendering compares 7,804 exact host trees across all 50 bosses and
three field widths (320/430/820), including opening, charge, recoil, colour
changes, resize, replacement hull image, defeat and restored turrets.

| 1,200 updates | Official runtime JSX elements | Candidate JSX elements |
| --- | ---: | ---: |
| Closed, unchanged doors | 0 | 0 |
| Opening doors | 21,600 | 21,600 |
| Charge with open doors | 21,600 | 3,600 |
| Recoil with open doors | 22,800 | 4,800 |

These are element-allocation counts for this component. They do not measure a
comparable change in total frame time, GPU memory, process memory or FPS.

Fourteen existing boss/core/special-weapon tests pass. Component hooks lint and
the release build pass, including TypeScript, twelve locale tests and the
translation release gate. Existing npm configuration and chunk-size warnings
remain. Evidence: `reactor-door-reuse-20261021/react.json` and `build.txt`.

Native Chromium 153 passes all 1,050 exact DOM comparisons (50 bosses × three
widths × seven opening/charge/recoil states). Across 120 further charge updates,
the original pulse node, two texture image nodes and native animation remain
connected and identical; its clock advances normally. Unmount returns native
animations, pacing entries and reactor nodes to zero, with no page errors.

With `--disable-gpu --disable-accelerated-2d-canvas`, all 90 PNG comparisons
match exactly without tolerance: five representative bosses × three widths ×
three opening/charge/recoil states × two controlled native pulse phases (0 and
550 ms). The actual production CSS is used. Native animations are paused only
for the snapshots; the separate lifetime test reloads a fresh document and
allows native clocks/events to run without seeking.

The initial default serverless SwiftShader comparison is not an exact pixel
pass: 7/90 PNG pairs differ at up to 195 pixels and one RGB level per channel,
with identical alpha. A same-baseline-vs-same-baseline control also fails,
13/90 pairs at up to 246 pixels and one RGB level with identical alpha. The
positions/counts differ; these establish variation in that comparison method,
not the precise cause or GPU equivalence. Keep both failed results as evidence;
do not relax the equality threshold or report them as successful pixel tests.
The strict software-rendered comparison above passes independently.

Evidence: `reactor-door-reuse-20261021/software.json` (strict passing run),
`native.json` (initial candidate run) and `baseline-control.json` (self-control).
Reproduce the passing run from frontend with
`CRYPTOID_NATIVE_SOFTWARE=1 node scripts/verifyReactorDoorsBrowser.cjs`, using
the existing esbuild, Playwright, native Chromium and @napi-rs/canvas QA tools.
For React allocation checks use `CRYPTOID_SCENE_QA=/tmp/cryptoid-boss-effect-qa
CRYPTOID_REACTOR_BASE=540d73e7b5a89a3098a6c6404bd3deac8f269cd3
CRYPTOID_REQUIRE_REACTOR_DOOR_FIX=1 node scripts/verifyBossReactorWork.cjs`.

Neither host-tree equality nor the controlled Linux Chromium comparison proves
Safari/WebKit behaviour, physical iPhone memory/temperature/presented FPS, or
that the reported interruption is fixed.

This is preparation only. Automatic deployment is disabled on
`codex/reactor-door-reuse-20261021`. Official Testnet, Mainnet and all existing
fixed source/rollback references remain unchanged. A later explicit publication
request applies to this reviewed candidate rather than an evidence-only commit.
