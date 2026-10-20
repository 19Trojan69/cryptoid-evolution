# Preserve the officially approved game

## Completed audio/heat Testnet release and further resource audit, 20 October 2026

The owner's 12:55 Europe/Vienna instruction explicitly authorized publishing the
two prepared corrections, then investigating and naming further resource defects
before fixing them. Publication is complete: official Testnet READY production
dpl_4ckqHNmsXh7NnQiYK79aHcsYeAZK, runtime b15306f2d22d2196275091c904d068829879efc7,
tree 9d39cd64724ac92b17a805cdc321e52ad43de638, ready 13:02:35.446 Vienna.
Keep codex/testnet-audio-heat-release-20261020 fixed at that exact source.
Immediate rollback is backup/testnet-before-audio-heat-fixes-20261020 at 613b3c7,
READY dpl_9SDKyLLDyvoT4Ni3yyzr6ojA8xxK. All older fixed refs stay fixed.
Delivered identity, Admin synchronous silent priming/cancellation and heat-tile
failure cleanup are verified. Build workingTreeDirty is observed true. API,
anonymous Admin denial, three Highscore hashes and artwork hash match before;
Mainnet remains 907d2a7 / dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe. A bounded scan of
10 request records on the new deployment has zero warning/error/fatal records.
No physical iPhone/audio/process-memory or Whitescreen-cause proof is claimed.

The subsequent read-only source/controlled-host audit demonstrates five further
areas: failed boss base-layer exceptions lack explicit release; BonusRock texture
null contexts throw, including from uncaught timer prewarm; boss-card temporary
layers/failure paths lack full disposal and ignore an unavailable weapon draw;
ship-card failure paths lack temporary-surface cleanup; pending boss texture loads
can be duplicated after two-entry cache eviction. Do not silently implement these
new findings: the owner requested naming them first. No new runtime change has
been made. GC may reclaim unreferenced surfaces; these are not permanent-leak or
device-crash proofs. Prioritize the two in-game failure paths over card helpers.
See docs/testnet-audio-heat-release-20261020/{release.json,resource-findings.md,
additional-resource-audit.json,testnet-ready.jpg} and
frontend/scripts/auditAdditionalResourceFailures.mjs. Continue audit documentation
on this branch with automatic deployment disabled. Do not ask again for the
completed two-patch release authorization; Mainnet/accounts/saves stay excluded.

## Boss heat-canvas failure cleanup, 20 October 2026, preparation only

The owner requested continuing the abort investigation at 12:39 Vienna. Inspection
found that drawBossWeapons did not zero a newly allocated heat tile when its 2D
context was null or its preparation threw. Failed tiles were left to GC, and a
null context incorrectly reported a successful draw. Release only unsuccessful
temporary tiles, return false for null contexts and restore the main Canvas save
state through finally; preserve successful drawing and original exception flow.
The controlled negative control sees 8,000 unreleased failed tiles over 2,000
attempts; the candidate sees zero. This is missing explicit release, not proof
that a real browser permanently retained those tiles. All 50 bosses, nine heat
levels, recoil/destruction/frozen cases and three backing ratios give 1,650 exact
RGBA matches. 62 targeted checks and the frontend release build pass. There is
no physical WebKit/process-memory or Whitescreen-cause proof. Keep the earlier
audio-start fix and this correction isolated and unreleased until explicit
Testnet publication is requested. Preserve official runtime 613b3c7, all rollback
refs, Mainnet, artwork, gameplay, saves, accounts and owner-only diagnostics.
See docs/iphone-boss-heat-cleanup-20261020.md and
frontend/scripts/verifyBossHeatLifetime.mjs. Native iPhone incident evidence is
still missing; do not claim this fault was observed on the device.

## Confirmed Admin audio-start correction, 20 October 2026, preparation only

