# Completed owner-only Testnet recorder release

Explicitly authorized by the owner. Official Testnet READY
dpl_5yuZonhFwMq5WXLgVTYmtrMGnMyW serves source
f85360ed464fb75944ada0c3f1d22776c4df31ca, exact tested tree
2aac1e929e8992b9d93b5de0ffaf8675effc6f00. Ready 21 October 2026,
17:14:42.139 Vienna; build 43.259 seconds.

Keep codex/owner-flight-recorder-20261021 fixed. Immediate rollback is
backup/testnet-before-owner-flight-recorder-20261021 at cc5ef227 and old READY
dpl_8zBFheLX2x4hLUMTYUxChv4exrts. Preserve every older fixed reference.
This receipt branch is not deployed; automatic deployment is disabled.

Preview dpl_Ertmq1oafJbxsyUbzcgzGP9B8DXd built in 44.206 seconds. Existing
authorized browser UI passes guest start/pause/countdown/resumed gameplay.
The protected HTTP helper returned 403 read_protection_bypass; no retry,
protection change or bypass followed. Production rebuilt the exact same Git
source in its own environment; it is not the identical preview binary.

Fresh public HTTP checks pass: delivered GamePage/Admin source/tree, eight new
owner recorder features, six preceding cleanup and eight preceding memory
features, four production QA exclusions. Anonymous Admin remains 401. API and
three leaderboard status/length/SHA-256 values exactly match the fresh baseline.
Only hashes/counters, not raw leaderboard/account payloads, are retained.
Public Home loads with Spielen enabled and no new public diagnostic UI.

29 focused diagnostics pass again. Native Chromium passes 72,000 synthetic hook
frames, native storage, document reload without finish, archive and lease cleanup.
The 20 minutes are simulated, not real-time/iPhone gameplay. Repeat host time is
559.8 ms, native storage total 82.0 ms/max individual write 5.1 ms; these are not
physical iPhone overhead measurements. Preparation also records 54 broader
diagnostic tests, build/12 locales and the unavailable historical source assertion.

Runtime logs remain unqueried after the prior permission denial. Drains not
inspected. Live owner/Pi login is not exercised; gates are checked by unit/code
tests, actual delivered code and anonymous denial. The interruption/thermal/GPU
cause remains unproved. No Mainnet, account/save/payment mutation or telemetry.

See owner-flight-release-20261021/release.json, before.json, after.json and
testnet-ready.jpg. Verification-helper changes are receipt-only, not deployed.
