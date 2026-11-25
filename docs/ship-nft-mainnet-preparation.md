# Cryptoid Evolution ship NFTs

The collection contains 20 player hulls in three editions. In revision `fleet-liveries-20261113`, the Advanced and Elite artwork carries each hull's Standard livery. The Pi Vanguard cards use the approved gold and violet Metallic Edition. The Shop shows the same fixed livery for each hull in all three stages. The downloadable bundle includes 60 full-size cards, 60 matching WebP previews, English stories and per-card terms in the metadata, and a manifest with SHA-256 hashes. The metadata image references are relative to the extracted bundle. Assign immutable hosted image and metadata URIs when preparing the contract.

| Edition | Max per model | Mainnet acquisition |
| --- | ---: | --- |
| Standard | 99,999 | Grey Scout is the free starter. The other 19 hulls cost 150 to 4,650 Shards, depending on the model. The NFT is included after confirmed acquisition. |
| Advanced | 31,415 | The matching base hull and a confirmed upgrade for 9.90 Pi. The NFT is included. |
| Elite | 3,141 | The matching Advanced stage and a confirmed Elite upgrade for 19.90 Pi. Both upgrades total 29.80 Pi. The Elite NFT is included. |

The combined maximum is 2,691,100 NFTs. The manifest gives the planned Shard or Pi price for each model and edition. Public Testnet players earn and spend Shards to acquire all 20 Standard ships, with the free Grey Scout as their starter. Each owned Standard ship can be selected for a Testnet mission. Testnet ship ownership is stored in the Testnet save slot.

## Prepared application behavior

The Shop has edition-specific copy next to the ship price and connects a Pi account before a Standard purchase in the released Mainnet shop. The NFT gallery uses the same artwork as the downloadable bundle. It loads at most five cards per request and returns the artwork for cards with an eligible Mainnet account state. The detail sheet describes eligibility. A future confirmed issue record must drive the issued state.

Payment eligibility uses the stored Pi network, payment ID, product ID, account UID, matching amount, transaction ID and completion time. Admin preview data and Testnet activity confer zero Mainnet eligibility. Verified pre-existing Mainnet ship receipts with all these fields qualify for the prepared view. Standard eligibility uses the account's server-managed Mainnet hull ownership. Imported inventory requires a separate recorded Shard purchase, except for the account-issued Grey Scout. An account whose historical import mixed verified and imported hulls may need an audit before launch to identify older purchases. No automatic migration or retroactive mint runs here.

## Artwork and release

Build the backend and verify the extracted artwork bundle with `node backend/scripts/importShipNftArtwork.cjs /path/to/extracted-bundle`. The command checks the 60 card IDs, WebP dimensions, sizes and checksums. With `--apply` and the selected `MONGODB_URI` and `MONGODB_DATABASE_NAME`, it upserts the revision by card ID into `shipNftPreviewArtwork`. This is a preview-art import. Repeating it leaves one row per revision and card.

`CRYPTOID_MAINNET_SHIP_NFTS_ENABLED` on the server and `VITE_CRYPTOID_MAINNET_SHIP_NFTS_ENABLED` at frontend build time default to disabled. The server also requires the production deployment of the Mainnet project. Keep both switches off through purchase-flow, artwork and contract review. Automatic deployment is disabled for the preparation branch.

## Blockchain integration still to do

### Owner release control

The Mainnet Admin overview contains a Mainnet release control. The server stores
the requested state and revision in the existing owner-access collection. A
missing record starts in preparation. Every request uses the existing verified
owner authorization. Testnet requests cannot change the Mainnet release.
Updates compare the displayed revision with the stored revision, so an older
screen cannot overwrite a newer change.

As of 25 November 2026, readiness separately checks account storage, the Mainnet
app/network and scoped server key, approved connected wallet evidence, an existing
completed checkout and required Pi approval evidence. The existing payment is
read from Pi with the scoped key and compared against the saved receipt, product,
quantity, amount, user, network, destination and transaction. No new payment is
created. The exact reviewed-evidence contract is in
[mainnet-evidence-contract.md](mainnet-evidence-contract.md).

