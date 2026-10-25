# Matched native-memory stage controls

These local controls identify which operations trigger retained Linux browser
memory in the isolated rebuild. They do not reproduce or fix the historical
cross-device White Screen. No decoder or renderer is accepted by this record.

The eight complete controls each use a fresh native browser, a fixed 393 × 744
CSS-pixel viewport at DPR 3, the same 367 × 590 field, the same byte-pinned
full-resolution images, five frames per model, 100 model cycles and 20 seconds
of natural idle. Each sequence visits the 50 original boss hull/gun pairs twice
and uses the same generated silver player image. All 100 boss images match
their original Git blobs. The generated player PNG is separately pinned; it
is not falsely described as a Git-tracked original file.

The primary three arms were run with the same tool sources (`matched-c`).
The additional `prepare-only` arm uses a recorded fixture extension that prepares
the existing renderer without calling `present()`. Renderer, decoder and source
image bytes are identical in all arms. Image-element arms explicitly await
`decode()` after onload; neither decoder-only nor preparation-only reads pixels.
The drawing arm uses the existing original hull, mounted weapons, heat tiles,
player and full-frame commit. Original resolution and sampling are unchanged.

## Results

Numbers are browser-process PSS in MiB, after disposal and 20 seconds idle.
The increment is relative to that control's own fresh-browser baseline.
The bundler's native service is excluded. These are separate processes, so
small differences are not precise performance estimates.

| Control | Chromium 141 baseline → idle | Increment | WPE WebKit 26.5 baseline → idle | Increment |
| --- | ---: | ---: | ---: | ---: |
| Fetch original encoded bytes only | 165.2 → 228.9 | +63.7 | 292.5 → 351.9 | +59.4 |
| Decode, never create a Canvas context or draw | 166.2 → 736.8 | +570.6 | 291.7 → 372.1 | +80.4 |
| Prepare existing renderer, never present | 165.0 → 735.7 | +570.7 | 292.0 → 384.4 | +92.3 |
| Draw and dispose | 163.5 → 752.6 | +589.0 | 291.3 → 743.3 | +452.0 |

Chromium's large increment already occurs in decode-only. About 492.2 MiB of
additional PSS is in mappings classified by Chromium-created shared-file names.
The same increase remains when the renderer is only prepared; drawing adds
comparatively little at this viewport. A Canvas leak alone cannot explain
this Chromium control, which never creates a Canvas context or calls draw.

WPE's large extra increment is triggered by drawing. Its baseline-adjusted draw
increment exceeds prepare-only by about 359.7 MiB. Aggregate native `[heap]`
mapping PSS grows about 387.5 MiB in the draw control, mostly in WPEWebProcess
(approximately 367 MiB). Inspector `other` still contains about 535.5 MiB after
idle, while JavaScript is about 3.1 MiB, the image category is zero and reported
Canvas backing bytes are zero. Preparing surfaces can defer their native
allocation until first use, so this does not distinguish raster allocation,
decoded-image caching and allocator page retention within the draw path.

All 800 closed-cycle receipts have zero managed bytes, entries, scopes, active
producers and disposal failures. No forced GC, memory-pressure command, manual
allocator trim, screenshot, getImageData, toDataURL, renderer substitution,
quality reduction or automatic navigation was used.

## Preserved evidence

`summary.json` contains exact numbers, source hashes, mapping/category contrasts
and the failed-control list. `raw-controls.tar.gz` contains all preliminary and
complete raw JSON, available console logs, and the exact main-control sources.
`archive-manifest.json` pins every archived member and the archive SHA256.

Eight preliminary failures are preserved. Six `matched-a` invocations stopped
at the original-file guard before measurements because the generated player
PNG is absent from the Git tree. Two `matched-b` WPE arms were stopped by the
runner incorrectly blocking this localhost origin's Blob URLs. That block was
corrected and a one-cycle diagnostic passed before the complete controls.
The earlier `matched-b` PSS includes a separately identified esbuild process;
those totals are not the browser-only numbers reported above. No preliminary
record was overwritten or silently treated as a passed native-memory gate.

## Reproduction

From `rebuild/`, with existing frontend build dependencies, original assets,
generated painted hulls and a matching installed native Playwright engine:

```sh
CRYPTOID_TEST_ENGINE=chromium \
CRYPTOID_MEMORY_STAGE=decode-only \
CRYPTOID_TEXTURE_DECODER=blob-image \
CRYPTOID_SCENE_CYCLES=100 \
CRYPTOID_PROFILE_IDLE_SECONDS=20 \
CRYPTOID_NATIVE_OUTPUT_TAG=unique-control-tag \
npm run verify:memory-stages
```

Use `fetch-only`, `decode-only`, `prepare-only` or `draw-dispose`; choose `webkit`
for the matching task-prepared WPE engine. Unique tags are mandatory and an
existing output file causes refusal before a browser is launched. Raw evidence
is written to `verification/rebuild`. The local server binds to loopback and the
request guard permits only its own HTTP origin and its own local Blob URLs.

Next work must identify decoded/raster cache and allocator ownership in the
Chromium decode path and WPE draw path. Mapping/category contrasts identify
triggering operations, not allocation stacks, a permanent leak, phone/GPU
residency or the historical White Screen cause. Full feature migration stays
blocked; no production files, accounts, saves, payments or deployments changed.
