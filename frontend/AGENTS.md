# Explicit purchased-ship selection, 27 October 2026

The owner's newest instruction supersedes automatic equip after acquisition:
show Select after buying, and mark Equipped only after confirmed hull/color/stage
selection. Base is actual shared GitHub/public1d80051 (PR190). Standard purchases
now leave selection intact; Advanced/Elite checkout retains ownership/cards but
removes auto-selection. Allow any owned stage, with an optional versioned account
shipStage, paid prerequisite/network validation and the server-confirmed stage
on start. Legacy highest-owned gameplay remains compatible until first explicit
selection; the UI offers Select until then. Actual verified useAuth identity now
decides guest/account loading and restart: a valid restored token without the
local marker previously started a Standard guest while Shop claimed Elite.
Resume preserves mission data and caps, never refills, saved projectile protection.
Original art/first-two sprite mapping, permanent Elite strengthened twin/2 hits,
Advanced twin/1 hit, clocks/charges/receipts, HUD/ships/flight/combat/economy/audio,
manual confirmed Continue, readable once-only binary feedback and terminal sleep
remain. No new loop/timer/observer/art, migration, free grant or real payment.
The shop now links directly to Ships, Weapons and Power-ups via the existing
views/translated labels and purchase controls. Three static44px-minimum controls
stay visible; changing category resets the content scroll without a purchase
or loadout mutation. Existing catalog/payment/network gates stay intact.
Only fixed exact hunks restore the entire published GamePage b5574344... and one
account-save type line before the unchanged historical fingerprints.141 backend,
430 frontend release/locales/types/Vite, eight extra module cases,32 native
selection,74 repeated full-flow and11 Game Over checks pass. Two pinned-UI control
scenarios reproduce the old mismatch. GamePage62 errors/four warnings and Shop5
remain pinned lint findings; no whole-project lint-clean/physical heat/FPS/font/
White Screen claim.1740 painted variants keep the same encoded byte sizes.
See matching docs and verification/ship-stage-selection-20261027, including fixture
exclusions. Do not commit raw owner/order data, attached images or machine caches.
The already authorized shared release to both existing projects proceeds via main
once, then actual READY/source/public commit/tree/bundles/new and retained guards.
Keep work and receipt refs auto-deploy-disabled; do not merge receipt refs.
Preserve1d80051 and READY TestnetAMEhBjnbthidFesbHrzAQJziWxYF /
production2GmV8T6UCwfW3TCR2G7MvSD3Bf1P plus older backups. Networks/accounts/payments
stay separate. No reset, secrets/protection/runtime logs, unrelated PR167/168,
manual duplicate builds or automatic selection on the owner's real account.

# Owner Testnet catalog and earned unlocks, 27 October 2026

The owner now explicitly requests all purchase options before Mainnet, using
Test-Pi only, and all ships unlocked through normal play/acquisition rather than
free grants. This supersedes the earlier catalog/backend freeze only for this
feature. Keep verified UID authorization and use normal saved gameplay outside
Admin preview. All20 Standard hulls retain earned-Shard prices; all51 Pi offers
retain prices, verified approval/completion, Advanced-before-Elite and armor
prerequisites. Base hull ownership is also required. New owner Testnet orders
cannot become Mainnet inventory, loadout, armor, upgrades or consumables.
Other players retain existing limits. Cards still require purchased hull/stage
or an earned boss victory; never auto-grant inventory, Shards or wins.
Only three exact GamePage permission arguments change; restore them before all
historical scope fingerprints. Preserve manual Continue, true pauses/Resume,
45-second charges/Auto/receipt replay, original art/audio/HUD/rendering and all
save/reward validation. See docs/owner-testnet-catalog-20261027 and verification.
135 backend cases,426 frontend release cases/types/Vite/locales and18 native
local UI/handler checks pass using isolated payment/database fixtures. No live
wallet transaction, physical Pi Browser or font-pixel equivalence is claimed.
Candidate automatic deployment stays off; the existing reviewed same-source
publication authorization to both projects applies because Testnet uses the
production payment backend. Preserve c2d1596 and its READY deployments. No
reset/migration, real payment, credential/protection/runtime-log changes or
unrelated PR167/168. Do not upload the raw owner stability report.

# Once-only binary feedback and readable warnings, 27 October 2026

The owner's latest instructions require expiry feedback in just the first binary
window after a real expiry, longer reinforcement/comparable notices, and visible
reload feedback. Base is actual GitHub/shared public c7811d0 / treea21aa5c. Clear
shown feedback at the actual next-flight boundary, including an entry cleared
before formation becomes active; pending/unseen feedback and manual/technical
pauses retain their existing rules. Keep red passive binary-only placement,
actual stage-correct fallback names and original shop marks, with no buy action.
Automatic reload now shows actual pending/confirmed/failed status within that
same one window; a late reply cannot recreate consumed feedback. Reinforcement
gets4800ms of protected phase time, calm finite keyed opacity and frozen pause/
Resume clocks; Reduced Motion is static. Three comparable goal/clear/drop notice
lifetimes become4800ms. Flight entry/gap/attacks/geometry/economy stay unchanged;
extra reading consumes no active equipment, and the event clock retains only
its released550/850ms intro allowance. No new timer/observer/RAF/loop/art.
Only fixed exact controller hunks restore the entire public GamePage SHA256
eb219ac8306919d27008dd7929fce871eff0e1b2df0d682ee518d3a23394e782
before all older fingerprints; no generic normalization. Preserve terminal sleep,
finite graphics, explicit restart, confirmed manual Continue without a read timer,
>2500ms/500ms/manual technical Resume, all resource/raster/auth/save/receipt guards
and the2:1 Home Play/Shop row. See docs and verification/quiet-readable-feedback-
20261027 for actual acceptance and exclusions.416 release tests/locales/types/
Vite pass, plus repeated native feedback/full-flow/Game Over receipts. Current
GamePage lint remains the pinned62 errors/four warnings, small modules clean;
no full-project lint-clean, backend127 rerun or physical heat/FPS/White Screen
claim. Backend source stays byte-identical. Keep working/evidence refs auto-
deploy-disabled; reviewed same-source publication to both existing projects is
already authorized via main, then actual READY/source/public bundles/commit/tree
and prior guard checks. Preserve c7811d0 and READY Testnet4nYG31Dn9u22Fe78rhC5FX2Yay2i /
production51UKRCrDEbL6Jsfo91LEeun2EWk1 plus older backups, separate networks/
accounts/payments. No duplicate manual builds, PR167/168, reset/migration, live
purchases, secret/protection/runtime-log changes.

# Paired Play/Shop home actions, 27 October 2026

Owner requests shortened Play with an adjacent Shop button, same original height,
Shop half Play width and comfortable spacing. The home-only2:1 grid keeps58px
narrow/72px desktop height and16–22px gap; Play label/gap adapt to fit. Shop uses
the existing translated label, busy guard and openQuickAction('shop') catalogue.
Existing close/paused-home/auth/purchase gates and all other home areas remain.
No new timer/state/animation/asset/observer/RAF, fullscreen behavior, account or
gameplay change. GamePage and original art/network effects stay byte-identical;
whole Shop restores after removing only the new callback.412 release cases/
locales/types/Vite,25 separate existing Home/Galaxy cases and171 native checks in
26 same-locale/account/viewport comparisons pass, including all19 languages,
320–1363px/landscape, exact ratio/heights/gap, no overflow, existing shop open/
close/no purchase/auth, keyboard order and Play navigation. First German/French
baseline-cache mismatch is excluded. CinematicHome lint0+0 and Shop5 old errors
match pinned baselines; no whole-project lint-clean claim. Prior full-game/native
Game Over/backend127 remain baseline, not repeated or physical heat/White Screen
acceptance. See docs and verification/home-play-shop-20261027. Candidate auto-
deploy off; reviewed same-source publication to both existing projects remains
authorized via main, then actual READY/source/public bundles/commit/tree/paired
home actions and prior guards. Preserve a718b4c and READY Testnet8GQBDCPE6uUKWBNF1g7try8s5Jia /
productionHu6VY49RQoW9TFnnjhfPagrMUwqv, older backups and separate networks/
accounts/payments. Keep manual confirmed Continue, strict >2500ms/500ms/manual
technical Resume. No duplicates, PR167/168, reset/migration, real purchases,
secrets/protection/runtime logs; receipt refs must also be auto-deploy-disabled.

# Shop symbols beside the red binary notice, 27 October 2026

The owner additionally requests the existing shop symbol alongside the shot name.
Reuse the exact shop marksⅠ–Ⅴ through one shared static weaponSymbols array,
leaving shop output identical. Add compact aria-hidden marks to expired/current
names, with numeric props matching the HUD's stage-correct effective level. Keep
red expiry copy, binary-only lifetime/position/animation, centered-title deferral,
pauses/manual Resume and absence of purchase actions. No new art/preview load,
animation/state/timer/observer/RAF, backend/combat/economy/save/audio/HUD change.
Only exact symbol-prop restoration recovers the entire public f596413 controller
before all older guards. See docs and verification/binary-weapon-symbol-20261027.
412 frontend release cases/locales/types/Vite and126 native UI/real-handler checks
pass, including actual shop-DOM symbol matching across eight scenarios.
GamePage62 errors/four warnings and MissionWeaponShop3 errors remain pinned
baseline findings, not repaired or lint-clean. Prior full-flow74/Game Over11 and
backend127 remain baseline, not newly repeated for this presentation change.
Physical-device/heat/FPS/White Screen acceptance is not claimed. Keep work branch
auto-deploy off; reviewed same-source publication to both existing projects is
still authorized via main, then actual READY and public commit/tree/bundle/new-
symbol/prior-guard checks. Preserve f596413 and READY Testnet2rHmD4diydHECvwzmrRFbSbgJw5Z /
productionBKvtNeoh28sumnisiTD4T2eBdFNp, older backups, separate networks/accounts/
payments, manual confirmed Continue and strict >2500ms/500ms/manual technical
Resume. No duplicates, PR167/168, reset/migration, real purchases, secrets/
protection/runtime logs; evidence refs must not deploy.

# Quiet red weapon feedback in the binary pause, 27 October 2026

The owner's later screenshot/clarifications supersede PR185's intrusive combat
popup and buy action. Show the expired shot and actual current fallback in
lighter red only inside the existing formation binary-code window, for example
`Dreifach · abgelaufen → Standard`. No button, buy prompt, separate reading timer,
new animation/observer or pause extension. For an unchanged effective shot type,
show its current name without falsely claiming it is unavailable. Existing stage-
correct HUD names are reused; Expired is translated for all19 selectable locales.
The unchanged binary rows keep their native animation behind a static sibling
label in their118px band. Both share the existing playing/normal/not-started/
intro-entry-formation predicate. A centered level title keeps its space; defer
the pending label until that title leaves while the binary window continues.
Queue only real selected expiry; clear after its first shown window ends, manual
weapon-menu entry or restart. Manual/technical pauses preserve the pending record
and obey the original code visibility/manual Resume. Remove the obsolete combat
reload/error popups, display state/timeout and unused observer; original menu
errors/retry/receipts and every actual activation/fallback/Auto/stock rule stay.
Only exact replacements restore all public0ae1555 controller bytes before old
fingerprints. Keep HUD/art/ships/geometry/audio/combat/save/economy/auth, equipment
transition-clock protection, readable titles, terminal sleep, confirmed manual
Continue and strict >2500ms/500ms/explicit technical Resume. See docs and matching
verification/binary-weapon-label-20261027 for final checks and exclusions.
412 frontend release tests/locales/types/Vite,118 notice,74 full-flow and11 Game
Over native checks pass. GamePage retains the baseline62 errors/four warnings
with identical message multisets; smaller changed modules are clean. No
physical-device/heat/White Screen or full backend127 rerun claim. Work branch
auto-deploy off; reviewed same-source publication to both existing projects
remains explicitly authorized. Preserve0ae1555 and READY TestnetGS7qtHJmjCcUsKnVMCzpxaCyUoHE /
productionG2inPaHpEa9Tic6ibhGXSfSfD2ud; keep networks/accounts/payments separate.
No duplicate manual builds, PR167/168, reset/migration, live purchases, secret/
protection/runtime-log access. Verify actual READY source and both public aliases;
publication receipts go to an auto-deploy-disabled evidence ref.

# Readable purchased-weapon notices, 27 October 2026

The owner's latest instruction requests a red spent-shot notice and more visible,
longer messages specifically for purchased weapons, without covering other text.
Base is shared public 22842bb/PR184. New transient selected-charge/pickup expiry
notice names the expired weapon, lasts 8000ms of visible active combat and opens
only the existing manual weapon menu. It preserves reading time while paused,
in transitions/countdowns or without safe display space; menu/restart dismiss it.
Existing Auto stock rules and fallback stay unchanged; successful Auto uses the
existing reload message. Existing reload/error timeout becomes 6000ms. Larger red
contrast notice reserves HUD, transition/combo/pickup text and side controls via
one finite mounted ResizeObserver; no new RAF/interval/timeout/animation. All19
languages have new copy. No automatic buying, reward, charge debit or game Resume.
Exact controller restoration recovers full 22842bb SHA256 before historical guards.
413 frontend release cases/locales/types/Vite, 77 notice, 74 full-flow and11 Game
Over native Chromium141 checks pass. Current resolved baseline/candidate GamePage
both retain62 errors/four warnings with identical message multisets; smaller
changed runtime modules clean. Earlier ref-view run is excluded; no lint-clean,
physical-device, heat or White Screen cure claim, backend127 remains prior evidence.
Keep readable titles, manual confirmed Continue, terminal sleep, original art,
HUD/fonts elsewhere, equipment/combat/economy/save/audio/auth and strict >2500ms/
500ms/explicit technical Resume. No PR167/168, reset/migration, live purchases,
secrets/protection/runtime logs. Preserve 22842bb and READY Testnet4yg2wdBGggVeXwdYA1soaZ58X9tx /
production BYMuqaz5gacx4vT67h2kJJGUtnsP. Work branch auto-deploy off; reviewed same-
source publication to both existing projects remains explicitly authorized. Let
main deploy once; verify actual READY commits and public bundles/commit/tree/new
feedback/prior guards, keeping separate networks/accounts/payments. See docs and
verification/ammunition-spent-notice-20261027; evidence-only refs must not deploy.

# Readable transitions and retained Game Over sleep, 27 October 2026

The owner's latest instruction explicitly extends PR184's game-over candidate
97fdd92 with readable middle-field titles and same-source publication to both
existing projects. Normal level/block and bonus intro = 4800ms, variety block
clear = 5200ms, legacy clear remains 8500ms, boss warning remains 4900ms with
matching native opacity duration. Five exact GamePage edits restore the full
97fdd92 SHA256 before all historical fingerprints. New native animation stays
mounted/frozen through manual/technical pauses and the explicit Resume countdown;
Reduced Motion remains static. Boss-defeated title stays for the existing heart
interaction. No new RAF/timer/endless effect or font/HUD/ship/art/layout change.
Keep actual 550/850ms reinforcement lead-ins and flight/boss timing; additional
reading does not advance the variety drop/rock clock or active equipment clocks.
Common completion retains its freely operated confirmed Continue, no reading
countdown/automatic continuation/reward. Terminal game-over sleep, finite native
explosion, restart/Home and strict >2500ms/500ms/explicit technical Resume stay.
406 frontend release cases/localization/types/Vite and 74 actual-flow native
checks pass; targeted title and retained Game Over checks are recorded in
verification/readable-transitions-20261027. Current GamePage lint messages match
the pinned candidate (0 errors/four warnings); historical62+4 are not fixed and
no whole-project lint-clean claim. Backend127 is baseline, not rerun. Excluded
test clock/fixture failures stay excluded. Preserve 09a6a40 and READY Testnet
5WzvAtXq4aNoXCj6DXwnFDcAKZX7 / production CXKVFwjsoiCFdLRZBUdeKqBGNR2h.
Reviewed publication is explicitly authorized; no repeated approval. Keep work
branch auto-deploy off through review, let main trigger both existing projects,
then verify actual READY source and public bundles/commit/tree/prior guards.
Separate networks/account/payment remain; no PR167/168, reset/migration, secrets,
protection/runtime logs or claimed White Screen/physical heat cure. See
docs/readable-transitions-20261027 and verification/readable-transitions-20261027.

# Terminal Game Over loop, 27 October 2026

