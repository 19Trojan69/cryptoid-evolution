# Quiet, readable combat feedback, 27 October 2026

Base: actual GitHub main/public c7811d0856dd18e3e0d56449c32f644120a7ae81,
tree a21aa5ce068a1477f6ab3f45fee1c0f909cf2ee0 (PR188). The owner's later requests
supersede the historical short reinforcement warning and missing reload display.

A selected timed shot still queues feedback only on a real positive-to-zero
expiry. Once shown, its record now also clears at the actual next-flight boundary.
That boundary previously retained it if an entry was cleared before the formation
started; it could immediately enter another binary window without an active
combat frame. A pinned-public native counterexample reproduces that repeat.
Unseen feedback still waits for the first eligible binary stream. A manual or
technical pause keeps the same pending record and requires explicit Resume.
The existing end-of-window, weapon-menu and restart clearing remain.

Automatic reload feedback is restored inside that same passive red binary label.
It says Reloading weapon… only while the actual request is pending. Confirmed
positive remaining time changes it to Weapon reloaded; failure says Reload not
confirmed. The result remains for the rest of that one binary window, with no
short success timeout. A late response cannot recreate a cleared notice. Actual
current, stage-correct shot names and the exact original shop symbols remain;
unchanged effective shots are never falsely called unavailable. There is no buy
prompt, purchase action, combat popup, new reading timer, observer or loop.
The binary animation remains independent behind the text. Both the centered
level title and centered reinforcement warning retain their space before the
weapon label appears during entry/formation.

Reinforcement warnings now have a protected 4800-ms phase, for current and legacy
flight plans. Spawn gap, entry movement, settling, attacks, ship sizes, rewards
and all combat rules retain their own timings. The warning uses one calm finite
opacity arrival/plateau/departure, keyed to its intro; manual/technical pause
and the existing Resume countdown retain/freeze its native node. System/saved
Reduced Motion is static for the same phase time. Formation goals, heavy-ship
warnings, completion feedback and opening-drop notices now use 4800 ms instead
of 2000/2100/2600 ms. A genuinely new event can replace the old status.

Added intro time consumes no paid/pickup ammunition, shield, rapid-fire, EMP or
overdrive lifetime. The variety event clock preserves only its original 550/850
intro milliseconds, including later reinforcement flights; additional reading
cannot bring a drop or rock due earlier. Falling pickups keep their released
movement. Manual confirmed Continue after boss and bonus has no read timer.

The entire published GamePage (SHA256 eb219ac8306919d27008dd7929fce871eff0e1b2df0d682ee518d3a23394e782)
is recovered by a fixed ledger of exact controller hunks before every existing
historical fingerprint. No broad normalization or allowed arbitrary edit exists.
Terminal-only Game Over sleep, independent finite graphics, explicit restart,
>2500-ms/500-ms/manual technical Resume, resource/raster protections, auth,
receipts/save retries, separate networks and the 2:1 Home Play/Shop row remain.

See verification/quiet-readable-feedback-20261027 for the actual build, native,
full-flow, Game Over, lint and publication receipts. Backend source is unchanged;
the historical127 backend suite is not claimed newly repeated. GamePage retains
its pinned62 lint errors/four warnings, not a lint-clean claim. No physical-device
heat/FPS/battery or historical White Screen acceptance is implied.

Publication to both existing projects is already authorized. Keep the working
and receipt branches auto-deploy-disabled. Merge only the checked exact tree,
let main trigger both once, inspect actual READY source, and independently check
the public aliases/bundles/commit/tree/new behavior and retained guards. Rollback
source remains c7811d0, READY Testnet4nYG31Dn9u22Fe78rhC5FX2Yay2i /
production51UKRCrDEbL6Jsfo91LEeun2EWk1. Preserve all earlier backups; no duplicate
manual builds, reset/migration, real purchases, PR167/168, secrets, protection or
runtime-log changes.
