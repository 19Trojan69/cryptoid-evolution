# Completion activation and interrupted audio

The story is boss → bonus → unified completion → verified save → manual Continue,
including an automatic weapon reload still awaiting its response and an explicit
Resume after a rendered audio context was interrupted. The owner supplied a new
private session export. It contains successful completed API responses but an
immediate completion failure while reload confirmation is still outstanding. It
also records both Web Audio clocks frozen under a running state while music's
media timeline advances, then clock progress after browser return and Resume.
The export itself, account details and precise telemetry are not committed.

## Changes

Preparation waits on the existing weaponBusy state instead of throwing a save
failure. When the original activation settles, that state change starts the usual
preparation automatically. It still drains the same durable queue, resolves only
an uncertain original receipt and verifies the exact next checkpoint, score,
Shards and hearts before releasing effects. Genuine failures still require
explicit Retry. There is no new activation ID, charge, reward, checkpoint route,
retry loop, timer or request made while that original activation is pending.

Explicit audio Resume applies the existing same-context ordered suspend/resume
cycle to already rendered interrupted or suspended graphs as well as running
graphs. Both native calls remain inside the user gesture. A never-rendered clock
at zero still resumes directly; menus/countdowns remain silent, music position,
volumes, original assets, buffers and graph ownership are retained. Automatic
repair stays bounded; simulation never resumes automatically after an interruption.
No speculative HTML-media autoplay change or audio-session override is included.

## Verification

- 291 normal frontend release tests, TypeScript and Vite pass. The new 11-case
  audio/real-UI-handler suite is part of the ordinary build, not a manual-only gate.
- 68 focused existing audio/initialization/music tests pass. Six old controls are
  explicitly excluded, not counted: the unavailable historical gesture source,
  one obsolete release-tree parity assertion and four graph-initialization
  comparisons whose old Git object lacks their files. The initial unfiltered
  attempt and these exclusions remain recorded in the verification manifest.
- The new host tests compare pinned public 57a60fd against the candidate for
  rendered interrupted/suspended clocks, repeated effects/music Pause/Resume and
  direct zero-clock startup. They assert original-gesture ordering, same graph,
  media element, buffers, gain/position and silence while paused. This models
  native behavior; it is not proof of physical-device audibility.
- Native WPE/WebKit 26.5: 13 pinned-public controls reproduce successful activation
  plus false completion failure and no preparation when its response later arrives.
  80 candidate checks pass: real final-shot explosion/outro, repeated explicit
  Pause/Resume, success or lost activation response, one charge/original receipt,
  automatic preparation, exact saved rewards, ten visible prepared seconds,
  manual Continue, legacy bonus restore, actual save error/Retry and campaign end.
  Real compiled backend handlers use isolated in-memory data with controlled
  SDK/API/clock/combat setup and widened score time. No live account is mutated.
- Small runtime module lint passes. GamePage retains its existing 62 errors/four
  warnings, with no new findings relative to 57a60fd; it is not wholly lint-clean.
  Strict exact-hunk scope restores the prior source before checking the approved
  full-game fingerprints. Backend sources/configuration are unchanged and its
  TypeScript build passes; prior 126 backend tests remain the unchanged baseline.

The first native fixture had no backend build output. The next encountered
unresolved preview React dependencies and an invalid hook dispatcher; a local
root dependency link and backend compilation corrected this test host. These
attempts are retained and are not counted as successful native controls. No
runtime fix was inferred from them. No repeat long owner campaign is requested.

The previously published transition design, HUD/art/ships, combat/economy,
settings, bounded invalid_save retry, auth ownership, account/network/payment
separation, strict >2500ms watchdog at 500ms and manual technical Resume remain.
The historical White Screen and physical Pi/iPhone long-run stability stay open.

## Publication

Candidate `codex/completion-audio-resume-20261026` is auto-deploy-disabled.
The owner authorized the reviewed same-code release to both existing projects.
Keep public source `57a60fdc10e08d6b133ea19f74a8695a8070d5d0`, tree
`4f2196dcb85d2f38fbe359d91c9c9e397938e8b0`, as rollback at
`backup/shared-before-completion-audio-20261026`. Its READY deployments are
Testnet `dpl_8PpTq1mGmTu5tZcigEsiMW4kxsrx` and production
`dpl_BeBc7AKz43K4ZP1jHcLjBQBy1UvL`. Capture the new delivered source, bundles,
READY deployments and existing public aliases after release; preserve separate
project environments and never request secrets or change deployment protection.
