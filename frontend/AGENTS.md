# Preserve the officially approved game

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
