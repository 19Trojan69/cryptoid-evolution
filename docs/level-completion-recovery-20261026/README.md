# Level confirmation and preserved Home exit

The owner reports a disabled Continue after the bonus and Home / Leave with no
visible result. The private screenshot shows failed preparation, not a successful
countdown. Its actual HTTP failure is not supplied and is not inferred from an
older session report. Small native touch movements did not reproduce swallowed
button taps; the viewport implementation is unchanged.

Against exact published GamePage 220b199, controlled native WPE with actual game
code and real API handlers reproduces a stale, present session scoreRun while the
account still owns the original active run. Normal upload Retry keeps receiving
403 because restoreScoreRun only restores a missing session run. The new explicit
Retry first calls the existing authenticated progress/recover through the existing
queue, then drains the original entries. The server decides current ownership;
replaced/expired/invalid runs remain rejected. This proves a repairable case, not
that it caused this device's screenshot.

Completion now distinguishes rejected/server-session saves, unconfirmed checkpoint
or rewards, and effect cleanup. No raw server message or credential is displayed.
The automatic healthy path makes the same requests as before. Exact next level,
score, Shards and hearts checks, the prepared visible ten-second wait, explicit
Continue, original activation receipt and bounded invalid_save retries remain.

A save failure previously made confirmed Home exit stay on the game every time.
At a failed level-completion stop, a clearly labeled primary Home action now uses
a local backup only if the actual queued bonus for this network/account/run/stage
matches the displayed score, Shards and hearts and its complete serialized queue
matches readable durable storage. The click rechecks this. It never submits score,
finishes the active run, archives, removes, or re-awards an entry. Keep playing and
server Retry remain explicit choices. Re-entry uses the existing queue recovery
before offering the current account mission. No local exit for missing/replaced
backup, storage write/read failure or uncertain activation. Ordinary combat exit
is unchanged. The compact 393x628 modal was visually checked.

Validation: 275 frontend release tests, TypeScript/Vite and changed small-module
ESLint. GamePage retains the existing 62 errors and four warnings; no extra findings.
Backend source is unchanged; the previous 126 backend tests remain the baseline,
and the native flow exercises its real compiled progress/hangar/reward handlers
with isolated in-memory data. Native checks include stale-session recovery,
failed bonus upload and Home, exact retained queue, re-entry before resume,
no duplicate bonus, failed durable storage, legacy boss marker and campaign 500.
Trusted native touch taps activate the tested controls. Simulation completion and
clocks are controlled and run score time is widened in the fixture; this is not
physical iPhone/Pi, real login, payment, wall-clock score-budget or long-run proof.
Initial fixture runs counted usage events as rewards and unloaded Home requests;
the final verifier counts only reward writes and waits for Home requests to settle.
No historical White Screen cause or complete stability fix is established.

No watchdog, genuine pause/Resume, HUD geometry, art/audio/ship size, combat rule,
reward amount, account/network/payment configuration, auth protection or PR167/168
change. Exact reviewed source restoration preserves prior scope fingerprints.
Candidate auto-deploy is disabled; publish only the checked source to the existing
projects. Immediate rollback is backup/shared-before-completion-recovery-20261026
at 220b1997f9c803f1dba0ac9fd89446c803a8e271; READY deployments are Testnet
DZruUPJWis8Tm2CQggmvD9uJVhEk and production 12mKjdMLfo3xFG3jaR8tq6wcwTPP.
Public delivery and deployment receipts belong on a separate non-deployed branch.
