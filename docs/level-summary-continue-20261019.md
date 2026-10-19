# Manual level summary and completed-encounter disposal

Prepared on `codex/level-summary-continue-20261019`, based on local diagnostic
commit `ec7fb25d32b72313c77f039e81c657c211ef5f8e`.

## Authorized behavior

The owner requested a persistent level completion summary with a Continue button,
and emphasized that the iPhone interruption investigation remains the main goal.
This changes the detailed summary **after the bonus round**. Ordinary block
transitions and the boss-to-heart-to-bonus sequence retain their existing gates.

The old summary faded after 3.8 seconds although its clear phase lasts at least
8.5 seconds. Its replacement enters once and stays visible; the existing localized
Continue label is used (German: Weiter). It scrolls if the available field is short.
The button becomes enabled after the existing clear duration and after every
destruction effect has expired through the original lifetime filtering.

At that boundary, the dead encounter arrays, boss reference and cached formation
slots are cleared immediately, rather than remaining referenced for an arbitrarily
long reading pause. The normal React unmount and CanvasEffects idle lifetime can
release associated effect resources. No shared asset-cache purge or forced native
memory reclamation is added. Carried pickups, weapons, shield/boost durations,
rewards and the summary are preserved.

While waiting, the guarded scheduler remains alive but simulation returns before
movement, timer changes, array copies and scene commits. Continue requests one
advance; duplicate clicks, paused clicks and clicks before readiness cannot skip a
level. Restart clears the gate. The final campaign summary also waits for Continue
before the existing once-only score submission and victory state.

## Verification

- Six tests execute the actual GamePage clear block and simulation body: effect
  completion before disposal, immediate dead-scene disposal, 10,000 waiting frames
  without state mutations or extra scene commits, preserved carried pickups and
  weapon timers, single advancement, restart, final campaign submission, and the
  unchanged physical boss-heart gate.
- The relevant suite contains 45 passing tests, including existing boss effects,
  rewards, guarded loop, audio resume, pickups and owner-only boundary diagnostics.
- Full frontend production build with `VITE_CRYPTOID_DIAGNOSTICS=0` passes,
  including 12 localization tests and the localization release gate.
- Actual-component Canvas lifecycle host still passes the two-second idle release,
  no idle drawing, allocation reuse, context-loss fallback and unmount cleanup.
- A rendered browser check was unavailable: the local browser executable is absent
  and its installation failed. No iPhone/WebKit layout, memory or FPS result is
  claimed for this change.

The strict whole-file diagnostic preservation script belongs to the preceding
diagnostic-only commit. It is not evidence of unchanged UI/timing for this branch:
the owner has now intentionally requested this specific UI and progression change.
The audio callback equivalence tests continue to run against the current source.

## Open crash investigation and release state

The latest supplied device report ends at `boss-victory-start` in sector 20,
boss 2. The new document starts 4.359 seconds later. This is **before** this manual
post-bonus summary; this feature cannot be presented as a demonstrated fix for
that interruption. The preceding owner-only victory/audio/heart readiness markers
remain included, to distinguish the earlier boundary in the next available report.
Known resource counters do not measure complete native/GPU/process memory.

No public Testnet/Mainnet release, admin access grant, authentication, backend,
payment or durable save-format change is part of this preparation. Official
Testnet remains the Canvas lifetime release at remote `66eb357cc08a6b5f9b32a9242d6875ed475532fa`.
Its prior source backup and READY deployment are recorded in
`testnet-canvas-release-20261019.md`. This feature can be discarded independently
by returning to its diagnostic-only parent; publishing requires a separate
explicit release instruction under `frontend/AGENTS.md`.