The owner requested correcting demonstrated faults while continuing the Whitescreen
investigation at 12:29 Europe/Vienna. Correct the Admin launch that primed effects
but created music/card graphs only after asynchronous server work. Prime the same
music element/graph silently and the card context in the existing start click;
transfer that player to GamePage. Failed or abandoned requests retire unclaimed
music, and saved music-off is respected. No waveform, gain, clipping, timing,
simulation, HUD, account, save or reward change. Six controlled launch tests include
an official-613b3c7 negative control; 80 targeted checks and the release build pass.
This is not physical iPhone verification or proof of the Whitescreen cause.
Do not move fixed release/rollback refs. No new deployment was requested for this
preparation; automatic deployment stays disabled. See
docs/iphone-audio-start-correction-20261020.md. The next crash evidence is an iPhone
system log matched to the last actual unexpected exit, not another identical
90-second comparison. Jetsam/WebKit termination and its cause remain unconfirmed.

## Completed owner audio Testnet release, 20 October 2026

The user explicitly requested publication at 11:31:50 Europe/Vienna. It is
complete: official Testnet is READY production dpl_9SDKyLLDyvoT4Ni3yyzr6ojA8xxK,
runtime 613b3c7ebaf235d75aab4fdc33eb58897e111e2f, reviewed tree
00080accf510eaed98d0e11480dc94ab3646ff71, released at 11:37:37.703 Vienna.
Keep codex/testnet-owner-audio-release-20261020 fixed at that exact runtime.
Immediate rollback: backup/testnet-before-owner-audio-20261020 at 53640c0,
READY deployment dpl_EKngjGTb8FFBnWE3k9eXF4xsQeZt. Older fixed refs stay fixed.
The owner-only Original/off controls and audio capture/arm/shutdown fields are
verified in delivered bundles. Detail sampling ends after 90 seconds; off stays
until route exit. No sparse extended audio capture was added. Mainnet remains
907d2a7 / dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe. API, anonymous Admin denial and all
three public Highscore hashes match the immediate pre-release check. No data,
save, account, payment or protection change occurred. A bounded new-deployment
Dashboard scan of 10 requests reports zero warning/error/fatal records. Build
identity matches exact source/tree; its aggregate workingTreeDirty flag is true.
No physical iPhone/audio-output or Whitescreen fix is proved. See the release
receipt and screenshot in docs/iphone-audio-transition-20261020. Continue records
only on the audit branch with automatic deployment disabled. Do not request
the same publication approval again; further runtime changes need their own scope.

## Owner audio diagnosis preparation, 20 October 2026, no publication

The user explicitly approved preparing the owner audio diagnosis and original/off
comparison. Keep this work isolated on the audit branch with automatic deployment
disabled. Only a server-verified Testnet owner with an armed, next-admin-preview
request may collect it or disable game audio. Original mode observes, never fixes
or truncates sounds. Off mode retires primed effects/music/card contexts and stays
off until route exit, even after the 90-second capture finishes. No HUD, artwork,
combat timing, account, purchase, reward or save change is authorized. Preserve
53640c0 and all existing release/rollback refs. The latest user-confirmed automatic
Whitescreen followed the last recorded 73-to-74 transition; that is not proof of
the initiating crash site. Missing-ended fault injection reproduces voice retention,
not an observed iPhone cause. Device sound output/native memory remain unproven.
See docs/iphone-audio-transition-20261020 for the pre-change audit and preparation
verification. Testnet/Mainnet deployment requires a separate explicit approval.

## Completed owner timing Testnet release, 20 October 2026

The user explicitly requested publication and separately approved the Dashboard
preview-then-production sequence. It is complete: official Testnet is READY
production deployment dpl_EKngjGTb8FFBnWE3k9eXF4xsQeZt, exact runtime commit
53640c01a16c921645d05502d9e5b34f6dc6eeec, reviewed Git tree
91f1dee117d67232485a38e9e9d9d985c16338b4, released at 09:35:35.578 Europe/Vienna.
Keep codex/testnet-owner-timing-release-20261020 fixed at that runtime. Immediate
rollback is backup/testnet-before-owner-timing-20261020 at 51e59c3 and READY
dpl_BvFoZifj5ZFqEqCTEBixwfoUPpcH; both older fixed release/backup refs also remain.
The public alias, served button/capture keys and exact commit/tree identity are
verified. The build's aggregate workingTreeDirty flag is true; do not silently
reinterpret it as a clean checkout. The three public Highscore responses match
their immediate pre-release hashes, anonymous Admin remains 401, and a bounded
11-request post-release Dashboard scan shows zero warning/error/fatal records.
Mainnet remains 907d2a7 / dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe. No data reset or
account/save/payment/security mutation occurred. Continue documentation only on
this audit branch, whose automatic deployment stays disabled. Do not ask again
for this completed release approval. Device FPS/native memory and a complete
Whitescreen fix remain unproven. See the release receipt under
docs/iphone-timing-investigation-20261020/release.json.

