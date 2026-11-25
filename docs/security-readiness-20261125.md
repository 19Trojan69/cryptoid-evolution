# Security and readiness corrections — 25 November 2026

These are reviewable source changes. Nothing in this task merges or deploys
them, enables Mainnet checkout, issues NFTs, sends notifications, changes live
inventory or resets accounts. The live notification fix therefore still needs
a separately authorized deployment after review.

## Verified published starting points

| Environment | Published source | Deployment | Matching repository branch |
| --- | --- | --- | --- |
| Mainnet preview | `645a445fb9520b5d0d584a711780dc3ce8f8eda5` | `dpl_78X8S16dmDgxq9eEp1xyEk9zZMiX`, READY | `codex/ascending-catalog-order-20261119` |
| Testnet | `13a50a2a56b37fee2b29bfe3cd49133a03f75492` | `dpl_DCLY6oCuDcWRkq2kHAZMuUhFgDcj`, READY | `codex/testnet-equipment-order-20261119` |

Vercel records each deployment's source ref as the commit SHA itself; the last
column identifies the existing Git branch pointing at that SHA, not an invented
branch value in deployment metadata. The unrelated default branch was not used
as the implementation baseline. Both working trees were created from these
published commits, with separate commits for their different source histories.

Read-only public probes returned HTTP 200 with 51 offers in both environments.
Production reported `mainnetReleased: false`, backend `local`; Testnet reported
backend `testnet-catalog`, without a Mainnet release field. Both Vercel projects
use Node 24.x. Their checked-in install/build configuration builds the existing
Express gateway and the frontend. Testnet retains its existing production proxy
for account/payment operations and local network-scoped features. Notification
dispatch is now handled locally to prevent cross-app forwarding.

Protected environment metadata was inspected without printing/decrypting keys.
The legacy production `PI_API_KEY` comment mentions Testnet, which is not proof
that its value is wrong or that a Mainnet wallet is disconnected. Its presence
does not establish Mainnet readiness. New sensitive operations require explicit
network-scoped configuration and matching verified evidence. No live
configuration was changed.

## Implemented changes and files

| Area | Behavior | Principal files |
| --- | --- | --- |
| Notifications | Session and verified operator authorization precede every external call; server network/key binding, verified Pi permissions/expiry, consenting recipients, exact fields, bounded content and internal destinations; durable Mongo compare-and-swap admission, duplicate rejection and conservative rolling quotas; generic errors. | `backend/src/handlers/notifications.ts`, `notificationSecurity.ts`, `apiGateway.ts`, `index.ts`, `handlers/users.ts`, session/user types; public test control removed from `frontend/src/pages/Shop.tsx` and `components/Header.tsx` |
| Mainnet readiness | Separate storage probe, app/network, scoped key, approved wallet evidence, revision-bound U2A acceptance plus existing-receipt verification, reviewed external Pi approval, supported NFT delivery and final publication checks. Owner release/revision and joint purchase/NFT policy preserved; failure closes new purchases. | `backend/src/mainnetEvidence.ts`, `mainnetRelease.ts`, `piIntegrationHealth.ts`; `frontend/src/pages/AdminMainnetRelease.tsx`, `AdminIntegrationHealth.tsx`, `mainnetReadinessCopy.ts` |
| Payments and inventory | Request and Pi-confirmed payment networks must agree; original account/product/amount/quantity/model/prerequisite checks retained; Pi completion re-read before conditional paid-order write; stale account callbacks discarded; existing incomplete payments recover and repeated responses cannot duplicate inventory. Mainnet preview can use its confirmed weapon stock while new buying is held. | `backend/src/handlers/payments.ts`, `handlers/hangar.ts`, `weaponStock.ts`, `services/platformAPIClient.ts`; `frontend/src/hooks/usePayments.ts`, `pages/Shop.tsx`, `MissionWeaponShop.tsx`, `ShipSelectionPanel.tsx`, `WeaponPurchase.tsx`, `TestPiPurchase.tsx`, two bounded permission expressions in `GamePage.tsx` |
| NFTs | All 430 paid definitions have product identifiers, including 390 preparation-only IDs outside the live checkout catalog. Original art references, current prices, supplies and acquisition rules retained. Offline final-publication validator checks exact metadata shape, versioned public origins and content hashes. Acquisition evidence is distinct from on-chain ownership; issuance remains unavailable. | `backend/src/nftPreparation.ts`, `nftReadiness.ts`, `nftPublication.ts`, `shipNftEligibility.ts`, `handlers/shipNftPreview.ts`, `handlers/bossNftPreview.ts`; `frontend/src/pages/AdminNftPreparation.tsx` |
| Login | No fixed production-to-Testnet redirect. Explicit same-environment OAuth configuration, random state, expiry, one-use callback, exact local return paths and stale response protection. Missing configuration gives a Pi Browser instruction; native SDK flow retained. Surviving cookies cannot override a different verified bearer account. | `frontend/src/config/piOAuth.ts`, `hooks/useAuth.ts`, `pages/PiSignInCallback.tsx`; `backend/src/index.ts` |
| Usage/privacy | Existing aggregates produce page openings, estimated active/unpaused time and time shares. Unique players and retention are explicitly unavailable. No new visitor IDs, fingerprints, account joins, event history or reconstructed retention. Notification consent/security processing is documented separately. | `backend/src/usageStats.ts`, `handlers/admin.ts`; `frontend/src/lib/aggregateUsage.ts`, `pages/AdminUsage.tsx`, locale bundles; `PRIVACY_POLICY.md` |
| Documentation | Current product, actual API architecture, English listing proposal, Pi Next requirements, evidence contracts and exact external blockers documented. No portal status assumed or submission made. | `README.md`, `doc/vercel.md`, `docs/pi-next-readiness-20261125.md`, `docs/mainnet-evidence-contract.md`, `docs/ship-nft-mainnet-preparation.md`, `docs/usage-evidence-20261125.md`, `.env.example` |

