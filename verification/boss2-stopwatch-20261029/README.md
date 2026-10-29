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

The work branch changes only the private Vercel build command and new
verification files. Autodeployment stays disabled. No public alias, Mainnet,
account/payment/save or unrelated branch change is authorized by this feature.
