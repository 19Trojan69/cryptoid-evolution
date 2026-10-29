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
