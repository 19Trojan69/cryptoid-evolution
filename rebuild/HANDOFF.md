# Continuation checkpoint

The owner requests a continuation prompt for a new project chat. Continue only
the Cryptoid Evolution cross-device White Screen work. The owner proposes a
controlled rebuild with all existing features, asks for step-by-step execution
and repeated autonomous continuation, and rejects reliance on missing OS/
WebKit/Pi Browser log entries. Do not demand another owner campaign, native log,
purchase or data clearing. Do not present this prototype as a completed game.

Repository: `19Trojan69/cryptoid-evolution`.
Draft PR: https://github.com/19Trojan69/cryptoid-evolution/pull/167
Branch: `codex/core-rebuild-whitescreen-20261025`.
Base/receipt: `8c4f17164daf625a4c9610b5d2d88946010c8496`.
Released runtime: `20843b5501387dca8bb5616303934ece2ae6d581`.
The branch disables automatic deployment. No deployment, main/Mainnet merge,
database/payment/inventory or real player-data mutation is authorized here.

Read `AGENTS.md`, `requirements.md`, `README.md`, `memory-investigation.md` and
`verification-summary.json` in this directory first. Existing frontend/backend
runtime files are unchanged on this branch. A separate older resource-retirement
draft PR 166 is not part of this rebuild and is not deployed.

## Verified work

- 43 unit/contract cases and TypeScript pass. The 41-module pure simulation
  graph imports no React, browser, HTTP, storage or account runtime.
- One run/clock owner; strict >2500 ms /500 ms watcher; maximum four <=34 ms
  substeps (136 ms catch-up); explicit Resume; canceled generations cannot fork
  a loop or revive a closed run. Rendering faults retain the last complete
  actor frame and pause the same run. No automatic reload/Home navigation.
- Pure released campaign, movement, roster, formation, attack, weapon, hit,
  turret/reactor rules; all 500 section mappings/50 boss configurations covered
  by short contracts. These are not completed fights/campaign acceptance.
- Scoped image/surface admission, shared pending work, two concurrent producer
  slots, late-result disposal and charged failed cleanup. Managed close counters
  return to zero. This is not proof of native browser/GPU memory release.
- A real new-prototype shared-canvas fault was reproduced and corrected with
  explicit visible owner/committed epoch: old cleanup and late first draws cannot
  overwrite or zero the next scene. Native same-frame controls pass in both
  Chromium141 and WPE WebKit26.5.
- All 150 original boss hull/gun/wreck files were byte-verified against the
  release Git blobs. Exact dimensions of the 100 hull/gun files now include real
  atlas padding. This fixes the prototype's boss-10 admission failure.
- All 50 original boss models, mounted guns and heat tiles render in local
  native fixtures. 120 scene cycles per engine and 300 in WPE complete.
- A standalone pure boss-stop gate has seven contracts: confirmed save/cleanup/
  bonus preparation, ten prepared visible seconds, explicit confirmed Continue,
  stale receipt rejection and explicit retry. Real adapters remain pending.

## Earlier blocking result

The historical White Screen is still NOT proved fixed. The renderer's native
memory/visual acceptance is also blocked. Decoder selection is required explicitly;
there is no accepted production default. `image` is the direct-image reference;
`bitmap`, `blob-image`, sampling and padded variants are controlled experiments.

Chromium's bitmap model run stays near 210–222 MiB PSS, but its scaled pixels
differ substantially from the original image-element reference. Alpha/colour/
sampling options and the padded bitmap do not remove this difference. WPE's
bitmap frozen pixels match. Blob/image-element decoding matches reference pixels
in both engines but grows Chromium native memory to about 759 MiB after 50 models.
No candidate is accepted merely for matching pixels or having zero managed bytes.

