# Published: playable standard raster

27 October 2026. PR182 is merged:
https://github.com/19Trojan69/cryptoid-evolution/pull/182.

- Public source: 9d0ac5ba60d9b25170176700a3c1efaa355be290.
- Reviewed candidate: 8618fbf8dfc4a3dd5427e952784b767d7ebb0138.
- Exact reviewed/common tree: d3a261585f631ab2b93100b19928b27b72604d50.
- Previous shared source 7433e560c2fd8575a501997d290157f3e3b2005f is preserved at
  backup/shared-before-standard-resolution-20261027. Previous READY Testnet
  8ppgy7riyzw1jqBqa1ThFYMhjikM / production Ab5qAoajYxjCUu8iZ1z2PN9unbCU remain
  the immediate rollback targets.

## Actual deployments

| Project | READY deployment | Duration | Active public domain |
| --- | --- | ---: | --- |
| cryptoid-evolution-testnet | dpl_FSG9xyeLKEgKGkGbKgRNjcPjq2jq | 75 seconds | https://cryptoid-evolution-testnet.vercel.app/ |
| cryptoid-evolution | dpl_BPscxQrsQfPF8WJk3nHtP12Yd5tt | 73 seconds | https://cryptoid-evolution.vercel.app/ |

The previously authorized signed-in dashboard confirms each source, READY status
and active domain. Dashboard URLs, immutable deployment hosts, observed build
output badges, public Home checks and rollback are in dashboard-status.json.
READY is not a claim of zero error/warning badges or zero runtime errors. Runtime
logs were not queried; no project, protection, network/account/payment setting
or player data changed.

## Public checks

verify-public-release.py passes on both public domains. Eight observed application
bundles match exactly between projects, contain the expected source/tree and new
one-pixel standard cap, and exclude the local fixture. Original styles match
each other and the preceding 7433e56 public release exactly. Previous auth,
diagnostic access, resource reuse, idle-loop wake, prepared explosion paths,
completion/save/Retry/Home-backup and audio-resume features remain delivered.

Health and catalogue return 200. Testnet remains production-proxy/network=testnet;
production remains local/network=mainnet. Existing 45-second charge descriptions,
prices and start-power durations remain. Anonymous Admin returns 401; the retired
public report redirects Home. Both public Home pages were reloaded and display
Pi sign-in and an enabled Play button. No real login/game/save/purchase was started.

## Scope and acceptance

Standard transient Canvas graphics now use at most one raster pixel per CSS point
instead of 1.5. Ordinary explosions/debris and boss weapon destinations already
share this helper; bonus rocks now do too. This is the default and needs no player
setting. It does not reduce native HUD/text rendering or original hull assets,
change visible sizes/backgrounds or alter the 60-Hz target, scene pacing, movement,
hit rules, audio, effects/lifetimes, rewards, weapon settings, saves or accounts.

Comparable affected RGBA backings use about 44.4% of their former pixel count,
about 55.6% fewer pixels. This is not a whole-app memory, CPU, energy or temperature
measurement. Native rendering at the new density intentionally differs from the
former oversampled graphics; exact comparisons use the original drawing at the
new density, with separate actual previous-density controls for bounds/sizes.

The normal frontend build passes 390 cases, localization release checks,
TypeScript and Vite. Native WPE/WebKit26.5 passes 48 checks and 156 exact RGBA
pairs across phone/tablet/ordinary-density contexts, live/heated/destroyed turrets,
impact ages, five-second pause/manual Resume, idle grace/regrowth, resize, context
loss/fallback and unmount. Excluded fixture setup attempts are retained separately.

Both edited runtime modules lint clean. GamePage is unchanged with its known
62 errors/four warnings; CanvasEffects retains 21 existing errors. Backend/API
is unchanged; the preceding 127 backend-test acceptance is baseline, not a rerun.

Physical smartphone heat/battery/presented FPS, long-run native stability and the
historical White Screen remain unproved. No new long manual campaign is required.

This evidence-only receipt remains on codex/standard-resolution-release-record-20261027
with automatic deployments disabled. Do not merge/deploy the receipt as another
app release; both public projects already run 9d0ac5b.