NFT issuance and final public metadata remain unestablished. The release control
therefore stays blocked. A stored release flag and browser-supplied readiness
fields cannot enable purchases while these server checks remain incomplete. The
original joint release policy remains: readiness of ordinary Pi payments alone
does not release offers with an included NFT or bypass NFT prerequisites.

New Mainnet payment approvals consult this release state. Previously approved,
verified Mainnet transactions can still be completed and recovered while the
application is in preparation. Existing Test-Pi policy continues to apply to
Testnet purchases. Basic gameplay and earned-Shard purchases use their existing
paths. The gate establishes controlled activation. Mainnet wallet checkout,
on-chain issue verification and device acceptance remain release work.

Confirm the Mainnet ship checkout and the wallet destination before enabling the feature. Use the successful server-side acquisition or payment completion as the trigger to persist an issuance job once per Mainnet account and card. Persist it with the acquisition or reconcile the verified record if completion is retried. Submit to the reviewed Mainnet contract, reconcile retries with the chain and mark the NFT issued only after verifying the chain transaction. Confirm the issuance policy for pre-launch purchases and imported saves. Verify those flows with real approved Mainnet test cases before going live.

## Owner preparation catalog

The Mainnet Admin overview also provides a read-only metadata draft for the
existing 500 designs: 200 boss editions, 60 ship editions and 240 Retro editions.
Shared terms preserve the existing prices, supply caps and acquisition conditions.
The export carries a SHA-256 content fingerprint, stable card IDs and the original
boss stories when present in the preview collection. It reads only the story and
ID fields from that collection.

The draft is explicitly unpublished: `publishable` is false, each `metadataUri`
is null and every metadata `image` is null. Owner-only Testnet artwork paths are
labelled preview references, never public NFT image addresses. The status lists
missing hosted addresses, descriptions and 98 premium designs currently represented
by silhouettes. All 430 paid designs now have stable product mappings: 40 retain
the existing ship offer IDs, and 390 boss/Retro editions use preparation IDs.
Those 390 IDs are marked `productState: prepared`, are not inserted into the live
checkout catalog, and still need an operational acquisition/delivery flow. The
Admin pending-checkout count uses prepared products, not missing mappings.

The offline versioned publication-candidate validator requires matching card IDs,
catalog hash, exact image and metadata SHA-256 hashes, complete matching metadata
and an operator-allowed HTTPS origin. Validation creates no final publication:
public reachability and a supported authorized issuance path are still unverified,
so even a valid candidate remains `publishable: false`. It cannot turn an owner-only
preview address into a final NFT image URI. See
[pi-next-readiness-20261125.md](pi-next-readiness-20261125.md) for the official-source
research and exact external prerequisites.

Preview responses explicitly identify `state: preview` and
`blockchainOwnershipVerified: false`. A verified acquisition-evidence helper checks
server-side eligibility; it does not claim blockchain ownership. No live supply
reservation, issuance queue or transaction is created. Parallel issue attempts
remain blocked until the supported issuer, durable supply accounting and chain
reconciliation have been implemented and reviewed.

Both summary and JSON download require the existing fresh verified-owner check
and Mainnet context. Preparing or downloading them creates no ownership records,
supply reservations, issuance jobs, payments or blockchain transactions. Existing
Mainnet eligibility helpers remain authoritative for account-specific acquisition.
No release-readiness flag changes as a result of this catalog.

## Verification

The frontend production build, frontend shop and navigation tests, and backend suite passed. A local 390 px Chromium run used the actual React views, API gateway, Express handlers and an isolated MongoDB. It opened the starter card, paged the gallery, showed all three Shop notes, saved a Shard purchase and opened the new Standard card. Synthetic receipts demonstrated that Test-Pi and a missing Advanced prerequisite left the respective cards locked. Matching Mainnet receipts opened both higher editions. Testnet and a disabled Mainnet build hid the Shop notes and ship gallery. Pi sign-in used a local fixture for `/v2/me`. No real Pi Browser, wallet or blockchain transaction was involved.
