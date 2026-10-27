# Quiet red weapon-expiry feedback inside the binary pause

Base is the actual shared public/main PR185 source
`0ae15558a2251adaf1b9dde833220cb3b3f932e3`, tree
`b9962f40992e295e7ea91f0a2fee27a1c7615aa8`.
The owner's later screenshot/clarifications replace the intrusive eight-second
combat popup and purchase action. They explicitly keep red expiry feedback,
within the existing binary-code pause, only while that code is displayed.

The notice now says, for example, `Dreifach · abgelaufen → Standard`. It names
the expired type and the actual current fallback, using the same stage-correct
weapon name as the HUD. When the effective shot type remains the same (a
confirmed automatic reload or an evolved hull's free base), only its active
name is shown, rather than falsely saying that available shot type is gone.
There is no button, purchase invitation, click interception, separate dialog,
new animation, observer or display timer. `Expired` has explicit translations
for all 18 non-English selectable languages; existing weapon names are reused.

A real selected timed-weapon expiry queues one transient record. Its label is a
sibling of the unchanged five native binary rows inside their exact existing
render predicate: playing, normal encounter, formation not started, and intro,
entry or formation phase. The code's original animation/mask/opacity remain
independent, running behind static lighter-red text. The notice is centered in
the existing 118px code band at top43%, with a restrained transparent gradient,
no border or large panel. A centered level-intro title reserves its space; the
pending notice waits until that title is gone and the binary window continues.
The ordinary block title remains readable above it.

The record has no reading deadline. Its first shown window owns its lifetime;
it clears when formation starts or the window's phase/encounter ends. Pending
notices survive manual/technical pauses, while both code and label obey the
original playing-only visibility rule. Only explicit Resume resumes the game.
Manual weapon-menu entry and restart dismiss stale feedback. Nothing is saved
to player/account records. Existing active equipment clocks stay paused during
formation preparation; no extra pause/read time is added.

Old red combat reload/error overlays, their unused React state and their
six-second timeout are removed together. Manual activation errors remain in
the existing weapon menu with its original retry/receipt guards. All actual
fallback, automatic stock, confirmation, pricing, charge duration, purchase,
save/reward, combat, audio and Continue rules remain. The replaced placement
component/helper are removed, including their ResizeObserver. The existing
weapon control still opens the original menu when the player chooses it.

Only exact reviewed controller snippets restore the entire public GamePage
SHA256 `ab979a75eef6698b84a0f015f10c50dc513cd7f211f790624a09b3dc45697be3`
before all historical restorations/fingerprints. No broad normalization or
watchdog/save/activation exception is introduced. Original binary markup,
HUD/art/ships/flight geometry, raster/resource optimizations, readable titles,
Game Over sleep, strict >2500ms/500ms watchdog and manual Resume/Continue stay.

See the matching verification directory for the normal frontend build, current
baseline lint comparison, eight native UI scenarios, real-handler full-flow and
Game Over regressions, public before snapshot and release verification. Native
checks use official Playwright1.56.1/Chromium141 and isolated SDK/account/order/
clock/combat-boundary fixtures, not real purchases or physical-device acceptance.
Earlier incomplete fixtures and the compact level-title overlap are excluded;
only final complete results are acceptance. Backend source is unchanged; prior
backend127 is not a new full-suite run. No heat/White Screen cure is claimed.

The work branch is auto-deploy-disabled. Reviewed same-source publication to
both existing projects remains authorized; main should trigger one build per
project, followed by actual READY source and public commit/tree/bundle/feature/
prior-guard checks. Keep prior shared0ae1555 and READY Testnet
`GS7qtHJmjCcUsKnVMCzpxaCyUoHE` / production `G2inPaHpEa9Tic6ibhGXSfSfD2ud`
as rollback, separate network/account/payment environments, and existing older
backup refs. No reset/migration, PR167/168, secret/protection/runtime-log access.
