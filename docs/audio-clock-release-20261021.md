# Audio correction on official Testnet

The owner authorized publication after reviewing the prepared correction. Small
ship debris and its visible lifetime remain unchanged, allowing the audio
correction to be assessed independently.

Fixed source: b026a194cdb596349b041c910d22b115eeb1560b. Source tree:
4257adb659718cce79af3558bcef4b9d2f4c74bd. Existing project:
cryptoid-evolution-testnet (prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF), account
team_KzJmtl0QyoYZAOu5RQKsAR2i. Official address:
https://cryptoid-evolution-testnet.vercel.app/.

Rollback branch backup/testnet-before-audio-clock-recovery-20261021 preserves
the preceding 4c25790a8b7173edda9f2ef9370f0251e716f668 release and READY
deployment dpl_EaTGHQkt3sRPmYY5ifvLK8bwvnfj. Keep all older fixed references.

The release adds scheduled-end fallback cleanup for missing native ended events,
a bounded same-context recovery for an observed stationary audio clock, release
of fading weapon sources on Pause, silent pending music during Pause/countdown,
explicit Resume graph recovery, and five sanitized owner resource fields.
Original samples, gain, envelopes, healthy overlap, music element and seek are
preserved. See audio-clock-recovery-20261021.md for the demonstrated failure
paths, exact 81-test results, build/12 locale checks, and the historical source
comparison explicitly excluded because its Git object lacks GamePage.

READY preview dpl_Hu77mEXz1RtTDNKWke187Hgsbi34 built in 45.947 seconds. Browser
guest start, Pause, visible countdown and resumed gameplay pass. No protected
HTTP bypass was attempted. Production separately builds the same exact source;
this is not the identical preview binary. Final deployment metadata and limits
for READY production dpl_BVG5yfJDSWjS3ETXK5xS1MAUDtti (44.787-second build)
are in audio-clock-release-20261021/release.json. Fresh public before/after
API, leaderboard, anonymous Admin-denial, source identity and prior resource
features are in before.json/after.json. New audio delivery checks and matching
module hashes are in audio-features.json. The saved screenshot shows official
Home with Spielen enabled.

The first new delivery probe expected a literal if(this.pending); the minifier
combines observation and that condition with a comma. Inspecting the served
code confirmed the intended early return. The receipt-only probe was corrected
to match that form and now passes all eight checks; no runtime patch or redeploy
was needed.

No authenticated owner/Pi login or physical iPhone test was performed here.
Browser UI checks do not verify audible output. White-screen recovery, native
or GPU memory, temperature and OS termination causes remain unproven. Runtime
logs were not queried after the earlier permission denial; drains not inspected.
No Mainnet, account, payment or durable game-state mutation was made.

This receipt branch codex/audio-clock-release-record-20261021 has automatic
deployment disabled and must not be deployed. Keep the published source branch
codex/audio-clock-recovery-20261021 fixed at the exact commit above. The owner's
next device run should reload Testnet, continue the saved mission, and try a few
Pause/Resume cycles. A new owner report can show audio-clock progress, recovery
attempts, blocked allocations and fallback voice cleanup if failure recurs.