## Remaining iPhone slowdown investigation, 20 October 2026, preparation only

The continuation explicitly forbids new Testnet/Mainnet deployments. Fresh reads
confirm official Testnet remains 51e59c3 / dpl_BvFoZifj5ZFqEqCTEBixwfoUPpcH;
the fixed release and a889d22 rollback branches must not move. The audit branch
has the same runtime plus reviewable preparation: skip an unnecessary 240x240
readback surface when a reloaded source URL already has its visual center; add
a one-shot, server-owner-gated 90-second timing capture armed/exported only in
the existing Admin report. No URL flag, public overlay, new game scheduler or
automatic ordinary-player collection. Preserve 32/50-ms request thresholds,
34-ms simulation cap, artwork, audio and all combat/account behavior. Keep
automatic deployment disabled on this branch. The owner chose the latest exit;
that run is not another unexpected crash. See
docs/iphone-timing-investigation-20261020.md for results and measurement limits.

## Completed Testnet image-lifetime release, 20 October 2026

The approved sequence below is complete. Official Testnet is READY production
deployment dpl_BvFoZifj5ZFqEqCTEBixwfoUPpcH, exact runtime source
51e59c3373a8dd4ba4985d5a9559acdcf2d6755a, reviewed tree
9a614fc69e88f6c8a55954c72131bb6df16a5798. Released at
2026-10-20T06:17:44.097Z (08:17:44 Europe/Vienna). The dashboard built the
same reviewed source in the existing Testnet Production environment (45s),
after the 47s preview build. Preserve fixed release branch
codex/testnet-image-lifetime-release-20261020 at that exact source.
Continue documentation only on the audit branch, whose automatic deployment
remains disabled. Do not ask again for this completed release authorization.

Immediate rollback is preserved by backup/testnet-before-image-lifetime-20261020
at a889d22cc9c1142f51773e073c41b0a7c8aa13d8 and READY deployment
dpl_DssUzk9j8fruG7HY7BNPUMfYZjmW. Mainnet remains dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe
at 907d2a7363345d00f0f90c54402bf04e887b64d9. Home/API/artwork checks pass;
anonymous Admin status remains 401/not_authenticated. All three public Highscore
responses match their immediate before-release hashes (2, 17 and 7 entries).
A bounded scan of 14 request records from 06:17:45.725Z to 06:19:34.103Z shows
zero warning/error/fatal console records. No account/data/save reset occurred.
See docs/image-lifetime-release-20261020/release.json and testnet-ready.jpg.
Physical iPhone native/GPU/process memory, FPS, Pi login and Whitescreen
resolution remain unverified. The next user check is targeted, not a demand
for another full manual campaign or the same already-known counters.

## Approved Testnet image-lifetime sequence, 20 October 2026

After the assistant proposed automated delayed-image checks, resource analysis,
then publishing tested corrections to Testnet with a rollback point, the user
accepted: "Und dann machen wir das. Sag mir step by step, was ich tun muss oder
ob du das allein machen kannst." Apply this approval to the reviewed changes
in paintedShip.ts only: early working-canvas release, cancellation of obsolete
preparations at asynchronous boundaries, and sharing pending source loads across
cache eviction. Thirteen native/controlled-host checks pass, including exact
RGBA preservation, failure/retry/remount cases and 1,100 preparation-plan changes.
Those are not physical iPhone memory/FPS results or a complete Whitescreen fix.
Publish only through the existing official Testnet project after preserving
a889d22 / dpl_DssUzk9j8fruG7HY7BNPUMfYZjmW as immediate rollback. Mainnet, Admin
exclusivity, accounts, saves and Highscores remain outside this change. Keep
automatic deployment disabled on the audit branch and record the actual release
receipt separately. This approval supersedes the earlier preparation-only
restriction below for this specific correction set.