Continue smartphone efficiency from shared public 09a6a40/PR183. A finished player
explosion remains in terminal state records, keeping the game loop awake after
its native DOM has ended. One exact GamePage sleep predicate now includes only
game-over; destruction reveal and resumable paused-effect clocks keep their old
policy. Never broaden this to all non-playing states. Four added cases execute
the actual predicate/guarded/shared schedulers and restore the entire controller
to the preceding SHA256; historical fingerprints chain that exact restoration.
397 frontend cases/localization/types/Vite pass. Targeted real GamePage/handler
WPE26.5 has eleven checks: native explosion completes independently, zero game
steps over five settled terminal seconds, explicit Play Again wakes a healthy
game, modal Home exits cleanly. Pinned released control measured 300 steps in
the same interval; eight checks completed before an incorrect hidden-header Home
selector, so no complete baseline UI pass is claimed. Initial native CSS/test-
clock assumption is also excluded. Lint messages match pinned baseline under
current tools (0+4); historical 62+4 remain historical, not claimed fixed. Backend
127 acceptance is baseline, not rerun. All other runtime sources, art/CSS/HUD,
audio, save/economy/auth, standard pixels, strict >2500ms/500ms watchdog and
explicit technical Resume stay unchanged. No temperature/battery or White Screen
cure claim. Preserve 09a6a40 at backup/shared-before-game-over-idle-20261027 and
READY Testnet 5WzvAtXq4aNoXCj6DXwnFDcAKZX7 / production CXKVFwjsoiCFdLRZBUdeKqBGNR2h.
Candidate automatic deployment is disabled; reviewed same-source release to both
existing projects remains authorized, with separate networks/account/payment.
No new owner campaign, PR167/168, reset/migration, secrets/protection/runtime logs.
See docs/game-over-idle-20261027 and verification/game-over-idle-20261027.

# Unused projectile scene copies, 27 October 2026

Continue owner-requested smartphone efficiency from shared public 9d0ac5b/PR182.
One GamePage publisher statement omits two unused shots/enemyShots array copies;
the direct presenter, live simulation and all rendered-list/boss copies remain.
No game.shots/enemyShots display consumers exist. Restore only this exact statement
before historical controller fingerprints. 393 frontend cases/types/Vite pass;
real GamePage/handler WPE26.5 has 74 local checks, including nonempty player/hostile
movement, four-second manual pauses, boss/bonus/summary/Continue, save failure/Retry
and campaign end. 600 synthetic publications avoid 1200 copies/103200 traversed
entries, not measured whole CPU/GC/temperature. Current resolved lint gives the
same zero errors/four warnings on pinned baseline and candidate; historical 62+4
is retained, not claimed fixed. Do not call GamePage/project lint-clean. Backend
types compile; full127-suite result is baseline, not rerun. Pixel standard, art,
CSS/HUD, audio, economy/saves, strict >2500ms/500ms pauses and explicit technical
Resume remain. Keep prior 9d0ac5b at backup/shared-before-projectile-scene-copy-20261027
with READY Testnet FSG9xyeLKEgKGkGbKgRNjcPjq2jq / production BPscxQrsQfPF8WJk3nHtP12Yd5tt.
Candidate auto-deploy off; reviewed same-source release to both existing projects
remains authorized with separate networks/account/payment. No new owner campaign,
PR167/168, reset/migration, secrets/protection/runtime logs or White Screen cure.
See docs/projectile-scene-copy-20261027 and verification/projectile-scene-copy-20261027.

# Playable standard raster, 27 October 2026

The owner now explicitly accepts ordinary playable graphics instead of unnecessary
Full HD detail. This supersedes only the earlier 1.5 density requirement. Standard
gameRenderScale caps effect/boss weapon canvases at one pixel per CSS point; rocks
share that helper. Preserve HUD/text, source art, CSS sizes/backgrounds, all counts,
60-Hz target, simulation/scene pacing, audio, controls, saves and existing cleanup.
No quality menu, timer, auto quality switch or art removal. 390 frontend release
cases/types/Vite pass; WPE26.5 has 48 checks/156 exact RGBA pairs at the NEW density,
not equality to former 1.5 pixels. Affected destinations use about 44.4% of their
old pixel count; no total-memory, energy or physical-temperature claim. Both edited
runtime modules lint clean; unchanged GamePage remains 62 errors/four warnings,
CanvasEffects 21 old errors. Backend 127 acceptance is baseline, not rerun. See
docs/standard-resolution-20261027 and verification/standard-resolution-20261027,
including excluded fixture attempts. Keep strict >2500ms/500ms pauses and explicit
technical Resume. Preserve 7433e56/PR181 and READY Testnet 8ppgy7riyzw1jqBqa1ThFYMhjikM /
production Ab5qAoajYxjCUu8iZ1z2PN9unbCU at backup/shared-before-standard-resolution-20261027.
Candidate auto-deploy off; same reviewed source to both existing projects remains
authorized, with separate networks/account/payment. No long owner campaign, PR167/
168, reset/migration, secrets/protection/runtime logs or claimed White Screen cure.

# Ordinary explosion outline reuse, 27 October 2026

Continue owner-requested smartphone optimization from public 3588ff2/PR180.
Each existing ordinary-impact draw record prepares fixed native fragment paths
once and clips them under the same original per-frame transforms. No global
cache/image/surface/RAF/timer/request or quality/cadence change. Missing/failed
Path2D preparation uses the complete original polygon fallback; context loss
still restores DOM and releases existing resources. Keep all lifetime guards.
386 frontend release cases/types/Vite, 275 CPU-raster pairs and nine native WPE
checks including 36 exact RGBA pairs pass. Sample frame-time path commands 1640->0
with 164 clips retained. This is not whole-CPU/energy or physical heat proof.
CanvasEffects retains 21 old lint errors; helper clean. GamePage remains unchanged
at 62 errors/four warnings, with controller/audio/save/loop/CSS/backend unchanged.
Backend 127 acceptance is baseline, not a rerun. The Home cutout reuse experiment
failed one of twelve image comparisons and is rejected; original Home is restored.
Do not repeat it as an accepted change. Preserve public 3588ff2 and READY Testnet
Esrjvchy43uW9hva84trp2B3BYXY / production CuaDcrdz9uuZJtuYKAtVSc8kNrzc at
backup/shared-before-effect-paths-20261027. Candidate auto-deploy disabled; reviewed
same-source release to both existing projects remains authorized. Keep separate
networks/account/payment, strict >2500ms/500ms pauses and explicit technical Resume.
No new owner campaign, PR167/168, reset/migration, secrets/protection/runtime logs.
See docs/effect-path-reuse-20261027 and native evidence. White Screen stays open.

# Smartphone redundant-work reduction, 27 October 2026

Owner requests less smartphone heating. Start from public f7197d6/PR179, retain
all previous corrections. Sleep only inactive empty-effect game loops, preserve
paused effect/destruction clocks, strict >2500ms/500ms watchdog and explicit
technical Resume. UI commits wake immediately; existing watcher never changes
play state. Cache live projectile appearance values and Home ship-width measures;
static reduced-motion Home sleeps with event-based preference/resize recovery.
No quality reduction, new FPS setting, art/CSS/HUD/sound/economy/backend/save change.
381 frontend gates/types/Vite, 127 backend cases/types, 14 pinned native controls,
16 candidate work/DOM cases and 58 actual-game checks pass. GamePage remains 62
lint errors/four warnings, no added findings; exact wiring restores before old
fingerprints. Local operation counts are not physical temperature/energy/FPS or
White Screen acceptance. Preserve f7197d6 at backup/shared-before-smartphone-work-20261027
and READY Testnet GwYCnFbzgQQgaskq2Xf3TX9Eysgu / production 52LJsvsvfFMaCnZgN3g1D3j1fJqb.
Candidate auto-deploy off; reviewed same-source release to both existing projects
remains authorized. No new owner campaign, PR167/168, reset/migration, secrets,
protection or runtime-log access. See docs/smartphone-work-20261027.

# Cockpit indicators and forty-five-second charges, 26 October 2026

Continue from common public dbed249/PR178; retain its prepared-resource reuse.
Owner requests visible-hull centering at secure access, ordinary bars beyond the
longest plumes (all boss bars unchanged), sequential CSS preparation stripes,
shorter armed weapon-menu return and longer red reload text without overlapping
upper labels. New charges explicitly become 45 seconds, including descriptions.
Auto-reload settings stay: off means one charge; on uses owned stock until off/
empty. No automatic purchase, migration or reset. Older confirmed 60s timers stay
valid across receipt replay/resume. Pickup/power-up durations/prices remain.
Only armed non-technical weapon-menu return uses 500ms steps; ordinary/technical
Resume stays 1000ms. Automatic server activation has no artificial delay to halve;
confirmation and save guards remain mandatory. Reload feedback lasts 3000ms.
No additional frame loop/timer/image work; temporary notice observer ends on exit.
See docs/cockpit-indicator-spacing-20261026 and native/handler evidence. GamePage
keeps its old 62 lint errors/four warnings; exact reviewed changes restore before
strict fingerprints. Boss indicators, fleet/art, HUD, audio, rewards, strict
>2500ms/500ms pauses/manual Resume and project separation stay intact. White Screen
and physical Pi stability remain unproved; raw screenshots stay private. No PR167/
168, secret/runtime-log/protection changes or repeat long owner campaign.
Candidate auto-deploy is disabled; reviewed publication to both existing projects
is still authorized. Preserve dbed249 and its READY Testnet CeVMgcLoAg69U4wNMFWWY4i3ni4h /
production HPsKkS4ivMqst5rkRTheW9Jb6FSR at backup/shared-before-cockpit-feedback-20261026.

# Prepared resource reuse and pending artwork sharing, 26 October 2026

Continue from common public bd23bd4/PR177. The owner asks to fix the reproduced
six-original reload at Continue and find equivalent redundant preparation across
the game. Reuse only exact ready color/stage plans, retaining missing/boss loads,
seven-source cap, serial readiness and incoming pins before outgoing release.
Known player centers need no original reload after eviction/remount. Share only
pending card-image originals across colors/resolutions; no new completed-image
cache, artwork/effect/audio budget or visual change. Failures must remain retryable.
Other image/texture/audio caches were audited; existing coalescing is retained.
See docs/continue-hull-prefetch-20261026 and verification/continue-hull-prefetch.
348 normal release cases/types/Vite pass; native controls and candidate show
6->0 Continue, 1->0 remount and 8->1 gallery source jobs with identical pixels.
GamePage remains unchanged (62 lint errors/four warnings); paintedShip retains
one old lint error. White Screen/native cause and physical Pi stability remain
unproved. Raw owner reports stay private; no repeat long owner campaign.
Preserve all save/economy/real-pause/manual-Resume and strict >2500ms/500ms rules,
original art/audio/HUD/boss indicators, separate project environments; no reset,
PR167/168, secrets/runtime logs or protection changes. Candidate auto-deploy is off.
Same reviewed source publication to both projects stays authorized; preserve
bd23bd4 at backup/shared-before-resource-reuse-20261026 and prior READY deployments.

# Ship indicators and free manual completion, 26 October 2026

Owner requests ordinary enemy bars at half width/height, closer and centered on
visible original hulls; calibrated main drive outlets and common plume appearance
across all 20 models/three stages; completion Continue without the ten-second wait.
The later clarification keeps ALL boss damage indicators unchanged. It supersedes
only the earlier mandatory reader timer. Save/effect confirmation remains required;
no auto-Continue, no extra reward, queue discard or validation relaxation.
Use static original-image bounds/outlets with no runtime scans/new timers/RAF.
Preserve art/sizes, hitboxes, HUD, combat/economy, audio, auth, strict >2500ms/500ms
pauses/manual Resume, network/account/payment separation and PR167/168 exclusion.
GamePage and BossHealthView/bossHealthLayout stay byte-identical to public 4ec0683.
328 frontend gates/types/Vite and leaf lint pass, plus 70 native gallery and 53
actual-flow checks. Native boss bars match the published geometry exactly. See
docs/ship-overlay-alignment-20261026 and verification/ship-overlay-alignment.
A new private owner report locates another White Screen at manual Continue before
visible next-round combat; its raw data stays private. Do not claim this visual
release fixes that interruption or reveals an OS/GPU/native cause. No new campaign.
Candidate codex/ship-overlay-alignment-20261026 is auto-deploy-disabled. Continuing
reviewed same-source publication to both existing projects remains authorized.
Preserve 4ec0683 at backup/shared-before-ship-overlay-20261026 and READY Testnet
DSpHhHrn6bjfmWarpHx88n2JzZde / production DchewrncL4vJzY4KwKz8ALWTzVdy.

# Completion activation and interrupted audio, 26 October 2026

Continue from common public 57a60fd/PR175; do not reimplement its transition UI.
New private owner evidence shows completion failing immediately while an existing
successful automatic reload response is pending, and rendered audio clocks frozen
under running after interrupted state. Keep raw export and precise telemetry private.
Wait on existing weaponBusy and prepare when it settles; retain exact queue/receipt/
checkpoint barrier and explicit genuine-error Retry. Extend only explicit Resume's
same-context ordered cycle to rendered interrupted/suspended graphs, with both
native calls inside the gesture. Never-rendered zero clocks still resume directly.
Keep silence in menus/countdowns, music positions/buffers/assets, bounded automatic
repair, real pauses and strict >2500ms/500ms watchdog; no automatic game Resume.
291 frontend build cases, 68 focused audio cases, 13 public native counterexamples
and 80 candidate WebKit checks are documented in docs/completion-audio-resume-20261026.
Six historical audio comparisons are excluded, not passed; GamePage remains 62+4.
Backend compile passes, source unchanged; prior 126 backend checks are baseline.
Physical iPhone/Pi audio, native long-run stability and historical White Screen
remain unproved. No new owner campaign, migration/reset, PR167/168, economy, HUD,
auth, network/account/payment, secret/protection or runtime-log access change.
Candidate codex/completion-audio-resume-20261026 is auto-deploy-disabled; the owner
already authorized reviewed same-source publication to both existing projects.
Preserve public 57a60fd at backup/shared-before-completion-audio-20261026 and READY
Testnet 8PpTq1mGmTu5tZcigEsiMW4kxsrx / production BeBc7AKz43K4ZP1jHcLjBQBy1UvL.

# Smooth game transitions and final bonus explosion, 26 October 2026

Owner reports an abrupt jump from the last bonus explosion to completion, then
requests all similar transitions be gentler and repeated pause/resume included.
Start from common published 59495ef. Let original effects finish, then 900ms of
active quiet before the unified completion; advance only visual lifetimes during
that bonus outro so the queued reward snapshot stays identical. Block/boss clears
also wait for active ending effects; preserve existing banner/music/heart timelines.
Use finite navy/champagne opacity/transform arrival (1200ms completion, 220ms
cockpit windows), reduced-motion alternative, no new art/audio, recurring timer,
RAF, blur/filter or full-screen flash. Count the existing ten prepared visible
seconds after arrival; manual Continue/save barrier stays mandatory.
New private screenshot again shows an unconfirmed save after some pauses. The
screen alone does not identify its HTTP failure, source version, native cause or
prove that the visual cut caused saving to fail. Keep raw attachments private.
Test repeated explicit pause/Resume and pause during the final explosion, exact
rewards, failed saves/Retry, legacy marker, campaign end and responsive/reduced
motion. Preserve strict >2500ms/500ms protection and no automatic technical Resume.
Keep 59495ef/PR174 queue recovery and verified local Home backup, auth/ownership,
network/payment config, backend, economy, HUD/ships/art/audio and PR167/168 out.
Candidate codex/level-completion-entrance-20261026 has auto-deploy disabled. The
owner's reviewed same-source release to both existing projects remains authorized.
Rollback backup/shared-before-completion-entrance-20261026 preserves 59495ef and
READY Testnet 8g5sdDp198rW7yDFJ2ReU3oSN9rB / production HPLEn3TwVkD39FH8fyudgaCYhanu.
No physical-device/White Screen/save recovery success is inferred from synthetic
controls. See docs/level-completion-entrance-20261026 and native evidence.

# Failed level-completion confirmation and Home exit, 26 October 2026

Owner reports disabled Continue after the bonus round and Home / Leave doing
nothing. Start from common public 220b199. Do not attribute the screenshot to an
unseen server error. A native controlled counterexample reproduces stale session
run metadata surviving normal upload retries; explicit Retry must recover the
existing authenticated run before draining its unchanged outbox. Preserve exact
next-checkpoint/reward verification, ten visible prepared seconds, manual Continue,
bounded invalid_save retries and no duplicate reward/charge. Explain distinct save,
checkpoint and effect-preparation failures without raw server details.
At this failed bonus stop only, offer explicit Home with local backup when the
exact pending bonus snapshot for this network/account/run/stage is readable in
durable storage. Recheck at the click; retain active run/outbox, never submit or
finish the mission. Re-entry recovers before offering the account save. No fallback
when backup is absent/failed or activation is uncertain. Preserve ordinary exit,
HUD/art/audio, combat/economy, settings, true technical pauses and strict >2500ms /
500ms watchdog. No PR167/168, reset, migration, secrets or protection changes.
Candidate codex/level-completion-confirmation-20261026 has auto-deploy disabled.
Owner's reviewed same-source publication to both existing projects is authorized;
rollback backup/shared-before-completion-recovery-20261026 preserves 220b199 and
READY Testnet DZruUPJWis8Tm2CQggmvD9uJVhEk / production 12mKjdMLfo3xFG3jaR8tq6wcwTPP.
The raw screenshot stays private; controlled native fixtures are not physical Pi
acceptance or a historical White Screen fix. See docs/level-completion-recovery-20261026.

