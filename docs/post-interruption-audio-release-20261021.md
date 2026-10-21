# Explicit audio retry after interruption — Testnet release

The ongoing authorized Testnet audio correction is live at
https://cryptoid-evolution-testnet.vercel.app/.
Fixed source b92ab45bc1e493fb86c36da4f01bd88d15a5f498, tree
9f68861ff277ef7a4b92da7392d82611333c6a29, branch
codex/post-interruption-audio-retry-20261021; automatic deployment is disabled.

READY production dpl_EZAwgBRrVpRXGwfEAZXW9bDz5GP5 built in 42.316 seconds.
READY preview dpl_AC3pd3Run2D1besfB8HZtqDYqa9M built in 37.038 seconds.
These are separately built from the same fixed source. The official Testnet
alias points to the new production. Rollback branch
backup/testnet-before-post-interruption-audio-20261021 preserves 25d80d4f and
previous production dpl_5C28c1QDmujcvKSMWBMUbidpK5N6.

Explicit Resume can now retire a pending or failed automatic audio recovery and
issue a new native request within that gesture. The frozen queue remains
blocked until measured clock progress, and old completions cannot clear later
attempts or revive closed graphs. Automatic calls stay bounded. The controlled
comparison runs the actual preceding implementation, which fails this case.
Only AudioClockRecovery.ts changes runtime behavior. See
post-interruption-audio-retry-20261021.md for the owner evidence, four new tests,
95 passing focused tests, passing build/types/locales/lint and explicit limits.

Preview browser: guest start, Pause and the 3–2–1 Resume countdown are observed.
The resumed run progresses through combat/life loss to Game Over before the
next snapshot; active play with an enabled Pause button after that countdown
was not separately observed. No account game or physical audio was tested.
The freshly reloaded official Home has Spielen enabled.

Delivered Game/Admin commit/tree identity matches the fixed source. Sixteen
audio feature checks pass, including the three new explicit-retry probes. Prior
memory/cleanup/owner-recorder/hull-handoff/production-QA-exclusion checks pass.
API and three leaderboard response hashes equal the fresh pre-release baseline;
anonymous Admin returns 401. before.json, after.json, audio-features.json,
release.json and testnet-ready.jpg are retained in the sibling directory.
The QA helper's three new probes and release records are receipt-only changes.

The owner additionally reports White Screen/Home during the boss-70 victory
cue. The old sector-48 event is historical; the fresh report shows an unfinished
active session, a new document, and a heartbeat 1.683 seconds after the cue
request. The effects clock advances, voice count is bounded, and boss-canvas
release is recorded. Music clock/native memory are unmeasured. Bosses 50/60
passed in the same recording, and the MP3 decodes without error in ffmpeg.
The White Screen cause is unresolved; this release does not claim to fix it or
prove audible recovery after it. No new diagnostics, artwork, debris, samples,
gains, account/save/gameplay changes or Mainnet contact are included. Earlier
runtime-log and protection-bypass denials are preserved; neither was retried,
and drains were not inspected.

Receipt branch codex/post-interruption-audio-release-record-20261021 has automatic
deployment off and must not be deployed. Keep the fixed source/rollback refs.
Device check requires only a fresh page load and Resume of the existing saved
mission; replacing the run with level one is unnecessary.
