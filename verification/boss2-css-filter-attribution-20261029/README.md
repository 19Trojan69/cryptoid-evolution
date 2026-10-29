# Shared smartphone CSS-filter attribution, 29 October 2026

The owner requests continued White Screen investigation across iPhone and Android
smartphones. Tablet and PC remain stable in the owner's tests. The physical
reduced-effects result is still pending. This QA-only continuation isolates native
filter work left enabled by that partial preference; no outcome is assumed.

The unchanged delivered c610e7c private game and existing source pins are used.
The mobile index.css rule at line303 sets HUD backdrop-filter:none, but the later
equally specific general rule at line304 overwrites it with blur(10px). Actual
computed mobile values were also observed in previous tests. This is a cascade
finding, not proof that blur caused the physical White Screen.

Eight fresh Linux jobs compare Chromium/WebKit at 430x825/DPR3, recording off,
protection on and original standard-motion preference. Each observes only90
active seconds in the existing protected reactor fixture. There are four cases:
the original scene, only HUD backdrop-filter disabled, only the outer boss-hull
filter disabled, and all CSS filter/backdrop-filter within .game-shell disabled.
The last case includes rendered pseudo-elements, but not box-shadow, text-shadow,
gradients, opacity, transforms or animation removal. It is not an all-graphics-off
condition. Individual cases are unseeded; progress must be reported, not assumed
equal. No physical-device memory/temperature/FPS or crash acceptance is claimed.

Overrides exist only as page.addStyleTag in the automated browser after the
original prepared pause. They deliberately alter the diagnostic image. They are
not written to frontend/app sources, the compiled game, public previews, saved
preferences or a proposed production quality mode. No gameplay/clock/input/audio/
auth/payment/progression implementation changes. There is no new native profiler,
forced collection, active screenshot or application collector.

Computed styles are checked while paused, before/after injection and at the end.
Field/entity dimensions, DPR, motion preference and node count stay identical
across injection. The full-off case must report zero rendered CSS filters and
backdrop filters, including present pseudo-elements. Native Resume/Pause and
same-document play/sector/reactor/frame/volley progress are required. One-second
external process samples reuse the existing fixture inspection. Both actual
filters and process memory must be considered; zero filter workload in an
emulator cannot rule out physical-device or other native rendering failures.

Initial external results are pending. No runtime change, new device link,
deployment, heat result, identified termination cause or White Screen fix.
