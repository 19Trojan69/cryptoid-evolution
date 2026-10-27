# Stop redundant terminal game callbacks, 27 October 2026

The owner asks for further smartphone efficiency. Start from common public
09a6a4047236c7c8cc5ef430386fd0c6825ebb41 (PR183), retaining all previous fixes.
Candidate codex/game-over-idle-20261027 has automatic deployment disabled.

## Reproduced issue and narrow change

After player death the original 1750-ms destruction reveal leads to Game Over.
The finite native player-explosion DOM ends independently, while GameState still
retains its effect record. The existing sleep condition requires an empty effect
list. Consequently the game controller keeps receiving about 60 callbacks per
second even after the explosion has disappeared and combat has ended.

One production line adds the terminal game-over state to sleepWhenInactive.
It stops only this controller's frame client. Native graphics keep their own
lifetimes; shared graphics clients are not cancelled. Destroying and paused
states with effects retain their old callback/timestamp policy. Other statuses
keep exactly their previous predicate. The existing UI commit wake starts the
loop after an explicit Play Again; waiting never restarts gameplay.

The real released controller reproduced 300 callbacks in five settled terminal
seconds. Candidate reproduces zero. These are local controlled operation counts,
not whole-app CPU, battery, device temperature, native RAM or FPS measurements.

## Verification

- 397 frontend release cases, localization checks, TypeScript and Vite pass.
  Four added cases run the actual current/released predicates and real guarded
  scheduler, preserve all resumable-state decisions, retain finite shared-client
  callbacks, verify explicit restart and reconstruct the entire released
  GamePage SHA256. Broadening to paused effects or altering watchdog polling is
  rejected. Historical controller fingerprints restore only this exact line
  before the already reviewed publisher/menu/summary changes.
- WPE/WebKit26.5, 393x744, actual GamePage and real local API handlers: all eleven
  targeted checks pass. A test-only fatal projectile uses normal collision and
  damage. The destruction reveal is retained, the native explosion progresses
  and removes its DOM after Game Over appears, the settled controller sleeps,
  Play Again wakes a healthy game, and the visible modal Home exits and unmounts
  the loop. No JavaScript page errors or unexpected local API errors occur.
- JavaScript's virtual test clock does not prove native CSS time advancement.
  An initial attempt making that assumption is excluded. Final verification
  explicitly holds the existing CSS animations for the terminal boundary, then
  resumes them and waits on their real native timeline. This is controlled test
  scaffolding, absent from shipped source.
- The pinned released native run completed eight checks, including the 300-step
  observation, independent explosion completion and healthy Play Again. Its
  final Home selector targeted the header behind the modal and failed. The
  valid observation is retained separately; no complete old-control UI pass is
  claimed. Candidate uses the actual visible modal Home button and passes it.
- Current ESLint9.39.4/hooks7.0.1/TS-ESLint8.57.1 reports identical zero errors and
  four warnings on pinned baseline and candidate. The historical 62 errors/four
  warnings remain historical evidence; this predicate did not fix them. Do not
  call GamePage or the project lint-clean. Backend source is unchanged; its
  prior 127-case acceptance is baseline, not a new full backend-suite run.
- Previous PR183's 74 actual-flow native checks remain baseline evidence, not
  rerun or counted as new results here. Full frontend guards still cover saves,
  completion/Continue, audio, pause thresholds and campaign boundaries.

## Preserved behavior and publication

The guarded/shared schedulers, effect renderers, timing constants, presentation,
standard raster, graphics, ships, HUD/CSS, sounds, settings, gameplay, rewards,
saves, authentication and every backend/API file stay unchanged. The strict
>2500-ms watchdog with 500-ms monitoring and explicit technical Resume remain.
No new timer, frame loop, diagnostics collection, cache, migration/reset,
PR167/168, token request, protection change or runtime-log access is introduced.

Preserve public 09a6a40 at backup/shared-before-game-over-idle-20261027 before the
already authorized reviewed release to both existing projects. Prior READY
Testnet 5WzvAtXq4aNoXCj6DXwnFDcAKZX7 (71s) and production
CXKVFwjsoiCFdLRZBUdeKqBGNR2h (106s) are the immediate rollback deployments.
Network/account/payment environments remain separate. Actual publication will
be recorded separately; this candidate document alone is not a live receipt.

Historical White Screen and physical iPhone/Pi long-run stability remain open.
No new long manual owner campaign is required for these controlled counters.
