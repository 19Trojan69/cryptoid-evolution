# Isolated game-core migration

This is an incomplete parallel implementation addressing the reported White
Screen across devices. The released Testnet source remains the comparison
baseline. Nothing in `frontend` imports this directory. It is not ready for
deployment, does not claim to cure the historical failure and must not replace
the current game yet. See [requirements.md](requirements.md) for the full
feature contract and outstanding gates.

Implemented so far:

- One run identity and clock lease, bounded substeps, the existing strict
  >2500 ms interruption guard with a 500 ms watcher, explicit Resume and stale
  callback protection.
- Pure campaign and battle simulation using the released movement, roster,
  formation, attack, weapon, collision, turret and exposed-reactor rule modules.
- Explicit resource scopes, deduplicated pending loads, decode reservations,
  bounded concurrency and disposal of late results. Failed cleanup stays charged.
- An internal single-encounter fixture using original full-resolution painted
  hulls, boss textures, mounted weapons and projectile CSS. Owned actor surfaces
  are admitted before allocation; a complete back buffer is committed only
  after drawing succeeds. The fixture deliberately has no account/save/payment
  authority and is not an appearance-complete game.

From this directory, with the repository's frontend dependencies installed:

```sh
npm test
npm run typecheck
npm run verify:boundaries
```

`npm run verify:native` needs Playwright and its matching native browser, plus
the repository's original public assets. Supply a Playwright module directory
with `CRYPTOID_PLAYWRIGHT_PATH` when necessary. `CRYPTOID_TEST_ENGINE=webkit`
selects WebKit. The runner starts only a localhost fixture, performs controlled
fault and lifecycle cases, and writes private working evidence under
`verification/rebuild`. The task environment can reuse its previously prepared
native dependencies and byte-verified font mirror. These are Linux Chromium/WPE
runs, not physical phone/Pi Browser or full-campaign acceptance.

Still required before replacement: complete loadout/power/effect/audio rules,
boss fall/reward and durable intermission/bonus handoff, dynamic scene preparation,
original visual parity, existing account/save/inventory/payment adapters, and
sustained complete-game verification on the affected devices. Internal ledger
rewards are not live wallet credits. Managed resource accounting is not native
process/GPU memory measurement.