WPE still grows during all-model sequences. Native Inspector attribution after
100 cycles and 20 seconds idle reports JavaScript about 5.9 MiB, image category
0, one zero-byte canvas, broad `other` about 766.8 MiB; aggregate native PSS about
1042.8 MiB. The final viewport is desktop/DPR3, so this is not phone memory.
`other` is not yet attributed and zero reported image/Canvas bytes do not prove
all native graphic resources gone. Fresh-canvas controls are not an accepted fix.
One paired fresh/shared record collided; both console receipts and shared JSON
survive, fresh raw JSON does not. Do not fabricate the missing raw record.

## Next concrete step

**2026-10-26 update: the same-model/all-model replay and native ownership work
below is COMPLETE.** Read `evidence/memory-ownership-20261026/README.md` and
`summary.json` before extending anything. The original renderer/loader/clock and
all production sources remain unchanged. The historical White Screen and
accepted-default-decoder gates are still open.

Four 500-cycle primary controls repeat boss 4 or all 50 models. Chromium decode
ends near 793/889 MiB idle PSS (single/all); WPE draw near 440/771 MiB. Further
stable-URL and actual-onload controls bring the principal closed cycles to 4000;
neither change removes the occupancy. The extra eager decode() belongs only to
the diagnostic and has not been added to gameplay. Copied matching native
browsers now survive in `verification/native-browsers`; both copy-path smokes
pass. Do not restart completed matrices or require owner system logs.

Available Chromium per-provider records identify `cc/image_memory` at about
495.7 MiB after idle. All global dump requests return false: two early controls
and a deliberately partial 100-cycle provider run remain failed diagnostics,
not complete allocator acceptance. No GC is forced. WPE mallinfo2 separates
allocated/free arenas; Heaptrack is stopped at closed idle before browser exit.
Its paired draw/fetch call chains associate about 277.5 MiB additional observed
live malloc bytes with the local Linux Mesa/Gallium driver. This is not a
permanent-leak diagnosis, phone/GPU memory or proof of the historical cause.

The source-pixel probe finds identical full-resolution RGBA for the tested
original player PNG and boss-4 hull/gun WebPs. The remaining Chromium difference
occurs at scaling. Native WPE matches the plain bitmap in those cases. Full-size
bitmap-to-canvas copying and resize hints are rejected as universal fixes; none
matches all tested source/scale cases. Assets, sampling defaults and production
renderer behavior are unchanged. Raw failures and both heap traces are archived.

Next focus on Chromium's native scaling/decode-cache interaction for explicitly
disposable sources while preserving original output quality. Factor WPE's local
driver allocation path into a bounded driver/scene baseline. Keep the loader
gate blocked until an original-quality, bounded, fully disposing path passes;
do not integrate further game features or deploy. The 43 contracts, TypeScript
and the 41-module boundary audit still pass. Details of the earlier stage matrix
follow for context; do not repeat them.

The requested fetch/decode/draw controls are NOW COMPLETE. Do not restart this
matrix from zero. Read `evidence/memory-stages-20261025/README.md` and `summary.json`
along with `memory-investigation.md`; raw failures and exact main-control sources
are preserved in that evidence directory's hashed archive.

Eight complete native controls cover fetch-only, explicit decode-only,
prepare-renderer-without-presentation and draw/dispose, each with 100 cycles,
identical 50 original hull/gun pairs twice, the same generated player PNG, a
fixed 393 × 744 / DPR 3 viewport and 20 natural idle seconds. Main controls have
no prior warm-up scene, desktop resize, screenshots or pixel readback. Original
renderer/decoder code is unchanged. Closed managed resources are zero in all
800 cycles. 43 contracts, TypeScript and the 41-module boundary audit still pass.

Retained browser-only PSS increments after idle, relative to each fresh baseline:

| Mode | Chromium 141 | WPE WebKit 26.5 |
| --- | ---: | ---: |
| Fetch only | 63.7 MiB | 59.4 MiB |
| Decode, no Canvas context/draw | 570.6 MiB | 80.4 MiB |
| Prepare renderer, no present | 570.7 MiB | 92.3 MiB |
| Draw/dispose | 589.0 MiB | 452.0 MiB |

