# Explicit purchased-ship selection and verified account starts

Base: actual GitHub/shared public main `1d800516767131013e0ef80f5c22fa1332593b43`,
tree `20919d588a70dca7f6f9453112158bccd5daf83b` (PR190). The owner's latest
instruction supersedes historical automatic equip after purchase: show Select
and let the player choose the acquired ship/stage.

## Findings and behavior

The old Equipped label compared the preview stage to the highest owned stage,
ignoring the actual selected stage. More seriously, GameEntry waited for verified
authentication but GamePage then independently decided guest/account from a
persistent local marker. A valid restored token without that marker produced a
Standard guest run and no account start request, while the Shop claimed Elite
was equipped. The focused pinned-UI native control reproduces both cases with
isolated, real local handlers. It is not an old full-campaign acceptance run.

Standard/paint purchases now acquire inventory and deduct the same price without
changing the selected loadout. Advanced/Elite checkout retains confirmed ownership
and card unlocks and no longer silently selects a hull. The existing translated
Select button is available for every owned stage/paint. Only an exact confirmed
hull/color/stage is marked Equipped. Busy/unconfirmed responses cannot report a
successful selection. Legacy records expose Select until a stage is explicitly
confirmed; their prior highest-owned gameplay fallback remains compatible until
then. Existing explicit selections remain unchanged by subsequent purchases.

The saved account choice now includes an optional shipStage. Selection is an
atomic versioned request; the server checks base hull, paint, paid matching
Advanced/Elite prerequisites and network scope. Invalid/unpaid/orphan/foreign-hull
or owner-Testnet orders presented to Mainnet cannot select an upgrade. No data
migration or live account update is performed by this release.

A normal start returns its server-validated selected stage. The game uses that
same choice for original artwork, permanent shot behavior and fresh-life hull
protection. The verified identity from useAuth decides account versus guest,
including restart, independent of the optional local hint. Guests remain Standard
and use their explicitly chosen owned hull. Admin preview remains separate.
Resuming preserves the mission and caps saved remaining projectile protection to
the selected stage: changing hulls cannot refill spent protection or carry Elite
protection into Standard. Equipment clocks, rewards and paid receipts are unchanged.

Elite retains the existing stronger twin laser and two free enemy-projectile hits
per life; Advanced retains twin fire and one free hit. Timed shot charges remain
separate. All20 hull identities retain their original sprite mapping (the first
Grey Scout/Nova Wing entries intentionally use sprites1/0). Shared pure stage rules
prevent frontend/backend drift. No original art, HUD, ship size, flight, enemy,
combat damage/cadence, shield/economy rules, music, new loop or effect is introduced.

The shop exposes direct Ships, Weapons and Power-ups category controls. These
reuse the actual existing offers and checkout flows, including all four weapon
charges, five powers and armor in Weapons. Category navigation is static, remains
visible outside the scrollable content and resets the destination scroll. It
creates no payment or inventory/selection mutation. Existing Testnet owner access
and Mainnet purchase limits stay intact. Original HUD/game CSS is unchanged; only
the existing shop purchase stylesheet gains the category controls.

## Validation and publication

141 backend cases pass, including six new integration cases for selection,
version/ownership/network/prerequisite checks, unchanged purchases, new/resumed
starts and legacy compatibility.430 frontend release cases/localization inventory/
TypeScript/Vite pass; eight separate existing evolution/purchase/attribute cases
also pass.32 native UI/real-handler assertions cover actual isolated checkout,
Select/Equipped, token-only account Play, correct Grey Scout Elite artwork and
live strengthened shots, all shop categories/offers/scroll/no mutation on phone
and desktop, guest Nova Wing, legacy desktop, resume and no guard
refill.74 full-flow and11 Game Over native assertions are repeated and pass.
Game Over performs zero controller steps over five terminal seconds.

Exact controller changes restore the entire published GamePage SHA256
`b5574344a195886dedb02730f20b9a486d4f3a410717ac17d0f468d42c3eb74d`
before every earlier guard. The account-save type addition is also restored by
one exact change before its unchanged historical fingerprint. No broad allowance
or fingerprint relaxation exists. Current resolved lint matches baseline:
GamePage62 errors/four warnings and Shop5 errors; other changed frontend modules
are clean. All1740 original-resolution painted variants retain identical encoded
size entries/95,450,326 bytes. A build revision can change with generator source
metadata, without changing artwork. No physical-device heat/FPS/font-pixel or
historical White Screen acceptance is claimed.

See verification/ship-stage-selection-20261027 for accepted results, fixture
exclusions and read-only public before/after receipts. Live ownership was checked
read-only; raw owner data, screenshots and reports are not committed. The owner
chooses their own ship after publication. No real payment, wallet transaction,
reset, secret/protection/runtime-log change or unrelated PR is included.

Work/evidence branches stay auto-deploy-disabled. The already authorized shared
publication proceeds through main to both existing projects once, followed by
actual READY/source/alias/bundle/guard checks. Rollback is1d80051, Testnet READY
`dpl_AMEhBjnbthidFesbHrzAQJziWxYF`, production READY
`dpl_2GmV8T6UCwfW3TCR2G7MvSD3Bf1P`; all older backups remain.
