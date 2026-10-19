# Official Testnet release, 19 October 2026

Status: **live**, deployed at 2026-10-19T20:11:37Z (22:11:37 Europe/Vienna).
The owner explicitly authorized the reviewed patch with "Ja bitte mach das."
The authorization remains valid; no further approval for the same release is
needed. This note changes no application code or deployment configuration.

## Completed release

- Project: `cryptoid-evolution-testnet`, `prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF`.
- READY production deployment: `dpl_6B1LLYF2VvuhwwjPBPhccPfQfTUM`.
- Public URL: https://cryptoid-evolution-testnet.vercel.app/.
- Immutable host: `cryptoid-evolution-testnet-9t3cacrhk-19-trojan69.vercel.app`.
- Dashboard receipt: https://vercel.com/19-trojan69/cryptoid-evolution-testnet/6B1LLYF2VvuhwwjPBPhccPfQfTUM.
- Exact source: `7cdad95400becf690175af0698292a24fb0a6c21`, reviewed tree below.
- Fixed release branch: `codex/testnet-frame-audit-release-20261019`.
- Production build duration: 53 seconds; framework preset remains unset, using
  the existing Vite/frontend build and API configuration.

The user explicitly authorized the browser fallback after the integration's
403 response, and chose GitHub sign-in. The dashboard resolved the fixed release
branch to the exact reviewed commit. Preview `dpl_HPqNo4aPkomuoJGX5VNvVrFDsySt`
completed first; the dashboard then rebuilt that commit using the project's
existing production environment and assigned the official Testnet domain after
the production build succeeded. No source was merged to main. No project,
environment-variable, domain-configuration or Admin-permission setting changed.
The original audit branch remains excluded from automatic deployments.

## Checks after release

- Independent deployment reads confirm official Testnet is READY production at
  the exact commit above; Mainnet remains at the deployment/source below.
- Public Home returned HTTP 200 and rendered the existing login/Home screen.
- Public entry assets match the production build log:
  `index-Cglu-3l1.js`, `index-CLY2nAhm.css`; the build includes
  `GamePage-DhQ1rrAt.js`.
- `/api/` returned HTTP 200 and the existing Hello World JSON response.
- Anonymous `/api/admin/status` returned HTTP 401, `not_authenticated`.
- Dashboard requests to `/api/hangar/catalog` returned HTTP 200 and the existing
  automatic usage requests returned HTTP 204.
- Browser inspection showed a nonfatal missing `HydrateFallback` warning;
  a Chrome-extension metadata error was outside the application source.
- Production build finished successfully. The language gate reported release
  ready; the existing chunk-size advisory remained. No complete Pi sign-in or
  physical iPhone gameplay/FPS/memory check was performed here.

### Server finding and subsequent correction

This finding was subsequently addressed by the separate, explicitly authorized
Testnet-only release `f5be06d`, deployment `dpl_7CGcYyrnLNXwkU8ychnkxfjqR198`,
at 20:34:14 UTC. The new actual-entry regression reproduces the eager session
store connection in this older source. The correction delays that store until
local Express use. The connection error and associated exit did not recur in
the checked post-release request window; Highscore responses match exactly.
See [session correction](testnet-session-initialization-20261019.md). The account
below records the observations from this earlier frame-audit release.

The integration's runtime-log endpoint returned HTTP 403; this is not a clean
error scan. The authenticated dashboard fallback did expose a concrete issue:
at 20:15:20 UTC (`GET /api/`, HTTP 200) and 20:16:17 UTC
(`POST /api/usage/collect`, HTTP 204), logs included a MongoDB selection failure
connecting to `127.0.0.1:27017` and Node.js exit status 128. The selected API-root
request shows a successful proxy response through the established backend.
The API/backend source is unchanged from the preceding official Testnet tree.
Whether the same server finding occurred before this release is unverified;
no link to the iPhone document restart is established. Do not call runtime logs
clean or describe this frontend release as fixing that server issue.

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

To undo this release, return the official Testnet to the existing deployment
above using the Vercel rollback operation for project
`prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF`. This requires no rebuild. Verify the
official hostname resolves to that deployment and source afterward. Do not
roll back or promote the separate Mainnet project.

Dashboard route: open this Testnet project's Deployments list, select deployment
`8h9mgxiRDUerhJr4PyCPTiaPQgR4`, verify source `66eb357`, and use Instant Rollback
(or promote this existing production deployment). Confirm the target is the
official Testnet domain before applying. This restores the existing build,
without rebuilding or changing player saves. Afterward verify the official
hostname points to `dpl_8h9mgxiRDUerhJr4PyCPTiaPQgR4` and Mainnet is unchanged.

## Earlier integration blocker (release completed via dashboard)

The authenticated Vercel integration rejected `POST /v13/deployments` for the
explicit Testnet project and team `team_KzJmtl0QyoYZAOu5RQKsAR2i`:

> HTTP 403: You don't have permission to create a Production Deployment for this project.

The requested production build pinned the reviewed Git commit above and did
not change project settings, environment variables, account permissions or
domains. No deployment ID was returned. The tool's advertised CLI fallback
was unavailable: no `vercel` executable was installed. No credentials were
requested, retrieved or exposed, and the rejected request was not retried.

The user subsequently authorized the dashboard fallback, which completed the
release described above. The failed integration call itself created no build.

## Verified public state at the frame-audit release (20:11 UTC)

| Site | Deployment | Source | State |
| --- | --- | --- | --- |
| Official Testnet | `dpl_6B1LLYF2VvuhwwjPBPhccPfQfTUM` | `7cdad95400becf690175af0698292a24fb0a6c21` | READY, released |
| Mainnet | `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe` | `907d2a7363345d00f0f90c54402bf04e887b64d9` | READY, unchanged |

No new login or Admin access was granted. No deployment, promotion or rollback
was performed against Mainnet. This patch is included in the subsequent official
Testnet session-store release documented above.
The complete Whitescreen fix remains unproved.
