# Step 1 — idle BonusRockLayer surface

The owner authorized a slow, step-by-step improvement with no optical downgrade.
Baseline is exact official Testnet `a51ce39e3199aeafc1101e30bb6f8aa53bf7cbab`, tree
`531e9810982382cf2b8ba846e67e69a47e907890`. Scope is only the empty rock canvas;
reactor, reflections and other effects are not changed in this step.

## Change

Previously the canvas grew to full field size on mount, before checking whether
there was anything to draw, and stayed that size through empty boss phases.
It now starts at 1×1. When there are stones or rock effects it restores the same
rounded dimensions at the existing maximum 1.5 raster scale and uses the original
textures, geometry, gradients, dust, particles, text, CSS sizing and drawing code.
There are no new timers, animation loops, dependencies or quality controls.

The last visible frame is cleared once. A brief empty gap keeps the warm surface.
After at least two seconds empty, the next existing component/scene update
shrinks the backing store to 1×1. A paused scene without updates can retain its
empty surface until the next update. Unmount explicitly zeroes both dimensions.
The seven reusable 192px textures remain available for the next event.

For the report's 430×825 field at device scale 3, the active canvas is 645×1238:
3,194,040 nominal RGBA bytes versus 4 at 1×1. These are backing-store dimensions,
not measured total process/GPU memory, and do not imply an equivalent RAM saving.

## Verification and limits

- Native Chromium 153, accelerated 2D canvas disabled: 936 exact RGBA comparisons
  with the actual baseline/current React components, without pixel tolerance.
  Three field sizes × three device scales (1, 1.5, 3), with the existing 1.5 cap.
- 72 cycles check active drawing, warm reuse, short empty gaps, the 1999/2000 ms
  boundary, first frame after regrowth, live hit marks, partial stone chips,
  final debris/dust/points, empty-pixel clearing, and zero dimensions on unmount.
- Actual draw code and texture generation are bundled. Only diagnostic timing is
  stubbed; idle time is controlled. CSS is compared unchanged. No page errors.
- Initial accelerated exact comparisons were not pixel-equal: the first captured
  320×700 pair differed at 99 pixels, with per-channel maxima [3,3,6,0] in RGBA.
  A self-control with two independent mounts of the exact same unmodified
  baseline reproduces 99 differing pixels and the same channel maxima. The exact
  underlying cause is not established; this limits that accelerated comparison
  method. It is not counted as a successful candidate pixel comparison. The
  controlled software comparison above passes. No physical
  iPhone/Safari/GPU equivalence or Whitescreen-fix proof is claimed.
- Twelve existing bonus-rock/combat-variety tests pass, including swept hits,
  points, campaign transitions and save behavior. Component lint, TypeScript,
  production build, twelve locale tests and the translation release gate pass.
  Existing bundle-size and backend module-type warnings are unchanged.

Evidence is in `idle-rock-surface-20261021/native.json` and
`idle-rock-surface-20261021/baseline-control.json`. Reproduce with
`CRYPTOID_IDLE_ROCK_REPORT=/tmp/idle-rock-result.json node scripts/verifyIdleRockSurface.cjs`
from frontend, with esbuild, Playwright and native Chromium dependencies available.

## Completed Testnet publication

The owner explicitly requested publication: "veröffentlichung bitte".
Official Testnet is READY on `540d73e7b5a89a3098a6c6404bd3deac8f269cd3`, tree
`e2530e7824a44992e41b612153a48b9df2174345`, Production deployment
`dpl_NnTPP38Gm8UZUaAUzj7q4uCUq4U8` (35s; ready 21 October at 12:35:00
Europe/Vienna). Protected preview `dpl_3FaenCtwAZs6AGXWq9xotgdanvbR` (36s)
passes guest start/pause/resume. The observed empty bonus-rock canvas is 1×1.
Fresh official Home loads with Spielen available. Pi authentication and physical
iPhone boss stability were not tested in this release flow.

Candidate branch `codex/idle-rock-surface-20261021` remains fixed at this exact
runtime. Immediate rollback is `backup/testnet-before-idle-rock-surface-20261021`
at `a51ce39` / `dpl_33bDNneTxC4RVXRWFYnrexuqFp9X`. Mainnet and all older fixed
refs remain unchanged. The production rebuild uses the same source with existing
Production environment values. Later documentation-only receipt changes must
not be deployed. Runtime logs were not scanned; the earlier denial was not
bypassed. The six dashboard build warnings are separate from runtime logs.


Public post-release verification confirms the exact source/tree in delivered
GamePage/Admin, all five idle-surface features and the five earlier static-glow
features. Four QA fixtures are excluded from Production. API, anonymous Admin
denial and all three Highscore response hashes match the fresh baseline exactly.
See `before.json`, `after.json` and `release.json` in the evidence directory.
