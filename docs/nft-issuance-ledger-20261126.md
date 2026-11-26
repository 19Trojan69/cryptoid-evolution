# Isolated NFT issuance bookkeeping preparation

Prepared 26 November 2026 from the published Mainnet source
`bfccab8601c6441d8baab7d233fad63ce5343c00`. This change prepares an unmounted
MongoDB bookkeeping core. It does **not** integrate an issuer, authorize an
issuance, publish artwork/metadata, create an acquisition entitlement in the
live game, or establish blockchain ownership. It does not run on Testnet or
modify the independently maintained Testnet source.

`backend/src/nftIssuanceLedger.ts` is not imported by server initialization,
routers, release inspection, payment completion or gameplay. Constructing it
opens no connection and performs no writes. Its explicit `initializeStorage`
maintenance operation is exercised only against disposable local test databases
in this change. No production database or stock has been initialized.

## Data and atomicity

| Collection | Stored facts | Invariants |
| --- | --- | --- |
| `nft_issuance_series_v1` | App/network/card identity, reviewed catalog hash, immutable maximum supply and publication fingerprint, allocated and confirmed counters | Existing policy/counters are never replaced on initialization. Allocation cannot exceed the reviewed cap. |
| `nft_issuance_claims_v1` | Verified source identity, account, recipient, card, catalog/evidence fingerprint, serial, issuance work key and separate lifecycle timestamps | One source entitlement per app/network/source kind; one issuance work key; one confirmed canonical asset identity per network. |

Reservation re-resolves the acquisition from authoritative server records in the
same snapshot transaction that increments the series counter and inserts the
unique claim. Writes require majority acknowledgement. MongoDB transactions
and unique indexes are required; there is no fallback for a standalone server,
index failure or transaction failure. A failed insert rolls back its counter
increment. Serial numbers are allocated atomically; they do not identify a
blockchain token.

The supported bookkeeping states are:

| State | Meaning | Capacity treatment |
| --- | --- | --- |
| `reserved` | A trusted acquisition resolver established a particular entitlement; no submission work has been claimed. | Counts against the series cap. |
| `pending` | A single worker has durably claimed submission work before any future external call. The external result may be unknown. | Remains allocated, including after errors, timeouts and worker crashes. |
| `confirmed` | A future trusted verifier returned matching chain evidence for this work key, recipient and reviewed publication; confirmation and its counter were recorded atomically. | Remains allocated; confirmation counted exactly once. |

`beginSubmission` returns `dispatchClaimed: true` to one worker only. This is
exclusive ownership of bookkeeping work, **not** a Mainnet operator approval,
release capability or permission to bypass the existing joint purchase/NFT
gate. It fails when the trusted verifier or reviewed publication is absent.
This module contains no dispatch/issue/mint call. A future integration must
independently enforce the unchanged global readiness and explicit owner release
requirements before contacting an authorized issuer.

Pending work is never timed out to `reserved`, recycled, deleted or retried with
a fresh issuance key. There is no automatic cancellation/release method. A
crash between the pending write and the future external call requires
reconciliation by the supported authorized adapter. Unknown/failed verification
keeps capacity held; it cannot authorize a second submission. A future reviewed
recovery design must resolve proven non-submission safely before introducing
any resubmission or capacity-release feature.

## Trusted acquisition boundary remains to be integrated

`resolveAcquisition(reference, session)` is a required server-only dependency.
There is deliberately no HTTP handler accepting a claimed UID, payment object,
wallet, card, cap, ownership flag or `verified: true` payload. The resolver must
read the authoritative payment or server gameplay/acquisition record with the
provided session and return `null` if any required proof is missing.

The future resolver must establish all of the following:

- Exact app/network binding and the reviewed catalog/card, with the original
  acquisition conditions. Mainnet cannot use a Testnet order, an Admin preview
  or an imported client save as proof.
- For a paid acquisition: verified payment provenance, product, amount,
  quantity, completion, account, recipient and absence of cancellation,
  consistent with the existing payment rules. A display receipt alone is
  insufficient. For earned or Shard acquisitions: the corresponding verified,
  persisted server achievement/purchase, including prerequisites.
- A stable canonical source kind/ID and evidence digest, unchanged on retries.
  A payment uses its actual verified payment ID and cannot be relabeled as a
  gameplay/Shard source. An earned/ship entitlement that existing rules permit
  once per account/card must use that canonical persisted entitlement identity,
  never a new per-request ID or every repeated receipt. The generic ledger does
  not add a new duplicate-purchase rule to other collections; the resolver must
  enforce each collection's existing policy before reservation.
