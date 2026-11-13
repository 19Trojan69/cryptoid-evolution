# Cryptoid Evolution ship NFTs

The collection contains 20 player hulls in three editions. In revision `fleet-liveries-20261113`, the Advanced and Elite artwork carries each hull's Standard livery. The Pi Vanguard cards use the approved gold and violet Metallic Edition. The Shop starts with those same liveries for all three stages and retains the chosen paint when switching stages. The downloadable bundle includes all 60 full-size cards, 60 matching WebP previews, English stories in the individual metadata files and a manifest with SHA-256 hashes. The metadata image references are relative to the extracted bundle. Assign immutable hosted image and metadata URIs when preparing the contract. Edition supply is open.

| Edition | Mainnet trigger |
| --- | --- |
| Standard | The free Grey Scout starter is issued to the saved account. Each other Standard card is free after the first confirmed Shard purchase of its matching hull. |
| Advanced | The account owns the base hull and has a completed Mainnet Pi payment for its matching Advanced stage. The NFT is included in that upgrade. |
| Elite | The account owns the base hull and has completed Mainnet Pi payments for its matching Advanced and Elite stages. The Elite NFT is included in the Elite upgrade. |

## Prepared application behavior

The Shop has edition-specific copy next to the ship price and connects a Pi account before a Standard purchase in the released Mainnet shop. The NFT gallery uses the same artwork as the downloadable bundle. It loads at most five cards per request and returns the artwork for cards with an eligible Mainnet account state. The detail sheet describes eligibility. A future confirmed issue record must drive the issued state.

Payment eligibility uses the stored Pi network, payment ID, product ID, account UID, matching amount, transaction ID and completion time. Admin preview data and Testnet activity confer zero Mainnet eligibility. Verified pre-existing Mainnet ship receipts with all these fields qualify for the prepared view. Standard eligibility uses the account's server-managed Mainnet hull ownership. Imported inventory requires a separate recorded Shard purchase, except for the account-issued Grey Scout. An account whose historical import mixed verified and imported hulls may need an audit before launch to identify older purchases. No automatic migration or retroactive mint runs here.

## Artwork and release

Build the backend and verify the extracted artwork bundle with `node backend/scripts/importShipNftArtwork.cjs /path/to/extracted-bundle`. The command checks the 60 card IDs, WebP dimensions, sizes and checksums. With `--apply` and the selected `MONGODB_URI` and `MONGODB_DATABASE_NAME`, it upserts the revision by card ID into `shipNftPreviewArtwork`. This is a preview-art import. Repeating it leaves one row per revision and card.

`CRYPTOID_MAINNET_SHIP_NFTS_ENABLED` on the server and `VITE_CRYPTOID_MAINNET_SHIP_NFTS_ENABLED` at frontend build time default to disabled. The server also requires the production deployment of the Mainnet project. Keep both switches off through purchase-flow, artwork and contract review. Automatic deployment is disabled for the preparation branch.

## Blockchain integration still to do

Confirm the Mainnet ship checkout and the wallet destination before enabling the feature. Use the successful server-side acquisition or payment completion as the trigger to persist an issuance job once per Mainnet account and card. Persist it with the acquisition or reconcile the verified record if completion is retried. Submit to the reviewed Mainnet contract, reconcile retries with the chain and mark the NFT issued only after verifying the chain transaction. Confirm the issuance policy for pre-launch purchases and imported saves. Verify those flows with real approved Mainnet test cases before going live.

## Verification

The frontend production build, frontend shop and navigation tests, and backend suite passed. A local 390 px Chromium run used the actual React views, API gateway, Express handlers and an isolated MongoDB. It opened the starter card, paged the gallery, showed all three Shop notes, saved a Shard purchase and opened the new Standard card. Synthetic receipts demonstrated that Test-Pi and a missing Advanced prerequisite left the respective cards locked. Matching Mainnet receipts opened both higher editions. Testnet and a disabled Mainnet build hid the Shop notes and ship gallery. Pi sign-in used a local fixture for `/v2/me`. No real Pi Browser, wallet or blockchain transaction was involved.
