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
original scene is prepared. Native Resume advances the initial boss-intro until
BossHullView actually mounts its hull; native Pause then permits style probes
and injection. This short preparation interval is outside the90-second window.
The overrides deliberately alter the diagnostic image. They are
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

## Completed external comparison

Corrected source f6928ef/tree988e8b2 completed workflow40904550899 successfully:
all eight jobs passed, with90.007–90.990 active seconds, expected filter states,
same-document play, real Pause, no page error/crash/unexpected external request,
and no additional full recording. Frontend/private source pins and transformed
controller types passed. All16 artifact ZIPs across both attempts matched their
GitHub digests and passed ZIP integrity. The original failed records remain.

| Linux browser condition | Chromium last30s median PSS | Core volleys | WebKit last30s median PSS | Core volleys |
| --- | ---: | ---: | ---: | ---: |
| Original | 576.729 MiB | 32 | 1132.817 MiB | 17 |
| HUD backdrop only off | 492.384 MiB | 32 | 1101.095 MiB | 11 |
| Outer boss-hull filter only off | 484.449 MiB | 32 | 1070.880 MiB | 11 |
| All CSS filters/backdrop filters off | 446.313 MiB | 32 | 1014.699 MiB | 25 |

The CSS cascade issue is reproduced in both engines: the original mobile HUD
really has blur(10px). Complete filter removal produces zero computed filter/
backdrop counts at preparation and after play. The full-off process median is
130.417MiB lower in Chromium and118.118MiB lower in WebKit than each single
baseline. These are observed single-run differences, not a causal estimate or
physical-phone saving. WebKit simulated work differs substantially, and even
full-off retains a large process footprint. No crash cause, temperature effect,
unbounded leak, universal stability or White Screen fix is established.

All16 original records and all active process/resource points are preserved in
evidence/synthetic-filter-measurements.json.gz, with ZIP/evidence SHA256 digests
in artifacts.json. summarizeEvidence.mjs reproduces results.json, verifies the
applied treatments and excludes the eight zero-sample preparation failures.
No physical owner report is in these artifacts.

## Protected physical-device control preparation

The complete-filter control is prepared as a separate preview so the owner can
test it on the actual smartphone. buildFilterPreview.mjs calls the unchanged
private builder and appends one static stylesheet link to the generated HTML.
The experiment uses exactly the same CSS treatment hash as the completed
full-off runs. Original compiled game modules, frontend, private runtime inputs,
assets, clocks, input, audio and account isolation stay intact. The menu gains
the visible label GRAFIKTEST: CSS-Filter ausgeschaltet. No new application JS,
collector, saved preference or auto-Resume is added. The diagnostic image is
deliberately changed; it is not a production quality setting or proposed fix.

Only this work branch's Vercel build command selects the additional preview
wrapper; automatic deployment remains disabled. The wrapper refuses production
builds. Source417cc1b0242d5cb11ca3d2ab826111e542523774/tree69cba8e completed
workflow40906805249 with both native-touch jobs passing. Chromium observed90.605
active seconds/32 volleys; WebKit90.283/25. Both verified the actual built-in
stylesheet, visible menu label, metadata, zero final CSS-filter/backdrop counts,
and absence of additional recording/errors/unexpected requests without
page.addStyleTag. The previous eight treatments remain separate and are not
relabeled as built-in-preview tests. Both new ZIPs match GitHub's SHA256 and pass
integrity. Full records are retained in
`evidence/synthetic-built-preview-verifications.json.gz`, with digests and actual
status in preview-results.json.

The shared control SHA256 is b383b67907e7278eaa6a5c9ea0706ba4a1f3085525407a95f7ef4b71c1097d27;
the stylesheet including the visible label is
1b510cc64aa39376811743b9613f158d4389d85c9db43ac80a7346e58c17a99b.
No physical-device outcome or White Screen fix is claimed.

## API permission block and authorized browser deployment

The reviewed target is the existing cryptoid-evolution-testnet project
prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF, account team_KzJmtl0QyoYZAOu5RQKsAR2i,
with its existing Standard Protection. The first API call incorrectly supplied
target="preview" and received403 referring to Production. The official API
requires omitting target for a preview; a corrected request for the same exact
project/team/source then explicitly failed403: no permission to create a Preview
Deployment for this project. No deployment ID or new URL was returned. Listing
that team's deployments is also denied. This is a service permission error,
not an automatic approval-review rejection or a game/test failure.

The mapped CLI fallback is unavailable: no installed Vercel CLI, local authenticated
CLI context, VERCEL_TOKEN or existing deployment workflow is available. No secret,
protection, account, automatic deployment or public alias setting was changed.
There is no repeated unchanged request, no production attempt to work around the
preview refusal, and no claim that reconnecting would fix the permission error.
The owner subsequently explicitly approved the browser fallback. The existing
signed-in Vercel account was used; no authentication/access settings changed.

The original c610e7c device deployment dpl_EkJsAPJX6JPjvbqbKArqo1Lxzey6 remains
READY, public main is still ce073547, and project protection is unchanged. The
old device URL does not contain this filter control.

The browser UI resolved417cc1b but could not determine a branch. The work branch
had meanwhile advanced with evidence-only receipts. A separate device branch,
codex/boss2-css-filter-device-20261029, is pinned to the exact tested417cc1b source
and was verified through GitHub. The UI then explicitly showed Preview and the
correct commit before Create Preview Deployment was used. Automatic deployment
stays disabled; no public alias or production deployment was changed.

The new deployment dpl_7WPyprxCUx4BRL4XfRygboG9oHhY is READY, target=null (Preview),
with source417cc1b0242d5cb11ca3d2ab826111e542523774/tree69cba8e. Dashboard and
read-only deployment API agree. The unchanged project Standard Protection was
verified again. The exact browser-verified entry URL is:
https://cryptoid-evolution-testnet-eb5f8lafa-19-trojan69.vercel.app/.

The actual hosted menu shows GRAFIKTEST: CSS-Filter ausgeschaltet and source
417cc1b0. Recording was switched off, protection remained on, preparation
completed and the original game opened paused. A DOM-backed read of that paused
field confirmed zero CSS filters, zero backdrop filters and HUD backdrop none.
This was a1363px desktop browser smoke check, not a physical smartphone or a
new90-second/six-minute acceptance run. The page was returned to the test menu.
The menu screenshot is preserved in evidence/protected-preview-menu-20261029.jpg;
its SHA256 and the previous API failure are retained in preview-results.json.

The remaining physical control uses this new URL on the same smartphone/browser,
recording off, protection on, manual start and six observed minutes. No new full
report is expected with recording off. This deliberate graphics isolation does
not establish a White Screen fix; the physical outcome remains pending.

Official API reference: https://vercel.com/docs/rest-api/deployments/create-a-new-deployment.

First workflow40903826744 (source e561362/tree a932a4e) failed before any active
measurement: the new style probe expected boss-hull during initial boss-intro,
but the original BossHullView mounts it only during boss-fight. All eight original
failed conclusions are preserved and excluded from memory comparisons. This is
a test preparation error, not an observed application crash. The corrected
driver uses the actual Resume/Pause sequence before measurement and gives an
explicit selector error for any missing expected element. The corrected run
repeated all eight conditions; there were no completed first-attempt observations
to reuse.
