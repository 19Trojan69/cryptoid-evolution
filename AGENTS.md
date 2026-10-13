# Cryptoid Evolution: backup and release requirements

Before any public Testnet/Mainnet release, record a dated source rollback point
and the actual project/deployment/environment. Verify a backup of the database
actually used by that environment and an isolated restore, including provider/job,
completion time, covered data and retention. Git branches and gameplay checkpoints
are not database backups. The current database backup/restore status is unverified.

Read docs/backup-recovery-2026-10-12.md before release. Do not expose credentials,
account data or database dumps in Git, chat or diagnostics. Restore testing must
use an isolated database with payments and outward account/reward writes disabled.
No public deployment, main merge, paid changes or destructive restore without
explicit user approval. Preserve existing work and network separation.

Follow frontend/AGENTS.md, particularly the 13 October scope reset: current official
Testnet is the baseline; preserve appearance and gameplay, with only the explicit
kill-origin power-up correction and technical stability changes.
