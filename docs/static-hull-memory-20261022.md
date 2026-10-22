# Static hull preparation — 22 October 2026

Status: tested preparation; no preview, Testnet or Mainnet publication.
Candidate: `codex/static-hull-memory-20261022`, automatic deployment disabled.
Parent: local `ab587934596011a05294ead81490ee510efac8a0`, tree
`344722edc99426ef63551d7f04ea7deb6c598819` (remote equivalent `a765aab60841b4aa3cdc6a543529a36a91fd250f`).
This retains both previously prepared audio initialization corrections. Official
Testnet remains `9b5f07c55a1f440ca925ee49b002bb223241793a`.

## Evidence and scope

The owner's new Jetsam event is dated 21 October, 17:26:09.580 Vienna. An active
WebContent process in the PiBrowser coalition was terminated for `per-process-limit`.
132359 resident pages × 16384 bytes = 2168569856 bytes, or 2.01964 GiB.
The recorded level-19 start was 17:26:09.359 and the replacement document began
17:26:10.981. This strongly connects that particular interruption to the OS
memory-limit termination. The system file has no site URL or game commit.
The raw private analytics file is not included in this repository.

The interrupted runtime was f85360ed, before subsequent resource/audio corrections.
Do not apply this event to the later b92 saved exit or claim all later interruptions
have an independently matched Jetsam event. A process limit is not a measurement
of GPU allocation or proof of global phone RAM exhaustion.

The prior hull cache was bounded but evicted combinations were painted, read
back, PNG-encoded and assigned a fresh Blob URL on reuse. The complete input
space is finite: twenty sprites × three stages × twenty-nine current/legacy
colour IDs. This correction removes that repeated allocation path. It does not
establish that hull painting alone caused the measured 2 GiB process footprint.

## Implementation

- The build runs the original `paintShipMaterial`, palette lookup, identity accents
  and original 282×282 PNG sources. All 1740 combinations become ordinary PNG files.
- File URLs include a content revision derived from generator, shader/palette/source
  inputs and the pinned native encoder version. Reusing an evicted combination
  reuses its URL. No hull Canvas/readback/PNG encoder/Blob URL runs in the game.
- Keep the existing serial readiness queue, load/decode boundary, mounted pins,
  24-entry/12-MiB/six-unused cache, twelve-item lookahead and cancellation/retry.
  The original source remains the visible fallback until the PNG is decoded.
- Full encoded-plus-decoded byte accounting remains. Existing job counters now
  count readiness jobs; material and encoding counters stay zero for this path.
- `@napi-rs/canvas` 0.1.100 is a pinned development/build dependency. The client
  does not receive native Canvas code. `predev` and `prebuild` generate the files;
  only their compact TypeScript manifest is committed. Generated PNGs are ignored.
- The complete static catalogue is 95,450,326 bytes (about 91.03 MiB) on the build
  server. It is requested one image at a time, never fetched/decoded as a catalogue.
  Cold requests transfer additional painted PNGs; repeat identities can be reused.
- Regenerable old hash directories are retired only inside the generator-owned
  ignored directory. Initial package checks caught stale older local catalogues;
  prior generated outputs were moved to a recoverable workspace build archive and
  the final package was rebuilt from the current catalogue alone.

Raw-source visual-center readbacks, ordinary/boss effect Canvas drawing and their
bounded SVG texture Blobs still exist. This is not a claim of zero Canvas or zero
Blob use for the whole application, nor a count of browser-owned decoded memory.

## Verification

`scripts/staticHullAssets.test.mjs`: eleven tests pass. They include:

- All 1740 generated PNGs equal the actual preceding runtime encoder output byte
  for byte under the same native raster host, including every saved legacy paint.
- Cold loading requests one PNG and creates zero Canvas/readback/encoding/Blob
  resources. Full decoded readiness and byte estimates are preserved.