Chromium's major occupancy is triggered BEFORE drawing; decode-only adds about
492.2 MiB in Chromium shared-file mappings. WPE's additional major occupancy is
triggered by DRAWING: about 359.7 MiB baseline-adjusted excess over prepare-only,
with about 387.5 MiB added native `[heap]` PSS across browser processes (mostly
WPEWebProcess). Its final Inspector image and Canvas backing categories are
zero, while `other` remains about 535.5 MiB. This narrows the previous broad
`other` observation to a draw-triggered native heap-region increase; it does not
identify exact allocation stacks, live cache contents versus reusable allocator
pages, a permanent leak, phone/GPU memory or the historical White Screen cause.

Keep focus on those two triggering paths. Next identify decoded-image/raster
cache and allocator ownership, for example through a focused same-model versus
50-model reuse control and read-only native cache/heap attribution. First verify
the available native attribution can distinguish live objects from allocator
retention. Do not adopt a decoder or integrate further game functions merely
because owner counters are zero. Do not repeat rejected old starfield/cache/clip
experiments, lower artwork resolution, silently mute sound, force GC or hide
the failure with automatic navigation.

Eight preliminary failed controls are preserved. `matched-a` stopped at a
source guard because the generated player PNG is not a Git-tree file; its bytes
are now separately pinned, without mislabelling them as a Git original. The
first WPE `matched-b` image controls were blocked by the runner rejecting its
own local Blob URLs; this was corrected and retested. Earlier `matched-b` PSS
included the separately identifiable esbuild child; the final matrix explicitly
excludes the bundler before browser launch. Do not reinterpret these tooling
failures as actual browser image-decoder failures or count them as passes.

Only after this gate, finish dynamic scene preparation, boss fall/reward/bonus,
all powers/effects/audio, the original HUD/visual parity and existing save/account/
inventory/payment adapters, then sustained full-game and affected-device checks.
The fixture currently stops at encounter completion and has no live backend.

## Local continuation if the old workspace survives

Root: `/workspace/scratch/ff55c88cc861/cryptoid-investigation` (no local .git).
New code is under `rebuild/`; private evidence is under `verification/rebuild`.
GitHub is the portable source if this scratch directory is absent in a new chat.

From `rebuild`: `npm test`, `npm run typecheck`, `npm run verify:boundaries`.
`verify-native.mjs` starts localhost only. Useful environment switches:
`CRYPTOID_TEST_ENGINE=webkit`, `CRYPTOID_ALL_BOSS_MODELS=1`,
`CRYPTOID_SCENE_CYCLES=100`, `CRYPTOID_TEXTURE_DECODER=bitmap`,
`CRYPTOID_NATIVE_PROFILE=1`, `CRYPTOID_PROFILE_IDLE_SECONDS=20`,
`CRYPTOID_DECODER_ONLY=1`, `CRYPTOID_NATIVE_OUTPUT_TAG=<unique-tag>`.
The isolated stage controls use `npm run verify:memory-stages` with
`CRYPTOID_MEMORY_STAGE=fetch-only|decode-only|prepare-only|draw-dispose`,
`CRYPTOID_TEXTURE_DECODER=blob-image`, `CRYPTOID_SCENE_CYCLES=100`,
`CRYPTOID_PROFILE_IDLE_SECONDS=20` and a required unique output tag. Each stage
launches its own browser. Existing output files are refused, never overwritten.
Use `CRYPTOID_PLAYWRIGHT_PATH` for a matching installed driver as needed.
The task environment has Chromium1.56.1/141 under verification/browser-tools and
primary Playwright1.62.1/WPE26.5 with task-local native libraries. Never mix the
old driver's protocol with the newer WPE binary or disable sandboxing.

Relevant prior real owner evidence: released 20843b5, last tail boss4/internal
stage40, 2/3 turrets alive, stable callback/timer/network counters, no recorded JS
fault, then a new document/Home. Exact cause remains unproved. It is not an
iPhone-only report. No unavailable OS log is required to continue this work.
