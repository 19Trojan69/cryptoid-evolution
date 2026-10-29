# Protected smartphone test stopwatch, 29 October 2026

The owner requests a visible stopwatch that starts with the game, freezes at
the end and remains visible afterward. This preview extends the existing
complete-CSS-filter-off guest control. It is not a White Screen repair or a
public release. The original frontend, all 24 private runtime input pins,
one-finger controls, audio, assets, account isolation and game clocks remain.

The extra preview wrapper first builds the exact original filter control and
adds a separate small module and stylesheet to the generated HTML. The module
observes the fixture's existing read-only status/frame inspector. It writes no
game state and never clicks a control or automatically resumes play.

The clock starts when actual play is observed after the native Fortsetzen
action. Initial preparation, countdown and real pauses do not count. During
play the bottom-center display shows active wall time; it passes touches through
to the original field. A small native observer watches only root-child route
changes and the active shell's pause attribute. One one-second timer reads
progress and writes one bounded localStorage value, retaining the latest and
one previous run. No extra RAF, input listener, full recording or upload is added.

Returning Home or reaching a terminal state freezes the value. The menu shows
Letzte Testzeit, which survives reopening the same preview origin. Preparing a
new scene does not erase the old value; actual new play starts a new zero clock
and retains the preceding run. A main-thread gap or stale frame is not counted
as healthy active time. Monotonic time keeps wall-clock corrections out of the
elapsed value. Storage denial/quota failure is shown without interrupting play.

A hard process termination cannot execute a final handler. The recovered value
is explicitly the last locally saved checkpoint, normally updated each second;
the actual interruption can occur later, especially during a long blocked main
thread. This is not an exact crash timestamp or a measurement of phone RAM,
temperature or native graphics state. Closing/reopening a private browser or
clearing site storage can remove the local value. A new Vercel preview hostname
has separate local storage from the older diagnostic links.

Twelve focused model checks pass locally, including absent final callback,
pause/resume, stale frames, long gaps, storage failure, previous-run retention,
bounded storage and duplicate DOM notifications. Whole frontend/private source
pins pass. Browser verification uses native touchscreen controls in Chromium
and WebKit at 430x825/DPR3. It checks visible advance, a real three-second pause,
native Resume, Home completion, explicit reload restoration and a new run
retaining the preceding value. A deliberate reload is not called a physical
White Screen. Browser/deployment results are recorded after completion.

## Completed browser verification

Initial source c4515f0/treeffd62ea passed both jobs in workflow40930230582.
The live menu then exposed a presentation issue: the clock's nested section
inherited the filter preview's section pseudo-label. The panel is now a div
with an accessible group role. Final source62bd691/tree8495e10 passed both
jobs again in workflow40931218477, including the unchanged twelve model tests,
full runtime scope and transformed-controller type preflight. Chromium's final
end checkpoint is17.483 seconds and WebKit's17.564 seconds. These are short
lifecycle observations, not six-minute stability or physical-crash acceptance.

All four original artifact ZIPs match GitHub's SHA256 digests and pass ZIP
integrity. Both attempts' complete synthetic verification records remain in
separate compressed evidence files. The initial statuses are not rewritten.
`results.json` identifies each source, workflow, artifact and digest; run
`node verification/boss2-stopwatch-20261029/verifyEvidence.mjs` to recheck the
archives, successful flow assertions and exact final script/style hashes.

The final protected Preview is READY dpl_4q6jjnqNaUizdJdywdv2wBwaac5m,
source62bd69152d3d1547a579b13a7eb13eb507296873/tree8495e10767950527148f61485e6c66df7587e691:
https://cryptoid-evolution-testnet-qxou1bcgf-19-trojan69.vercel.app/.
It was created through the previously owner-authorized Vercel browser fallback;
the plugin's earlier Preview permission denial is unchanged. Standard Protection
remains enabled for all deployments except custom domains. No public alias or
production target changed. The UI resolved the requested pinned device branch
to the work branch at the same exact tested commit; both were fixed at that
source during deployment. The separate device branch remains pinned after the
evidence-only receipt advances the work branch.

A live desktop-browser check of the final hosted version confirms initial00:00,
native Resume, visible00:19 while playing, a real frozen00:30 pause, normal Home
completion and the same00:30 after explicit reload. Recording was off and test
protection on. The duplicate section label is gone. The exact menu screenshot
is retained in evidence/protected-stopwatch-menu-20261029.jpg with its digest in
results.json. That30-second example is a synthetic desktop check, not the owner's
phone result or a new six-minute acceptance. Physical CSS-off stability remains
pending. The older eb5f8lafa link does not contain this stopwatch.

The work branch changes only the private Vercel build command and new
verification files. Autodeployment stays disabled. No public alias, Mainnet,
account/payment/save or unrelated branch change is authorized by this feature.
