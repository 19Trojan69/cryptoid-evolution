# Admin audio-start correction and remaining Whitescreen investigation

20 October 2026. Preparation on `codex/iphone-lifetime-audit-20261020` only.
Base: `943c6cc229e54d5079e47b56d2af30c1e0ffd342`; its runtime is the approved
`613b3c7ebaf235d75aab4fdc33eb58897e111e2f` audio-diagnosis release.
The owner explicitly requested correcting demonstrated faults and continuing
the game-abort investigation at 12:29 Europe/Vienna.

## Device evidence

The 12:17:32 export contains the requested comparison on the same build/tree,
boot, 430x825 field, ship stage 3 and starting sector 25 (Level 3, Block 5).

| Observation | Fully off | Original |
| --- | --- | --- |
| Detail duration | 90,004 ms | 90,016 ms |
| Largest recorded RAF gap | 84 ms | 83 ms |
| Effect context | none after confirmed cleanup | running, clock advances 90,016 ms |
| Effect voices started/ended/released | 0 | 405/405/405 |
| Weapon voices started/ended/released | 0 | 11/11/11 |
| Overdue/untracked effects and weapons | 0 | 0 |
| Music/card contexts | none | suspended, clocks remain zero |

Original starts at 12:15:32.801 Vienna; its detail capture finishes around
12:17:02.816. Explicit `home-intent` occurs at 12:17:26.908, followed by monitor
stop. There is no recorded unexpected restart in either short comparison.
The 7,660,648 cached effect-buffer bytes are a known subset, not process/GPU memory.
Media-element position advancing while its connected AudioContext is suspended
does not establish audible music. The report's `timingCapture: null` is expected.

The original test therefore confirms healthy effect-clock/lifecycle behavior
in this run and a separate blocked music/card start. It does not reproduce the
earlier retained-voice accumulation, establish presented FPS, or diagnose the
prior Whitescreen. Single maximum gaps do not establish equivalent overall pacing.

## Reproduced fault and correction

The actual Admin `startTest` primed only GameAudio in the start click. It then
awaited `/admin/start`; navigation and GamePage initialization happened after
that boundary. Music and the shared card AudioContext could first be created or
resumed after the qualifying gesture had ended. This matches the supplied
suspended-context observation; it is not proof of an underlying browser defect.

The correction calls card priming and a new silent music priming method in the
existing start click, before the request. Music `load()` and graph `resume()` use
the same player later claimed by the existing GamePage handoff. No soundtrack is
played during the request, and no play action waits for a pending audio promise.
Saved music-off is respected. The normal Home music handoff and existing
MusicPlayer play/unlock/track-change behavior are preserved.

A ref retains only the unclaimed Admin preparation. Failed requests and Admin
unmount close it; a successful handoff clears that ref so Admin unmount cannot
close the game's player. A stale cancellation checks identity and cannot close
a newer preparation. If the audio constructor is unavailable, the original
Admin request still proceeds. No new timer, animation loop or input listener.

## Verification

`adminGameAudioStart.test.mjs` executes the actual TypeScript start handler and
actual music/card modules against a gesture-sensitive controlled host:

1. Negative control executes the official `613b3c7` handler and reproduces
   suspended music/card after the delayed request.
2. Corrected handler primes while the click is active, remains silent during the
   request and later plays through the same two contexts/one media element.
3. Successful transfer survives actual Admin cleanup; abandoned preparation is
   closed, and stale cancellation cannot retire a newer player.
4. Twenty rejected requests leave no prepared music context alive.
5. Busy and saved music-off paths do not prepare a soundtrack.
6. Unavailable media constructors cannot block the request.

80 targeted checks pass across launch, effects, music, Resume, owner audio/timing
gates, report sanitation, reload diagnostics, game-loop recovery and all 50 boss
boundary models. Existing full simulation/owner-entry AST parity checks pass.
`npm run build` passes: 12 locale tests, release completeness gate, TypeScript and
Vite. The pre-existing >500 kB chunk warning remains. `git diff --check` passes.
These controlled-host tests do not measure physical WebKit permission behavior,
audible output, GPU/native memory or the iPhone Whitescreen.

## Abort-path review and next discriminating evidence

Inspected GamePage's explicit Home/save-exit callbacks, its auth-entry Home
button, the route error fallback, router and useAuth. The inspected automatic
error recovery pauses the mission; it does not silently route to Home.
The route fallback's reload/Home actions also require a click. The unchanged
normal-clear transition and its previous controlled replay do not establish
anything about native rendering/image-decode failure at that transition.

The earlier confirmed interruption showed a new document after visible active
play, without an exit intent. This points to a page/browser-process restart
boundary, but does not identify whether it was memory termination, a WebKit/GPU
crash, a watchdog action, or another host reload. Do not label it as proved jetsam.

Next: inspect an existing iPhone `.ips`/JetsamEvent or WebKit/Safari/Pi Browser
report matched to the actual unexpected exit (the previous confirmed case was
around 10:12 Vienna on 20 October), rather than the voluntary 12:17 exit.
Device path: Settings > Privacy & Security > Analytics & Improvements >
Analytics Data. No Mac, new long campaign or analytics-setting change is needed
to look for already recorded entries. Absence of an entry is not evidence that
no native termination occurred.

For jetsam, inspect the process with a `reason` field, timestamp, process name,
coalition, `rpages` and report `pageSize`. `largestProcess` alone does not identify
the killed process or establish that Cryptoid was responsible. A report naming
an unrelated killed process does not prove the game's abort was memory-related.
For a normal crash, inspect exception/termination reason and crashed thread.

Primary references checked:

- https://webkit.org/blog/6784/new-video-policies-for-ios/
- https://bugs.webkit.org/show_bug.cgi?id=134925
- https://developer.apple.com/documentation/xcode/acquiring-crash-reports-and-diagnostic-logs
- https://developer.apple.com/documentation/xcode/identifying-high-memory-use-with-jetsam-event-reports
- https://www.apple.com/at/legal/privacy/data/de/device-analytics/

## Publication and preservation

No deployment, alias, environment, account, payment, save, Highscore or data
mutation. The public Testnet root still returns 200 with release asset
`/assets/index-N-bYkJCy.js`. Deployment metadata rereads through the connector
were unavailable (404); this is not a claim of fresh deployment-ID verification.
Git remote fixed release remains `613b3c7`; rollback remains `53640c0`.
Audit-branch automatic deployment remains disabled in `vercel.json`.
The runtime correction is prepared, not live, and requires a separate release
instruction before moving the official Testnet alias. Mainnet is excluded.