## Official Testnet lifetime audit, 20 October 2026

The owner no longer has a Mac. Continue the authorized stability investigation
on exact official Testnet a889d22cc9c1142f51773e073c41b0a7c8aa13d8,
READY deployment dpl_DssUzk9j8fruG7HY7BNPUMfYZjmW, freshly verified on 20 October.
Do not import unofficial preview code or require a further full manual campaign
for the same counters. This isolated candidate releases only the painted-hull
working canvas after its PNG Blob is complete, before image load/decode. Keep
the original full decoded-byte cache accounting and exact artwork. Native RGBA,
controlled failure/cancellation and repeated-preparation checks pass; this is
not an iPhone memory/FPS result, proved crash cause or complete Whitescreen fix.
See docs/iphone-lifetime-audit-20261020.md. Keep automatic deployment disabled on
codex/iphone-lifetime-audit-20261020. No public alias/Mainnet change is authorized
for this new preparation. Preserve Admin exclusivity, saves and Highscores.

## Small turret bodies, 19 October 2026, preparation only

The user explicitly requests larger bodies on every small boss turret, with
unchanged barrels, to make them easier to hit. Start from official Testnet
f5be06d594f70f21fe9b6b6235015b819b57bb34 (local bf13968 includes its runtime
and release documentation). Enlarge only small bodies/sockets and their matching
body hit regions across all 50 bosses. Keep barrel dimensions, mount positions,
muzzles, caliber, fire/recoil/tracking, HP, points, audio, HUD and other gameplay.
Pre-bake the artwork rather than adding runtime surfaces or per-frame layers.
Do not import unofficial previews. Testnet/Mainnet aliases and Admin/data/saves/
Highscores are not authorized to change for this new preparation. Preserve the
official f5be06d release as rollback; disable automatic deployment on this branch.

## Explicit Testnet Mongo session-store release, 19 October 2026

At 22:28 Europe/Vienna the user explicitly approved the additional MongoDB
session-store correction provided saved data and Highscore lists are not deleted.
This release is complete: official Testnet is READY production deployment
dpl_7CGcYyrnLNXwkU8ychnkxfjqR198 at f5be06d594f70f21fe9b6b6235015b819b57bb34,
reviewed tree 2e030b6e43f0fe71e5cd2de410d5eb71230d7e71. Released at 20:34:14 UTC
(22:34:14 Vienna). Only local Express session-store creation is delayed until
the app is used; session options, authentication, owner Admin rules, frontend,
data/schema, saves, Highscores and payments are unchanged. Do not ask for this
same release authorization again. No deletion, migration or data reset occurred.

The before/after public legacy, V2 and career Highscore responses match exactly
(2, 17 and 8 entries respectively). Home/API/catalog checks and anonymous Admin
denial pass. A 20:36 UTC dashboard scan of 17 new-deployment request records,
including usage calls, shows no recurrence of the localhost Mongo error or
associated exit 128. This is bounded post-release verification, not an iPhone
Whitescreen or native-memory/FPS proof. Backend TypeScript and 109 tests pass.

Immediate rollback: dpl_6B1LLYF2VvuhwwjPBPhccPfQfTUM at 7cdad95, independently
preserved by backup/testnet-before-session-store-20261019 and the preceding fixed
release branch. Keep codex/testnet-session-store-release-20261019 fixed at f5be06d;
automatic deployment remains disabled on the preparation branch. Mainnet remains
dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe at 907d2a7363345d00f0f90c54402bf04e887b64d9.
See docs/testnet-session-initialization-20261019.md for release and rollback.

