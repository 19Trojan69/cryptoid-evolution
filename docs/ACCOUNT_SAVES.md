# Permanent account saves

Verified Pi sign-ins use MongoDB user documents, scoped to UID and Mainnet/Testnet.
Guest play remains browser-local. Admin previews never update normal account saves.
No player-save data is joined to the anonymous usage counters.

## Saved data

- Shards balance, standard hull/color copy counts and selected hull/color.
- Account career counters: highest reached section, defeated enemies, earned and
  spent Shards. Legacy records are not imported into these counters.
- Mission checkpoint after each completed block, boss and bonus section.
- Checkpoint score, run Shards, destroyed count, lives, selected weapon source,
  remaining weapon/power-up timers and shields.
- Existing server-owned paid upgrades, loadout, high score and reward collection.

Resume starts the next section with the checkpoint snapshot, not in the middle
of combat. Leaving voluntarily preserves the last completed section; partial
section Shards are not credited because that section is replayed. Death ends the
mission and credits the remaining run Shards once. Starting a new mission replaces
the saved mission but does not erase the account inventory or reward collection.

## Consistency and recovery

Inventory mutations require the current profile version. Reward events, checkpoint
updates and Shards deltas share one compare-and-swap user-document write. A ninth
block also writes the completed-chain prerequisite atomically. Run IDs reject
obsolete writes after another device starts/resumes a mission. A retryable start
key reserves a specific consumable order, preventing retries from consuming a
second item. Paid orders remain independent of the standard fleet.

The client queues reward/final-score writes locally per UID/network and submits
them sequentially. Failed writes remain pending; recovery reinstates only the
server-recorded run metadata. Run recovery expires after eight hours. Obsolete
or expired pending writes require an explicit choice to retain the confirmed
cloud state, archiving the unconfirmed local queue. Clearing browser storage can
destroy unconfirmed writes, but not confirmed database saves. A newer active run
wins across devices; this does not merge simultaneous unfinished runs.

Legacy local standard inventory may be explicitly imported once before the first
account mission. It is grandfathered browser data, not retrospectively verified
gameplay. The import cannot create paid Pi ownership, scores or rewards.

## Verification and operational limits

Build backend before running `node --test src/*.test.mjs src/handlers/*.test.mjs`
inside `backend`. The account-save tests use an in-memory MongoDB-semantic test
double; they do not prove live MongoDB connectivity or backup availability.
Browser verification likewise uses controlled account/API fixtures, not live Pi
credentials. Physical Pi Browser/iPhone testing remains a separate release check.

Gameplay still executes in the browser. Score/time limits and server-owned paid
inventory are enforced, but this is not an authoritative anti-cheat engine.
Database persistence is not a substitute for backups: the operator must verify
MongoDB Atlas backup/restore configuration and retention independently.
