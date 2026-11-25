# Mainnet checkout evidence contract

Prepared 25 November 2026. This is a read-only readiness interface; this change
creates no approval, wallet connection, payment or production evidence record.
The NFT issuance and final-publication checks remain blocked independently.

## Configuration and trust boundary

`backend/src/mainnetEvidence.ts` uses explicit server configuration:

| Setting | Meaning |
| --- | --- |
| `CRYPTOID_APP_NETWORK=mainnet` | This server is configured for the Mainnet app. |
| `PI_MAINNET_APP_ID` | The actual Mainnet app identifier from its authorized configuration; do not guess it. |
| `PI_MAINNET_API_KEY` | The server-only credential for that exact app, supplied through protected configuration. A generic or Testnet key is not a substitute. |
| `PI_MAINNET_WALLET_ADDRESS` | The approved incoming wallet's actual public address. |
| `ADMIN_PI_UID` | The verified Mainnet app owner UID; distinct app UIDs must remain separate. |
| `VERCEL_GIT_COMMIT_SHA` or `CRYPTOID_CODE_REVISION` | The exact 40-character source revision being inspected. |

Known Testnet or other deployment identities cannot attest Mainnet checkout.
No request-body flag, browser wallet field or environment `ready=true` value
replaces the evidence checks. Keys and raw portal evidence must never be put in
Git, logs, the client bundle or public API responses.

## Owner-reviewed evidence record

An authorized operator can later provide a reviewed record through the existing
protected database administration process. There is no HTTP route in this change
to create it. The record key is `mainnet-readiness-evidence:v1` in the existing
server `adminCollection`.

| Field | Required value |
| --- | --- |
| `schemaVersion` | `1` |
| `network` | `Pi Network` |
| `appId` | Exact configured `PI_MAINNET_APP_ID` |
| `walletAddress` | Exact configured incoming wallet public address |
| `codeRevision` | Exact inspected source revision |
| `reviewedBy` | Exact configured verified Mainnet owner UID |
| `keyFingerprint` | Lowercase SHA-256 of the actual scoped server key; store no raw key in this record. |
| `reviewedAt` | Actual review timestamp, no future time |
| `validUntil` | Future expiry, after review and at most 90 days from review |
| `walletApproval` | Object containing `status: approved`, an official source URL and SHA-256 of the retained review artifact |
| `appApproval` | Same shape, recording the actual required Pi app/payment approval reviewed for this app |
| `checkoutPaymentId` | Identifier of an existing completed, server-recorded Mainnet U2A payment for this app and revision |
| `checkoutAcceptance` | Retained, reviewed acceptance of the actual end-to-end U2A flow for this exact revision, owner and payment; see below. |

Each approval object's `sourceUrl` must use HTTPS and exactly `develop.pi`,
`developers.minepi.com` or `minepi.com`, without embedded credentials or a
nonstandard port. `evidenceSha256` is the digest of the actual retained artifact,
not invented placeholder data. Retain the artifact in authorized private storage
with sufficient context to review the app, wallet and Pi approval involved.

The code treats this as **operator-reviewed evidence**. It does not fetch a
portal status or infer Core Team approval from an official webpage's existence,
an arbitrary official URL or the digest alone. KYC, listing, PiNet and Pi Next
registration/submission remain separate statuses requiring their own evidence.
Do not create an `approved` record while its underlying status is unknown.

## Existing-receipt verification

An existing historical payment cannot establish current checkout readiness by
itself. `checkoutAcceptance` must contain all of these fields:

| Acceptance field | Required value |
| --- | --- |
| `kind` | `end_to_end_u2a` |
| `codeRevision` | Exact inspected source revision |
| `paymentId` | Exact `checkoutPaymentId` |
| `reviewedBy` | Exact verified Mainnet owner UID |
| `verifiedAt` | Actual end-to-end acceptance time, at or after the order's completion and at or before the evidence review time |
| `evidenceSha256` | Lowercase SHA-256 of the retained end-to-end acceptance artifact |

That artifact must record the tested current app/UI path, account, network,
product, amount, wallet destination and resulting confirmed service. It must
come from the authorized acceptance exercise; neither a synthetic receipt nor
a successful read-only API probe is sufficient. Providing the artifact remains
an external operator action; this task performs no real payment or acceptance
record creation.

Only after the configuration and reviewed evidence match does the readiness
inspector read the specified paid, uncancelled Mainnet order. It then performs a
read-only `GET https://api.minepi.com/v2/payments/{id}` using the scoped key.
The order and Pi response must agree on the actual account, product, quantity,
amount, network, incoming wallet, verified transaction and completion state.
The inspector never invokes `/approve`, `/complete` or payment creation.

The inspector combines the retained current-revision end-to-end acceptance with
current read-only verification of its selected receipt. It does not execute a
new live checkout test, retroactively verify every product or physical device,
or repair missing receipt provenance. The required real-world end-to-end
acceptance must be performed separately by an authorized operator under a later
explicit instruction. This task prohibits real payments.

Evidence expires or becomes unusable after a revision, key, app, wallet or owner
binding changes. A Pi/API outage fails closed. Only safe reason codes are exposed;
raw credentials and upstream errors are not returned.

## Capability and release policy

The server reports separate app/network, credential configuration, wallet
approval, existing checkout and external Pi approval checks. Configured credentials
alone do not establish a functioning checkout.

Mainnet release still requires every existing release capability, including
supported NFT issuance and verified final metadata. The reviewed public Pi
documentation does not establish an app-authorized NFT issuance integration for
this project, and no final NFT publications have been provided. Both remain
blocked. A valid checkout record or stored operator release cannot bypass them.
The explicit owner release, revision checks and safe error behavior remain in
`mainnetRelease.ts`.

## Relevant official documentation

- [Launch checklist and approved Incoming Multisig Wallet](https://developers.minepi.com/docs/build-first-app/Launch)
- [Production testing and real U2A checkout acceptance](https://developers.minepi.com/docs/build-first-app/Production)
- [Platform API and payment status](https://developers.minepi.com/docs/api-reference/PlatformAPI)

The repository's behavior tests use simulated responses and fake credentials
only. They do not establish live Pi approval, payment success or device stability.