# Owner crash-boundary evidence requested, 26 October 2026

Owner reports another White Screen then Home on the current 6fe93a5 release and
asks for substantially finer reporting. The raw attachment remains private.
Fix the reproduced nested GameRoute/auth observer miss, add bounded quarter-
second tail and existing callback progress, and link the next document/Home
without claiming a native cause. Preserve current UI/HUD/art/audio, gameplay,
saves/economy, account/network/payment separation and strict >2500ms/500ms pause.
Only fresh verified Testnet owner sessions collect; no ordinary-player
collection, new timer/RAF/request, automatic Resume, migration or reset.
Candidate codex/owner-crash-boundary-20261026 has auto-deploy disabled. Follow
the already authorized reviewed same-source release to both existing projects;
keep 6fe93a5 and its READY deployments as immediate rollback. PR167/168 excluded.
See docs/owner-crash-boundary-20261026/README.md and native controls. A termination
can prevent any final JavaScript event; never promise exact white-pixel or OS-
cause measurement from this report. Do not request another full owner campaign.

# Overlay Control Center and tablet/PC shortcut removal, 26 October 2026

Owner explicitly resumed work and requested existing overlay settings bundled
as a Control Center, fullscreen symbol removed on tablet/PC, and the reviewed
result published to both existing Testnet/production projects. Current common
release 2d02098 is verified READY on both and preserved by
backup/shared-before-control-center-20261026. Work from that main source;
keep codex/overlay-control-center-20261026 auto-deploy disabled while preparing.
Keep phone fullscreen, Play/Home automatic requests, original HUD/art/audio,
gameplay/economy/saves, real pauses and strict >2500ms/500ms watchdog. Do not
implement HUD customization: owner chose to bundle existing options only.
Network/account/payment environments remain separate. No PR167/168, data reset,
migration, secrets/protection changes or claim of historical White Screen fix.
See docs/releases/20261026-control-center/README.md and native verification.

# Retired sign-in callback correction prepared, 26 October 2026

Continued investigation from fixed public 0ec94cf reproduces a distinct client
lifecycle defect: old Pi SDK/API replies after route unmount can replace/delete
new route credentials or clear its admin flag. Old external host detection can
also perform a retired OAuth action. Only useAuth runtime changes: guard each
async continuation by the mounted lifecycle generation; no timer, new request,
permission, backend, payment metadata, gameplay, save or watchdog change.
Published-source counterexamples fail before correction and pass afterward.
11 auth cases now gate the normal build; 262 release cases, types/Vite and changed
hook/test lint pass. Native WPE26.5 passes ten real-React controls (five released,
five candidate), including healthy scopes/incomplete-payment parity. The initial
localhost-versus-production-origin verifier error is retained, not called a pass.
GamePage and all backend modules match public 0ec94cf. No physical Pi login,
live account mutation, deployed correction or historical White Screen fix is
proved. The latest raw report is older 20843b5, not the current release. Keep
its full contents private. See docs/auth-lifecycle-20261026.md and its evidence.
Public Testnet/production and rollback remain unchanged; candidate auto-deploy
stays disabled and PR167/PR168 remain excluded.

# Continue runtime White Screen audit, 26 October 2026

The owner requests continuation after completed PR170 publication. Both existing
public projects remain on 0ec94cf (reviewed b7ed7c0 tree); receipt c467586 is
stored separately. Continue the unresolved runtime interruption investigation
from that exact release on codex/white-screen-runtime-audit-20261026 with automatic
deployment disabled. Do not reimplement the already released mobile cockpit or
completion scene. Preserve real focus/background/technical pauses, strict
>2500 ms/500 ms watchdog, explicit Resume, original HUD/art/audio/combat/economy,
account separation and bounded invalid_save retries. No database reset, purchase,
account migration, inclusion of PR167/PR168 or new owner manual campaign. This
continuation prepares an isolated, reviewable result; it does not authorize
shipping a new unreviewed runtime. Keep the current releases and rollback fixed.
Raw user session input remains private and must not be uploaded to GitHub.

# Mobile cockpit and unified level completion, 26 October 2026

The owner explicitly requests a game-related login with a launching original
ship, cockpit styling for plain overlays, a fixed mobile viewport without page
pulls or accidental repeat pauses, automatic device language and right-handed
controls on first use. Preserve deliberate saved language/hand choices and
the ability to change them. Do not keep requesting fullscreen during steering;
retain Play's native request and the explicit display control. Cover the entire
game route, including authentication, while retaining scrollable inner settings.
Real blur/hidden/stall pauses and explicit Resume remain unchanged.

The owner clarifies that statistics belong in the existing level-complete scene
AFTER the bonus round, together with actual completion rewards, an actually
earned bonus heart, and Continue game. No separate boss-statistics page. Keep
ten visible prepared seconds and manual Continue at this unified stop. Preserve
all reward amounts, timing, validation, durable retries, account/network isolation,
combat, HUD geometry, original art/audio and owner-only diagnostics. The new
client flags only boss events with summaryPlacement=level-end; old clients keep
their legacy stop. A restored legacy marker may move to the level end without
changing its snapshot or rewards. Continue itself grants nothing.

Implement from the common d0a0b81 release, test, and keep both authorized existing
Testnet/production projects aligned. Prepare on the auto-deploy-disabled branch
codex/mobile-cockpit-level-completion-20261026. The historical White Screen remains
unproved. Preserve the release source d0a0b81 as rollback. No database reset,
purchase, auth/protection change or inclusion of PR167/PR168 is authorized.

# Explicit Testnet and production publication, 26 October 2026

The owner now explicitly requests publication and the same code version in
Testnet and production. This supersedes the older no-Mainnet/no-main-release
scope only for the reviewed release based on2435ee0 and its merged PR169.
Publish the verified existing Testnet runtime plus bounded reward-save recovery
to both existing Vercel projects. Preserve separate network/account/payment
configuration and data. The unfinished core rebuild (PR167), mouse-steering
draft (PR168) and unmerged experiments remain outside this release.

Frontend release gates244, backend checks124, TypeScript, Vite, changed-module
lint and the native same-payload400-to200 recovery controls pass. Releasing this
version does not prove the historical White Screen fixed. Keep the exact
rollback sources and verify both live deployments, public URLs and code version.
No database reset, account migration, purchase or new pool tuning is included.

# Bounded invalid_save reward recovery, 26 October 2026

The owner explicitly asks to continue the White Screen investigation, obtain
server-log access and concentrate on invalid_save. Prepare this correction
separately on codex/save-budget-retry-20261026 with automatic deployment disabled.
No new publication, main merge, account migration or live player mutation is
included. Keep all original visuals, input, audio, timing, combat and economy.

The established backend uses invalid_save both for malformed snapshots and for
its time-dependent score bound. Only queued /rewards/event responses with
status400 and that exact code may opt into two bounded retries after5s and10s.
Keep the existing maximum of three attempts, immutable payload/order barriers
and durable retained outbox on final failure. Other4xx and explicitly permanent
subreasons fail immediately. Do not loosen server checks or discard saves.
An unclassified permanently invalid legacy response can receive two additional
requests; it still cannot pass server validation. This is limited save recovery,
not a general invalid-save cause or historical White Screen fix.

The exact accountSave scope fingerprint is updated with a new negative control
rejecting an expanded attempt limit. Local validation passes244 release-gate
tests, TypeScript, Vite, changed-module lint and a native WPE400-to200 same-payload
control. Synthetic local SDK/API and legal armor/weapon fixtures are not real
Pi login or physical iPhone acceptance. The independent latest device request
completed200 at both Vercel projects; the later document replacement remains
unexplained. Preserve prior failures; do not request another owner campaign.

# Authorized Testnet integration, 25 October 2026

The owner now explicitly authorizes the official Testnet release and clarifies
that diagnostics must be accessible only through Admin. This supersedes earlier
no-Testnet scope for this release only; no main merge/Mainnet/automatic deployment.
Restore real api/index.ts and normal build/install configuration from ce1fb59d;
never promote the isolated guest/private-preview build. Keep the existing fresh
server-side /admin/status owner check for reading/copying/downloading reports.
New bounded lifecycle capture runs only after a server-verified Testnet owner
session, stops recording on signout/revocation, has no public report page/global,
no automatic transmission, no new frames/timers and no automatic Resume.
Watchdog remains strictly >2500 ms with 500 ms polling. Preserve all gameplay,
art, sound, economy, saves and backend. New branch is auto-deploy-disabled.
Physical iPhone long-run/White Screen cause and full campaign remain open.

# Preserve the officially approved game

## Protected Preview lifecycle capture, 24 October 2026

After the clarified same-route white-display report and repeated continuation,
prepare a new isolated protected Preview with local lifecycle evidence. Keep
all real frontend/src/index/art/audio/gameplay/watchdog/backend/account code
unchanged. Only Preview packaging adds48 bounded sanitized events and a separate
read-only report page. Existing native RAF is forwarded, not rescheduled;
no new RAF/timer/poll loop, time modification or automatic Resume. Observation
of gaps>250ms is diagnostic only; game watchdog stays strict>2500ms/500ms.
No auto transmission/account/save/token/score/shard payloads. Report starts no
game/recorder and writes no storage. Tab evidence is preferred; origin fallback
is labelled, and another immutable deployment origin is not retrospectively read.
168 build tests and3 actual app/report cases per Chromium/WPE pass locally.
No natural device White Screen cause/fix or physical Pi Browser/long-run proof.
See docs/private-preview-lifecycle-capture-20261024.md/.json. Keep new branch
codex/private-preview-lifecycle-capture-20261024 auto-deploy-disabled. Manual
protected Preview is authorized by the owner; no Production/main/Testnet/Mainnet,
protection change, live data, purchase, data deletion or repeat owner campaign.


## Same-route White Screen report investigated, 24 October 2026

The owner clarifies that the white display returned directly to the game with
ships entering from above, never Home in between, followed by normal death.
Whether points/lives reset is unknown. Screenshot does not capture white pixels
or establish the full hostname/browser. Do not blame its translation/browser bars.
From protected Preview ba5d12d, unchanged real app passes normal early-flight
Pause/Resume and393x744/628 viewport changes in native Chromium141/WPE26.5.
Explicit /game reload separately starts a new guest scene without Home, changes
timeOrigin and records page-reload. That controlled result is not a natural
White Screen, OS kill or fast-motion reproduction. Device finding remains open.
Only the old Node simulation host's missing settled Promise is corrected;27
scheduler/cadence/formation tests pass after22pass/5host-fail controls. No game,
audio, art, HUD, timing, saves or backend change. Existing strict>2500ms/500ms
watchdog, explicit Resume, private photo and earlier WPE failures remain intact.
See docs/preview-resume-investigation-20261024.md/.json. This investigation
branch is auto-deploy-disabled; no new deployment or main/Testnet/Mainnet change.
Do not demand a repeat campaign, purchase or data clearing.


## Protected playable Preview authorized, 24 October 2026

The owner explicitly requests a protected playable Preview, fullscreen on Play,
without viewport scrolling or cropping. This supersedes the earlier no-Preview
scope only for this isolated guest Preview. Start from ce1fb59 on the existing
stability branch; do not restart on main. New branch
codex/private-playable-preview-20261024 has automatic deployment disabled.
Manual Preview deployment is authorized; Production, aliases, main merge,
Mainnet and Testnet runtime remain excluded. Existing Vercel Authentication
must remain enabled. No bypass links/secrets, purchases or browser-data deletion.

The Preview uses the original app source/assets with build-only guest auth,
local SDK, no-database API fixtures and a fixed game host viewport. No real
backend imports or durable account/reward mutations. Keep original HUD, art,
audio, simulation and strict >2500ms /500ms watchdog; no automatic Resume.
The existing Play gesture requests native fullscreen, including tablet/PC;
Home may retain browser bars there. Unsupported hosts cannot be forced into
native fullscreen. Physical Pi Browser/iPhone and full-campaign acceptance remain
open, including the retained cold WPE loop-stall. Never call this a crash fix.

The connector could not access this existing project; the owner-approved
signed Dashboard fallback may create a manual Preview under existing protection.
No project/protection/billing setting change is authorized. Before deployment,
verify current Production ID/source and after deployment verify they remain.


## Native cold-start pause evidence, 24 October 2026, no runtime correction

Continuation on codex/white-screen-startup-recovery-20261023 verifies exact
remote/local base33b137256eae06407985244499cc61cd0f3ef119. The complete checkout,
frontend NPM dependencies, compatible Chromium141 and WPE-WebKit26.5, local native
libraries and all13 byte-matching original fonts are restored. Both native
browsers start and reach localhost HTTP200; no browser/network/sandbox bypass.
Full original production build passes151 tests, localization release gate,
project TypeScript and Vite. Original1740 hulls/95,450,326bytes are retained.

The unchanged verifier with CRYPTOID_STARTUP_ROUTE_FLOW=1 passes Chromium's
seven startup cases and Home/Play/Pause/Resume/Home. The first WPE route fails
after Home/Play. New collector now actually captures reason=loop-stall,
phase=SECTOR_INTRO, sector1/block1, diagnostics.state=read and native pause pixels.
No JS/console/HTTP errors or document replacement. This is a visible technical
pause, not a White Screen or OS memory-kill reproduction. Do not retroactively
assign this reason to the older unobserved pause or infer its blocking source.

A separate original WPE startup-only run passes7/7. A separate native-profiler
route also passes, without a technical interruption. The profiler trace does
not contain the failed interval and cannot identify its cause or supersede the
first failed route. A further local browser-API forwarding audit passes the
short flow with359 retained observations, no extra timers/RAF/storage writes,
max native-RAF gap1301ms, max RAF callback4ms and500ms interval callback1ms.
It too does not capture the failed interval or prove active FPS/device stability.
No rejected renderer/cache/clip experiment is repeated.
No new runtime correction follows. Keep strict >2500ms and500ms watcher, explicit
Resume and all original game/account/audio behavior. No automatic continuation,
publication, main merge, fixed-ref movement, owner campaign/purchase/data-clear
request or claim of full-game/iPhone acceptance. Automatic deployment stays off.
See docs/webkit-cold-start-investigation-20261024.md/.json and retained evidence.
Automatic review rejects pushing local evidence commit7bc2361 to GitHub because
it treats the user's no-publication scope as excluding this remote upload.
Read-only remote verification still returns33b1372. Do not work around this
rejection through another write path. Preserve new work locally/private archive;
do not claim these new commits are on GitHub.

## White-Screen priority and startup recovery, 23 October 2026, prepared

The owner again asks to continue and explicitly gives White Screens highest
priority. Runtime d84a4447e3318f06d4f28ccf7178adee28224295, tree
4acca9df81e7af3cf4a33685f563638a84fdce1f, on
codex/white-screen-startup-recovery-20261023 inherits acd9668/494f7b7. The first
commit disables automatic deployment. No publication, main merge or fixed
release/rollback/Mainnet change is authorized by this continuation alone.

A distinct startup blank is reproduced in Chromium 141 and WPE-WebKit 26.5:
held synchronous head SDK prevents even body/root creation; held/failed entry
and first-route modules leave an empty UI. Original probes have 2 healthy starts
and 8 empty controls. Keep SDK/init bytes, version 2.0 and synchronous order before
entry, but place them after body/root. A pre-SDK inline guard offers manual
recovery for an empty start after 8000ms, earlier on a module resource error.
Late success removes it; first UI commit releases timer/observer/error listener.
Only the language key is read. No automatic reload, SDK retry, navigation or
account/save mutation. It does not monitor a running game or survive an OS kill.

Final full build: 131 tests, localization release check, project TypeScript and
Vite pass using a fresh local output directory. Original 1740 hulls and 95,450,326
bytes remain. New tests/helpers pass lint. All frontend/src files remain exact;
runtime changes are confined to index.html. Both native browsers pass 7 startup
cases each, including actual SDK-held pixel captures and 6 fault-to-Home recoveries.
19 locale choices match existing translations/fallbacks. SDK init is once per
successful document. Transport/storage fixtures are local synthetic data.

Keep the additional lifecycle finding separate: Chromium Home/Play/Pause/Resume/
Home passes. A WebKit cold lifecycle attempt stops after Home/Play when a pause
overlay intercepts the requested Pause click. No uncaught JS/HTTP error; its exact
pause reason was not captured. It is NOT passed. Default startup-only checks to
Home do not establish campaign or full-game lifecycle acceptance. Optional
CRYPTOID_STARTUP_ROUTE_FLOW=1 retains the additional test. Do not loosen the guard.

