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
an accepted decoder. The next high-information control is matched fetch-only,
decode-only and draw/dispose sequences with identical assets and viewports, to
separate decoding/allocator retention from drawing/backend retention.

Earlier failed controls remain under private `verification/rebuild`. One paired
fresh/shared 100-cycle comparison used a colliding output filename: the shared
raw JSON and both complete console logs survive; the fresh raw JSON does not.
That fresh-context result is not treated as a complete acceptance record.
Output names now include engine, decoder, cycle count, canvas lifetime and tag.

## Next acceptance

Attribute the native growth before adopting a decoder. Require original pixel
fidelity, bounded native behavior, real cancellation and complete disposal, then
connect the dynamic scene, boss-stop and bonus handoff through the same clock.
Complete powers/effects/audio/HUD/account/save migration and affected-device
campaign acceptance remain subsequent gates. An automatic reload/Home fallback
or forced garbage collection is not a deployed correction.