## Explicit official Testnet frame-audit release, 19 October 2026

The user explicitly approved publishing the reviewed frame-audit and static
destroyed-boss-weapon patch with "Ja bitte mach das." This supersedes the
preparation-only alias restriction in the following section for this release.
Release candidate: 7cdad95400becf690175af0698292a24fb0a6c21, tree
37ad25a8540d84ef862aca90f7ef7cc82f82eef2. Only the existing official
cryptoid-evolution-testnet project and its official Testnet aliases are authorized.
Mainnet and owner-only Admin authorization must remain unchanged. Do not ask for
the same release authorization again. The rollback branch
backup/testnet-before-frame-audit-20261019 was created and verified at
66eb357cc08a6b5f9b32a9242d6875ed475532fa before attempting deployment.
Its existing READY deployment is dpl_8h9mgxiRDUerhJr4PyCPTiaPQgR4.
Released on 19 October at 20:11:37 UTC (22:11:37 Vienna) through the explicitly
authorized Vercel dashboard fallback after GitHub sign-in. At that release the
official Testnet alias resolved to READY production deployment
dpl_6B1LLYF2VvuhwwjPBPhccPfQfTUM, exact source 7cdad95400becf690175af0698292a24fb0a6c21.
The fixed release branch codex/testnet-frame-audit-release-20261019 points to that
exact commit; keep it fixed. Continue records on the audit branch, whose automatic
deployment stays disabled. Mainnet remains dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe at
907d2a7363345d00f0f90c54402bf04e887b64d9. The previous 403 integration blocker
remains an integration limitation, but no longer blocks this completed release.
Post-release smoke checks passed for Home, API root and anonymous Admin denial.
Dashboard runtime logs additionally showed a MongoDB connection refusal and
Node.js exit 128 after successful proxy responses; preserve this unresolved
server finding separately, without claiming a link to the iPhone Whitescreen.
See docs/official-testnet-frame-audit-release-20261019.md for receipt and rollback.
Do not claim an iPhone FPS gain or a complete Whitescreen fix.


## Official Testnet source only, 19 October 2026, continued frame audit

The user explicitly required using only the currently official Testnet and
excluding the unofficial test games. The verified official deployment is
dpl_8h9mgxiRDUerhJr4PyCPTiaPQgR4, source
66eb357cc08a6b5f9b32a9242d6875ed475532fa, tree
cec8743f06146e3b2e1d292219917e9ff24dae8d. This supersedes older
baseline pointers below for this continuation. Local transfer 92f392e has
the same complete tree. Start the isolated frame audit directly from that tree;
do not import unofficial preview commits, gameplay/UI changes or test scaffolds.
The user found no visible benefit in the HUD-blur comparison; do not describe
blur removal as the solution. Preserve the official HUD, visuals, timing,
simulation, input, audio, login, accounts, rewards and owner-only Admin access.
Limit this candidate to demonstrably redundant per-render initialization and
unchanged presentation reconstruction. The supplied 20:09 iPhone video also
authorizes investigating the ongoing boss-7 fight: preserve the existing weapon
canvas pixels after every turret is destroyed, invalidating on geometry,
texture/config changes, context loss/restoration and any failed draw. Keep live
guns, heat, recoil, reactor, escorts and every combat rule unchanged. No further full campaign replay should
be required merely to collect the same known counters. The iPhone restart and
slowdown remain unresolved device findings; host tests cannot prove iPhone FPS
or native/GPU/process memory behavior. Prepare and preserve a reviewed isolated
result; this continuation does not authorize another preview game or a public
Testnet/Mainnet alias change. Keep automatic Vercel deployment disabled for the
candidate branch while preserving its source.

## Explicit owner-only V4 Testnet release, 19 October 2026

The user explicitly authorized "V4 ins Testnet, nur Admin." Release the tested
iPhone resource-trend diagnosis v4 only to the existing official Testnet alias.
The periodic resource sampler must run only for a server-verified canAdmin owner
session and remain visible/exportable only inside the existing owner Admin
diagnostics view. Ordinary players must not receive the new sampler, UI, hints
or export access. Preserve gameplay, visuals, audio, Pi login, payments, saves,
difficulty and recovery semantics. Mainnet is excluded. Create a rollback branch
to the current official Testnet source before moving the Testnet alias.

