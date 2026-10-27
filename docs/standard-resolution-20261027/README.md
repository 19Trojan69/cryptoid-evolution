# Playable standard raster, 27 October 2026

The owner asks for an ordinary, playable mobile-game default rather than
unnecessary Full HD detail. App-store distribution does not define one universal
rendering resolution. This change lowers only the existing transient Canvas
raster budget; it does not introduce another quality menu or require players to
enable Reduced effects themselves.

## Change

Baseline: public/main 7433e560c2fd8575a501997d290157f3e3b2005f (PR181).
Branch: codex/playable-standard-resolution-20261027; automatic deployment disabled.

- Shared gameRenderScale now caps transient graphics at one raster pixel per CSS
  point instead of 1.5. Ordinary explosions/debris and boss weapon destination and
  socket canvases already consume this helper.
- BonusRockLayer uses that same helper rather than a separate 1.5 cap. Its seven
  original 192px materials, dust/debris drawing and two-second empty-surface grace
  remain intact. An empty canvas still releases both backing and display to 1x1.
- Invalid device ratios still fall back to one; sub-one ratios retain their old
  values. Above-cap screen-density changes can reuse already-ready resources.

For a comparable RGBA destination, 1 / 1.5 squared is about 44.4% of the former
pixel count, or about 55.6% fewer backing pixels. Rounding slightly affects actual
dimensions. This applies only to affected surfaces, not all graphics, CPU, native
RSS, battery consumption or temperature. Original source images, ship dimensions,
HUD/text/native UI rendering, CSS backgrounds and boss health bars are unchanged.
The global 60-Hz target, smartphone scene pacing, simulation and combat timing,
audio, touch controls and transition durations are unchanged.

## Verification

- Normal frontend release gate: 390 cases, zero failures; localization release
  check, TypeScript and Vite succeed. Three existing render-memory cases now join
  the gate, and one new actual-resource case verifies above-cap density changes
  cause no additional image/texture jobs.
- Existing scale-invalidation and retained-path tests now exercise an actual
  1-to-0.75 change, preserving their fallback/replacement assertions. They also
  verify above-cap reuse. The pinned old rock display fixture stays immutable;
  its reference density is explicitly normalized to the new standard before
  comparing original draw commands and the existing negative display control.
- Native WPE/WebKit26.5: 48 focused checks, including 156 exact RGBA comparisons
  against the released original drawing at the **new one-pixel density**. These
  do not claim equality to the former 1.5-density output. Actual old-density
  component controls establish unchanged CSS bounds and smaller active surfaces.
- Sizes/DPR: 393x744/3, 393x628/2.625, 768x1024/2 and 430x825/1. Bosses 1, 50, 25
  and 7 cover live/heated/rotated/destroyed turrets; effect ages, five-second
  pause/explicit Resume, idle grace/regrowth, resize, context-loss fallback and
  complete unmount release pass. All component images are real original assets;
  native clocks and local component state are controlled.
- Both changed runtime modules are ESLint-clean. GamePage is byte-identical and
  retains the known 62 errors/four warnings; CanvasEffects retains its known 21
  existing errors. Neither entire file is described as lint-clean.
- All backend/API runtime is unchanged. The previous 127-test backend acceptance
  is baseline evidence, not a suite rerun for this graphics-only change.

The first native image comparison had unequal original mounting ages and was
excluded. Preparation now settles before freezing the clock and all React mounts
start together. A frozen-preparation attempt and an unnecessary diagnostic rerun
overlapping generated-manifest restoration are also excluded, not app failures or
acceptance. The final full run completed on the prepared 1b15 catalogue before the
tracked generator output was restored. See results/excluded-attempts.json.

## Preserved boundaries and release

GamePage, CanvasEffects drawing, BossWeaponsView/renderer, both Home renderers,
art, HUD/CSS, loop/projectiles, controls/settings, audio, save/outbox/reward logic,
and backend remain the preceding source. Strict >2500-ms watchdog/500-ms checks
and explicit technical Resume remain. No art/particle removal, new clock/timer,
automatic quality switching, account migration/reset, PR167/168, token request,
security change or runtime-log access is included.

Previous shared source 7433e56 and READY Testnet 8ppgy7riyzw1jqBqa1ThFYMhjikM /
production Ab5qAoajYxjCUu8iZ1z2PN9unbCU are the rollback targets, to be preserved at
backup/shared-before-standard-resolution-20261027 before merge. The previously
authorized reviewed same-source publication to both existing projects remains in
scope, with separate network/account/payment configuration. A separate receipt
will record actual publication; this candidate document is not proof of release.

There is no physical smartphone temperature/energy/presented-FPS measurement,
new physical long-run acceptance or demonstrated historical White Screen cure.
No further long manual owner campaign is required for these local checks.

Platform guidance used for choosing a bounded default:
https://developer.apple.com/documentation/metal/improving-your-games-graphics-performance-and-settings
and https://developer.android.com/games/optimize/power.
