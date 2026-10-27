# Latest owner report: screenshot timing and missed document correlation

The owner asks to resume the existing examination without duplicate work and
clarifies that taking a screenshot coincided with the White Screen. This is a
reported trigger, not an automatically timestamped screenshot observation. The
reattached report is byte-identical to the previous input. The existing checkout,
accepted feature tests and owner export fixture are reused. No second implementation
of the already completed shop, Auto, ship selection, balance or reload work is made.

Baseline is main97d74b412f7dc7ea2f4f8c05f483d87eb3451dba/PR193, tree
851296db95402d5f53fdebc0c2f71a92e55b10aa. That tree equals the previous reviewed
569b351 candidate. The private recording itself identifies the earlier0868671
source/tree; it does not test the subsequent moderate-balance/reload release.
Raw attachments, exact private timestamps, request IDs and telemetry are excluded.

## Independent findings

- All9448 sequence numbers are present and timestamps are ordered. The capture
  spans about28 minutes of wall time, including pauses/background intervals.
- All251 recorded requests have a matching response, HTTP200 and success outcome.
  The final checkpoint is confirmed and the last recorded queue depth is zero.
  This is HTTP/queue evidence, not a complete semantic audit of every server reply.
- Five bosses complete. The final scene is normal ENTRY at internal sector54,
  with six enemies and no recorded shots or active effects. The existing rendered
  level mapping makes this level6, block4.
- Existing frame/work and React-commit counters progress through the final saved
  interval. The final two-second frame window measures about50 callbacks/s,
  a74ms maximum frame and2ms maximum measured simulation step. This is not a
  displayed-frame/GPU measurement; long-task observation is unsupported here.
- Known resource estimates finish near16MB, below their recorded18.4MB peak.
  These omit native/compositor/GPU/process allocations and cannot exclude memory
  pressure during an OS capture. No allocation spike is invented from them.
- The next document starts approximately2.7s after the last saved evidence;
  Home is observed approximately5.2s after it. No final pagehide, hidden/freeze,
  Home intent, terminal death, JS exception or stall signal is recorded for that
  departure. An unrecorded final interval is still possible.
- Effects/music context clocks stop after an earlier background/Resume interval,
  many minutes before the final replacement. Treat this separately; the report
  does not establish that the audio state caused the later screenshot-linked exit.

## Reproduced export defect and correction

The published helper returns replacement-not-observed on this input even though
the same-tab lifecycle explicitly links the new document to the old one. The
tail and lifecycle independently read the old document origin and differ by3ms;
the helper's comparison allows only2ms. The reason for that platform clock
discrepancy is not established by this report.

Keep the ordinary2ms matcher. When it finds no replacement, the read-only helper
may instead use one actual same-tab document-start record within5ms, with the
same compiled source commit and a start before the run. Reject ambiguous starts,
an intervening document before the last run evidence, absent source/run metadata,
origin-only copies, closed runs and larger discrepancies. The replacement must
still explicitly point to that captured original document. Export the chosen
lifecycle origin,3ms offset and same-tab-start-record method, preserving the
original tail origin. Use that same linked origin when checking real departures
and earlier returns, so an old background interval cannot become a final exit.

The existing private input now derives replacement-without-lifecycle-signal and
the correct Home link. Both nativeCauseKnown and whitePixelsObserved remain false.
Nothing in this change detects screenshots, allocates graphics, creates a timer,
collects new data, changes gameplay or recovers a terminated browser process.

## Screenshot scope and remaining uncertainty

The owner's simultaneous screenshot is retained as a possible trigger. The
recording has no direct OS screenshot marker or native process/GPU trace. The
game has no native screenshot bridge. Apple's
[screenshot notification](https://developer.apple.com/documentation/uikit/uiapplication/userdidtakescreenshotnotification)
is a UIKit API that posts after the capture; this web application does not receive
that native notification. A browser automation screenshot is not evidence that
the iPhone hardware-button/Pi Browser capture path was reproduced. The prior
available menu screenshot is not substituted for an unseen final capture.

## Existing application paths checked against this trigger

The actual running controller's blur/hidden handlers pause, reset controls and
save; pagehide records/saves. The input module releases pointer capture on
blur/resize/fullscreen/visibility changes. The menu viewport observer updates CSS
bounds. None of those handlers reloads the document or navigates Home.

The startup fallback disconnects after a mounted root. Its reload is a user
button; RouteRecovery likewise reloads only on a click. The explicit game Home,
saved exit and local-backup exits record their intent before SPA navigation.
Those intents are absent from the recording. The OAuth callback's delayed hard
redirect belongs to a separately mounted sign-in route, not the running game's
background handler; there is no matching sign-in event in the final history.
The previous controller fingerprint tests retain these published paths. No
second auth/pause/startup implementation is introduced based on the screenshot.

This source audit finds no matching automatic in-game reload path for a brief
capture interruption. It does not exclude an unrecorded action in the final
interval, a host navigation or native termination, and is not a physical screenshot
reproduction. Those distinctions matter because the report observes a new
document, not only a temporary white screenshot flash.

This review narrows the observable boundary to continuing game callbacks followed
by document replacement, with the reported capture as a candidate trigger. It
does not establish a native cause or a White Screen fix. Do not ask the owner to
repeat an entire campaign or attribute the exit to a boss/transition solely from
the final sector label. Native screenshot reproduction remains an open device
investigation; no hypothetical game/graphics change is shipped as its solution.

See the matching verification directory for tests, exclusions and the blocked
native-browser attempt. The new branch disables automatic deployment. Preserve
main and all previous accepted changes; prepare this correction for review.