## iPhone resource trend diagnosis v4 preparation, 19 October 2026

The user authorized preparation with "Gut dann bereite das vor bitte" after a new iPhone
run again ended abruptly during boss 20 while the last visible frame remained healthy.
Prepare an isolated owner-only diagnostic extension that samples the already bounded
resource counters during active visible play, including normal levels and boss fights,
so a full run from level 1 can reveal cumulative growth before a hard WebView exit.
Use a low-frequency interval (about 10 seconds), a separate bounded local ring buffer,
and an owner-only Admin export. Do not change gameplay, visuals, audio, Pi login,
payments, saves, difficulty or recovery semantics. Do not enable the new sampler for
ordinary players.


## Explicit owner-only Testnet diagnosis release, 18 October 2026

The user explicitly authorized "ins testnet, nur in meinen Admin bereich".
Release the tested reload-diagnosis v2 only to the existing official Testnet.
The extended collector must run only for a server-verified canAdmin owner
session; ordinary players keep the previous runtime path and receive no new
diagnostic listeners, UI, hints or export access. The report remains only under
the existing owner-only Admin diagnostics view. Do not change Pi login,
payments, gameplay, visuals, audio, progression, saves or Mainnet. Create a
rollback reference to the current official Testnet source before promotion.

## Reload diagnosis v2, 18 October 2026, 18:41 Vienna

The user explicitly authorized the next isolated diagnostic step with "mach das bitte"
after clarifying that the short Loading screen completes normally and returns to Home.
Treat the symptom as an unexpected app/WebView reload during active play, especially
boss fights and transitions; do not describe Loading itself as hung. Add bounded local
evidence for app boot/reload, JavaScript and promise faults, foreground main-thread
gaps, page lifecycle, WebGL/Canvas context loss, and the final boss/turret/reactor/timer
state. Keep only a roughly 60-second owner-exportable technical window and do not
store account, purchase, score, shard, raw error-message or stack data. Preserve all
gameplay, visuals, audio, Pi/login/purchase behavior and recovery semantics. This work
is authorized only on the isolated branch/preview; do not move the public Testnet
alias or Mainnet without a separate explicit release instruction.

## Privacy correction, 18 October 2026, 16:52 Vienna

The user clarified: "es soll nur für mich sichtbar sein, ohne dass andere
spieler es mitbekommen". This supersedes the standalone public-export scope
below. The public alias was rolled back to bb23a8b immediately. Remove the
standalone export files and redirect their old routes home. Put the read-only
report inside the existing owner-only AdminPage, using the existing verified
server UID binding and a fresh /admin/status check before reading or copying.
No new menu, hint, telemetry or behavior for ordinary players. Release this
privacy correction to the existing official Testnet only; no Mainnet release.
The underlying Whitescreen remains unresolved pending actual device evidence.

## Explicit diagnostic-export release, 18 October 2026, 16:50 Vienna

The user approved the prepared read-only stability export with "okay" after
reviewing its preview and scope. Release tested source f67ad68c243f95762c96c3e9fa1f87c1019d7376
to the existing official Testnet only. This adds /stability-report.html and its
standalone module; game source, visuals, cadence, audio, accounts and saves stay
unchanged. Read existing technical records only; no automatic transmission or
storage mutation. The Whitescreen remains unproved and unresolved. Mainnet is
excluded. Backup: backup/testnet-before-stability-export-20261018 at bb23a8b.

## Explicit Testnet follow-up release, 18 October 2026, 16:03 Vienna

After the known Canvas allocation correction and original-display recovery were
tested in preview, the user explicitly requested "aktualisieren bitte". Release
the tested commit bb23a8b48bce4a19c707170458e3ed94e3e4cdfc only to the existing
official Testnet project. Keep all artwork, draw geometry, source resolution,
timing, audio, balance, input and account behavior. The complete Whitescreen
before boss 2 remains unproven and must not be described as fixed. Mainnet is
not authorized. Backup: backup/testnet-before-canvas-reuse-20261018 at b71d368.