- The account's actually authorized recipient binding. No Pi UID-to-wallet
  relationship, wallet address or proof has been invented in this preparation.

The resolver runs inside a retryable MongoDB transaction: it must not send
notifications, write to unrelated systems or call a blockchain API. A retry
must resolve the same immutable proof. Changed account/card/recipient/evidence
under the same source ID fails instead of reusing or transferring the claim.

The module accepts a reviewed **server-loaded** manifest snapshot; its API is
not a policy-authentication mechanism. It must never take caps or proof records
from request bodies. It changes none of the current catalog's prices, caps,
original artwork or acquisition conditions.

## Trusted confirmation boundary remains to be integrated

`verifyIssuance(claim, publication)` is optional and absent by default. No
configured flag, fabricated transaction, caller-supplied confirmation object or
local eligibility record replaces it. The future supported, app-authorized
issuer/verifier must independently establish matching network, app, card,
recipient, stable issuance/submission identity, canonical asset identity,
transaction, confirmed time and reviewed permanent metadata identity. This
module does not choose a protocol, guess an endpoint, contract, asset format,
finality threshold or authorization.

The verifier runs outside retryable DB transactions. Its result is checked
again against the immutable pending claim inside the confirmation transaction.
`assetId` must be the canonical **network-global issuer/contract plus token
identity** for the actual supported protocol, not a display name or a local
collection-relative token number. The unique index relies on that canonical
identity to stop one asset satisfying multiple claims. The verifier must also
actually fetch/verify chain data; implementing a callback that merely echoes the
claim is not an integration or a readiness proof.

A `confirmed` row records verified issuance at the stated time. It does not
prove the recipient still owns the asset after a later transfer and is not a
current ownership API. No actual row was confirmed on Pi by this work.

## Publication and policy revisions

Final original-art and metadata publications are still unestablished. The
optional publication descriptor is trusted reviewed policy input, not evidence
of public reachability/durability merely because its HTTPS syntax is accepted.
Use the existing original-art/content validation and actual durable publication
evidence before supplying it. There are no production descriptor values here.

Series identity excludes a changing global catalog hash, so creating a new
manifest cannot silently reset a card's cap. The series stores the exact
catalog hash, cap and publication fingerprint; attempts to change any of them
fail with `nft_series_policy_conflict`. This intentionally also rejects attaching
metadata to an already initialized series whose publication was absent. A
reviewed migration/reconciliation is required before such policy changes;
storage must not be initialized in production with provisional definitions.
No migration or production reservation is part of this change.

## Validation

The new tests use synthetic accounts, acquisition proofs, publication strings
and verifier results. No fixture URL was fetched or published, and no fixture
is a live Pi receipt or blockchain confirmation.

Two always-run tests check configuration/import safety and transaction failure
without fallback. The opt-in integration cases use the existing MongoDB driver
and a disposable loopback replica set, exercising actual transactions and
unique indexes: concurrent supply exhaustion, same-source retries, proof
mismatches/replay, insert rollback, exclusive pending work, restart/unknown
results, missing verifier/publication, confirmation races, chain mismatch/outage,
asset replay, immutable policy/counters and damaged counter/series bindings.

Run after the ordinary backend build, with a local replica-set URI supplied
explicitly through `CRYPTOID_NFT_LEDGER_TEST_URI`. Integration tests reject a
non-loopback URI, create only fresh `cryptoid_nft_ledger_test_*` databases and
drop those disposable databases afterward. Without that URI they report skipped
integration cases; skipped cases are not a completed concurrency test. No new
runtime or manifest dependency is introduced.

Executed on 26 November 2026: the backend TypeScript build passed, all 14 new
cases passed with zero skips against MongoDB 7.0.14 using a disposable local
single-node replica set, and the full backend suite passed 295 cases with one
pre-existing skip (296 total, zero failures). The replica and test runner ran
within the same isolated process tree; no Atlas or application database was
contacted. Independent code review found no remaining blocking issue. Existing
project-wide lint debt was not repaired or re-certified by this change.

Passing these tests establishes the isolated bookkeeping behavior under the
tested local MongoDB setup. It does not establish Atlas deployment/credential
readiness, a real acquisition resolver, final publications, a supported issuer,
Pi approvals, a genuine payment, physical Pi Browser acceptance or blockchain
ownership. `nftReadiness.ts`, release policy and every runtime route remain
unchanged and blocked as before.
