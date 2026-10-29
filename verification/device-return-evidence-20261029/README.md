# Private Boss 2 return evidence, 29 October 2026

The isolated device report previously exported the game recording and crash tail
but omitted the existing reload trace and the reporting document's start time.
Returning to the test menu alone cannot distinguish an in-document Home action
from a replacement browser document, and cannot identify a native cause.

The private menu now exports `returnEvidence` using the existing sanitized
stability reader. A read-only host exposes only this tab's session storage,
performance navigation metadata and coarse route. The origin-wide reload copy
is deliberately unavailable because it can describe a different tab. The reader
retains its existing sixty-second/64-event bound. Current document metadata is
kept separate from prior game rows, source metadata and tail evidence.

No new observation, listener, timer, RAF, request, storage mutation, automatic
Resume, control, gameplay or audio change is introduced. The already accepted
window-only blur correction remains. The complete frontend inventory, private
API/packaging and original device builder remain pinned. Two exact private-menu
hunks restore the entire previous menu hash. The new reader's source is checked
for collection and mutation APIs as an additional scope check.

Six focused cases cover distinct and shared documents, explicit Home intent,
cross-tab isolation, bounded sanitization, inaccessible evidence and read-only
operation. Together with existing report/isolation cases, all 45 local cases
pass. The browser acceptance additionally exports both the full and limited
reports after a controlled reload and checks current-versus-prior document
metadata and distinct boot IDs. A controlled reload is not a simulated OS kill.

The historic attachment is private and is not included here. Its observation
is an unobserved return to the test menu, not a visually confirmed White Screen.
The earlier report did not export the new-document evidence, so this addition
cannot reconstruct that missing part of the historic file. A stable tracked
resource estimate does not establish stable total RAM, native/GPU memory or
temperature. No White Screen, heat, cache or native termination fix is claimed.

This branch is for the existing protected guest Preview only. Automatic
deployment remains disabled. Public Testnet/Mainnet releases and the separate
single-finger draft are outside this change. Browser/deployment results are
recorded separately after completion; they are not inferred from local checks.

Accepted external source: `c610e7cb2bde2891dd04721c530c5b1bbead2215`,
tree `044a9aa1cd058009ced317c8ec9bd5d452c1ea71`.
[Actions run 40854908853](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/40854908853)
completed successfully in Chromium 151.0.7922.34 and WebKit 26.5. Each job passed
78 focused runtime cases and 45 export/isolation cases, types and scoped lint.
Chromium retained 18 original input checks, nine neutral-contact cases and the
repeated sequence; WebKit retained 11 original input checks. Both retained the
native element-focus regression. WebKit is not native multi-contact or full
combat acceptance.

The actual Chromium Boss 2 scene ran 30.173 active seconds after the input
checks. Its recovered full report had 329 contiguous rows and 144 contact rows.
Both full and limited exports included the new current-tab return evidence;
current document time, distinct boot IDs and the previous game tail were checked
after an explicit paused reload. There were no unexpected external requests.
Both artifact ZIP digests and ZIP integrity were independently verified; their
IDs, hashes, scope and limitations are in `results.json`.

Deployment was **not** created. Automatic approval review rejected the specific
Vercel Create Preview Deployment submission because it requires explicit user
approval. The prepared dialog shows the exact accepted commit and Preview
environment in `evidence/prepared-private-preview.jpg`. No retry, bypass,
protection/settings change, public alias change or Mainnet action followed.
The existing hde4nlh2r Preview still serves source 68c33d1; it does not yet contain
this export addition or the separately accepted window-blur correction.
