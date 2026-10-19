# Testnet session-store initialization correction, 19 October 2026

Status: prepared and locally verified; not published.

## Observed failure and cause

The official Testnet production release is
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

The official Testnet and Mainnet deployments are unchanged by preparation.
The previous Testnet release instruction covered `7cdad95`; publication of
this additional backend correction remains to be authorized.

The immediate rollback point is the existing READY production build
`dpl_6B1LLYF2VvuhwwjPBPhccPfQfTUM` at `7cdad95`, preserved by fixed branch
`codex/testnet-frame-audit-release-20261019`. The earlier `66eb357` rollback
is also retained. Mainnet remains `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe` at
`907d2a7363345d00f0f90c54402bf04e887b64d9`.

After an authorized Testnet-only release, inspect actual Vercel function logs
after catalog/proxy/usage requests and confirm the localhost connection error
and associated exit do not recur. Repeat anonymous Admin denial and public
API smoke checks. Do not call the server error fixed in production before
that check; physical iPhone FPS/native memory and the Whitescreen cause remain
unverified.
