# White-screen evidence, saved boss intermission and owner player tools

Prepared official Testnet source, 25 October 2026. Not deployed.

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
MONGODB_PASSWORD remains a secure manual provider input, never a chat value.
Neither old nor new database passwords were read, printed or committed.

When MONGODB_USERNAME is explicitly set, both the application's Mongo client and
connect-mongo receive authSource=admin and the separate raw username/password
options. This avoids manual password insertion or URI escaping, including for
passwords containing URI-special characters. URI-only authentication is retained
when no explicit username is configured. Pool and timeout defaults are unchanged.

## Validation and release gate

The reviewed frontend build and its 230 tests, plus three controlled Chromium
browser checks, passed before these backend integration changes. The latest
complete backend build and 122 tests pass. New regression controls fail on the
previous adapters and pass with the actual Vercel entry, warm Mongo-backed
sessions, both cookies present, and separate raw credentials forwarded to both
clients. All fixtures use synthetic credentials and controlled storage.

The historical iOS/Pi Browser White Screen cause remains unresolved. Controlled
renderer recovery is not proof that the original device failure is fixed.

Before publication: save the new MONGODB_PASSWORD through the secure Vercel form,
verify the real connection and owner authorization, capture the exact current
Testnet rollback deployment, and build the complete Git tree with original assets.
Do not use the partial local compiled output as a deployment archive.
Enable CRYPTOID_TESTNET_ACCOUNT_DELETION only after the configuration, guard and
transaction-capability checks pass together; no real deletion is a smoke test.
No new deployment has been requested by this source-preparation step.