Two head-only capture attempts are excluded; DOM bounds were insufficient proof
and a blocked parser also prevents fonts.ready. Final body placement has completed
native captures; only the test host bypasses the optional screenshot font wait.
Earlier incomplete/default-output and ENOTEMPTY build attempts are excluded; the
fresh final output has the complete successful build. Do not repeat old renderer
cache/clip experiments or require an owner campaign, purchase, clearing or OS log.

The older f85360ed Jetsam event proves that particular WebContent process-limit
kill near 2.02 GiB, not a current source allocation or every later White Screen.
No new physical iPhone memory measurement or White-Screen elimination is proved.
Historical device White Screens and active stalls remain open. See
docs/white-screen-startup-recovery-20261023.md/.json and retained evidence.

## Empty display bounds and resume watchdog, 23 October 2026, prepared

Runtime 494f7b7181befe42654f2d9e965a00f77e768c23,
tree ce2ee28b9719b14161177c0493f660480eafc3b0, on
codex/idle-display-resume-guard-20261023 inherits 9fd9c9d and the IDB callback guard.
Automatic deployment is disabled in the first branch commit. Nine remote
runtime/config/test blobs match the checked local files. No publication or main
merge; preserve every fixed release/rollback reference and Mainnet.

An empty BonusRockLayer used a 1x1 raster but full-field display bounds. Start its
empty display at 1x1 and shrink it after the same original 2000ms grace on an
existing update; restore 100% bounds before the next active draw. Material and
active draw source are byte-identical; DPR cap 1.5, prewarm, timing, gameplay and
all art remain unchanged. No new RAF/timer. Eight regressions plus 312/312 exact
native RGBA comparisons and 312 valid twin-baseline controls pass across two field
sizes, three DPR values, two cycles in Chromium 141/WPE 26.5. WebKit bounds/estimated
memory snapshots support only a display-layer finding, not RSS/FPS/iPhone proof.

A separate loop defect is reproduced: the first callback after observed paused,
loading or hidden time could report that gap as active stall. Rearm measurement
on first observed active/visible callback. Original 10 pass/7 fail becomes 17 pass.
Preserve strict >2500ms real-stall detection, 500ms watcher, pending generation,
one RAF, original explicit Resume and GamePage state/save/audio recovery.
Unobserved transitions cannot be inferred; genuine active stalls remain guarded.

Full build: 119 tests, localization release check, TypeScript/Vite and changed-file
lint pass. Original 1740 hulls/95,450,326 bytes/revision 91a72bc0c36be9407915 retained.
The final actual production Router Home/Play/Pause/Resume/Home passes in each
native browser with original fonts and local guest SDK/API fixtures, no gameplay
hooks or recovery bypass. Both game audio contexts close on Home; shared card/
new Home music remain. Earlier rock-only WebKit UI pause is preserved as failed;
its exact cause is not established by the separate deterministic watchdog fix.

Build reports retain parent 9fd+dirty provenance; both module SHA256s match 494f.
Seven failure/lifecycle cases, seven CPU pixel comparisons and four bonus-rock
logic tests also pass. These are not physical PiBrowser, live-payment, sustained
campaign or historical White-Screen acceptance. Keep sector 57/59 active-stall
and historical device findings open. Do not repeat rejected renderer-cache/clip
experiments, demand an owner campaign/purchase/OS report, or declare the whole
game fixed. See docs/idle-display-resume-guard-20261023.md/.json and evidence.

## Diagnostic IDB callback guard, 23 October 2026, prepared, not published

Renderer follow-up: native layer/timing comparisons identify the filtered milky
band as a substantial local Paint contributor. Hiding formation text does not
remove that cost. Individual/parent/opaque cache hints have no complete unchanged-
output and sustained-benefit acceptance and are NOT integrated. Their lower Paint
shifts work into software graphics; do not claim improved game FPS or an iPhone
fix. The separate-static probe interrupts527ms after capture startup and is
excluded from steady-state timing. Some WebKit unchanged/reversion image controls
are invalid; Chromium controlled captures retain small colour differences.
See docs/renderer-layer-attribution-20261023.md/.json. Do not repeat rejected
experiments or a full owner campaign. No new rendering runtime/deployment change.

The owner asks to continue and needs a substantiated stability conclusion before
expanding the game. Runtime candidate 4c384023a4fae3d84403ade7beae7934e22e39fd
on codex/diagnostic-idb-callback-guard-20261023 starts at recorded source19de3e6.
Automatic deployment is disabled. Original starfield clipping experiments are
excluded; no graphics, CSS, HUD, audio, gameplay, account/save/economy or backend
runtime changes are part of this correction.

A real original-source Linux-WPE full scene reaches sector64 after587.2 seconds,
then chunks.add inside an IDB get-success callback throws TransactionInactiveError
globally and opens technical pause. This is not a White Screen. The store now
guards synchronous setup and later transaction callbacks, rejects the exact
operation, aborts safely, and reaches the existing recorder storage-error path.
No automatic write retry or reconstructed history. Seven regressions join the
existing full-session build gate:43 cases pass.24 additional browser cases
separate failing original controls from clean candidate callbacks.

Candidate4c384 passes the full frontend production build:94 tests, localization
release check, project TypeScript and Vite; changed store-module lint passes.
The unchanged production Router flow Home/Play/Pause/Resume/Home passes in
Chromium141 and standalone WPE-WebKit26.5 with original fonts and local SDK/API
fixtures. No actual Pi authentication/payment or physical-device proof is implied.

The extended campaign acceptance is NOT passed. A parallel run ends at sector59
after345.684s; a standalone original-font run ends at sector57 after260.945s.
Both reach the existing loop-stall pause after one original-Resume recovery.
No uncaught JS exception, Canvas loss or diagnostic storage failure occurs;
the standalone run still confirms1300 records. Preserve the stall guard and
Resume semantics. Parallel browsers alone do not explain the finding. Linux
software rendering does not establish an iOS memory-termination cause.
Historical White Screens remain unresolved; do not call the whole game fixed.

A bounded native timing follow-up after warmup captures27.212s of active
sector57 before the original loop-stall handler. Overlapping Paint intervals
cover12.506s (largest1.211s), while native ScriptProfiler evaluation covers1.086s.
This points to local browser rendering as a major cost; it does not identify a
particular source element or prove iPhone memory/White-Screen causation.
Profiler overhead applies. A first cold-start-paused trace is excluded from the
active-play comparison. No new runtime correction or acceptance pass follows.
Next narrow investigation: attribute repeated native paints to concrete display
layers while preserving original visuals. See the nativeTimingFollowup field
and native-timing section in the existing evidence files.

See docs/diagnostic-idb-callback-guard-20261023.md and .json for the evidence and
test boundaries. No new owner long campaign, purchase, data clearing or native OS
report is required to review this correction. Preserve fixed official release/
rollback refs and Mainnet. No new publication instruction accompanies this work.

## Shop/storage recovery prepared, 23 October 2026, not published

The owner's follow-up reports failed purchases/paid-weapon activation and about
15 minutes paused without a crash, then asks to continue. The supplied v6 report
is actual 38002f0 gameplay: normal projectile damage, destroying/game-over,
home-intent and finished recorder at sector68. Do not call that exit a crash.
The document spans about44 minutes including pauses. Last confirmed save remains
05:38:19.878 Vienna; full recording stops05:38:27.224 at sector51 after3550
committed records, with readable IDB but no returned summaries. Neither shared
cause nor a quota/OS/connection cause is established. Do not demand another long
campaign, clear browser data, reset saves or repeat a purchase for diagnosis.

Isolated codex/shop-storage-audit-20261023 starts at local5559923, with the
seven directly compared runtime blobs equal to fixed official38002f0. Automatic
deployment is disabled. Two additional client failures are reproduced: failed
inventory readiness disables replay of the original pending receipt, and an
optional payment diagnostic storage exception can hold checkout busy. Keep
same-id server confirmation and purchase gates; allow pending replay/inventory
refresh and keep optional payment diagnostics in memory if persistence fails.
Never alter token requirements, SDK payment metadata, backend/economy or saves.

Retire an abnormally closed cached IDB connection by identity so the next existing
operation can reopen it. No automatic write retry or reconstruction of deleted
history. Fixed sanitized storage categories distinguish a missing committed
history from quota/denial/closure/timeout; no raw exception is persisted.
GamePage, image loader/explicit-decode comparison, CSS/art/audio, account/save
queue and all backend/API code remain unchanged.87 build-gated tests, full
types/Vite build and four changed utility/hook modules' lint pass. Fault tests
use actual source with isolated transports/fake IDB, not physical PiBrowser or
live-payment proof. No installed native browser engine is available here.
See docs/shop-storage-recovery-20261023.md and its verification JSON. This is
preparation only; retain official38002f0, Mainnet and every fixed reference.

## Image-load comparison published to Testnet, 23 October 2026

The authorized comparison is READY at fixed runtime38002f07f9c8c20cb68e4416492ab7749944b104,
tree551e089627f048c5899b3dc902771585cb50b06f, branch
codex/hull-load-readiness-20261023. New rollback
backup/testnet-before-hull-load-readiness-20261023 ->d783b01 is independently
verified. Preserve all fixed refs and Mainnet. PreviewGCMiHuc4tLDuAAoaR5g7Km56Mv8w
READY05:09:56 Vienna81s; Testnet ProductionFMakKRfBYkQFgY9yGLXtrtmbkcMk
READY05:12:29 Vienna73s. Exact ten remote runtime/test/config paths were verified;
no local notes, private run or evidence uploaded. Do not advance the runtime
branch with this receipt. Local codex/hull-load-release-record-20261023 is
auto-deploy-disabled and must not itself be deployed.

Both build suites pass12+33+15+17 and types/Vite.22 delivered feature checks,
syntax-tree proof of the load/error gate and zero explicit decode calls in the
target loader,6 original PNG pairs, globalCSS, API root200/anonymousAdmin401 and
all3 fresh leaderboard hashes pass. Official Home SPIELEN enabled. Keep the
distinction: native synthetic held decode control and equal WebKit pixels are
not a natural White Screen reproduction or proof of an iPhone fix. Next device
comparison continues the existing mission after reload; no new long campaign
or native OS report requirement. See docs/hull-load-release-20261023.md.

## Explicit image-load comparison, 23 October 2026

The owner's “mach das bitte” accepts the proposed isolated removal of the extra
Image.decode call, internal visibility checks and subsequent Testnet comparison
availability. Candidate codex/hull-load-readiness-20261023 starts at9606951,
with application source matching officiald783b01/tree598bbf5. Auto-deploy is off.
Only the conditional explicit decode after successful onload is removed;
variant-decode-skipped replaces the paired execution markers. Preserve the
original load/error gate, serial queue, both retain checks, caches, bytes, styles,
gameplay, timing, audio and every account/save/economy boundary.

The new private run has6526 valid contiguous records; lastGraphics6534 is
variant-decode-before/imageJob596/sprite17/stage1/paint2,112ms beyond last commit.
62 prior plans succeed,131 server replies HTTP200, no normal end or JS error.
This does not prove a hung decoder, native-memory cause or crash fix. Do not
upload private archives or demand another campaign/native report.

Full build passes12+33+15+17 tests/gates and TypeScript/Vite.16 current resource
cases include1100 plans/7259 readiness requests across500 sectors. Two old
encoder controls lack historical Git source and remain excluded, not passes.
WebKit26.5 actual PaintedShip A/B: nine rendered pixel pairs equal;12/12 hulls
per plan and six visible hulls;66 explicit control decodes versus0 candidate;
held-decode control stalls and candidate finishes; delayed-source flame guard
remains, cleanup zero pins, zero page/image HTTP errors. Linux-only acceptance,
not a physical PiBrowser or natural crash reproduction. Both private archives
read unchanged;1740 original PNG digest unchanged; one preceding lint finding.
See docs/hull-load-readiness-20261023.md. Fixed official/runtime/rollback refs
and Mainnet stay unchanged until the scoped Testnet release and receipt.

## Fine hull-stage observations prepared, 22 October 2026, not published

The owner continued after supplying the complete run and asked whether to test
again. The answer was to wait for the additional observations to be available.
Local preparation is on codex/hull-stage-diagnostics-20261022, based on local
90a9b0975549fefa197f1b2d2fb5672fb4702b54 with the exact application tree deployed
as 175e407622444ebe2dce7bfdb31e8037e25c1c97. Candidate auto deployment is disabled;
no new Testnet/Mainnet release, account mutation or remote log/protection access.

The supplied run's seq2327 is hull-plan-start55; separate observed seq2331 is
phase-start55. Last stored step is not the cause of interruption: 47 earlier
plans complete12/12, sometimes taking1853ms. The full private original and
derived analysis remain local; full analysis is on sibling audit commit3684f71.

New fixed-enum progress observations distinguish preload, retain/release,
source loading/readback/surface release and variant load/optional decode/ready.
Only bounded catalogue/job numbers are recorded, never raw URLs/messages/data.
They batch with existing IDB flushes; a separate synchronous lastGraphics marker
survives later phase breadcrumbs. Marker write cost is measured. Normal finish
now leaves an immediate observed end marker before the existing async commit.
No timers, RAF, retries or network requests were added. Existing owner/Testnet
guards, record/storage/queue limits and export paths remain. All2327 existing
records/summary/status compare unchanged under the extended reader.

32 build-gated full-session/transfer/hull cases, full locales/Canvas/weapon/
TypeScript/Vite build and16 additional current resource tests pass. Two old
encoder comparisons lack the historical ab587934 object; the old extra React
handoff host lacks its local dependency. Do not count these as passes or retry
the missing-source fetch. Five changed TS modules lint clean; paintedShip retains
its single preceding set-state-in-effect finding. Original1740 PNG digest matches.
Portable AST scope proof now includes paintedShip and rejects cache/argument
mutations; its empty-block normalization is pinned to actual c62efe2a source.

Native Linux WebKit26.5 430x825 DPR3 passes actual53->54flight0->54flight1->55,
then intentionally held decode and task-owned content-process SIGKILL.356 committed
records/14 chunks recover contiguously; uncommitted seq360 lastGraphics survives
without inventing a commit. Regular finish is synchronously observed and then
commits closed.0 page/imageHTTP errors;373 marker writes total17ms/max8ms locally.
This is synthetic, not physical PiBrowser, natural crash or native-memory proof.
Do not claim Whitescreen fixed or demand another full campaign/native22Octlog.
See docs/hull-stage-diagnostics-20261022.md. Publication remains a separate
explicit release action under the existing project rule at the end of this file.

## Weapon auto-reload confirmation recovery, 22 October 2026, preparation

Marcus reports persistent "Not confirmed. Retry the same weapon." after an
automatic charge cycle, with later weapon choices failing. This explicitly adds
the client recovery defect to the current stability work. Isolated sibling
branch codex/weapon-reload-recovery-20261022 starts at 94825bd; automatic deployment
is disabled. Do not mix it with the separately prepared bonus-clear observation
branch codex/bonus-clear-boundary-20261022 (remote c1e8688980b826d33e58c2a4300baa5ee38d65a1).

Actual released selection/menu code reproduces a lost-response pending receipt
that disables alternatives, ignores retry if that weapon appears selected, and
leaves an old error after free/cached choices. New manual selection reconciles
the original level/id first, then honors the requested standard/live/new/pickup
choice. Never checkpoint over an uncertain grant, invent confirmation, refill a
live/pickup timer, abandon the original request id, or allocate a second id for
an already spent confirmed receipt. Continuing failure preserves that receipt;
busy/run/mount/automatic-selection guards remain. Successful choice clears stale
error; a newer manual attempt retires the older notification timer.

Only the weapon selection/pickup handlers and two existing menu buttons change
runtime behavior. The complete remaining GamePage, including the automatic
trigger, is byte-identical to 94825bd. Preserve simulation, CSS/art/audio, timing,
weapon rules/durations, prices/stock, checkout, account/save schemas and backend.
Seventeen build-gated tests run actual handlers/menu/sync code. Two use actual
unmodified account/checkpoint/activation handlers and isolated in-memory stock;
same-id replay debits once. Released negative control fails twelve and passes
five; current seventeen pass. Thirty-five focused cases, twenty-eight existing
backend checks and full locales/Canvas/types/Vite build pass. Lint findings are
identical before/after (GamePage 62 errors/four warnings, menu three errors under
restored tooling); no clean whole-project lint claim. This is not physical
PiBrowser/live-account proof or proof of the initial device transport error.

No new deployment, live account mutation/purchase, Mainnet contact or runtime-log/
protection retry. Keep official 5d6e7cb and every fixed source/rollback reference.
The White Screen cause remains open; the bonus-clear diagnostic is separately
prepared, not a proved crash fix. See docs/weapon-reload-recovery-20261022.md.

## Canvas static-URL correction published, 22 October 2026