- Load/decode failure, late cancellation, shared mounted ownership and remount retry.
- Actual style-hook fallback before decode and on failure; identical style fields
  apart from image URLs. The hook source itself remains unchanged.
- Evict/reuse negative control: the old path encodes eleven new Blob identities;
  the replacement path encodes none and returns the same static URL.
- 1100 preparation changes across 500 sectors, escorts and bonus groups: 7259
  readiness requests, 269 unique URLs, bounded cache/pins, zero painting surfaces,
  readbacks, encodes and Blob URLs. This exercises preparation, not full gameplay.
- Native Canvas debris can draw and clip the same ordinary PNG sources.

The final catalogue's concatenated PNG SHA-256 is
`174ad6e9a3d8515f1e8fbbe29ac9812089a1cf65e430585074a1fd5e8d468be8`.
Packaging-only generator changes were checked against this proven pixel digest.

154 existing audio/boss/owner diagnostic tests and four cache/material tests pass.
The two unavailable historical-source comparisons remain explicitly excluded, not
counted as passes. Existing Canvas lifecycle/resource hosts pass, including 2000
warm impacts, 400 moving impacts, context loss and complete release. The previous
Canvas/Blob painting test script is explicitly pinned to its historical reference;
its path no longer describes the replacement runtime.

The full frontend build passes: twelve locale tests, release-language gate,
TypeScript and Vite. `verifyStaticHullBuild.mjs` checks all built PNG bytes, the
matching client revision, absence of the old hull encoder and seventeen unchanged
runtime files. It also checks the disabled candidate deployment configuration.

New runtime/build modules pass targeted ESLint. `paintedShip.ts` retains exactly
the preceding `react-hooks/set-state-in-effect` finding in its unchanged style
hook; both baseline and candidate exit 1 for that same finding. Do not describe
whole-project lint as clean. Existing large-bundle/backend module-type and proxy
configuration warnings remain.

The historical `verifyResourceCache.cjs` browser probe could not launch because
its local Playwright Chromium executable is absent. Its started server was stopped.
No browser/iPhone result, audible output, presented FPS, native-memory reduction
or final White Screen fix is claimed from these host tests.

## Research interpretation

Primary sources consulted:

- Apple: https://developer.apple.com/documentation/xcode/identifying-high-memory-use-with-jetsam-event-reports
  documents page-size accounting and per-process-limit termination.
- WebKit 241402: https://bugs.webkit.org/show_bug.cgi?id=241402 describes additional
  decoded/shared-memory copies around explicit decode, drawing and readback. Its
  March 2026 analysis concerns much larger images; it is not a Cryptoid diagnosis.
- WebKit 195325: https://bugs.webkit.org/show_bug.cgi?id=195325 documents historical
  Canvas allocation/collection limits. The prior runtime already zeroed working
  surfaces; the new path removes their creation for hull recolouring.
- WebKit 229668 and 236692 are historical resolved reports about detached Canvas
  retention and Blob-image cycling. They are not proof those bugs exist on iOS 26.6.
- Reports requiring video/WebGL/WASM or iOS 27 custom-font Canvas text do not match
  the exercised path and were not copied into speculative workarounds.

The verification story is hull selection → on-demand static PNG → load/decode →
unchanged CSS/mask and debris. Static package/readiness/fallback are verified;
physical PiBrowser/WebKit process memory remains the final unmeasured boundary.
No API/data/auth flow changes, runtime-log scan or protection bypass was attempted.

## Release boundary

GamePage, simulation, input, HUD/CSS, original artwork, audio parameters, boss rules,
hearts, accounts, saves, scores, purchases and Mainnet remain unchanged relative to
the preparation parent. The new source is reviewable and backed by tests; it needs
an explicit Testnet release instruction under frontend/AGENTS.md before publication.
Preserve all fixed source and rollback refs. A subsequent iPhone check should use
the existing mission near a transition/boss, not repeat a whole campaign merely
to collect the already known frozen-clock counters.
