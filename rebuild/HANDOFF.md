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

## Blocking result

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

Keep focus on the native growth. Run matched fetch-only, decode-only and draw/
dispose controls with the same original assets, viewport and decode mode. This
distinguishes decoding/allocator retention from drawing/backend retention before
changing architecture again. Use existing bounded native attribution. Do not
repeat rejected old starfield/cache/clip experiments, lower artwork resolution,
silently mute sound, force GC or hide the failure with automatic navigation.

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
Use `CRYPTOID_PLAYWRIGHT_PATH` for a matching installed driver as needed.
The task environment has Chromium1.56.1/141 under verification/browser-tools and
primary Playwright1.62.1/WPE26.5 with task-local native libraries. Never mix the
old driver's protocol with the newer WPE binary or disable sandboxing.

Relevant prior real owner evidence: released 20843b5, last tail boss4/internal
stage40, 2/3 turrets alive, stable callback/timer/network counters, no recorded JS
fault, then a new document/Home. Exact cause remains unproved. It is not an
iPhone-only report. No unavailable OS log is required to continue this work.
