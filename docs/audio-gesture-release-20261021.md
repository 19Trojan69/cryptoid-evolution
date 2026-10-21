# Audio Resume gesture correction — Testnet release

The authorized follow-up audio correction is live at
https://cryptoid-evolution-testnet.vercel.app/.
Fixed source: 25d80d4fea43bd18b9c3ce643a1766cde537114e; tree:
36c1887d871364b8721c9db8a7c19cd940d67b83; branch:
codex/audio-gesture-recovery-20261021. Its automatic deployment remains off.

Official READY production deployment dpl_5C28c1QDmujcvKSMWBMUbidpK5N6 built in
36.987 seconds. READY preview dpl_5EAFVPM3pESDYk9GikfJpoE85SRU built in
43.926 seconds. They use the same fixed source and separate environment builds.
The official alias is assigned to the new production deployment. Rollback is
backup/testnet-before-audio-gesture-recovery-20261021 at b026a194cdb596349b041c910d22b115eeb1560b,
with preceding production dpl_BVG5yfJDSWjS3ETXK5xS1MAUDtti preserved.

The owner report directly measures the effects clock at zero despite running,
one stall and 25 then 135 blocked starts. The preceding code delayed native
resume beyond the click after forcing a fresh graph to suspend. Fresh graphs
now resume directly within the gesture; rendered paused graphs queue both
native operations in order before awaiting them. Rendering progress releases a
stale pending gate. See audio-gesture-recovery-20261021.md for the demonstrated
failure, correction, 91 focused tests, build, type/lint checks and their limits.
Two unavailable historical comparisons remain explicitly excluded.

Preview browser checks pass: guest start, Pause, explicit Resume, visible 3–2–1
countdown and resumed active play. The freshly reloaded official Home has
Spielen enabled. Delivered Game/Admin source and tree identities match the fixed
source. All 13 audio feature checks pass, including five new gesture/progress
checks. Prior eight memory, six cleanup, eight owner-recorder, two hull-handoff
and four production-QA-exclusion checks also pass. API and all three leaderboard
response hashes are unchanged; anonymous Admin remains denied with HTTP 401.
before.json, after.json, audio-features.json, release.json and testnet-ready.jpg
are in the sibling evidence directory.

The receipt-only QA helper drops an obsolete leading `if(` in its existing
music-coalescing substring probe because the new clock observation precedes
that same guard. The deployed runtime is unchanged by this probe adjustment.
This receipt branch codex/audio-gesture-release-record-20261021 has automatic
deployment disabled and must not be deployed.

No physical iPhone audio output or authenticated owner session was tested.
Music's stopped clock is not measured by the owner's report. WebKit's exact
internal fault, white-screen causation/recovery, native/GPU memory and OS cause
remain unproven. Earlier runtime-log and protection-bypass denials are retained;
logs were not queried, protection was not bypassed, and drains were not inspected.
Mainnet, game logic, account/save semantics, artwork, debris and sound parameters
are unchanged. Next device test: freshly load Testnet, continue the saved game,
leave the app, return and press Resume; check music and effects and export a
new report if the fault recurs.
