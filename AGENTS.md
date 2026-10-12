# Cryptoid Evolution: backup and release requirements

Marc requires an available backup before every public release (12 October 2026).

- Before changing a public Testnet or Mainnet deployment, preserve the current source commit in a dated backup ref and record its project, deployment and environment. Confirm the return deployment still exists. Keep all source assets and existing network separation.
- Before a public release, require a verified database backup covering the real backend used by that environment. A Git/Vercel code rollback or a gameplay checkpoint does not satisfy this database requirement.
- Record backup provider/job ID, completion time, covered database/collections, retention and the latest isolated restore verification. Do not treat a prepared script, configuration, a running job or an unverified screenshot as a completed backup.
- If database protection cannot be verified, stop the public release and state the missing evidence. Continue reversible analysis, code preparation, tests and isolated previews.
- Never put database dumps, customer data, connection strings, passwords, Pi keys or decrypted environment values in Git, chat, logs or public artifacts. Use encrypted storage with controlled access; recovery credentials remain in the provider's secure configuration.
- Preserve Testnet/Mainnet data and payment boundaries during backup and recovery. Restore testing must use an isolated database with payments, outgoing notifications and reward/account writes disabled. Never automatically restore into a live database or replay payment/reward operations.
- Read docs/backup-recovery-2026-10-12.md and its inventory before release. Reverify live facts; this inventory is a dated record, not a claim that automatic database backups are active.
- No Main merge, Mainnet publication, paid service upgrade or destructive live restore without the user's explicit instruction. Follow frontend/AGENTS.md for the approved game presentation and mechanics.
