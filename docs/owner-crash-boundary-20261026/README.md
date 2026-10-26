# Owner crash-boundary evidence

The owner supplied a private current-release run after another White Screen and
return to Home, and explicitly requests more precise evidence if needed.
The raw report stays private and is never committed. Start from common public
6fe93a5d8364e2dce900bfa4225457f8359e0abf; preserve its fixed source and READY
Testnet DhTyCpWgMHQ8XATKAZZMYdkLbzze / production DP8RN6JYDLPbbsML652jk7anfojj.
No gameplay fix or historical White Screen cause is established by this work.

A concrete instrumentation defect is reproduced against the pinned published
ownerLifecycleCapture source: #root's direct-child observer sees GameRoute's
authentication gate but misses its later nested replacement by .game-shell.
Consequently active scene, pause and RAF-gap observation can remain absent.
Bind one additional direct-child observer to GameRoute (no subtree/shot observer).
Keep fresh server-verified Testnet owner access, revocation and native RAF forwarding.
Add fixed-enum route/view/focus/fullscreen/freeze signals, with no auto-Resume.
A DOM-empty or recovery view is only DOM evidence, never observed white pixels.

The independent crash tail now retains up to 128 snapshots at most every 250 ms,
covering about the last 32 seconds while callbacks execute. Its head already used
250 ms; reuse that callback and add bounded frame/work/React progress from existing
probe methods. No per-work-section storage write, new timer/RAF, network request,
DOM render-work query, account payload, screenshot recorder or whole-run memory.
Persist actual cadence in metadata; older 32-slot/one-second tails keep their
original labels. Storage failure remains isolated from the game.

Export supplementaryEvidenceVersion2 adds a read-only recoveryBoundary linking
same-tab document identifiers, last committed/observed times, next navigation
start, first observed route/Home and the remaining unobserved interval. Origin
fallback is not asserted to be the same tab. Closed runs and observed departures
remain distinct. Native verification caught an important ordering case:
next navigation timeOrigin can precede the old pagehide; use first actual next-
document observation for the upper bound, and expose overlaps rather than a
negative interval. Do not infer OS, memory, compositor or GPU cause.

Validation: 271 normal release tests, locales, TypeScript/Vite and changed-module
lint; 14 native WPE26.5 controls. The native real-React GameRoute fixture reproduces
the published missing mount and corrected active scene, paused DOM, quarter-second
tail, callback progress, actual IndexedDB export, replacement/Home linkage and
normal pagehide distinction. Both published and candidate cases use local fixture
inputs; this is not real Pi authentication, payment, physical iPhone or natural
White Screen reproduction. The initial new correlation helper misclassified native navigation ordering; its failed control is retained and the helper is corrected. The published-source comparison applies to the lifecycle observer only; tail/progress use the current implementation in both native cases.
GamePage, backend, styles/art/audio, economy/save queue and strict >2500ms/500ms
watchdog are unchanged. No automatic recovery, migration, reset or PR167/168.

Technical limits: JavaScript cannot record while its process is terminated.
The public Page Lifecycle guidance explicitly describes unobservable discarded
states; Apple's WKNavigationDelegate termination notification belongs to the
native app host. These sources describe platform boundaries, not this run's cause:
https://developer.chrome.com/docs/web-platform/page-lifecycle-api
https://developer.apple.com/documentation/webkit/wknavigationdelegate/webviewwebcontentprocessdidterminate(_:)

Candidate branch codex/owner-crash-boundary-20261026 has auto-deploy disabled.
Continue the owner's established same-source Testnet/production release workflow
only after review and checks. The new active capture remains Testnet-owner-only;
ordinary users get no added collection. Keep release receipts on a separate
non-deployed branch and preserve all existing fixed/rollback references.