The approved release is complete. Official Testnet is READY at fixed source
5d6e7cb703ef114ee4626c1fbb0e34a45b1667d8, tree
7d0fa724da3840b378d8de1e5723b24bfce19a89, source branch
codex/canvas-static-url-readiness-20261022. Production
dpl_G6q1Ni4Lgc3XZfvRbDTB7mk4rw5k completed at 15:40:08 Vienna, 82 seconds total /
81-second Deploy Logs. Preview dpl_HvG3kARjrKwSLS54JS1hNR42iWN2 completed at
15:34:02, 87 seconds. Production rebuilt the same source with Production settings;
do not claim identical preview and production binaries.

Rollback branch backup/testnet-before-canvas-static-url-20261022 resolves to
0bb35e5aeac49557edb8fd7379422066971e47de; its previous READY deployment
dpl_AxeBWSTp1tKTYWWUe2ALcqcA6ktv remains preserved. Keep every fixed ref and Mainnet
unchanged. Receipt branch codex/canvas-static-url-release-record-20261022 has
automatic deployment disabled. Do not deploy this receipt or advance the fixed
runtime branch with later documentation.

Fresh delivered GamePage/Admin source/tree, requested-source guard/two resource
bundles, absence of the reflected Image.src guard, static revision and four QA
exclusions pass. Six served 282x282 PNGs equal the locally proven bytes. API root,
anonymous Admin denial and all three leaderboard hashes equal the fresh baseline.
Preview guest Start/Pause/3-countdown/active Resume/second Pause pass; a normal kill
raised score 25 to 50 and activated normal-effects-surface from 1x1 to 280x200.
Fresh official Home finishes loading with Spielen enabled. No Pi/owner login,
account/save/economy mutation, runtime-log/drain/protection retry or Mainnet contact.

The browser DOM adapter cannot call canvas.getContext; one read-only pixel probe
failed at that adapter boundary, not in the app. No bypass was attempted. Actual
browser surface activation and the 54 local native RGBA pairs are separate proof.
Physical iPhone/WebKit native memory, heat, audio output, presented FPS and final
White Screen elimination remain unproved. Reload/Resume the existing mission;
do not demand another full campaign for already established counters.
See docs/canvas-static-url-release-20261022.md and its evidence directory.

## Canvas static-URL Testnet release authorized, 22 October 2026

The owner's latest "fortsetzen" answers the explicit question whether to publish
the verified Canvas correction to Testnet. Proceed through the existing Testnet
preview/production workflow without asking the same release permission again.
Prepared local runtime is 115b0e5b9db6e3a35c60f96df73a086c342eadfc. Only readiness
identity changes application behavior; fifteen new build-gated tests and prior
regressions already pass. Do not broaden the patch or repeat unrelated tests.

The signed-in dashboard confirms old READY dpl_AxeBWSTp1tKTYWWUe2ALcqcA6ktv at
0bb35e5aeac49557edb8fd7379422066971e47de. Independently resolved rollback branch
backup/testnet-before-canvas-static-url-20261022 points to that exact source.
The Vercel connector's exact-resource 404 persists; the previously authorized
dashboard fallback remains applicable. Earlier runtime-log/protection denials,
Mainnet, accounts, saves/economy and every older fixed reference remain unchanged.
Keep candidate auto deployment disabled, verify its full remote tree, preview
and delivered source/guard, then record the actual release separately. Never move
the fixed new runtime branch with later receipt-only documentation.

## Canvas static-URL readiness, 22 October 2026, verified preparation only

The owner accepted the isolated correction/integration tests with "fortsetzen".
This does not authorize publication. Candidate
codex/canvas-static-url-readiness-20261022 has automatic deployment disabled;
preserve official Testnet 0bb35e5a, Mainnet and every fixed source/rollback ref.
No preview, runtime-log/protection-bypass retry or account/data mutation.

The new 22 October report ends in active boss 2 with open reactor and advancing
audio clocks. Last flight persistence is 14:31:58.552 Vienna; new document starts
14:32:05.098. No matching native log was found. Do not reuse the 21 October Jetsam
as OS confirmation of this new event or blame first-shot creation/defeat audio.

Actual released CanvasImpact compares a reflected absolute Image.src with the
root-relative static PNG key and silently retains original CSS effects. The real
style-hook/component/native-raster host reproduces that failure with prepared
resources and zero failures. Keep sourceUrl in cached/async bundles and compare
that exact requested key, retaining scale/generation guards. This is the only
runtime change. No altered drawing, artwork, timing, resolution, cache budget,
timer/RAF/listener, audio, boss rules, HUD, simulation, API or saved state.

Fifteen new tests now gate every frontend build. Portable exact previous-source
fixture SHA-256 is f9f862bad6cc19968c46b13c6045e3317c7a4e10b9080dea7083be8c579fbbd1.
Before correction eight of the original twelve cases fail; afterward all fifteen
pass, including actual hook/static PNG activation, failures, stale callbacks,
scale/context loss/pause, shared ownership, 1000 warm impacts and 54 exact native
RGBA pairs. 154 existing focused tests and eleven static-hull tests (all 1740 PNG
byte pairs), Canvas resource/lifetime/cadence and full build/types/twelve locales
pass. The same two historical-source cases remain excluded. CanvasEffects lint
retains exactly its twenty preceding findings; no whole-project clean-lint claim.

No physical iPhone/Safari memory, heat, output, FPS or White Screen fix is proved.
The native raster/hook host is not browser/device verification. Keep prior browser
and permission restrictions; never demand another full campaign for known counters.
See docs/canvas-static-url-readiness-20261022.md for evidence and release boundary.

## Static hulls and audio initialization published, 22 October 2026

The owner's explicit "Bitte veröffentlichen" supersedes preparation-only status
below for this tested candidate. Official Testnet is READY at source
0bb35e5aeac49557edb8fd7379422066971e47de, tree
43af181e9990cc34501dd8ebb44367ce0cf219e1, fixed branch
codex/static-hull-memory-20261022. Production
dpl_AxeBWSTp1tKTYWWUe2ALcqcA6ktv reports 51 seconds total / 49-second deploy
logs; preview dpl_FEMWyzgkPUybwZ5UVFGVBNrvqtp5 reports 70 / 69 seconds.
Production rebuilt the same source with production settings, not the identical
preview binary. The prior 9b5f07c5 READY deployment and newly verified
backup/testnet-before-static-hulls-20261022 preserve immediate rollback.

Delivered GamePage/Admin source/tree, ten new static/audio features, nineteen
previous audio/progress, eight memory, six cleanup, eight owner-recorder, two
handoff and four production-QA exclusion checks pass. Six served PNGs match the
proven local production bytes at 282x282. All 1740 local files were separately
verified; do not claim a full remote catalogue comparison. API/anonymous Admin
denial/three leaderboard response hashes match the fresh baseline. Preview
guest start/Pause/countdown/active Resume/second Pause pass, with seven ship styles
using the matching static revision. Fresh official Home has Spielen enabled.

The Vercel connector sees the team but returns exact-resource 404s; the previously
authorized signed-in dashboard completes this release. No runtime logs, drains,
protection bypass, Mainnet contact, accounts/saves/economy mutation or new auth.
The receipt-only probe was corrected for Vite's equivalent typeof comparison
and a valid $-containing minified identifier; no runtime patch or assertion
removal followed these probe failures. Static hulls plus the two prepared audio
initialization fixes are now live. Physical iPhone audio, native memory, FPS and
a final White Screen fix remain unproved. Reload/Resume the existing mission
near a transition or use direct boss testing; do not require a replacement
level-one run or another full campaign merely for already established counters.

Keep all fixed source/rollback refs and Mainnet unchanged. This later receipt
branch codex/static-hull-memory-release-record-20261022 is auto-deploy-disabled;
do not deploy it or advance the fixed runtime branch with documentation.
See docs/static-hull-release-20261022.md and its sibling evidence directory.

## Static hull preparation, 22 October 2026, tested candidate

The owner asks for internet-backed investigation and correction, then "setze fort".
The newly matched Jetsam event is a PiBrowser-coalition active WebContent
per-process-limit termination at 17:26:09.580 Vienna, 221 ms after the f853 level-19
start and 1.401 s before the replacement document. Resident pages imply 2.01964 GiB.
The raw file has no site URL; do not assign it to later evening reports or claim
the latest b92 saved exit was a crash. The allocation responsible remains unproved.

Candidate codex/static-hull-memory-20261022 starts at ab58793 / 344722ed (the two
prepared audio initialization fixes), equivalent remote a765aab6. Automatic
deployment is disabled. Keep official Testnet 9b5f07c5 and every fixed rollback/
source reference, Mainnet and prior runtime-log/protection denials unchanged.
No publication instruction accompanies this continuation.

Generate all 1740 original-resolution ship/stage/current-or-legacy-colour PNGs at
build time with the unchanged material/palette/accents and pinned build-only
@napi-rs/canvas 0.1.100. The compact content-addressed manifest is tracked; PNGs
are ignored and generated in predev/prebuild. Request only actual prepared/mounted
variants, never preload the catalogue. Retain serial load/decode readiness, visible
source fallback, cancellation/retry, twelve-item plans and the 24/12-MiB/6 cache.
Eviction must reuse the static URL, without game-time hull Canvas/readback/PNG/Blob.
Keep full decoded accounting; readiness jobs are not material/encoding work.

All 1740 native encoder PNGs equal the preceding actual runtime byte-for-byte.
Eleven tests cover loading, actual-hook fallback, failures, cancellation, mounted
ownership, stable reuse and 1100 preparation changes through 500 sectors/escorts/
bonus (269 unique URLs, 7259 requests, zero painting/Blob allocations). Existing
154 audio/boss/diagnostic + four material/cache tests, Canvas resource/lifecycle
hosts and build/types/twelve locales pass. Seventeen runtime files and the entire
style hook match the preparation parent. The historical painting lifetime script
is pinned to its old Canvas/Blob reference; the new suite covers current code.
New-module lint passes; paintedShip retains its one unchanged set-state-in-effect
finding. The old browser probe could not launch absent local Chromium and its
server was stopped. No browser/iPhone memory, output, FPS or complete-fix proof.

The generated catalogue is 95,450,326 bytes on the build server, loaded individually
by the client. Keep only the current catalogue in the build; package verification
checks every PNG and matching client revision. Original sources, effects Canvas,
audio, gameplay/HUD, accounts/saves/economy and Admin privacy are unchanged.
Do not claim all application Canvas/Blob use disappeared or that this path alone
explains the 2 GiB footprint. See docs/static-hull-memory-20261022.md and its evidence.

## Audio graph initialization, 22 October 2026, tested preparation only

The owner accepted the isolated two-defect correction with "Dann beginnen wir";
this does not authorize publication. Start from official 9b5f07c5 / d92cd586
(local equivalent 759b63e plus its receipt). Keep Testnet, Mainnet and all fixed
source/rollback refs unchanged. Automatic deployment is disabled on candidate
codex/audio-graph-initialization-20261022; no deployment/log/protection action.

GameAudio publishes its bus/limiter only after full connection; failed temporary
nodes disconnect and later starts retry on the same context. MusicPlayer retains
its same bound context/source/gain across connection failures, reports not ready
and reconnects on a later attempt without replacing/rebinding its media element.
Allocate gain before binding; retain HTML fallback only when the host is absent
or its constructor is unavailable before binding. Close retires partial graphs.
Keep healthy parameters, pause/countdown/seek, prior clock/allocation guards and
physical heart collection. Graph readiness is not proof of audible output.

22 new tests include four actual preceding-source negative controls, seven effects
and five music failure points, 1,000 repeated failures of each engine and 100
healthy music cycles. Before correction 16 cases fail; afterward all 22 pass.
154 focused tests, 12 locale checks/release gate, build/types and both runtime
modules' lint pass. Two unavailable historical-source comparisons remain excluded,
not counted as passes. First build's nullable-context error was corrected and its
log retained. Only gameAudio.ts/musicPlayback.ts change runtime behavior; GamePage,
AudioClockRecovery, cardSound, Admin/owner diagnostics, CSS/assets, backend/API,
accounts/saves/economy are unchanged. No new timer/RAF/listener/context on healthy
playback, native audioSession workaround or device audibility/memory proof.
White Screen and the reported zero clock remain unresolved. Do not request a
full campaign for the same counters. See docs/audio-graph-initialization-20261022.md.

## Boss-victory progress guard published, 21 October 2026

Official Testnet READY source 9b5f07c55a1f440ca925ee49b002bb223241793a, tree
d92cd586d6257357de893c2357960e6c2cd116bc, fixed branch
codex/boss-victory-audio-progress-20261021. Production
dpl_7dCdyJ8A78QqiKU6oXzuZbBQqg6j builds in 45.030 seconds; preview in 42.967.
132 focused tests/build/types/locales/lint, exact delivered identities, all 19
audio/progress probes and previous memory/cleanup/recorder/handoff probes pass.
API/three leaderboard status-length-hashes equal baseline; anonymous Admin is
401. Preview guest start/Pause/Resume/countdown/resumed second Pause pass;
official Home freshly loads with Spielen enabled. Native iPhone output and
White Screen cause remain unresolved. Do not repeat a full campaign to confirm
the already observed b92 zero-clock failure. Keep physical heart collection.
Previous fixed b92 source/deployment is immediate rollback. Receipt branch
codex/boss-victory-audio-release-record-20261021 is auto-deploy-disabled and must
not be deployed. Preserve Mainnet, fixed refs and prior log/protection denials.
See docs/boss-victory-audio-release-20261021.md and its sibling evidence directory.

## Bounded boss-victory audio wait, 21 October 2026

The owner's 19:29:39Z v5 report is actual b92 gameplay: effects currentTime stays
zero with one stall/recovery and 462 blocked starts, so native audible recovery
remains unproven/unsuccessful for this observed clock. It passes core volleys,
boss defeat and the defeat scene, then records paused saved-exit/unmount and
finished=true. The 25d80d4f unexpected-restart record is historical, detected when
this monitor starts. Do not describe the current saved exit as another crash.

The actual previous GamePage can wait forever for a playing/non-ended victory
element with frozen media time. Three negative cases fail before the fix.
MusicPlayer.waitingForEnd now uses existing active simulation time and media
position; two active seconds without progress stop blocking the existing normal
clear deadline. Advancing media still keeps its complete jingle. Pause/source/
close reset it, with no new timer/listener/RAF/context/element/node or healthy
sound parameter change. Physical heart pickup remains required exactly once.
Seven bounded owner-only music/heart fields distinguish a future media wait
from an uncollected heart; this specific report has neither and cannot prove
which held its final clear. Whole-GamePage parity outside these exact additions
passes, along with 132 focused tests/build/types/locales and utility lint.
See docs/boss-victory-audio-progress-20261021.md. This is an indefinite-wait
correction, not a native audio or White Screen fix. Continue authorized Testnet
scope; keep Mainnet, fixed refs and prior log/protection denials unchanged.
Candidate codex/boss-victory-audio-progress-20261021 has automatic deployment off.
Preserve the fixed b92 source/deployment as immediate rollback. Check the separate
release receipt for publication status. Never require another full campaign or
replacement level-one run to verify these already observed counters.

## Explicit retry correction published, 21 October 2026

Official Testnet READY source b92ab45bc1e493fb86c36da4f01bd88d15a5f498, tree
9f68861ff277ef7a4b92da7392d82611333c6a29, fixed branch
codex/post-interruption-audio-retry-20261021. Production
dpl_EZAwgBRrVpRXGwfEAZXW9bDz5GP5 built in 42.316 seconds. Rollback branch
backup/testnet-before-post-interruption-audio-20261021 retains 25d80d4f.
95 focused tests/build/types/locales/lint pass. Delivered source/tree, all 16
audio features and prior resource/owner/handoff checks pass; API/three score
hashes match baseline and anonymous Admin is denied. Preview start/Pause/Resume
countdown pass; the resumed guest simulation reaches Game Over before the next
observation, not a separately observed active-Pause state. Official Home freshly
reloads with Spielen enabled. See docs/post-interruption-audio-release-20261021.md.
Receipt branch codex/post-interruption-audio-release-record-20261021 is disabled
for auto-deploy and must not be deployed. Preserve fixed refs, Mainnet and prior
log/protection denials. Device audible recovery and White Screen cause/fix remain
unproven. Ask only for reload/Resume of the existing mission, not a new level-one
run or another full campaign for the same counters.

## Post-interruption explicit audio retry, 21 October 2026

Owner's 25d80d4f report reaches boss-70 victory, then White Screen/Home; immediately
choosing Resume is fully silent again. Effects clock advanced with zero stalls,
one voice and bounded known resources at the last sample. The last heartbeat
continues 1.683 seconds after the victory request; canvas-release is recorded.
Do not assign the White Screen to the jingle, sound queue, GPU/OS or saved game.
Boss 50/60 pass in the same recording. See
docs/post-interruption-audio-retry-20261021.md for the measured timeline/limits.

