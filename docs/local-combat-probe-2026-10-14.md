# Local shooting/frame probe — 14 October 2026

User authorized measurement at 05:34 Vienna after reporting that firing feels
slower, more in the private test but also on official Testnet. The original mobile
crash and subjective firing slowdown are not yet diagnosed on-device.

Confirmed mechanism in the shared code: simulation delta is limited to 34 ms and
the unchanged fire timer accumulates that delta. Synthetic extraction of the real
firing block gives 30/20/10 standard volleys over 9.6 s with 16/50/100-ms steady
frames, respectively. Projectiles were removed each step to exclude the cap.
This reproduces a mechanism, not the user's actual device frame schedule.

Implementation is observational only. Private test explicitly enables
window.__ENV.combatProbe; the normal production build has no flag and creates no
probe. Existing scheduler/step and simulation/volley logic remain identical after
removing observational calls; verifyProbePreservation.cjs checks this against
50688fe9c2b47a4801e005954cd8a8ee71cfca65. Main game markup, CSS/assets, sound,
ship statistics, damage/collision, entry timing and projectile limit are unchanged.

The existing 20-record local diagnostics ring stores one window per 10 active
seconds and a final window on pause/background/unmount. No per-frame storage or
new scheduler. Fields include build/sector/block/phase, frame mean/max and count
over 34 ms, counted/discarded simulation time, simulation-step work, firing
attempts/emitted volleys/projectiles and cap blocks, expected interval/changes,
gap mean/max and at most 12 recent gaps, React commit count/gap, active object
peaks, estimated image-cache bytes/pending jobs, source analysis/material work
and cumulative encoding/decoding wait totals. A prior diagnostic write cost is
also recorded, because instrumentation itself is not free.

Raw/source pixel processing and material work are synchronous work measurements;
encoding/decoding and queue wait are elapsed waits, not CPU attribution. React
commits are not proof of physical display/GPU presentation. Cache bytes are not
total browser/GPU memory. Resources at the worst observed frame give correlation,
not proof of causality. Context is sampled at window end; mixed phases/changed
weapon intervals must not be treated as a steady firing-rate measurement.
Pause/background and known non-firing transitions reset shot-gap comparison.

Private Site adds a separate diagnostics.html (not a game/HUD button). It reads
only shooting samples and explicitly allowed fields from the same origin's ring.
No account/outbox keys, credentials, scores, inventory or automatic transmission.
Manual JSON download/copy requires a user click. Storage denial, malformed records
and optional provider failures are contained. Use game and viewer in the same
browser; native embedded views may have isolated storage. Do not clear progress.

Verification: 402 frontend tests, production build and backend build/106 tests.
New tests compare real firing code with probe on/off, distinguish cap blocking,
exclude pause/weapon-change false gaps, enforce ring/recent-gap bounds, contain
provider/storage errors, and keep paint allocation/output unchanged. Private
viewer synthetic DOM test verifies filtering/privacy and mobile viewport metadata.
Existing GamePage Node simulation passed 30 normal blocks with three boss cycles
and zero residual RAFs/timers/listeners. It stubs visuals/account/audio and is not
a real device benchmark. A synthetic test fixture was updated for the new optional
probe dependencies; restored backend build artifacts were required by an existing
frontend test. No production bug was inferred from those harness failures.

Device workflow: open private test in one browser, play 2–5 minutes with a stable
weapon and note the time/level when slow firing is felt. Pause normally, open
diagnostics.html in that same browser, download cryptoid-schussdiagnose.json and
share it voluntarily for analysis. Export immediately: the bounded ring keeps
roughly the last three minutes, fewer after lifecycle/error events. The diagnostic
run is not itself a stability/slowdown fix or mobile acceptance proof.

Temporary workspaces were pruned; exact runtime source and Site source were
recovered from their respective Git repositories. Existing work was preserved.
The change stays in the protected development branch/private Site. No public
Testnet/Mainnet release, main merge, database mutation or paid change. Database
backup/isolated restore remains unverified; public release still blocked.
