# Renderer layer attribution, 23 October 2026 — no rendering change accepted

The oversized, filtered `.milky-band` is a substantial contributor to native
Paint in this local Linux software-rendered scene. Hiding the formation text
stream does not remove that cost. This narrows the local rendering lead; it does
not identify the allocation behind an iPhone WebContent kill or establish a
White Screen fix.

No rendering experiment below is integrated. The candidate branch still contains
only the independently tested recorder callback guard as its new runtime change.
Its 94-test full production build remains the prior verified result; it was not
repeated for these documentation and local-tooling additions. No deployment,
account, purchase, save or fixed release/rollback reference was changed.

## Bounded comparisons

Original GamePage source19de3e6, with the tested4c384 diagnostic callback guard;
original CSS, fonts, assets, timers and native RAF. Local controlled projectile
inputs and synthetic transport are test scaffolding. Software WPE-WebKit26.5,
430×825 CSS pixels, DPR3, two llvmpipe threads, one browser at a time. These
nondeterministic scenes are exploratory comparisons, not identical-frame
benchmarks or long-campaign acceptance. Fixture packages: React19.2.4,
ReactDOM19.2.4, React Router7.13.2 and axios1.13.6; the separate full production
build used its documented newer resolved versions.

Native Timeline/ScriptProfiler/CPUProfiler start after audio warmup. Interval
unions merge nested/overlapping events of the same type and are clipped from the
active-window timestamp to the first pre-handler fault timestamp or active end.
Different categories overlap and must not be added.

| Local variant | Active window | Native Paint union | Longest Paint | Mean process CPU / llvmpipe threads |
| --- | ---: | ---: | ---: | ---: |
| Original appearance | 19.096s | 6.890s | 820.5ms | 156.0% / 88.4% |
| Milky band hidden, diagnosis only | 18.328s | 0.411s | 29.5ms | 178.2% / 117.5% |
| Formation stream hidden, diagnosis only | 18.038s | 7.689s | 737.3ms | 149.0% / 69.8% |
| Milky-band `will-change:transform` | 18.172s | 0.330s | 28.3ms | 175.9% / 133.8% |
| Whole-starfield `will-change:transform` | 18.230s | 3.498s | 750.2ms | 170.2% / 115.5% |
| Opaque wrapper around both backgrounds | 18.239s | 4.141s | 626.9ms | 165.2% / 104.2% |

CPU means exclude the initial profiler sample and use samples inside the active
window. Percentages can exceed100% across cores. Reduced Paint did not establish
improved presented-frame rate or sustained stability: much work moves into the
software graphics threads. Native RAF dispatches are callbacks, not presented
frames/FPS. No game-speed improvement percentage is claimed.

A separate-static-background probe reaches the original loop-stall guard527ms
after capture starts, with no uncaught JS exception or Canvas loss. That is not
a useful sustained active window and is **excluded** from steady-state timing.
It is neither an acceptance pass nor proof that this candidate caused the pause.

## Layer and memory boundaries

The native layer inspector identifies a separate milky-band backing after its
hint:821×1575 CSS-sized composited bounds, estimated5,167,928 bytes, compared
with no separate band layer in the control. Total layer estimates change from
15,440,401 to20,317,514 bytes. These are inspector estimates, not resident memory
or a portable DPR-scaled total. Every layer's paintCount stays0, so those counters
cannot identify individual repaints.

Lifetime content-process RSS peaks are977.7MiB in the control and953.9MiB in the
band-cache probe; these short unmatched runs do not prove a memory saving or
absence of leaks. Probes that also capture frozen screenshots explicitly mark
their lifetime peaks as including that extra work; do not compare them as pure
active-game memory figures. These Linux values do not identify the historical
iPhone2GiB termination cause.

## Original-output acceptance

The pixel host clones the original full scene only after capturing its Canvas
contents, unmounts the live game, substitutes corresponding image snapshots for
Canvas nodes, and holds native animations at1000ms. Comparisons are within the
same engine, never between different engines. Viewport and opacity-palette cases
are recorded in the JSON. Later captures include unchanged/reversion controls.

All Chromium unchanged/reversion controls in the controlled captures match
exactly. The three individual milky-band hints (`transform`, `opacity`, `filter`)
change roughly748k of1,419,000 pixels, with maximum channel difference3/255.
Promoting the whole starfield changes635,132 pixels, maximum2/255. The opaque
wrapper changes256,187 pixels and the separate static cache253,608 pixels,
maximum3/255. These are small colour changes, but no complete unchanged-output
acceptance or clear overall performance benefit is established.

Some WebKit pairs are much closer, including one exact opaque-wrapper pair.
However, reversion/unchanged controls do not all settle exactly, and the separate
static variant never reaches its WebKit pixel stage after the early interruption.
Those captures are explicitly excluded as complete output proof. The first
uncontrolled screenshot series is exploratory only. Do not call all pixels equal,
a rendering fix validated, or the original appearance intentionally reduced.

## Retained evidence and next boundary

`renderer-layer-attribution-20261023.json` contains bounded aggregates, tool/output
hashes, package versions, invalid-capture exclusions and explicit limitations.
`evidence/renderer-layer-attribution-20261023/` retains the native capture helper,
frozen pixel comparator, interval summarizer, and the rejected static-cache patch
for continuity. These tools are not application imports, dependencies or a build
gate. They operate only on a prepared synthetic localhost fixture. The summarizer
accepts the local capture directory and an optional output JSON path.

Do not integrate the rejected patch, reduce graphics, disable the stall guard,
or demand a replacement owner campaign/purchase/native OS report for these
already established local counters. The next rendering change needs independent
unchanged-output and sustained-benefit evidence. The iPhone White Screen and the
full campaign acceptance remain open. The earlier recorder guard is still a
bounded correction to a separately reproduced JavaScript failure.