Actual preceding-source counterexample demonstrates that an old pending or
failed automatic recovery blocks a later genuine Resume. Explicit Resume now
retires the pending generation and permits a new in-gesture native attempt;
frozen allocation blocking remains until measured clock progress. Automatic
requests remain bounded; old completions cannot clear later attempts or revive
closed contexts. Only AudioClockRecovery.ts changes runtime behavior. 95 focused
tests, build/types/locales and clock lint pass; two historical comparisons remain
explicitly excluded. Same samples/media/context/seek/gains, graphics, saves and
gameplay. No new timers/listeners/telemetry. Continue the ongoing authorized
Testnet audio correction only, preserving Mainnet and fixed refs and earlier
log/protection denials. Candidate codex/post-interruption-audio-retry-20261021
has automatic deployment off. Device audible recovery and White Screen cause
remain unproven. Never recommend replacing the run with level one for this test.

## Audio gesture correction published, 21 October 2026

Official Testnet is READY at source 25d80d4fea43bd18b9c3ce643a1766cde537114e,
tree 36c1887d871364b8721c9db8a7c19cd940d67b83, fixed branch
codex/audio-gesture-recovery-20261021. Production deployment is
dpl_5C28c1QDmujcvKSMWBMUbidpK5N6 (36.987-second build). Rollback branch
backup/testnet-before-audio-gesture-recovery-20261021 retains b026a194.
Preview guest start/Pause/Resume/countdown/resumed play pass; freshly reloaded
official Home is enabled. Delivered source/tree, all 13 audio features, prior
memory/cleanup/owner/handoff features, unchanged API/three score hashes and
anonymous Admin denial pass. The receipt-only QA probe accepts the new clock
observation before the same existing music-coalescing guard. See
docs/audio-gesture-release-20261021.md and sibling evidence. Receipt branch
codex/audio-gesture-release-record-20261021 is auto-deploy-disabled; never deploy
it or advance the fixed source branch with documentation. Physical iPhone
audibility and white-screen fix remain unproven; preserve Mainnet and earlier
runtime-log/protection-bypass denials.

## Audio Resume gesture correction, 21 October 2026

The owner's follow-up after b026a194 publication confirms silence after leaving
to paste a report and pressing Resume again. Effects clock stays exactly zero
despite running; one clock stall and 25 then 135 blocked starts are recorded.
The current continuation ends with saved-exit-intent/unmount and finished=true.
The unexpected-restart sector-48 record is detected when this monitor starts,
referring to the preceding run; it is not a new crash in this continuation.

An actual preceding AudioClockRecovery blob under a gesture-gated host shows
its forced fresh-graph suspend calls native resume only after the click ends.
Fresh/never-rendered graphs now request native resume directly in Resume;
existing rendered paused graphs enqueue suspend and resume in order inside
the same gesture. Actual clock progress releases a stale promise gate, with
identity guarding its late completion. Keep frozen queue blocking and cleanup.
No replacement context/media element, new timer/RAF/listener, sound parameter,
artwork/debris/gameplay/account change. GamePage and GameAudio remain identical.

91 focused tests plus TypeScript, 12 locales/build and audio lint pass. Five new
fault/gesture cases cover the demonstrated path. Two historical comparisons
are explicitly excluded because old Git objects lack their source files; the
newer whole-GamePage guard and actual current Admin callbacks pass. Lifecycle
fixture now supplies the native resume API; an earlier recovery assertion was
updated to include sounds admitted on measured progress before promise settle.
The new pending-native test also caught a music coalescing order issue, fixed
before the final passing run. See docs/audio-gesture-recovery-20261021.md.
Continue the owner's authorized Testnet audio correction only; keep Mainnet,
all fixed published/rollback refs and earlier log/protection denials intact.
Candidate branch codex/audio-gesture-recovery-20261021 has auto deployment off.
No actual iPhone audible recovery or Whitescreen-cause proof is established.

## Audio correction Testnet release, 21 October 2026

The owner's "Okay, dann machen wir das mal" authorizes the prepared audio
correction on Testnet, superseding preparation-only status below. Keep debris,
artwork, sound parameters, gameplay, accounts and Mainnet unchanged. Fixed
source is b026a194cdb596349b041c910d22b115eeb1560b, tree
4257adb659718cce79af3558bcef4b9d2f4c74bd, branch
codex/audio-clock-recovery-20261021. Rollback is
backup/testnet-before-audio-clock-recovery-20261021 at 4c25790a.
The separate codex/audio-clock-release-record-20261021 branch is evidence only,
automatic deployment disabled; do not deploy it. See
docs/audio-clock-release-20261021.md and its sibling evidence directory for
final status, delivered checks and limits. Official READY production is
dpl_BVG5yfJDSWjS3ETXK5xS1MAUDtti (44.787-second build). Preview guest start,
Pause, countdown and resumed play pass. Delivered source/tree, eight new audio
features, prior memory/cleanup/owner/handoff features, unchanged API/score hashes,
anonymous Admin denial and fresh enabled official Home pass. Preserve the earlier runtime-log and
protection-bypass denials. Device audibility and Whitescreen recovery still
require the owner's actual iPhone test.

## Audio clock/voice recovery, 21 October 2026, preparation

New owner report: continuation from level 21 has no music/effects; pause can
occasionally leave audio hanging. Registered sources grow 0→2060 (2086 at the
last transition), unlike the preceding normally sounding run's small counts.
The fresh trace passes boss 30/bonus and level 35, then records normal level 36
at 19:06:45.128 Vienna, before the new document at 19:06:47.432. The old bonus-20
unexpected-restart record is historical. Do not identify this latest exit as
bonus-only, nor infer audio-clock freeze/native memory/OS cause from state=running.

Prepare from fixed official 4c25790a / 88063f6 plus its receipt. Scheduled sources
need independent audio-clock end deadlines (one-second grace), not only ended.
Observe a running clock across frequent foreground playback requests; block
further source allocation if it stops for two seconds. Clear the frozen queue
and attempt one same-context suspend/resume per stall, coalescing pending work.
Pause releases all registered sources including fading weapons and silences
the music graph during pending play; explicit Resume restarts paused running
graphs using the same unlocked context/element, before account/countdown work.
Keep all buffers, samples, gains, envelopes, overlap, regular playback and seek
position. No extra timer/RAF/listener, context recreation, waveform change or
gameplay/UI modification. Five bounded evidence fields join existing owner-only
resource snapshots; no new transmission or ordinary-player diagnostics.

Controlled negative case retains 2086 sources in preceding runtime; candidate
stays at <=21 before stopping further allocation and drains to zero. 10,000
missing-ended pairs remain bounded; 500 healthy groups match old scheduling
parameters. Focused tests/build and their limits are in
docs/audio-clock-recovery-20261021.md. One historical source comparison cannot
run because its old Git object lacks GamePage; exclude it explicitly and keep
the newer whole-GamePage parity guard with exact audio/diagnostic normalization.
No physical iPhone audio output, native memory or Whitescreen-fix proof.
Keep codex/audio-clock-recovery-20261021 automatic deployment disabled. This
new correction is prepared, not published; preserve official Testnet, Mainnet,
fixed source/rollback refs and the runtime-log/protection-bypass denials.

## Hull handoff Testnet publication, 21 October 2026

The owner's subsequent instruction explicitly authorizes publication to Testnet
with all other outstanding uploads. It supersedes preparation-only status below.
Source is fixed at 4c25790a8b7173edda9f2ef9370f0251e716f668 / tree
88063f617e2321705b19af0dfb3dcb22b6bce491. Official Testnet READY deployment
dpl_EaTGHQkt3sRPmYY5ifvLK8bwvnfj built in 42.299 seconds. Delivered handoff,
memory, cleanup, owner recorder, anonymous Admin denial and unchanged API/three
score hashes pass; public Home has Spielen enabled. Rollback branch is
backup/testnet-before-hull-handoff-20261021 at f85360ed. All completed glow,
reactor, cleanup, memory and owner recorder work was already live in that base;
the handoff is the only outstanding runtime patch. Historical small-turret work
was already published on 20 October. Do not reintroduce older branches or the
rejected reflection prototype. See docs/hull-handoff-release-20261021.md and
the before/after/release evidence in its sibling directory. Receipt branch
codex/hull-handoff-release-record-20261021 has auto deployment disabled and
must not be deployed. Mainnet and runtime-log permission denial remain intact.

## Hull preparation handoff, 21 October 2026, tested preparation

The owner requests investigating graphics preparation/release after the new
f85360ed report reaches normal level 19 then starts a new document. Exact last
resource-normal-start is 17:26:09.359 Vienna; saved ring 09.381; document origin
10.981. The final phase-complete-only ring does not locate a synchronous throw:
the probe flushes the old phase before recording the next phase and throttles
the subsequent write. No JavaScript fault is present; Long Tasks is unsupported.
Do not assign an OS/GPU/thermal cause or claim the new failure is boss-only.

Real native painting/cache and actual React tests demonstrate a conditional
handoff fault: if current hull reads make the prewarmed next hulls older in the
LRU, cleanup of the old plan unpins everything before the next setup and evicts
six fully prepared incoming hulls. Level 18→19 then paints twelve instead of six.
Acquire the next plan before releasing the preceding plan; release the last plan
on unmount/StrictMode cleanup. Keep all plan keys, raster/shader/artwork/pixels,
source preloads, cache budgets, mounted pins, cancellation and simulation rules.
No new timer, RAF, extra forward prewarm or cache-budget increase. Savings depend
on LRU order; normal warm-next order needs six jobs in both versions.

22 hook/owner/cache tests, two native painting transition controls, eleven
existing native lifetime cases, hook lint, build/12 locales and actual GamePage
30-section/three-boss host pass. The latter stubs presentation/audio/accounts.
Full GamePage matches official f85360ed after the isolated hook substitution;
paintedShip.ts/resourceCache.ts/asset/CSS contents are unchanged. React renderer
QA uses matching installed 19.2.4; no production dependency change. Test renderer
deprecation and existing large-bundle warnings remain. No physical iPhone/native
memory, universal FPS/50% savings or interruption-fix proof.
Preparation only: keep official Testnet f85360ed and every fixed ref/Mainnet.
Automatic deployment is off on codex/hull-preparation-handoff-20261021. Do not
deploy this preparation without a separate release instruction. See
docs/hull-preparation-handoff-20261021.md and its evidence JSON.

## Completed owner flight recorder Testnet release, 21 October 2026

The owner's explicit Admin-only publication request is complete: official
Testnet READY dpl_5yuZonhFwMq5WXLgVTYmtrMGnMyW at
f85360ed464fb75944ada0c3f1d22776c4df31ca / tree
2aac1e929e8992b9d93b5de0ffaf8675effc6f00. Ready 17:14:42.139 Vienna,
build 43.259 seconds. Keep codex/owner-flight-recorder-20261021 fixed there.
Immediate rollback: backup/testnet-before-owner-flight-recorder-20261021 at
cc5ef227 / old READY dpl_8zBFheLX2x4hLUMTYUxChv4exrts. Preserve all older refs.
Preview guest start/pause/countdown/resumed play pass. Protected-preview HTTP
helper returned 403 read_protection_bypass; no retry or bypass. Existing authorized
browser UI rendered normally. Production separately rebuilt the same exact source;
it is not the identical preview binary. Delivered GamePage/Admin source/tree,
eight owner recorder features, previous six cleanup/eight memory features, four
production QA exclusions, anonymous Admin denial and unchanged API/three score
hashes pass. Fresh public Home loads with Spielen enabled; screenshot saved.
29 focused diagnostics re-run and 72,000 synthetic native recorder frames plus
document reload/archive/cleanup pass. No authenticated owner/Pi login or physical
iPhone/heat/GPU/termination-cause proof. Runtime logs remain unqueried after the
earlier permission denial; drains not inspected. No account or Mainnet mutation.
Subsequent receipt branch codex/owner-flight-release-record-20261021 is evidence
only with automatic deployment disabled. Do not deploy it. See
docs/owner-flight-release-20261021/{release.json,before.json,after.json,testnet-ready.jpg}.
The preparation-only status below is historical and superseded for this release.

## Owner flight recorder, 21 October 2026, preparation only

The owner asks for additional evidence if the iPhone interruption recurs, then
"setze fort". Add only a verified-owner Testnet rolling timing recorder using
the existing simulation/scene/resource hooks. Ordinary players must not obtain
storage or a timing lease. Keep 30 aggregate windows (~60 active seconds), save
about every two seconds and sample expensive runtime counters at most every
ten seconds. Preserve the previous run before the first substantive new write;
loading/StrictMode cleanup must not overwrite it. Separate keys from the armed
90-second capture; its expiry must not stop the ring. Preserve compiled asset
basename/line/column for faults, never raw messages/stacks/URLs or account data.
First fault bypasses the normal write throttle once; repeat faults remain bounded.
No new timer, RAF, listener, UI or network. Preserve all simulation, visuals,
audio, account and recovery code exactly. No physical temperature/brightness,
GPU/process-memory or OS termination-cause measurement is available here.
This preparation is NOT published. Keep official Testnet cc5ef227 and fixed
source/rollback refs, Mainnet and runtime-log permission denial unchanged.
Automatic deployment is disabled on codex/owner-flight-recorder-20261021.
See docs/owner-flight-recorder-20261021.md for tests, limits and the historical
test blocked by an unavailable old Git source object.

## Completed combined cleanup Testnet release, 21 October 2026

The owner's explicit publication request is complete. Official Testnet READY
dpl_8zBFheLX2x4hLUMTYUxChv4exrts, runtime
cc5ef2276feb651edcf0681222865e8c957f8a4e, tree
5d2a7002beedd357d17e68a4f46e33bc01204b64, ready 16:49:47 Vienna,
build 43.571 seconds. Both finished-hit/debris and spent boss source cleanup are
now included. Keep codex/testnet-effect-cleanup-release-20261021 fixed there.
Immediate rollback: backup/testnet-before-effect-cleanup-20261021 at 171cb5c,
old READY dpl_729MdmJke7jMhhX28Ukh8EqbXo8T. Preserve all older fixed refs.
Combined 44 focused tests, 12 locales/build, 3300 native CPU weapon RGBA pairs,
600 DOM/120 PNG finished-effect pairs, 120 native browser weapon RGBA pairs and
Canvas cadence/lifecycle pass. Preview guest start/pause/countdown/resumed play
is observed; an automation second-pause deadline is not a passing second pause.
Production rebuilt the same source with production settings; it is not the
identical preview binary. Delivered GamePage/Admin commit/tree, six cleanup and
eight previous memory features pass. API/anonymous Admin denial/three leaderboard
status-length-hashes equal the fresh baseline. Four production QA exclusions and
fresh enabled official Home pass; saved screenshot is available. Runtime logs
were not rescanned after the prior permission denial; build-log endpoint 404 is
not zero errors. No Pi authentication, physical iPhone heat/GPU memory/Whitescreen
fix proof, account mutation or Mainnet contact. Do not deploy subsequent receipts;
disable automatic deployment on codex/effect-cleanup-release-record-20261021.
The earlier preparation-only notes are historical. See
docs/effect-cleanup-release-20261021.md and its release.json/after.json evidence.

## Combined effect cleanup release approved, 21 October 2026

The owner explicitly requests "bitte veröffentlichen" after both prepared
cleanup steps. Publish the combined finished-hit/debris and spent boss-weapon
source cleanup to the EXISTING Testnet project only. Base is official
171cb5c4507a1530a9bbb080d61805be0da545f7 / tree
490b444be6bb87e8a4438c06b3c4bc86114a486f / READY
dpl_729MdmJke7jMhhX28Ukh8EqbXo8T. Preserve existing fixed references;
create backup/testnet-before-effect-cleanup-20261021 at that source before
publishing. No Mainnet, account, payment, API or durable-state mutation.
Combine exact tested runtime changes from 5c6cc88 (finished effects) and
f3e8728 (spent boss weapon source). Validate the combination and actual delivered
identity/features. No CSS, artwork, visible durations, resolution, simulation,
audio or account changes. Do not deploy the intervening thermal/reflection
audit commits. No iPhone interruption/heat/GPU memory fix claim is established.
The owner already confirmed whole-display dimming, hot/warm phone and charging;
do not ask again. Runtime log scan was previously permission-denied: do not
work around that denial or claim a clean runtime log scan.
Use fixed source branch codex/testnet-effect-cleanup-release-20261021 with
automatic deployment disabled; release explicitly using the verified project
and commit. Later receipts belong on a separate non-deployed record branch.
This explicit authorization supersedes the preparation-only status below.

## Finished hit/debris cleanup, 21 October 2026, tested preparation

