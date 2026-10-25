# White-screen diagnosis, boss intermission and player administration

Prepared source for the next official Testnet release, 25 October 2026.

Base: d615e86f8f1e4bc02b98200d2ba8e3ef2e0ab895
Original source tree: 4ba6309b5c33d336d69e31b8b82fd29e360bb92a
Branch: codex/testnet-whitescreen-boss-stop-20261025
Automatic deployments: disabled for this branch. No main merge or Mainnet release.

The 48-file reviewed package adds a unified private owner report, independently
persisted last-event records, weapon activation recovery, a saved manual boss
intermission before the bonus round, and confirmed player administration.
Source package: Cryptoid_Evolution_WhiteScreen_Bossstopp_Admin_Pruefpaket_2026-10-25.zip.

The release integration review found a missing export in the Vercel adapter:
the account-deletion guard was exported by the backend but not forwarded by
api/index.ts. With deletion enabled, even active Testnet users received 503.
A test executing the actual transpiled Vercel entry reproduced 503 instead of
200 before the correction. After forwarding the existing guard, active requests
reach the established proxy and deleted tokens receive 410.

Validation: the reviewed package previously passed the frontend build and 230
frontend tests, 119 backend tests and three controlled Chromium browser checks.
The adapter correction passes the complete backend build and all 120 backend
tests. No physical iOS/Pi Browser White Screen cause or full-campaign stability
is established. No real player was deleted or reset during these checks.

## Live configuration gate

The authenticated Vercel dashboard was inspected read-only. The Testnet project's
Project variables contain PI_DOMAIN_VALIDATION_KEY (Production) and a diagnostic
username setting limited to an older Preview branch. The Shared tab reports
"No shared variables linked". No secret values were read or exported.

MONGODB_URI, MONGODB_DATABASE_NAME and SESSION_SECRET are not configured on the
Testnet project. Its established requests still proxy to the existing backend.
The new local summary/player routes must use that same existing user/save data,
compatible sessions and the same verified owner binding. Do not provision an
empty database, copy secrets into source, deploy incomplete local build output,
or publish these routes before their authenticated configuration is verified.

CRYPTOID_TESTNET_ACCOUNT_DELETION=enabled additionally requires the deletion guard
and MongoDB transaction support to be verified together. No actual deletion is
a release smoke test. Leave the feature disabled until this gate is satisfied.

Current status: source prepared; no deployment or environment setting changed.
The existing official Testnet is the rollback point. Capture its exact current
deployment before any release. Original artwork/audio/fonts remain in the base
Git tree and must be retained by the deployment build.

## Authorized connection preparation

The owner explicitly approved the direct Testnet database/session connection
and subsequent full Testnet publication. Atlas read-only metadata confirms the
existing cryptoid-testnet cluster and demo-app database with users, orders,
admin_access, user_sessions and the established community collections.
The existing backend uses the default database name. Its saved Production
MongoDB value is a write-only Secret and was not read or copied.

A narrow readWrite user restricted to this database and cluster was requested
through the Atlas connector. The connector returned: User did not confirm the
execution of atlas-create-db-user; operation not performed. No new database
user was created; this rejection must not be bypassed through another write path.

The Vercel API still returns project-not-found for the dashboard-verified project
ID. The already authorized Dashboard route saved MONGODB_DATABASE_NAME=demo-app
and CRYPTOID_SESSION_COOKIE_NAME=cryptoid.testnet.local.sid for Production and
Preview. An independent generated SESSION_SECRET was saved as a write-only Secret
in those environments; no value was printed, committed or retained in an artifact.
Local Testnet sessions use an independent signing key and cookie so
that the established proxy's connect.sid remains compatible. A regression test
using the actual Vercel entry verifies stored state with both cookies present.
The complete backend build and all 121 backend tests pass.

Publication remains blocked until MONGODB_URI has been supplied through a secure
provider form and the database connection is verified. The account-deletion
flag remains disabled until this configuration and transaction gate is satisfied.
No new deployment, player reset or account deletion has been performed.
