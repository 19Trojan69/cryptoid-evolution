# Avoid unused projectile snapshot copies, 27 October 2026

The owner asks to continue reducing avoidable smartphone work. Start from shared
public 9d0ac5ba60d9b25170176700a3c1efaa355be290 (PR182), retaining its one-pixel
standard raster. Candidate codex/projectile-scene-copy-20261027 is auto-deploy-off.

## Finding and change

Player and enemy projectiles already use the direct presenter on the existing
game frame. GamePage never reads game.shots or game.enemyShots for React display.
Nevertheless each requested React scene also copies both complete projectile
arrays. The real current publisher and its exact released statement reproduce
these two extra traversals/array allocations.

One production line now omits only those two explicit copies. The existing object
spread keeps their values/references; the live simulation still owns its own
lists. The original boss and four rendered-list copies remain. No field is deleted
from saved combat or diagnostics. Direct presentation still consumes stateRef
before scene publication on the same original clock.

For 600 controlled publications with 72 player/100 hostile entries, the released
statement creates 1,200 projectile copies and traverses 103,200 entries. Candidate
does neither. Those are synthetic operation counts, not a measured CPU/GC time,
whole-app memory, native temperature, battery or presented-FPS reduction.

## Verification

- Full frontend gate: 393 cases, localization release checks, TypeScript and Vite
  pass. Three new cases execute the exact current publisher against the released
  negative control, verify unchanged values/ownership of rendered snapshots and
  restore the entire controller to the exact preceding SHA256. Other changes,
  including removing a rendered-list copy or changing a real pause, are rejected.
- Historical controller fingerprints restore this one exact statement before
  the earlier exact idle/menu/completion changes. They do not allow arbitrary
  controller changes. Physics, rewards, save/retry and transition code remain
  byte-identical after this one-line restoration.
- Native WPE/WebKit26.5 actual GamePage and real API handlers: 74 checks pass with
  local isolated player data, controlled clocks and test-only combat completion.
  Actual player/hostile DOM counts and coordinates match live state before boss
  defeat, while moving and after explicit Resume at bosses 6 and 50. Nonempty
  shots remain fixed through four-second pauses; no automatic Resume occurs.
- Boss -> heart -> bonus -> complete original final explosion -> quiet beat ->
  common summary -> explicit Continue succeeds. Five repeated bonus pauses,
  failed final-campaign save/retained outbox/Retry, exact next checkpoint, no new
  reward on Continue and final victory pass. Summary projectile layers are empty
  and the next normal level fires correctly. No JavaScript page errors occur.
- An initial added check sampled during the original boss introduction, when
  shooting is intentionally suppressed, and failed. It is excluded. The final
  verifier waits for genuine gameplay and actual hostile fire. A preliminary
  successful 66-check run with empty hostile samples is retained separately and
  is not treated as proof of hostile movement.
- No added lint findings: current resolved ESLint9.39.4/hooks7.0.1/TS-ESLint8.57.1
  reports zero errors/four warnings for both pinned baseline and candidate. This
  differs from the historical 62-errors/four-warnings report, which is retained
  as historical evidence; this one-line edit did not fix those 62 findings. Do
  not describe GamePage or the whole project as lint-clean.
- Unchanged backend types compile. The previous 127-test full backend acceptance
  is baseline, not a full suite rerun. Handler activity here is entirely local.

## Preserved scope and release

The presenter, loop and strict >2500-ms/500-ms watchdog, explicit technical Resume,
pixel standard, original graphics/backgrounds/ships/HUD/indicators, effects, audio,
weapon/Auto settings, rewards, saves, authentication and all backend/API source
are unchanged. There is no timer, RAF, cache, quality menu, migration/reset,
PR167/168, token request, security change or runtime-log access.

Retain prior shared 9d0ac5b at backup/shared-before-projectile-scene-copy-20261027
before the previously authorized reviewed same-source release to both existing
projects. Prior READY Testnet FSG9xyeLKEgKGkGbKgRNjcPjq2jq (75s) / production
BPscxQrsQfPF8WJk3nHtP12Yd5tt (73s) are the immediate rollback deployments.
Keep network/account/payment settings separate. A separate evidence receipt will
record actual publication; this candidate document is not proof it is live.

Physical smartphone warmth, native long-run stability and the historical White
Screen remain unproved. Do not demand a new long manual owner campaign.
