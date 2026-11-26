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

### Continuation review of the draft changes

A separate review of draft PRs 208 and 209 on 25 November 2026 reproduced
additional defects before applying narrow corrections. The drafts had not been
deployed; these findings do not establish contamination of live data.

| Confirmed defect | Correction and relevant files |
| --- | --- |
| The established Testnet proxy could store Pi permission information in the production server's Mainnet notification namespace. | Consent capture now rejects mismatched network intent, clears only that server namespace and requires fresh `provenanceVersion: 2` proof. A request hint cannot select credentials. `backend/src/notificationSecurity.ts`, `handlers/users.ts`, `index.ts`, `notificationConsentProvenance.test.mjs` and existing notification/session tests. Authentication failures also use fixed log messages. |
| A failed readiness inspector could prevent persisting Hold or hide the revision needed by the Admin Hold button. | A verified-owner Hold uses the existing revision comparison before readiness services. Readable release status remains available with all readiness marked unverified on inspection failure. Missing/corrupt/unwritable storage cannot produce a successful Hold, and failed inspection cannot authorize release. `backend/src/mainnetRelease.ts` and tests; `frontend/src/pages/mainnetReadinessCopy.ts`, its 19-language bundle and actual Admin component tests. |
| Wallet approval alone could mark the separate wallet-connection capability ready. | Both an approved-wallet record and a separate reviewed `connected` record are now required. The latter must match the app, Mainnet, wallet address and source revision; approved-only or mismatched evidence cannot reach order or Pi probes. `backend/src/mainnetEvidence.ts`, tests and the evidence contract. No actual approval or connection was performed. |
| The publication candidate could supply its own replacement-image bytes and matching digest without proving the approved original. | The offline validator now requires a separate trusted original-art record bound to the card, catalog, artwork revision and image digest. No real records or hashes were invented. `backend/src/nftPublication.ts` and tests; the issuance/publication lock remains. |
| The paused mission could omit a UID when reusing an SDK token, leaving its checkout/recovery account unbound. | The hook resolves the existing server-session UID before using that SDK session and retains the verified UID for cached orders. A mismatched/missing SDK UID does not open checkout or recovery. `frontend/src/hooks/usePayments.ts` and tests; explanatory account guidance covers all 19 languages. |
| An authenticated A-to-B switch could clear the Shop inventory without refetching, then accept a late A response; a same-account Admin-mode switch could also accept an old-context reply. | The inventory effect also depends on the UID. Version and active owner/mode context checks reject old inventory, error, equip and post-refresh purchase responses. `frontend/src/pages/Shop.tsx`, `shopInventoryContext.test.mjs` and the required purchase test group. Confirmed server purchases are preserved. |
| An already queued reveal or delayed preference retry could display an A card in B or mark it seen for B. | Reveal queues are owner/mode tagged before render and before remembering a card. Retired Continue callbacks cannot consume the next account's queue. `cardRevealMemory.ts` verifies the current server UID, keeps a captured bearer when present and retires retries after auth/network/mode changes. Cookie-only syncing remains available. The `/progress/card-reveals` handler compares optional `expectedUid`/`expectedNetwork` with the authenticated server context before any storage; these fields can only deny a write, never grant privileges. New real-source and helper tests cover both authentication paths and preserve existing local seen records. |
| Input after the collector's idle cutoff could retroactively count elapsed idle seconds. | The existing collector starts a fresh measured interval after that cutoff. The reproduced 30-second report becomes 15 seconds; the test covers all five existing input events. `frontend/src/lib/aggregateUsage.ts` and tests. No new requests, identifiers, collection fields or reconstructed history. |

No gameplay rules, prices, supplies, gameplay save schema, routes, menus, artwork, audio or
actual release/configuration values were changed by this continuation. The
Testnet-specific payment policy and unmounted Mainnet preparation modules remain.
The account-switch/collector/UI tests are included in the existing required
frontend build pipeline. All new defects were reproduced with simulated
interfaces or actual local source fragments, without real Pi operations.

The existing Testnet gateway uses the common production backend for ordinary
`/progress/card-reveals` requests. Any later authorized rollout must include the
matching server guard in that common backend before the updated Testnet client.
Legacy payloads remain accepted; the new helper always supplies its account and
network expectations. No rollout, proxy change or deployment occurred here.

### Continuation verification

| Complete required check | Mainnet review | Testnet review |
| --- | ---: | ---: |
| Backend build and tests | 281 passed, one existing skip | 272 passed, one existing skip |
| Frontend release pipeline | 598 passed | 596 passed |
| Frontend TypeScript and Vite | Passed | Passed |
| Whole-project ESLint | 102 errors, five warnings | 102 errors, five warnings |

The lint rule-count distribution is unchanged from the initial drafts; this is
not a claim that the repository is lint-clean. No existing tests were removed
or weakened. The new regression cases failed against the prior draft behavior
and then passed with the corrections. The full builds include the new actual
Shop/reveal-helper cases, the owner Hold component case and the collector case.
Existing large-bundle warnings remain. Test transports, server sessions, storage
and Pi interfaces are simulated; physical-device/live-payment acceptance remains
outside this work.

### Initial draft verification

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