## Explicit Testnet renderer release, 18 October 2026

After completed Pi v9/v10/v11 device tests, the user authorized applying the
tested ordinary-explosion Canvas renderer to the official Testnet, conditional
on preserving the game's appearance. Release only this renderer integration
from public Testnet commit 27d174788327c3423f04ace32be61af67a2004cc.
Keep original fire/smoke artwork, full-resolution hulls, fragment counts and
trajectories, timing, HUD, input, sound, balance and account behavior. Retain
the original DOM fallback. Diagnostic pilots, weakened enemies, controlled
lives and automatic boss transitions are excluded. Mainnet is not authorized.
Backup: backup/testnet-before-canvas-20261018 at the preceding Testnet commit.

## Additional explicit scope, 16 October 2026

The user authorized releases only to the existing public Testnet project, not
the separate main app. At 20:44 Europe/Vienna the user confirmed restored music
and sound effects, requested a visually closer shield ring, then continuation
of the slowdown tests. Only the two shield-ring insets may change for that
visual request; shield protection, timers, hitboxes, hull size and all other
appearance stay unchanged. Continued slowdown remains an open device finding.

## Explicit feedback scope, 15 October 2026, 20:26–20:29 Vienna

The user authorizes isolated fixes for flame-before-hull/late hull appearance,
remaining technical slowdowns, false boss contact below the rendered hull and
around its descent, and floating power-ups appearing without a defeated carrier.
Keep existing drop probabilities, durations, movement paths/speeds, sizes, HUD,
styles and loaded artwork. Tie the existing opening benefit to the next safe
lethal enemy hit; never spawn it from a clock alone. Fix developer report export
so unavailable Web Storage cannot silently produce an empty report. Full loss of
input after a boss was reported; do not claim that freeze reproduced or fixed
without evidence. Public Testnet/Mainnet remain untouched; only the existing
private diagnosis preview is authorized for updating.


The user confirmed IMG_5288.jpeg on 12 October 2026 as the original visual reference. This task authorizes stability fixes only.

Explicit movement correction requested on 12 October after testing: resting normal Testnet enemies should slowly sway back and forth, including restored formations; keep the existing sway amplitude/rhythm, and make normal formation arrivals 10% longer. This narrow authorization supersedes the frozen-motion rule below for these two corrections only. Boss escorts, attack paths, weapons, HUD, markers, sounds and Mainnet retain their prior behavior.

- Do not change the appearance or layout of any game page, menu, header, ship, weapon, explosion, background, card or control.
- Keep the compact original HUD: Home, hearts, Level, Shards above Score in the center, Block, Pause, all in one row. Do not enlarge the occupied game area.
- Enemy positioning markers remain invisible. Preserve all existing entry, attack, regroup and sector formations.
- Keep the current official simulation timing, mobile paint behavior, damage, weapons, power-up timers, speed, difficulty, rewards, economy and recovery semantics.
- Do not change sounds, music, samples, pitch, volume or truncate simultaneous effects. Resource cleanup may release nodes after they finish or during the existing pause/close lifecycle.
- Limit changes to resource lifetime, redundant work, controlled error recovery and bounded diagnostics. No new visual quality governor or particle/texture/explosion reductions.
- The approved Testnet baseline is codex/testnet-campaign-variety-20261011 at 21eb4b2151b9e5cb5b1f32f3e78d666bb860fdb1, not main at 907d2a7. Preserve its compact hudDepth.css, hidden Testnet marker DOM, fast combatTiming, formations, retained falling pickups, class sounds and existing boss budget. Apply stability corrections to this baseline.
- Isolated previews must use the approved production styles without a separate HUD or marker override. Restore the original fonts. Account/API/purchase/durable-reward isolation is test scaffolding only.
- No main merge, Testnet or game production deployment without the user's explicit release instruction.