The owner requests combining finished-hit cleanup with inspection of long-lived
debris/flames, slowly and without optical downgrades. Base this candidate on exact
official runtime 171cb5c4507a1530a9bbb080d61805be0da545f7, tree
490b444be6bb87e8a4438c06b3c4bc86114a486f. Step 2 has now been published:
READY dpl_729MdmJke7jMhhX28Ukh8EqbXo8T, ready 13:28:11 Vienna; completed
receipt 65e05fd340febf8d04cb4e9d95cfc4571abd10b5 is on
codex/reactor-door-reuse-release-record-20261021. Preserve fixed source
codex/reactor-door-reuse-20261021 and rollback
backup/testnet-before-reactor-door-reuse-20261021 at 540d73e. This supersedes
the historical Step 2 preparation-only baseline below.
The intervening reflection prototype was rejected: strict pixels differ and
native resource measurement is unavailable. Audit e1d163e is on
codex/boss-reflection-audit-20261021; do not ship its display:none prototype.

FinishedEffect releases transient DOM only after all native child/pseudo
animations finish; paused/running/delayed/infinite children prevent retirement.
Missing/throwing native inspection retains original parent ownership. Keep
existing keys for replacement hits, permanent heat masks and the falling boss.
Canvas draws unchanged visible ages, clears once after the last fragment and
sleeps until new registration; retain bounds, resource pins, surface dimensions,
original parent lifetime and two-second idle grace. No new timer or RAF chain.
GamePage's entire component body, all CSS/artwork and drawImpact remain byte
identical. Visible times stay: normal fire 880 ms, smoke 1450 ms, debris
2120+0..44 ms; boss final debris 2550+0..44 ms. Logical 2250/3400-ms ownership
still controls gameplay/recovery. Do not shorten live effects in this cleanup.
600 native DOM/120 strict software-rendered PNG pairs, 275 Canvas RGBA pairs,
native pause/new-hit/delayed/infinite/fallback/final-cleanup checks, 5000 React
hits, Canvas cadence/sleep/wake/max-delay/lifecycle checks, 26 focused tests and
release build/12 locale tests pass. New helper/HullDamage lint is clean; baseline
GamePage four warnings and CanvasEffects twenty errors remain unchanged.
No physical iPhone/WebKit GPU, memory, heat, FPS or interruption-fix proof.
This is preparation only. Disable automatic deployment on
codex/finished-hit-debris-cleanup-20261021; keep official Testnet at 171cb5c,
Mainnet and all fixed refs. No new publication instruction accompanies this step.
See docs/finished-hit-debris-cleanup-20261021.md and its evidence directory.

## Step 2: reactor door reuse, 21 October 2026, tested preparation

The owner requests the next small stability step without optical downgrades.
Base this candidate on official runtime 540d73e7b5a89a3098a6c6404bd3deac8f269cd3,
tree e2530e7824a44992e41b612153a48b9df2174345, READY production
dpl_NnTPP38Gm8UZUaAUzj7q4uCUq4U8. Step 1 was published and verified; completed
receipt f68eca3 is on codex/idle-rock-surface-release-record-20261021. This
supersedes the historical Step 1 preparation-only baseline below.
Reuse the two exact textured reactor-door React subtrees by primitive rendered
opening/image/layout/metal/ID values. Keep pulse CSS, filter, phase, colour,
opening/recoil/muzzle, resolution and all simulation/audio/account code.
7,804 exact React host trees pass across all fifty bosses/three widths. Per
1,200 updates, charge JSX allocations fall from 21,600 to 3,600 and recoil from
22,800 to 4,800; opening stays 21,600 and closed stays zero. These are component
element counts, not GPU/process-memory or FPS improvement percentages.
Native Chromium passes 1,050 exact DOM comparisons, 120 native-clock updates
with the same pulse/images/animation, and complete cleanup. All 90 strict PNG
comparisons pass with GPU/accelerated-2D disabled. The initial default renderer
has 7/90 one-RGB-level mismatches; the identical-baseline control also has
13/90 one-level mismatches. Preserve these failed evidence files and do not
claim default-renderer/GPU equivalence or a physical iPhone interruption fix.
Fourteen boss/core/weapon tests, hooks lint and build/12 locale tests pass.
Disable automatic deployment on codex/reactor-door-reuse-20261021. This is
preparation only: preserve official 540d73e, Mainnet and all fixed source/rollback
refs. Publication of this new step needs an explicit owner release instruction.
See docs/reactor-door-reuse-20261021.md and its evidence directory.

## Step 1: idle rock surface, 21 October 2026, tested preparation

The owner requests a slow, step-by-step audit with no optical downgrade. This
candidate changes only idle BonusRockLayer backing-store lifetime, based on exact
official Testnet a51ce39e3199aeafc1101e30bb6f8aa53bf7cbab (READY production
dpl_33bDNneTxC4RVXRWFYnrexuqFp9X; completed receipt 879d0a8). Start its canvas
at 1x1; retain the original active resolution/drawing/CSS/textures. Clear the
last visible frame once. After >=2000 ms empty, shrink on the next existing
scene update; do not add timers/RAF/polling. Pausing may defer idle shrink until
the next scene update. Explicitly zero the surface on unmount. Keep the seven
shared rock textures and all simulation/account/audio/rendering elsewhere.
Native Chromium with accelerated 2D disabled passes 936 exact RGBA comparisons
and 72 reuse/release cycles over three viewports/DPRs, including first frames
after growth, brief gaps, dust/chips/final fragments, no stale content and
unmount. Timing diagnostics are stubbed and idle time controlled in this QA.
Initial accelerated exact comparisons had small RGB differences; a baseline-
versus-baseline self-control reproduces the same 99-pixel/max-channel pattern.
Do not claim accelerated WebKit/GPU equivalence or an iPhone crash fix. Twelve focused
gameplay tests, component lint and release build/12 locale tests pass. Disable
automatic deployment on codex/idle-rock-surface-20261021. This is preparation:
keep Testnet at a51ce39 and all existing fixed refs; publication of this new
step needs an explicit owner request. See docs/idle-rock-surface-20261021.md.

## Static boss glow, 21 October 2026, tested preparation

The owner requested unanimated boss damage glow visible by half turret armour.
This candidate starts at official runtime 8a603e553845507245c99851dea0408bbb74be40
(previous completed open-reactor receipt: 26c0035). Living guns use one fixed
orange sprite from <=50% armour until destruction; retain actual aim/recoil/fire
and sprite clipping. Boss hull ember marks have stable React keys/profile and no
cool/flicker/speck animation; ordinary ships and short hit bursts stay unchanged.
All fifty bosses/392 guns pass threshold, fractional HP/resume, allocation/reuse
and release checks. Native Chromium passes 150 boss/width cases and 500 further
hit replacements with zero persistent glow animations, stable nodes and complete
unmount cleanup; focused 25 tests, component lint and release build pass. This is
not zero rendering cost or proof of an iPhone Whitescreen fix. Keep automatic
deployment disabled on codex/static-boss-glow-20261021. This task has no new
publication request: preserve current Testnet 8a603e5 and fixed release/rollback
refs. See docs/static-boss-glow-20261021.md for evidence and limits.

## Open-reactor effect audit, 21 October 2026, isolated preparation

The owner explicitly resumed the hit/ember/reactor investigation. Base this
candidate on official a210180 plus its 5569c4b release receipt. Retain fixed
reactor SVG children across changing charge/open/recoil values; preserve actual
host markup, native pulse/filter, doors, muzzle, clipping, image, simulation and
all account/audio/HUD behavior. Actual React checks pass 7,804 exact host trees
across fifty bosses/three widths. Opening/charge creates 21,600 instead of 85,200
JSX objects per 1,200 steps; recoil 22,800 instead of 86,400. This is not a 74%
GPU/process-memory/FPS improvement or a demonstrated Whitescreen fix. Five
thousand actual HullDamage hit updates keep eight sites/23 host nodes; controlled
native finish/cancel delivery releases all pacing entries after 16,025 creations.
Native Chromium passes 250 exact SVG comparisons and fifteen exact screenshots
at a controlled snapshot state (CSS animation disabled only during capture).
Five hundred further native hit replacements on a fresh document keep at most
64 controller entries and return all entries/native animations/nodes to zero.
This does not prove Safari event delivery or browser-owned surface retirement.
Thirty focused tests, component lint and release build (12 locales) pass.
Keep automatic deployment disabled on codex/boss-effect-audit-20261021; do not
move Testnet/Mainnet or any fixed refs without an explicit publication request.
See docs/boss-open-effects-20261021.md and its evidence directory.

## Normal-resolution memory reduction authorized, 21 October 2026

The owner explicitly approved cleanup plus lower resolution and clarified:
"es ist kein high end game, es genügen normale auflösungen!!!!" This supersedes
the historical full-resolution prohibition only for this reduction. Normal
explosion/debris and boss weapon raster density now cap at 1.5; rocks already
do. Preserve CSS sizes, drawing/timing, HUD/text, hits, sounds, saves and accounts.
Painted hulls keep six unused variants with 24-entry/12-MiB soft budgets; all
mounted/preparing pins are protected. Canvas keeps two unused hulls and four
texture entries after every consumer/draw record releases them; zero retired
texture canvases, retain the two-second surface reuse grace and original fallback.
Do not purge live/preparing resources, force reloads, add timers/RAF chains or
claim whole-process memory is down 75%: that ratio applies only to 3x -> 1.5x
effect backing stores. Baseline/rollback is e7b49fe / dpl_6uZ96rZE714sudgnFuzsjYTSxtcF.
33 focused + 14 painting lifetime checks, 275 normal-density effect pixel and
500 boss pixel comparisons pass. Unchanged-density comparisons are NOT equality
to the former high-density output. New helper/cache/BossWeapons lint passes;
paintedShip retains its pre-existing set-state-in-effect error. New memory-work
QA page is protected-preview-only and must be absent from production. Keep
automatic audit-branch deploy off, all fixed release/rollback refs and Mainnet.
See docs/normal-memory-release-20261021.md for current verification/release state.

Completed Testnet release: READY dpl_FNcYt4WQLGefzmbrEhp7Qow6bS5C, source
a21018085b9ea522a6e5fd7b13f26251ff5a9823, tree 40d8ac846830d7670bdd9a26ec498ef06ff42a46,
ready 21 October 2026 05:09:01.536 Vienna (03:09:01.536Z), build 39.032 seconds.
Keep codex/testnet-normal-memory-release-20261021 fixed at that runtime. Immediate
rollback: backup/testnet-before-normal-memory-20261021 at e7b49fe / old READY
dpl_6uZ96rZE714sudgnFuzsjYTSxtcF. Delivered source/tree plus all eight memory
features, unchanged API/admin denial/three leaderboard hashes, four production
QA exclusions and fresh official Home pass. Protected native Chrome comparison
passes ten checks; guest start/pause/resume passes. Runtime log API returned 403;
do not represent that as zero errors or work around the denied operation. This
is not physical iPhone memory/heat/presented-FPS or Whitescreen-fix proof. Mainnet
was not contacted. Subsequent receipts/tests/docs are evidence-only: do not
deploy those commits or move any fixed refs. The older preparation-only baseline
instructions below are historical and superseded by this completed scoped release.

## Owner second-boss interruption report, 21 October 2026

New v5 report on e7b49fe ends with a visible active sector-20/boss-2 session,
then a new document; no Home intent/normal stop is present in the available
window. The owner subsequently confirmed "wieder von allein": this run returned
spontaneously, not by menu exit. Do not ask that question again. Uploaded-file
search found only the older 19 October Jetsam log, not a matching 21 October file.
This is an unclosed-session/document-replacement signal, not proof of
a browser kill or its cause. First core shot creation/audio/scene commit finished
within 4 ms; the final heartbeat is 7.452 seconds later. Actual new-document
start is 4.954 seconds after that heartbeat. Lazy verified Admin diagnostics
record boot 19.091 seconds after document start; do not call that the reload gap.
Known caches plateau (48 painted, 8 Canvas textures, 46 audio buffers); final
estimate 39,428,372 bytes excludes native/GPU/process allocations. Do not infer
no native leak or sustained FPS from those counts/sparse frame samples. Latest
timingCapture is null; the earlier targeted capture remains valid for its own
run. No new runtime fix/deployment is supported by this evidence-only review.
25 diagnostic tests pass. Missing boundary is the physical event and matching
iOS termination record around 04:25:43–04:25:48 Vienna, 21 October. Do not assign
older unattributed Jetsam logs to this run or demand the same 90-second test
again by default. See docs/iphone-boss2-interruption-20261021.md. Keep Testnet at
the fixed e7b49fe release and Mainnet untouched; do not deploy this audit entry.

## Owner capture and projectile presentation, 20 October 2026, completed Testnet release

The owner's 19:17 UTC v5 capture is current bdf8b0a, has zero discarded time in
every pacing sample, and ends through pause/home-intent/monitor-stop. Do not call
it a reproduced abrupt crash or proof of an intentional human tap. The exposed
boss loses RAF cadence while measured simulation stays cheap; native/GPU cause
is unproven. Cumulative CSS configured=15034 is not active animation count.
Projectile DOM now reads the final simulation state once per existing <=60-Hz
game RAF, independent of the compact-phone 32/50-ms scene interval. The empty
React mount reserves its children for this presenter: retain live nodes only,
remove hits/clears immediately, dispose on unmount, and do not add a second RAF,
extrapolation, account state or collision rules. Preserve authored CSS artwork,
rotation and player-before-enemy order with independent translation. Live
engine thrust is already smoothed in advanceShipMotion; suppress its redundant
140/160-ms height transitions only inside the game field. Preserve flame art,
glow and original 110-ms response, accepting removal of the second response lag.
89 focused tests and three 30-normal-section/three-boss host campaigns pass.
60-Hz gameplay hash matches bdf8b0a exactly. New module lint/typecheck pass;
GamePage retains its 63 pre-existing hook compiler errors/four warnings. Native
comparison passes 58 native style/bounds cases, 120 versus 60 position updates
in 120 ticks, and 476 versus zero thrust-height transitions with four flames.
Guest start/pause/resume and freshly loaded official Home pass. Production QA
pages are excluded. Testnet READY dpl_6uZ96rZE714sudgnFuzsjYTSxtcF, source
e7b49fed4c29baf021d9f0af56fead66ff7d02b7, tree 2106d405572faf19a8ced7606f13dca31be65910,
ready 21:36:37.965 Vienna (44.174 s). Keep the fixed release ref
codex/testnet-projectile-presentation-release-20261020. Immediate rollback:
backup/testnet-before-projectile-presentation-20261020 at bdf8b0a /
dpl_Ai2j6jAyoxvC5mWESvKKBK1bMAKU. Delivered GamePage/Admin identity and actual
presenter code match. Anonymous API/admin denial/three leaderboard hashes match
the fresh Testnet baseline. Do not deploy subsequent evidence-only commits.
Keep every existing fixed release/backup ref. Mainnet read comparison was denied
by automatic review; public HTTP checks are Testnet-only. No Mainnet operation.
See docs/iphone-capture-projectiles-20261020.md and projectile-presentation-release-20261020/.

## Continuing boss render investigation, 20 October 2026, completed Testnet release

The owner asked to continue after the simulation-time release. The closed
BossReactorView recreated 85,200 JSX elements in 1,200 unchanged scene frames.
Reuse the last SVG tree by its actual rendered primitive values, not mutable
boss/core object identity. Include muzzle opacity explicitly in dependencies;
hooks lint is clean. All 4,201 actual React host-tree comparisons match across
50 bosses, three widths, opening/recoil/color/resize/replacement/death/restoration.
33 focused tests, 12 locales, release build and preview-fixture typecheck pass.
Keep the actual SVG markup/artwork, native animations, simulation, shot timing,
audio, accounts and Mainnet unchanged. A protected-preview-only reactor comparison
is bundled alongside the existing animation fixture; neither belongs in production.
Do not infer iPhone memory/heat/Whitescreen resolution from JSX operation counts.
Protected Chrome preview passes 135 direct SVG/DOM comparisons on five bosses and
three widths. Official Testnet READY dpl_Ai2j6jAyoxvC5mWESvKKBK1bMAKU, runtime
bdf8b0a9edda1d878c47fddb59ab3ec3b20c7e26, tree b321345f44d9e03c5d6e38af8805b5cd2dfd2de0,
ready 21:05:27.714 Vienna (49.047 s). Keep codex/testnet-reactor-render-release-20261020
fixed. Immediate rollback: backup/testnet-before-reactor-render-20261020 at 7bf0e9b /
dpl_HE3FFtbQEhAVwGx7Qn2mFr5wLU35. Delivered GamePage/Admin identity and the actual
powerUps chunk's 16-dependency reactor useMemo are verified. API/admin denial/
leaderboard hashes and Mainnet HTML match the fresh baseline. Official Home reload
passes, and both QA URLs are excluded from production. Preserve all previous
fixed release/rollback refs. Evidence/test-only commits must not be deployed.
See docs/reactor-render-work-20261020.md and reactor-render-release-20261020/.

