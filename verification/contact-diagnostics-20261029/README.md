# Protected contact evidence, 29 October 2026

This separate diagnostic Preview continues the accepted one-finger Preview
(a50b68e0d5739eab3bf844460c728a877e300a8a). It does not change PR 200 or release
new code to main or either public application.

The physical owner report did not record secondary contacts. The owner described
possible two contact points from a little finger after releasing the steering
finger. This remains an account of the action, not a recorded cause or measured
finger count. The previous recording does not establish a RAM leak or native
process/GPU termination.

Window capture observes down/up/cancel, capture loss, touch start/end/cancel,
Safari gesture start/end, context-menu/control click and lifecycle reset before
React root capture (including its existing audio callback) and the input guard.
It never changes propagation, default handling, steering, control-tap policy,
audio, pause reasons, watchdog thresholds, clocks, or Resume.

Only an active existing diagnostic subscriber permits event input reads. The
observer is bound to the game field lifecycle, is passive, has no motion-event
listener, and adds no timer, RAF, request, DOM mutation or transmission. Fourteen
listeners are released on disposal. Up to ten pointer IDs are transiently held
for deduplication; no IDs, coordinates, pressure, contact geometry, DOM text,
URLs, tokens or account data are emitted. Sanitizers whitelist the new schema
for full-session IndexedDB export and the existing synchronous crash tail.

Each contact row is a pre-handler observation. trackedPointers counts tracked
Pointer Event IDs, not proven physical fingers. reportedTouches appears only
on a real TouchEvent and is the browser-reported document touch total, capped
at ten. It is not copied to subsequent pointer/gesture rows. target is a closed
coarse category. primaryFlag is the browser flag, not acceptance by steering.
steeringActive and playing are sampled before the game handler. Capture loss
alone does not remove a pointer; up/cancel or reported zero touches do. Blur,
pagehide and hidden record the previous state, then clear the transient counts.

There are at most sixteen ordinary and eight cancellation/gesture/lifecycle
observations per one-second window. Transient state still updates when records
are suppressed; the next recorded row declares the bounded suppressed count.
truncated identifies counts affected by the ten-pointer cap. The existing
128-event crash tail may lose older contact events in a burst; its independent
frame ring and contiguous full report remain separate evidence. Synchronous
local storage writes and the added event listeners are measurement overhead.

The OS may swallow contacts before JavaScript or terminate before a final write.
No native RAM/GPU cause or natural White Screen is measured by these additions.
Physical iPhone/Pi Browser acceptance and the older full-game WebKit cold-start
stall remain open. Native browser checks of the small input boundary do not
establish full-combat WebKit acceptance.

Validation and protected deployment receipts are recorded in results.json.
No raw owner attachment or physical-session content is committed here.

## Completed checks and deployment

The frontend release build passes all 538 cases in 22 groups, TypeScript and Vite;
only the existing large-chunk warning remains. Changed modules pass ESLint.
The 24 isolated Preview cases and transformed-controller type check also pass.
The initial full-session-only run before required painted-art prebuild is
retained as excluded in results.json; the full build includes that prebuild.

Actions 40826490687 at application source 68c33d1/tree ac2f4a8 passes both jobs.
Chromium 151 passes 18 boundary checks, WebKit 26.5 passes 11. Both observe native
single-touch input before React root capture. Chromium additionally observes
native two-touch/ignored-secondary events. Its actual isolated Boss 2 scene runs
30.108 active seconds, exercises the original weapons/Resume flow and recovers
a complete 426684-byte/179-record report after a controlled reload. That report
contains 39 contact rows, including native two-contact evidence. These are
synthetic browser checks, not physical Pi Browser or full-game WebKit acceptance.
Both artifact ZIPs were downloaded, integrity checked and SHA256 compared with
GitHub's artifact digests. See results.json for IDs, hashes and exact checks.

Protected Preview READY, 35 seconds, source 68c33d15f6f591477508cc9e0497d6c8a4c100c0:
https://cryptoid-evolution-testnet-hde4nlh2r-19-trojan69.vercel.app/
Deployment 6AG4NJpP5eWm44Ze927kLR8A6FvE. Existing Vercel Authentication/Standard
Protection is retained. The already approved signed Dashboard fallback was used;
no bypass secret/link or protection/account/project setting was changed.

The deployed cloud browser separately verifies the original paused setup,
manual Resume, crossing the weapons button, fresh click opening, explicit Return,
manual Pause and report recovery after reload. Its native mouse test yields a
276363-byte report with 119 contiguous records and 21 contact rows; it does not
claim native two-finger input. Runtime report commit/tree match the application
source above; workingTreeDirty is reported true and is not rewritten as false.
The screenshot shows the new instruction and working local report export.

The public Testnet Overview still assigns Production 239zEifRV84KCpbyHumnuHmSGm9T,
main ce073547cf573375d141bf846f70e294138dbd73, to its unchanged public alias.
PR 200 remains draft, open and unmerged at 5795faaa7c5f0197a2d32639107e957dbc1d6e88.
The original one-finger preview and Mainnet were not modified. Receipt commits
change documentation/evidence only and are not another application deployment.
