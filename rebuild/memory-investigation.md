# Renderer ownership and native memory gate

These findings concern the new isolated prototype. They do not establish the
cause or cure of the owner's historical cross-device White Screen. No released
game, account, save, payment or backend source is changed.

## Corrections proved before integration

A real prototype fault was reproduced: a renderer from a previous scene could
overwrite and then zero the shared visible canvas after its replacement had
committed. The failing native control returned `staleRenderRejected=false`,
`currentFramePreserved=false`, width/height 0. A per-surface owner and monotonic
committed epoch now reject both stale redraws and a late first presentation from
an older preparation. An old disposer can release only its own visible output.
The native replacement-frame comparison passes in Chromium and WPE, including
two previously prepared old views. A failed actor draw retains its last complete
back buffer until the host shows the explicit technical pause.

The first all-model test also rejected boss 10 because its atlas allocation was
estimated from used rectangles and omitted real padding. The renderer now uses
exact dimensions and encoded sizes measured from the 100 released hull/gun
images. All 150 original hull/gun/wreck files were verified against their Git
blob IDs from release receipt 8c4f171 before the table was generated. These
full-resolution hull/gun images total approximately 421.62 MiB as RGBA; this sum
is neither simultaneous live ownership nor complete browser/GPU memory.

## Native acceptance remains blocked

All 50 original boss hulls, mounted weapons and heat tiles render in both native
engines. Repeated close returns managed bytes/entries/scopes and owned canvas
dimensions to zero. The original 120-cycle checks pass in each engine; a further
300-cycle WPE check also completes. These are functional/resource-owner checks,
not a complete campaign or an accepted native-memory result.

Actual Linux PSS still grows during the all-model sequence, despite zero managed
ownership between scenes. A bitmap-source Chromium run remains around 210–222
MiB across 50 models, but its scaled image pixels differ from the original
HTMLImageElement reference. WPE bitmap pixels match the frozen reference, while
its all-model process memory grows substantially. The fetched-Blob/image-element
path preserves reference pixels in both engines but produces much greater
Chromium memory growth (approximately 759 MiB after 50 models in that run).
Direct-image and fresh-context controls do not provide accepted elimination of
the WPE growth. Separate native processes and differing warm-up sequences limit
precise cross-run performance comparisons; no global saving or leak fix follows.

Chromium bitmap alpha/colour options do not remove the pixel difference. Explicit
medium/high sampling does not produce a universally matching frame either. No
quality reduction, changed source resolution or unproved sampling adjustment is
accepted as a solution. Decoder choice is required explicitly by the renderer
API; the fixture's default is the original direct-image reference.

Read-only native Inspector attribution now completes for 100 WPE bitmap-model
cycles. At the closed checkpoints the Inspector reports 0 image-category bytes
and 0 Canvas backing bytes, while its broad `other` category grows. After the
remaining desktop/held-load controls, 20 idle seconds reduce JavaScript to about
5.9 MiB and leave one zero-byte canvas, but aggregate native PSS remains about
1042.8 MiB (1054.8 MiB before idle) and `other` about 766.8 MiB. The final viewport
is desktop-sized at DPR 3. This does not identify what `other` contains, prove all
native graphics data freed, or establish a permanent leak. It excludes treating
the managed counters or a forced GC as sufficient acceptance.

A transparent padded-bitmap allocation-shape probe preserves the frozen WPE
reference pixels but still differs in Chromium. It does not resize or reduce the
original artwork. Its native-memory behavior is not yet tested, and it is not
an accepted decoder. Matched fetch-only, decode-only and draw/dispose controls
have now separated the triggering operations; their results follow below.

Earlier failed controls remain under private `verification/rebuild`. One paired
fresh/shared 100-cycle comparison used a colliding output filename: the shared
raw JSON and both complete console logs survive; the fresh raw JSON does not.
That fresh-context result is not treated as a complete acceptance record.
Output names now include engine, decoder, cycle count, canvas lifetime and tag.

## Matched stage attribution (2026-10-25)

The requested three controls now complete in Chromium 141 and WPE 26.5. An
additional prepare-only control separates preparation of the existing renderer
from its first presentation. Every arm uses a fresh process, identical original
full-resolution files and the fixed 393 × 744 / DPR 3 viewport throughout; there
is no desktop resize, pixel-readback warm-up or prior scene/pixel experiment.
The same 50 hull/gun pairs are visited twice (100 cycles), with five frames per
model and 20 seconds natural idle. HTMLImageElement `decode()` is explicitly
awaited in both decoding and drawing arms. No forced GC is used.

| Retained PSS increment after disposal/idle | Chromium | WPE WebKit |
| --- | ---: | ---: |
| Encoded fetch only | 63.7 MiB | 59.4 MiB |
| Decode, no context or drawing | 570.6 MiB | 80.4 MiB |
| Prepare renderer, no presentation | 570.7 MiB | 92.3 MiB |
| Draw and dispose | 589.0 MiB | 452.0 MiB |

