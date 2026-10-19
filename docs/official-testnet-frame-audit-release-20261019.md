# Official Testnet release attempt, 19 October 2026

Status checked at 2026-10-19T18:37:40Z: **blocked before deployment**.
The owner explicitly authorized the reviewed patch with "Ja bitte mach das."
The authorization remains valid; no further approval for the same release is
needed. This note changes no application code or deployment configuration.

## Reviewed source and verification

- Repository: `19Trojan69/cryptoid-evolution`.
- Release commit: `7cdad95400becf690175af0698292a24fb0a6c21`.
- Complete reviewed tree: `37ad25a8540d84ef862aca90f7ef7cc82f82eef2`.
- Branch: `codex/official-testnet-frame-audit-20261019`.
- Scope: avoid discarded per-render initialization and repeated unchanged ship,
  HUD and fully destroyed boss weapon drawing. Preserve gameplay, appearance,
  input, audio, authentication, saves and owner-only Admin access.
- Existing verification: full frontend build, release/localization gate,
  reconciliation/source-preservation checks, existing lifecycle/combat checks,
  and 3,201 strict native RGBA comparisons across all 50 bosses.
- Detailed evidence: [frame audit](official-testnet-frame-audit-20261019.md)
  and [video/boss-7 follow-up](official-testnet-video-boss7-20261019.md).
- Physical iPhone/WebKit FPS and total native/GPU/process memory remain
  unverified. The Whitescreen cause and a complete fix remain unproved.

## Rollback secured before the attempt

- Created and independently verified GitHub branch:
  `backup/testnet-before-frame-audit-20261019`.
- Rollback source: `66eb357cc08a6b5f9b32a9242d6875ed475532fa`.
- Existing READY production deployment: `dpl_8h9mgxiRDUerhJr4PyCPTiaPQgR4`.
- Immutable deployment host:
  `cryptoid-evolution-testnet-hgwzbvatt-19-trojan69.vercel.app`.
- Official host: `cryptoid-evolution-testnet.vercel.app`.

After a successful future release, return the official Testnet to the existing
deployment above using the Vercel rollback operation for project
`prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF`. This requires no rebuild. Verify the
official hostname resolves to that deployment and source afterward. Do not
roll back or promote the separate Mainnet project.

## Deployment access blocker

The authenticated Vercel integration rejected `POST /v13/deployments` for the
explicit Testnet project and team `team_KzJmtl0QyoYZAOu5RQKsAR2i`:

> HTTP 403: You don't have permission to create a Production Deployment for this project.

The requested production build pinned the reviewed Git commit above and did
not change project settings, environment variables, account permissions or
domains. No deployment ID was returned. The tool's advertised CLI fallback
was unavailable: no `vercel` executable was installed. No credentials were
requested, retrieved or exposed, and the rejected request was not retried.

The project owner must make production deployment access available to the
connected integration, or perform the reviewed deployment in Vercel themselves.
User approval is already present; the blocker is Vercel deployment access.

## Verified public state after the rejection

| Site | Deployment | Source | State |
| --- | --- | --- | --- |
| Official Testnet | `dpl_8h9mgxiRDUerhJr4PyCPTiaPQgR4` | `66eb357cc08a6b5f9b32a9242d6875ed475532fa` | READY, unchanged |
| Mainnet | `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe` | `907d2a7363345d00f0f90c54402bf04e887b64d9` | READY, unchanged |

No new login or Admin access was granted. No deployment, promotion or rollback
was performed against Mainnet. The new patch is **not live**.

Before resuming, independently verify both current public aliases, the rollback
deployment and the reviewed commit/tree. Build only in the Testnet project with
its existing production environment; prefer staging without domain assignment
when the available interface supports it. Check the finished build before
promotion, then verify the official hostname and confirm Mainnet is unchanged.
