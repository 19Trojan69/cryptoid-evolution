# Testnet session-store initialization correction, 19 October 2026

Status: live on official Testnet since 20:34:14 UTC (22:34:14 Europe/Vienna).

## Release receipt and checks

- Exact release source: `f5be06d594f70f21fe9b6b6235015b819b57bb34`.
- Complete reviewed tree: `2e030b6e43f0fe71e5cd2de410d5eb71230d7e71`.
- READY production deployment: `dpl_7CGcYyrnLNXwkU8ychnkxfjqR198`.
- Official URL: https://cryptoid-evolution-testnet.vercel.app/.
- Immutable host: `cryptoid-evolution-testnet-e29vjvwzf-19-trojan69.vercel.app`.
- Dashboard: https://vercel.com/19-trojan69/cryptoid-evolution-testnet/7CGcYyrnLNXwkU8ychnkxfjqR198.
- Production build: 48 seconds, existing Vite/frontend and API settings.
- Staging preview: `dpl_3pkDokaYvM2UkUW15Cn2tWBjnCJL`, 43 seconds.

The user-authorized dashboard fallback remained signed in through GitHub.
Vercel resolved the fixed release branch reference to the preparation branch
containing the same exact commit; the SHA was verified before promotion.
The production environment rebuilt that exact SHA and then assigned the
official Testnet hostname. No project settings, credentials or database settings
were changed. Fixed release branch `codex/testnet-session-store-release-20261019`
remains at this source; documentation continues on the disabled preparation
branch. No source merge or deployment occurred against Mainnet.

Public post-release checks at 20:34:48–20:34:54 UTC:

- Home rendered normally and returned 200. Entry JS/CSS filenames are identical
  to the preceding official release, including `index-Cglu-3l1.js` and
  `index-CLY2nAhm.css`; the build retains `GamePage-DhQ1rrAt.js`.
- API root and public hangar catalog returned 200.
- Anonymous Admin status returned 401, `not_authenticated`.
- Legacy, V2 and career Highscore responses returned 200 with exact before/after
  equality of their complete canonical JSON hashes. Entry counts remain 2, 17,
  and 8. No score/account records were altered to perform these read-only checks.
- At 20:36:26 UTC, the new deployment's dashboard request-log view contained 17
  request records, including two usage requests (204), catalog/proxy/Highscore
  requests (200) and the expected anonymous Admin denial (401). No MongoDB
  connection-refusal, unhandled rejection, exit 128 or 5xx appeared. Only the
  existing `NODE_ENV: production` informational messages were present. The
  observed window exceeds the former connection failure delay. This establishes
  no recurrence in the checked window, not an unlimited uptime guarantee.
- Independent deployment reads confirm the official alias and exact SHA.
  Mainnet remains the preceding deployment/source documented below.
- Machine-readable public comparison evidence is in
  `testnet-session-initialization-release-20261019.json`; it contains counts,
  response hashes and technical status only, with no account or score values.

## Observed failure and cause

The preceding official Testnet production release was
`7cdad95400becf690175af0698292a24fb0a6c21`, deployment
`dpl_6B1LLYF2VvuhwwjPBPhccPfQfTUM`. Its dashboard logs showed a MongoDB
connection refusal to `127.0.0.1:27017` and Node.js exit 128 after successful
proxy responses at 20:15:20 and 20:16:17 UTC. The API root returned 200 and
the usage endpoint returned 204. These successful responses alone did not
establish a healthy function lifecycle.

The static import in `api/index.ts` evaluates `backend/src/index.ts` before
the gateway chooses a route. That module created `MongoStore` immediately.
Installed `connect-mongo` 5.1.0 calls `MongoClient.connect` in its constructor
when given `mongoUrl`. The existing default URI falls back to localhost when
no local database is configured. Official Testnet uses the established
backend proxy and its own public catalog; neither route needs the imported
local Express app or a local Mongo session store.

The new actual-entry regression fails against the unmodified official source:
one session-store creation occurs during import, before a request. This
reproduces the unwanted connection trigger in an isolated process with
synthetic configuration. It does not prove a cause of the iPhone Whitescreen.

## Isolated change

Create the existing session middleware and Mongo store on the first request
that actually enters the local Express app, then reuse them for warm requests.
The static Vercel import remains intact: an earlier dynamic-import attempt
already failed runtime module resolution and is not repeated here.

All session options, cookie flags, database/collection names, authentication,
owner authorization, Pi service routing, saves, payment logic and gateway
behavior are unchanged. No pool settings, timeouts, database credentials,
network access rules, data, frontend code or dependencies are changed.
`vercel.json` only disables automatic deployment on the preparation branch
`codex/testnet-lazy-session-store-20261019`.

## Verification

- Full backend TypeScript build passed before and after the change.
- 109 backend tests pass, including the three new actual-entry checks and
  existing gateway, owner authorization, payment, save and reward regressions.
- The actual statically imported API entry plus six Testnet request paths
  create zero local session stores and zero Mongo connections. Paths include
  public catalog, API root, sign-in forwarding, anonymous Admin denial, usage
  forwarding and upstream failure. Authentication forwarding and Testnet
  network selection remain unchanged.
- Real Express, express-session and connect-mongo run against a synthetic
  Mongo client/collection fixture. A local session survives consecutive HTTP
  requests; HttpOnly, Secure and SameSite=Lax remain present. Warm requests
  retain one session store and the existing two connection lifetimes (backend
  and session store), without additional connection creation.
- A synthetic first backend connection failure returns controlled HTTP 500,
  starts no session store, and can recover on the next request without an
  unhandled rejection.
- Source-preservation check confirms byte-identical session options and no
  change to `api/index.ts`, gateway source or any frontend file.
- `git diff --check` passes. Tests use synthetic data only; no live account,
  database, payment or permission is changed.

## Release boundary and rollback

At 22:28 Europe/Vienna the user explicitly authorized this additional Testnet
release provided saved data and Highscore lists are not deleted. The patch
contains no deletion or schema/data migration and retains all session settings.
The user clarified that Highscore lists were meant. No separate Mainnet release
or account/data mutation is authorized. Do not ask for the same authorization
again.

The immediate rollback point is the existing READY production build
`dpl_6B1LLYF2VvuhwwjPBPhccPfQfTUM` at `7cdad95`, preserved by fixed branch
`codex/testnet-frame-audit-release-20261019` and the independently verified
`backup/testnet-before-session-store-20261019`. The earlier `66eb357` rollback
is also retained. Mainnet remains `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe` at
`907d2a7363345d00f0f90c54402bf04e887b64d9`.

To undo this correction without rebuilding, use Instant Rollback in the existing
Testnet project to `dpl_6B1LLYF2VvuhwwjPBPhccPfQfTUM` (source `7cdad95`). Verify
the official Testnet domain is the target before applying, and verify that alias
and unchanged Mainnet afterward. This restores application code without resetting
player data. The older `66eb357` rollback remains available as well.

The unwanted connection trigger is corrected and did not recur in the checked
live window. Physical iPhone FPS/native memory and the Whitescreen cause remain
unverified. No full campaign replay is required merely to gather the same known
resource counters.
