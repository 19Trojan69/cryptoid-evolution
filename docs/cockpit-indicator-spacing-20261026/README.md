# Cockpit feedback and forty-five-second weapon charges

Base: common public dbed24977b8a3bc08cf2ed7c8dcae37d570135aa / PR178,
reviewed tree da707be59a4537ecc73325119469ab57b0c45f42. Retain its prepared
hull reuse, source sharing and every earlier save/audio/transition correction.
The owner explicitly adds visual alignment, activity feedback, shorter equipped
weapon-menu return, clearer reload feedback and 45-second purchased charges.
These limited timing changes supersede the prior freeze on combat durations.
Owner screenshots remain private and are not repository fixtures.

## Result

- Secure-access and sign-in decoration centers the visible original hull, rather
  than its asymmetric transparent image box. The existing finite lift ends at
  that center at normal and short viewport heights. The same original PNG/size
  is retained, with its existing trail aligned to the drive.
- Ordinary enemy bars keep their released half-size dimensions and horizontal
  alignment. A static per-model/stage rear edge reserves the longest existing
  plume plus a small gap, so live thrust does not move the bar. All boss hull/
  turret damage indicators stay unchanged. No new image loads, scans, canvases
  or frame-time geometry work; shipFleet/artwork stays byte-identical to PR178.
- A shared three-stripe CSS activity indicator lights in order and repeats at
  sign-in and only the genuinely pending mission-preparation state. It is
  removed for account choices, errors or play, and invents no progress percent
  or readiness delay. Reduced motion shows clear static stripes instead.
- Returning from the weapon menu with an equipped paid/pickup timer uses three
  500ms steps (1.5 seconds) instead of three 1000ms steps. Empty/standard weapons,
  ordinary Resume and genuine technical pauses keep their existing 3 seconds;
  hidden callbacks reset to the ordinary pace. Audio still unlocks in the
  explicit gesture before waiting; pending activation/save barriers are intact.
- Automatic reload itself has no artificial wait in the existing code. Server
  confirmation still controls activation; no network-latency halving is claimed.
  Its original notice timer is lengthened from 1250 to 3000ms. The compact red
  message sits below actual HUD/level/group/bonus/warning text, with a temporary
  ResizeObserver only while mounted and discrete scene updates. No per-frame
  measuring, recurring timer or new interaction surface is added. Error feedback
  shares the placement. Paused/loading overlays do not show this flying notice.
- New purchased charges are exactly 45000ms on server and client. Shop, in-game
  weapon menu, catalogue, purchase memo and all 18 non-English charge labels
  say 45 seconds. The weapon-only shop description does not label power-ups as
  45-second charges. Collected weapons remain 20 seconds; start power-ups retain
  their old durations. Prices, quantities, products and payment policy stay put.
- Existing confirmed older 60-second timers remain valid through receipt replay
  and resume. No timer migration, clipping, replacement grant or inventory reset.
  The old atomic activation and no-refill/idempotency logic is unchanged.
- Auto-reload settings are unchanged: off means one selected charge; enabled
  consumes further owned charges on expiry while stock remains, until switched
  off or empty. No automatic purchases. Defaults/account/network keys, manual
  selection and the already active charge's saved time remain intact.

## Verification

357 normal frontend release cases, TypeScript/Vite, 127 backend cases/types,
changed-module lint comparison and native evidence are recorded under
verification/cockpit-indicator-spacing. Ten native controls pin public dbed249; 24 visual and 44 actual-game checks pass.
The gallery covers all 20 original models/three stages at maximum plume length
and bank, exact unchanged boss geometry and retained compact bar sizes. Secure
access is measured at 393x744, 393x628, 768x1024 and 393x550. Native stripe phases
prove ordered repetition and the reduced-motion alternative. Notice checks use
actual HUD cells and verify non-overlap including newly appearing bonus text.

The actual game/handler flow holds mission preparation to verify its stripes,
activates a 45-second charge without another debit, checks the 1.5-second armed
menu return against the ordinary three-second Resume, then runs the real final
bonus explosion/outro, confirmed Continue, unchanged rewards, failed save/Retry
and campaign victory. SDK/API/account data, combat setup and native clocks are
controlled and isolated. No real account, payment or database mutation occurs.

Early acceptance-harness issues are retained separately: normal clock progression
while asserting millisecond boundaries, React commits between synthetic timer
steps, a click intercepted by the existing pause modal and reading a playing
state ref before the preparation DOM commit. Final checks wait for the actual
commit and step the paused native clock between React updates; no production
pause/save rule was weakened for these tests. Initial test expectations of a
60000ms new grant were updated to the explicitly requested 45000ms. The native
Node test's extensionless import was corrected before the final build.

GamePage retains 62 pre-existing lint errors/four warnings; MissionWeaponShop
retains three errors and Shop five. New/changed small components have no added
findings. Exact reviewed GamePage hunks are restored before the existing strict
source fingerprints/negative controls; no broad stripping or fingerprint reset.
Historical White Screen/native cause, physical Pi/iPhone long-run stability and
real-device audibility remain unproved. No new long owner campaign is required.

## Publication

The working branch codex/cockpit-indicator-spacing-20261026 has automatic deployment
disabled. Reviewed same-source publication to both existing projects remains
explicitly authorized. Preserve dbed249 at backup/shared-before-cockpit-feedback-20261026
and prior READY Testnet CeVMgcLoAg69U4wNMFWWY4i3ni4h / production
HPsKkS4ivMqst5rkRTheW9Jb6FSR. Record actual delivered source/tree, matching
application files, READY active aliases, public 45-second catalogue and separate
network/account/payment environments afterwards.

Keep HUD geometry, original ship sizes/art, sounds, combat rules outside the
requested charge/countdown duration, rewards, strict >2500ms watchdog/500ms
polling, genuine focus/background pauses and explicit Resume. No data deletion,
account migration, PR167/168, secret/runtime-log access or protection change.
