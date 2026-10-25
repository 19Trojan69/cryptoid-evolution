# White-screen evidence, saved boss intermission and owner player tools

Released to the existing official Testnet, 25 October 2026.
Deployed source: 20843b5501387dca8bb5616303934ece2ae6d581.
Production deployment: JA3UqZt1CvRqr44GLMBB9gSCqvxf.
Official URL: https://cryptoid-evolution-testnet.vercel.app/.

Original base: d615e86f8f1e4bc02b98200d2ba8e3ef2e0ab895.
Branch: codex/testnet-whitescreen-boss-stop-20261025; automatic deployment disabled.
No main merge or Mainnet release is included.

## Resulting behavior

The reviewed source package combines owner-only White Screen reports, the full
session and independently persisted recent events, and weapon activation recovery.
After a defeated boss, the statistics remain until saving is confirmed, unused
resources are released and at least ten visible prepared seconds have elapsed.
Only an explicit Continue gesture starts the bonus round. Failed or uncertain
responses retain the stop and use the existing idempotent recovery paths.
Owner player tools provide scoped search, confirmed score reset and confirmed
account deletion. No real player was reset or deleted for verification.

The real Vercel entry forwards the exported account-deletion guard; the original
adapter omitted it, causing 503 for valid users when deletion was enabled.
Local Testnet sessions use their own signing key and configurable cookie name
to coexist with the established proxy's connect.sid cookie and shared session
collection. Existing deployments retain connect.sid when no override is set.

## Database connection configuration

The owner approved direct Testnet access to the existing database/session data
and the subsequent full Testnet publication. The owner created a separate Atlas
database user. Read-only Atlas metadata confirms readWrite on demo-app, restricted
to the existing cryptoid-testnet cluster, with no additional role or cluster.
The existing database includes the established users, orders, admin_access and
user_sessions collections. No replacement database is provisioned.

The Testnet Dashboard now has MONGODB_URI containing only cluster/database/options,
MONGODB_USERNAME, MONGODB_DATABASE_NAME and CRYPTOID_SESSION_COOKIE_NAME for Production
and Preview. SESSION_SECRET is a separately generated write-only Secret.
The owner saved MONGODB_PASSWORD as a write-only Secret for Production and Preview
through the provider form, never as a chat value. The first full-tree Preview
successfully initialized MongoDB with the scoped credential; the protected player
route returned 401 without authentication and the runtime confirmed the connection.
Neither old nor new database passwords were read, printed or committed.

When MONGODB_USERNAME is explicitly set, both the application's Mongo client and
connect-mongo receive authSource=admin and the separate raw username/password
options. This avoids manual password insertion or URI escaping, including for
passwords containing URI-special characters. URI-only authentication is retained
when no explicit username is configured. Pool and timeout defaults are unchanged.

## Validation and release record

The reviewed frontend build and its 230 tests, plus three controlled Chromium
browser checks, passed before these backend integration changes. The latest
complete backend build and 124 tests pass. New regression controls fail on the
previous adapters and pass with the actual Vercel entry, warm Mongo-backed
sessions, both cookies present, and separate raw credentials forwarded to both
clients. Enabled account deletion now verifies transaction support at startup with
a read-only snapshot transaction using an impossible users filter. It returns no
player data and writes nothing. Failed verification prevents backend readiness,
releases the session and closes the failed connection; a later startup can retry.
The actual-entry tests cover successful verification, warm reuse, and this failure
path. All fixtures use synthetic credentials and controlled storage.

The historical iOS/Pi Browser White Screen cause remains unresolved. Controlled
renderer recovery is not proof that the original device failure is fixed.

Vercel built the complete Git source tree with its original assets. Protected
Preview 7jBKrXq6BR9PtXhM8iLFgtyfiexX used the deployed source above and passed
the real MongoDB connection and read-only snapshot transaction checks. Guest
game start and pause also worked. No partial local build archive was deployed.

The final Production rebuild was created from that Preview in the existing
cryptoid-evolution-testnet project and reached Ready with the official alias.
CRYPTOID_TESTNET_ACCOUNT_DELETION=enabled is saved for Preview and Production
only in that Testnet project. The final deployment's runtime confirmed both
Connected to MongoDB and Account deletion transaction preflight passed (read-only).
Official unauthenticated requests to /api/admin/players/find and
/api/progress/boss-summary/prepare returned 401 not_authenticated. No player
was reset or deleted. A real owner Pi Browser sign-in, boss intermission and
device White Screen run remain user-device checks; these were not simulated
with a real account or represented as completed.

Rollback deployment: EnU4fLgtc81qUEdB1YFGLBWcS1Mn, from the original base above.
Main was not merged and the separate Mainnet project was not published or edited.
This post-release record is documentation only; the deployed code source remains
the exact commit named at the top.