Chromium's major remaining occupancy is already triggered by decode-only,
including about 492.2 MiB additional PSS in Chromium shared-file mappings. It
cannot be explained solely by retained Canvas objects. WPE's major additional
occupancy is triggered by drawing: its baseline-adjusted draw increment is
about 359.7 MiB above prepare-only. The native heap-region increase is about
387.5 MiB across browser processes, mostly in WPEWebProcess. Inspector `other`
remains about 535.5 MiB with JavaScript about 3.1 MiB and zero image-category and
reported Canvas backing bytes. These mapping regions and operation contrasts
are narrower evidence than the previously unattributed `other` total, but do
not identify individual live allocations versus reusable allocator pages.

All 800 closed-cycle receipts return managed resources and visible canvas
dimensions to zero. The request guard initially blocked WPE's local Blob URLs;
those failed controls are retained and excluded from the final comparison. A
separate original-file guard initially rejected the generated player PNG, which
is now pinned separately from the 100 Git-verified original boss images. Earlier
process totals including the separately recorded bundler are also retained;
the final matrix excludes that child before browser launch.

Exact results, eight preserved preliminary failures, logs, archive/member hashes
and exact main-control sources are in
[evidence/memory-stages-20261025](evidence/memory-stages-20261025/README.md).
The local runner is `verify-memory-stages.mjs`; it refuses output collisions.
No renderer/decoder behavior or original gameplay implementation was changed.

## Next acceptance

The 2026-10-26 continuation now includes four 500-cycle same-model/all-model
controls, stable-URL and actual-onload draw controls, native allocation ownership
probes and full-source versus scaled pixel comparisons. See
[the ownership evidence](evidence/memory-ownership-20261026/README.md).

Available partial Chromium provider records name `cc/image_memory` at about
495.7 MiB after idle, while global dump requests remain explicitly failed.
WPE native malloc call chains attribute much of the observed additional live
allocation to the local Linux Mesa/Gallium driver, approximately 277.5 MiB above
the instrumented fetch baseline. This is neither physical-device GPU memory nor
a proof of the historical crash cause. Some glibc arena bytes are free and many
remain allocated, so treating all of `other` as free pages is also rejected.

Tested full-resolution source RGBA is identical across image/bitmap. Chromium's
remaining fidelity difference is triggered by scaling. Full-resolution canvas
copying and bitmap resize hints do not universally preserve reference pixels;
no such candidate is selected. Stable file URLs and removal of the diagnostic's
extra explicit decode() call also fail to eliminate the native occupancy.
Do not repeat those controls as proposed fixes.

Identify decoded-image/raster cache and allocator ownership on the Chromium
decode path and WPE draw path before adopting a decoder. The triggering stages
are now separated; exact allocation lifetime and bounded memory are still open.
Require original pixel
fidelity, bounded native behavior, real cancellation and complete disposal, then
connect the dynamic scene, boss-stop and bonus handoff through the same clock.
Complete powers/effects/audio/HUD/account/save migration and affected-device
campaign acceptance remain subsequent gates. An automatic reload/Home fallback
or forced garbage collection is not a deployed correction.

## Account-path and cache follow-up (later 2026-10-26)

The owner's successful PC/Sandbox run did not involve deliberate Pi login. The
released guest path omits the account run and checkpoint outbox. Local controls
use the real pinned GameEntry/GamePage at phone/tablet dimensions with synthetic
SDK/API transport. Chromium's five cases pass, including checkpoint401 retaining
the advancing run and backup. WPE's latest suite remains failed: the owner/tablet
case captures a visible loop-stall pause at initial elapsed0, same document/run,
no uncaught JS error or White Screen. Two focused fresh WPE ordinary/owner tablet
controls both subsequently preserve play after401; they do not supersede failures.
This is not actual Pi/mobile acceptance or proof that login is unrelated.

The already available partial Chromium closed-idle cache provider reports
519,782,400 bytes size/effective size but zero locked bytes/budgeted entries.
Do not call all of it non-discardable gameplay memory. Global dumps still fail;
pressure reclaim and anonymous-allocation ownership remain open. Native cc.debug
sampling markers now confirm cached Image/Blob-Image mip draws, including rounded
500x188/250x94 and512x242 intermediate dimensions, unlike the tested bitmap draw
path. Source-motivated constructor medium resizing still fails exact output and
is rejected. No original loader/renderer/default/quality change follows.

Read [the full evidence](evidence/login-cache-followup-20261026/README.md) and its
hashed raw archive before continuing. Preserve every failed diagnostic. The
account/owner path and native graphics allocation remain controlled variables;
the isolated native memory fixture itself imports no auth/account adapter.