## Projectile slowdown correction, 20 October 2026, completed Testnet release

The owner explicitly reported repeatedly slowing shots and requested correction
as part of the continuing iPhone investigation. This supersedes the historical
single-step/34-ms-total-frame preservation requirement only for the proven time
loss: the previous loop simulated 680 ms per 1000 ms at 20 Hz. Keep each collision
step <=34 ms, consume frames in at most four bounded substeps, publish only the
final scene/direct ship styles per RAF, and retain the shared 60-Hz scheduler and
compact-phone paint backpressure. No backlog after extreme >136-ms frames; the
existing foreground-stall pause remains. Paused/background time must not consume
movement or equipment timers. Probe totals are once per original RAF, not per
substep. The actual GamePage host checks movement of both shot types and timers
at 60/30/20 Hz, 88-ms and jittered delivery. 66 focused + 62 boss/input tests and
release build pass; two 25-normal-sector/two-boss host runs pass. One old isolated
boss test needed ownerDiagnostics=false in its host; runtime destroyBoss is unchanged.
The 60-Hz gameplay trace hash
exactly matches the preceding source. Hardware/presentation/audio/API are stubs
in these host tests; none proves an iPhone heat or Whitescreen fix. The resource
audit found bounded boss/image/canvas lifetimes; do not invent a proven native
leak. Official Testnet is READY dpl_HE3FFtbQEhAVwGx7Qn2mFr5wLU35, runtime
7bf0e9b755cdbcd4cb41bb8cdaa70a4686174996, tree cd5aa604ee210ed3382ee6176f69c26b7ea27603,
ready 20:37:21.381 Vienna. Keep codex/testnet-simulation-time-release-20261020 fixed.
Immediate rollback: backup/testnet-before-simulation-time-20261020 at e0bc53f /
dpl_3uJJPe98c6KMK7K7jpU3z8fHPDH8. Delivered source/tree and bounded helper match;
anonymous API/admin denial/three leaderboard hashes and Mainnet HTML match baseline.
Preview guest start/pause/resume and fresh official Home pass in remote Chrome.
No physical iPhone or Pi authentication proof. Preserve all prior fixed refs;
do not deploy later evidence/test-only commits. See docs/simulation-time-20261020.md
and docs/simulation-time-release-20261020/release.json, testnet-ready.jpg.

## Native animation timing / iPhone research, 20 October 2026

The owner's broad investigation/fix instruction and continuation are complete for
the demonstrable CSS-clock overhead and report-evidence gaps. Official Testnet is
READY dpl_3uJJPe98c6KMK7K7jpU3z8fHPDH8, runtime e0bc53f3ea73bc127aab8ad4bc67c463c0a92464,
tree 78e2f71b106c5c62e91d6aeaf9deb3e30118a1a0, ready 20:02:13.712 Vienna.
Keep codex/testnet-native-animations-release-20261020 fixed. Immediate rollback:
backup/testnet-before-native-animations-20261020 at d6419c5 / prior READY
dpl_2L5un3yvfZ5YiVYP8DEeHYMZKii1. Preserve every older fixed ref and Mainnet.
Replace the prior manual CSS currentTime/playbackRate=0 pump with native stepped
effect timing: keyframes/easing inside keyframes and native clocks/durations/
pause/end semantics remain. Nonlinear outer timing uses a detached timeline-free
one-time probe and a bounded native staircase cache. Keep the shared 60-Hz own RAF
scheduler; do not restore per-frame CSS seeks. Unsupported cases fall back to
ordinary native playback, so do not promise a hardware-wide hard refresh lock.
Remember the installed canonical easing string when restoring it (Chrome rewrites
steps(n,end) to steps(n)); initial preview caught this, corrected preview passes
14/14 native checks including 1440 curve comparisons, pseudo/transition/pause/end
and cancel cleanup. 156 targeted code tests, 12 locale tests and release build pass.
Owner run contexts now include sanitized build/pacing identity, and verified active
Admin report loading installs the bounded boot diagnostics. Reporting runtime is
separate from old-run identity. Keep permission/active-view guards before storage.
Actual old/new controller comparison: 24 running + 24 paused effects, 2 seconds at
120-Hz host: 2880 -> 0 visible clock writes; this is not thermal/memory proof.
Existing October 19 Jetsam log proves a WebContent per-process-limit kill near
2.01 GiB but no site attribution or relationship to today's failure. Latest game
report ends mid-boss 1, no Home intent/error, new document 2.388 sec later.
Physical iPhone native memory/heat/Whitescreen cause remains OPEN. Do not claim a
complete crash fix. Next useful controlled device step is direct boss 1 with the
existing 90-second owner timing capture, not nine normal blocks. Preserve artwork,
audio, gameplay, saves, accounts and Mainnet. Automatic audit-branch deploy stays
off; do not deploy later evidence/docs commits. See
docs/iphone-webkit-research-20261020.md and native-animations-release-20261020/.

## Completed global 60 Hz Testnet release, 20 October 2026

The owner's 19:04:04 Europe/Vienna instruction authorized completing the prepared
global-cap release. Official Testnet is READY dpl_2L5un3yvfZ5YiVYP8DEeHYMZKii1,
runtime d6419c5946a660173a7b59e5d6edc63e6322ee7a, reviewed tree
5360d798e8fc301bfcc27a600a0fd0a81c8c261c, ready 19:17:51.804 Vienna (40s).
Keep codex/testnet-global-60fps-release-20261020 fixed there. Immediate rollback
is backup/testnet-before-global-60fps-20261020 at 30b8b23 / READY
dpl_5s1S5thJ7ps83dy4ZXkeiS7JWcGr; preserve every older fixed release/backup.
Native browser acceptance is now complete in a normally deployed protected HTTPS
preview, without bypassing the earlier local-file/browser restriction. The initial
pseudo check needed subtree inspection; dynamically started pseudo animations also
needed event-target subtree discovery. Both are corrected, with a new regression.
All ten native checks and 121 targeted code tests pass. Preview-only multi-page
build input excludes the QA page from production; its official URL serves the
ordinary app fallback. Delivered source/tree, 60 Hz deadline, CSS/manual clock,
event/pseudo/portal discovery and cleanup are independently verified after rebuild.
API, anonymous Admin denial, all three Highscore response hashes and artwork match
the fresh baseline. Mainnet remains 907d2a7 with identical HTML and entry. A bounded
ten-request Dashboard scan shows zero warning/error/fatal records. Preview Chrome
still reports extension metadata errors and Pi SDK messaging timeouts; do not call
the browser console entirely clean or claim Pi authentication was tested.
No account, save, payment, security or Mainnet mutation. Continue documentation on
the audit branch with automatic deployment off; do not deploy later docs commits.
Physical iPhone heat/presented FPS/Whitescreen cause remain unproved; manual CSS
sampling has unmeasured main-thread cost and unsupported APIs retain native fallback.
See docs/global-60fps-release-20261020/release.json and testnet-ready.jpg.

## Global 60 Hz preparation requested 20 October 2026, 18:44:07 Vienna

The owner explicitly expanded the previous effect-only cap to the whole game.
All own RAF call sites now use lib/frameScheduler.ts: one shared native chain,
60 Hz target with original timestamps, 1 ms rounding tolerance and no catch-up
burst. Main-loop guard, 34 ms delta clamp, slower mobile React/24 Hz Earth-network
cadences remain. Touch accepts state immediately but publishes ship DOM position
on the same capped tick. CSS/SVG/transitions and the Galaxy Web Animation use
lib/cssFramePacing.ts; body scope includes React portals. Keep authored artwork,
keyframes, durations, easing, resolution, sounds, rewards, accounts and saves.
This explicit request supersedes older no-global-governor/cadence restrictions
only for the 60 Hz work. No removal or quality reduction is authorized here.
120 targeted tests, 12 locale tests/release build, Canvas cadence/lifecycle and
275 exact native RGBA comparisons pass. Actual GamePage host at 120 Hz passes
25 normal sectors/two bosses, stress/pause/recovery and complete cleanup.
Native browser CSS/end-event verification remains OPEN: remote browser could not
reach localhost, then blocked a local-file URL by policy. Do not circumvent this
restriction or claim that the browser fixture or iPhone heat/crash was verified.
The CSS controller shifts sampling work to JS; thermal savings are unmeasured.
Unsupported/failed Web Animations fall back to native playback and are therefore
not guaranteed capped. See docs/global-60fps-20261020.md and its results JSON;
frontend/scripts/fixtures/frame-pacing.html contains the native-browser checks.
Preparation only: official Testnet remains runtime 30b8b23; no publication was
requested in this step. Preserve all fixed release/rollback refs and Mainnet.
Automatic audit-branch deployment stays off. Native browser acceptance is still
needed before public release; do not present this as a confirmed Whitescreen fix.

## Completed Canvas effect 60 Hz Testnet release, 20 October 2026

The owner's 17:54:30 Europe/Vienna instruction explicitly authorized publication.
It is complete: official Testnet READY production dpl_5s1S5thJ7ps83dy4ZXkeiS7JWcGr,
runtime 30b8b2326b9514c066edbdf23c4f5dc61f15a14c, reviewed tree
f43ffb18477b1d6055793b4f6ec46e58b6ecdb17, ready 18:04:25.539 Vienna (45s).
Keep codex/testnet-canvas-60fps-release-20261020 fixed at that source.
Immediate rollback: backup/testnet-before-canvas-60fps-20261020 at 927dc5a /
READY dpl_3St55QU618jXYuGGVMCWAYmgex5c. All older fixed refs stay fixed.
Delivered source/tree, 60 Hz interval, phase-preserving deadline, 1 ms timestamp
tolerance and resume/cleanup reset are verified. Observed build dirty flag is true.
Preview and official guest home load. API, anonymous Admin denial, all three
Highscore response hashes and artwork match the fresh pre-release baseline;
Mainnet stays 907d2a7 with the same public HTML and entry. A bounded scan of twelve
new-deployment requests shows zero warning/error/fatal records. Existing hydration
warnings and extension errors are not presented as a clean browser console.
Physical iPhone heating and the Whitescreen cause remain unproved. See
docs/canvas-effect-60fps-release-20261020/{release.json,testnet-ready.jpg}.
Continue documentation on this audit branch with automatic deployment off; do not
deploy later docs SHAs or ask again for this completed publication authorization.

## Canvas effect 60 Hz preparation, 20 October 2026

At 17:42:41 Europe/Vienna the owner authorized the proposed 60 Hz Canvas-effect
paint limit after confirming device heating. Limit only the existing ordinary
explosion/debris surface; retain wall-clock ages, geometry, source resolution,
effect counts, simulation/input, audio, HUD, saves and accounts. Keep one RAF
chain, use a phase-preserving deadline with 1 ms timestamp tolerance, skip
catch-up frames, and reset the deadline on release/resume. Do not reset it for
transient React effect re-registration. No global CSS or game-loop governor.
Controlled 120 Hz drawing falls from 240 to 120 paints over two seconds;
30/59.94/60 Hz drawing is retained. Tests cover 90/120/144/240 Hz, rounded and
jittery clocks, pause/resume, remount, long gaps and context loss. 275 exact
native RGBA comparisons, existing lifecycle/resource checks and the release
build (12 locale tests, locale gate, TypeScript/Vite) pass. Heat reduction and
the Whitescreen cause are not physically verified. This is preparation only;
no new deployment was requested or performed. Preserve fixed release/rollback
refs and keep automatic audit-branch deployment off. See
docs/canvas-effect-60fps-20261020.md and its JSON results.

The old local .git pointer targets a missing parent. The source is intact and
was checked against a fresh bare copy of audit HEAD a20f6465fc59ef321a660835186005cb859e97c9.
For this preparation use GIT_DIR=/workspace/scratch/cryptoid-canvas-60fps-2IPc5r/repository.git
and GIT_WORK_TREE=/workspace/scratch/cryptoid-iphone-lifetime-audit explicitly;
do not overwrite the old pointer or create unrelated runtime changes.

## Completed card preparation Testnet release, 20 October 2026

The owner's 14:12:49 Europe/Vienna instruction explicitly authorized Testnet
publication. It is complete: READY production dpl_3St55QU618jXYuGGVMCWAYmgex5c,
exact runtime 927dc5ab50941e66709f8c0dfc09a50625edba7f, reviewed tree
e294a19875e5216059062d1ef6a49a6466363175, ready 14:21:09.252 Vienna (36s).
Keep codex/testnet-card-pending-release-20261020 fixed at that source.
Immediate rollback: backup/testnet-before-card-pending-20261020 at 23b9f83 /
READY dpl_whZtejzMwRDZEDs71ohk3GGDaWHn; all older fixed refs stay fixed.
Delivered source/tree and both shared-pending paths, settlement cleanup and
eight/twenty-entry result-cache limits are verified. Observed build dirty flag
is true. Preview and official guest collection render six visible boss portraits
and all twenty Standard ship portraits. API, anonymous Admin denial, three
Highscore response hashes and boss atlas match before; Mainnet remains 907d2a7
and its prior deployment/public entry. A bounded twelve-request scan reports
zero warning/error/fatal records. A browser hydration warning and unrelated
extension metadata errors were observed; do not claim an entirely clean browser
console. Native iPhone memory/Whitescreen cause remains unproved.
See docs/card-artwork-pending-release-20261020/release.json and testnet-ready.jpg.
Continue documentation on this audit branch with automatic deployment off;
do not request this completed release approval again or deploy later docs SHAs.

## Card preparation deduplication, 20 October 2026, preparation complete

At 14:05 Europe/Vienna the owner requested correcting the two newly named
card-loader findings. Boss/ship artwork preparations now remain shared while
unfinished, even after eviction from the existing eight/twenty-entry result
caches. Success/failure removes pending entries by identity; failure remains
retryable. Preserve all compositing, pixels, resolution/color keys and cache
capacities. Eighteen controlled before/after, churn, failure/retry and key checks
pass against official 23b9f83, as do 110 native CPU RGBA comparisons (50 bosses,
60 ships), twelve existing card tests and the frontend release build including
twelve locale tests. No physical iPhone memory or Whitescreen-cause proof.
See docs/card-artwork-pending-fix-20261020.md and its results JSON.
This step contains no deployment. Keep official Testnet 23b9f83 and all fixed
release/rollback refs unchanged; automatic audit-branch deployment remains off.

## Completed correction/release of all five resource findings, 20 October 2026

Publication is complete: official Testnet READY production
dpl_whZtejzMwRDZEDs71ohk3GGDaWHn, exact runtime
23b9f83f2639ba836eea0e94e45ba310c9ab97d0, tree
fd7acbdf411984cb6005351c719480a014ed0e29, ready 13:25:37.836 Vienna.
Keep codex/testnet-five-resource-fixes-release-20261020 fixed at that source.
Immediate rollback: backup/testnet-before-five-resource-fixes-20261020 at
b15306f / dpl_4ckqHNmsXh7NnQiYK79aHcsYeAZK. Older fixed refs remain fixed.
All five fixes and exact source/tree are verified in delivered bundles; observed
build workingTreeDirty is true. API, anonymous Admin denial, all three Highscore
hashes and artwork match before; Mainnet stays 907d2a7 / its original deployment
and public entry. A bounded scan of 11 new-deployment requests has zero
warning/error/fatal records. See docs/resource-fixes-20261020/release.json and
testnet-ready.jpg. Continue documentation only on the audit branch with automatic
deployment disabled. Do not request this completed release approval again.

At 13:12 Europe/Vienna the owner requested fixing all five named findings. Correct
only those resource paths: dispose an uncommitted boss base layer on exceptions;
return unavailable/release failed rock textures without an uncaught prewarm error,
skip unavailable texture draws and retry through existing later draws; dispose
all boss-card working surfaces and check weapon draw success; retire ship-card
working/failed-output surfaces in finally; share pending boss-texture loads across
completed-cache eviction, retaining the existing two-entry cache limit.
Preserve successful pixels, timing, gameplay, sound, HUD, accounts, saves, purchases
and Mainnet. Continue the established official Testnet release workflow with the
current b15306f / dpl_4ckqHNmsXh7NnQiYK79aHcsYeAZK as immediate rollback; keep all
older fixed refs unchanged and automatic deployment disabled on the audit branch.
44 before/after failure/cache cases and seven real TSX effect/timer cases pass.
1,803 exact RGBA comparisons cover all 50 boss renderers, all 50 boss cards,
60 ship editions, 29 paint IDs, seven rock textures and seven full rock/effect
frames. 68 targeted gameplay/audio/card/resource checks and the release build
(12 locale tests, locale gate, TypeScript/Vite) pass. The existing chunk-size
warning remains. The historical audit script is now pinned to its b15306f source
so it still reproduces the original 15 findings without misreading fixed code.
No physical iPhone/native/GPU memory or Whitescreen-cause proof is claimed.
See docs/resource-fixes-20261020 and the two new verification scripts.

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
