# Readable combat transitions, 27 October 2026

Continue PR184 from verified remote candidate 97fdd92b6c8caef3616bc9b32348d4b0413d5d4f
(tree cda32e9a2de5a3f49e893e7512520cd23f7f0fca). Shared public/main is
09a6a4047236c7c8cc5ef430386fd0c6825ebb41. The owner explicitly requests readable
middle-of-field titles and completion of the already authorized same-source
Testnet/production release. The previous Game Over optimization is retained.

## Behavior

Normal level/block intros and bonus intros last 4800 ms of active playing time.
Combat-variety block clears last 5200 ms, replacing 1150/1750 ms; the legacy
8500-ms clear remains. The original 4900-ms boss warning now has a matching
visible animation instead of the later 2200-ms CSS override. Titles spend 80%
of their duration fully opaque (3840/4160/3920 ms), with one calm opacity arrival
and departure. Competing child title/glow animations are disabled only for these
notices. All fonts, original layout/positions and original art stay unchanged.

Native duration comes from the same phase constants. A phase/encounter/section
key starts each new title once. Manual and technical pauses retain that exact
DOM node and freeze its native animation, including the explicit Resume
countdown. Neither waiting nor animation completion resumes play. System and
saved Reduced Motion show static, fully legible titles for the same phase time.
The boss-defeated title arrives once and stays while its existing heart pickup
can be pending; it has no independent disappearance deadline.

Reinforcement flights retain their actual released 550/850-ms lead-ins; enemy
entry/gap/breathing, boss movement and every combat rule remain. The additional
normal intro reading time does not advance the existing variety event clock,
so it cannot bring drops or rocks due earlier. Existing transition protection
keeps paid/pickup weapons, shield, rapid, overdrive and EMP time intact. Falling
pickups retain their existing movement. No new RAF, timer, poll, endless
animation or full-screen effect is introduced.

The common completion after boss and bonus remains the existing manual stop:
confirmed saving/preparation, retry on failure, no reader timer, no automatic
Continue and no reward on Continue. Original terminal Game Over sleep, finite
explosion completion, explicit restart, strict >2500-ms watchdog/500-ms polling,
explicit technical Resume and all previous resource/raster improvements remain.

## Verification and release boundaries

Five exact controller edits restore the entire 97fdd92 GamePage to SHA256
fd1706248bfab3e84170b8e75c11c058fda244f87c04fb16513bcde73f0334de.
The existing Game Over/publisher/historical restoration chain calls this exact
restoration first. Any other controller edit still changes the pinned digest;
negative controls retain real pause and watchdog checks. Old subsecond title
assertions are replaced with full-campaign readable-deadline assertions.

See verification/readable-transitions-20261027 for completed gate, native,
actual-flow, lint, scope and excluded-fixture observations. The previous 397
cases and 127 backend cases remain historical evidence, not the new result.
Current resolved lint findings are compared against the pinned candidate;
historical 62+4 are not claimed repaired and no whole-project lint-clean claim
is made. All backend/API code remains unchanged.

Keep backup/shared-before-game-over-idle-20261027 at 09a6a40. Immediate rollback
deployments remain Testnet 5WzvAtXq4aNoXCj6DXwnFDcAKZX7 and production
CXKVFwjsoiCFdLRZBUdeKqBGNR2h, independently confirmed READY in the Dashboard.
Keep this working branch auto-deploy-disabled through review. Merge PR184 only
after acceptance, let main trigger both existing projects once, then verify
READY source commits, delivered commit/tree, bundles, title changes, prior
guards and separate public networks. Actual publication is recorded separately.
No reset/migration, live purchase/account mutation, PR167/168, secret/protection
change or runtime-log access. No physical temperature/battery or historical
White Screen cure is claimed; no new long owner campaign is requested.
