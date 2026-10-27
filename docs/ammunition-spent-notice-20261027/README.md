# Readable purchase-weapon feedback and spent-charge action

Base: shared public/main `22842bb7a1986b2b34710f2dcbca7c2e5e6a7b7c`, PR184.
The owner requests a red message when a shot type is consumed, so the player can
choose available ammunition or buy more. The clarification requests longer,
more visible messages for purchase weapons without covering other text.

## Behavior

- An actually selected paid charge or collected shot type reaching zero creates
  one notice naming that exact weapon before the existing fallback selection.
  Paid text says "Charge depleted", not that the entire owned stock is empty.
  Pickup text distinguishes its expiry. Standard/infinite weapons do not alert.
- The notice lasts eight seconds of visible, active combat. Manual/technical
  pauses, Resume countdowns, level/block/bonus transitions and lack of safe
  display space do not consume that reading time. Opening the weapon menu,
  deadline expiry or explicit restart dismisses it. It is transient UI only,
  absent from account/combat saves, inventories and rewards.
- "Switch weapon / buy charges" opens the existing weapon-selection menu with
  its original pause and confirmed selection/purchase gates. Opening it alone
  grants nothing, debits no charge and creates no purchase. It never buys or
  resumes automatically. Existing stock/Auto preferences and free hull weapons
  retain their original rules.
- A successfully started automatic reload uses the existing reload feedback
  instead. Reload and automatic-activation error feedback increase from 3s and
  2.5s respectively to 6s on their original timeout mechanism. No new timeout,
  RAF, interval or new animation is introduced.
- All three weapon messages gain larger red type, a compact opaque contrast
  background and a border. Original HUD, fonts elsewhere, ships and art stay.
  Event-based placement reserves existing side-control text and chooses a free
  vertical gap between HUD, titles, combat, combo and pickup text. It defers
  rather than covering text if no gap fits; a deferred spent notice keeps its
  reading time. One mounted-notice ResizeObserver is released on removal.
  Reduced Motion needs no additional animation because this feedback is static.
- All 19 selectable languages have the new wording. Weapon names use the
  existing translated names. No library or production dependency is added.

## Checks and scope

The release gate passes 413 frontend tests, localization release inventory,
TypeScript and Vite. Seven new cases exercise real old/new expiry statements,
actual notice lifetime/placement/component handlers and exact whole-controller
restoration. Existing reload-recovery host supplies the additional transient
ref/setter; its original receipt/retry/no-double-debit tests retain their gates.
Its formerly explicit 3s reading assertion now checks the requested 6s boundary.

Native Chromium141/Playwright1.56.1 uses the actual candidate GamePage, original
graphics/fonts, and real local handlers with isolated synthetic SDK/account/
orders. Seven notice scenarios check manual/automatic/empty stock/pickup,
393x744, 320x568, 768x1024, 1363x768, 393x628 and 430x825, both hands and
German/English/Thai. Checks include real activation/debit, no overlap, a clear
menu action, both pauses, layered transition/pickup text, full notice expiry,
and six-second reload feedback. The prior full-flow and Game Over verifiers
run independently on this engine. Detailed results are in the verification
directory. These are local controlled checks, not physical iPhone/Pi acceptance,
presented FPS, native RSS, battery, heat or a historical White Screen cure.

Only exact reviewed controller replacements restore all bytes of the published
GamePage SHA256 `280be9043d47d5cb80f3c51223a549e8dc3a69c89588d632a7698dae3e218acb`
before historical fingerprints. No broad normalization is added. Timers,
auto-selection/activation, 45s and legacy charges, saves/rewards, auth/backend,
strict >2500ms/500ms watchdog, explicit technical Resume, readable transitions,
Game Over sleep and prior raster/resource fixes stay protected.

Current resolved GamePage lint has the same 62 errors/four warnings as pinned
baseline; no whole-project lint-clean claim. Smaller edited runtime modules are
clean. Historical 0+4 under other resolved tools is not a repaired-error claim.
Earlier incomplete fixture attempts are excluded. Backend127 remains baseline,
not a new full backend suite. No reset/migration, live purchase/account mutation,
PR167/168, secret/protection change or runtime-log access.

## Authorized release

Work branch `codex/ammunition-spent-notice-20261027` is auto-deploy-disabled.
Retain public 22842bb and prior READY Testnet
`4yg2wdBGggVeXwdYA1soaZ58X9tx` / production `BYMuqaz5gacx4vT67h2kJJGUtnsP`
as rollback. Standing authorization covers reviewed same-source publication to
both existing projects, keeping separate network/account/payment environments.
Let main trigger them once, verify actual READY source commits and both public
bundles/commit/tree/new feedback/prior guards, and record publication separately.