New visible copy is integrated with the existing 19-language system. The Admin
interface's existing German-language policy remains. Artwork, audio, speakers,
campaign data, balances, prices, supplies and save schemas were not rewritten.
The two GamePage permission changes retain the strict historical source
fingerprint chain and negative controls.

## Capability state and external actions

| Capability | Prepared or verified here | Still required before live operation |
| --- | --- | --- |
| Notifications | Authorization, consent validation, payload restrictions, durable quota/dedup behavior, real Express bootstrap all verified with simulations. | Explicit app/network key, conscious server enablement and actual recipient-granted `in_app_notifications` permission verified by Pi. Current login need not force a new notification consent. No messages sent. |
| Mainnet checkout | Complete conditional UI/API path, correct currency/quantity/product, stock credit, mismatch rejection, recovery and replay behavior verified with simulations. | Actual portal app/wallet approval evidence, exact scoped server configuration and revision-bound real U2A acceptance, including authorized device testing. No real payment performed. A connected wallet alone is insufficient. |
| NFT output | Stable catalog IDs, preview/earned eligibility, receipt checks, byte-checked publication candidate interface. | Documented Pi issuance route authorized for this app, actual permanent public original-image/metadata publications and a transaction-safe issuance/supply ledger. No invented mint API, CIDs or transactions; no supply consumed. |
| Browser OAuth | Environment/state/return/cancellation/stale-account behavior verified. | Actual authorized OAuth portal values for each environment if ordinary-browser sign-in is wanted; otherwise use the functioning Pi Browser SDK entry. No client ID guessed. |
| Usage evidence | Existing aggregate sums and their limits verified without new tracking. | Unique-player counts and retention cannot be derived from these data. Any new personal-data purpose requires separate design/decision; proposed tracking is not activated. |
| Pi Next/listing | Requirements compared with official sources, prepared English description and evidence checklist. | Developer must verify actual KYC, portal listing, PiNet, registrations, preview artwork and public demo/submission status. These statuses remain unknown without evidence. No registration/submission/commitment made. |

NFT delivery and metadata blockers remain part of the common Mainnet gate.
Therefore even a valid checkout acceptance record and stored owner release
cannot currently activate new Mainnet purchases. Offers including an NFT cannot
be released with only their game-inventory portion ready.

Testnet keeps its own source policies, catalog and menus. Its backend continues
to reject Mainnet payments; the needed Mainnet preparation modules are unmounted
there. There is no migration between Testnet/Mainnet, guests or Pi accounts.

See the evidence and Pi Next documents for the official source URLs and exact
required operator actions. In the reviewed official public interfaces no
app-authorized NFT issuance path for this project was established; this is not
a claim that Pi can never support NFTs.

## Verification record

Production baseline `645a445`: full backend build/test, 210 passed, one existing
skip; full frontend release pipeline, 539 passed, TypeScript and Vite passed.

Production candidate: full backend build/test, 265 passed, one existing skip;
full frontend release pipeline, 566 passed, TypeScript and Vite passed. Additional
OAuth return-route restriction: seven targeted tests passed. This is a full
build record, unlike the earlier audit's 18 isolated tests.

The frontend project-wide ESLint command fails on both baseline and candidate:
104 baseline errors and five warnings; the candidate removes two initial-load
findings and retains 102 errors and five warnings. No new violations remain in the new
authentication/payment/configuration/locale helpers; existing application lint
debt is not described as a clean lint result. Both builds retain the existing
large-bundle warning. No test was deleted or relaxed to hide a failure; affected
test fixtures now simulate the Pi completion confirmation and the actual
environment routing.

Testnet baseline `13a50a2`: full backend build/test, 182 passed, one existing
skip; full frontend release pipeline, 528 passed, TypeScript and Vite passed.
Testnet candidate: full backend build/test, 256 passed, one existing skip;
full frontend release pipeline, 564 passed, TypeScript and Vite passed.
Its whole-project ESLint result remains 102 errors and five warnings,
the same as its own baseline; copied unmounted Mainnet support components do
not introduce new lint errors. Final branch/PR references are recorded in the
pull-request descriptions. All payment, notification and NFT-related
behavior tests use simulated external clients, fixtures or pure interfaces.
Passing them does not establish a real Pi payment, live approval or stability
on physical iOS/Android devices. No complete physical-device campaign was run.

Both review branches disable Vercel Git deployment in `vercel.json`; repository
workflows target unrelated explicit branches. Do not merge or deploy these
changes as part of this review.
