# Pi Next and Mainnet evidence — 25 November 2026

This document separates published evidence, work prepared for review, and external acceptance. It does not authorize a deployment, release, payment, notification, NFT issue or submission. The final change and test report must accompany the PR; successful simulated tests do not prove a real payment or physical-device stability.

## Published starting points

The deployment aliases and commits were read again on 25 November 2026. Both Vercel deployments reported `READY`. The Git branch names identify repository references containing those commits; Vercel's deployment metadata records the commit SHA as its ref because these releases were deployed from exact commits.

| Environment | Published commit | Matching branch | Deployment |
| --- | --- | --- | --- |
| [Mainnet preview](https://www.cryptoid-evolution.app/) | `645a445fb9520b5d0d584a711780dc3ce8f8eda5` | `codex/ascending-catalog-order-20261119` | `dpl_78X8S16dmDgxq9eEp1xyEk9zZMiX` |
| [Testnet](https://cryptoid-evolution-testnet.vercel.app/) | `13a50a2a56b37fee2b29bfe3cd49133a03f75492` | `codex/testnet-equipment-order-20261119` | `dpl_DCLY6oCuDcWRkq2kHAZMuUhFgDcj` |

These are separate source baselines. No default-branch version should replace either published line without comparing its changes. The review branch must preserve this distinction and disable automatic deployment before publication.

Project setting names and key presence are configuration evidence, not verified checkout. An old environment-variable comment referring to Testnet does not establish which Pi app a secret actually authorizes. Do not print a secret to diagnose it. Confirm the corresponding app and network using authorized runtime evidence and the Developer Portal.

## Official requirements checked

Sources were read on 25 November 2026. Portal values and personal account statuses were not supplied by these public pages.

| Requirement | Repository evidence / current limit | Remaining evidence or action |
| --- | --- | --- |
| Functional product and professional interface | Playable campaign, ship collection, Shards, galaxy map and account features are implemented. Planned Mainnet purchases and NFT delivery remain gated. | Complete the scope-specific acceptance checks; a build is not proof that every interactive feature works on devices. |
| Independent brand | English name **Cryptoid Evolution**, studio **Trojan Wolf Games** and the `cryptoid-evolution.app` domain are present. `frontend/public/cryptoid-icon.svg` is an existing asset. | Review final listing/logo materials for Pi trademark compliance. This is not a trademark clearance. |
| Pi-only authentication and payments | Pi SDK authentication and server verification are implemented. Shards are earned game resources, not a new currency or token sale. | Verify the correct app/network binding and complete authorized Pi Browser acceptance. |
| Data minimization | [Privacy policy](../PRIVACY_POLICY.md), `/privacy` and aggregate usage reporting exist. | Keep anonymous statistics separate from account records. Unique players and retention cannot be inferred from aggregate requests or seconds. |
| English name and accurate description | English product copy exists in the application; the suggested listing copy below describes current preview limits. | Confirm the actual Developer Portal description against the final accepted version. |
| Interface preview images | Ship and other artwork exist. These are not evidence that the required UI screenshots have been uploaded. | Select current screenshots showing the real interface and confirm portal upload. |
| Privacy policy and terms | [Privacy policy](../PRIVACY_POLICY.md), [terms](../TERMS_OF_SERVICE.md), `/privacy` and `/terms` exist. | Confirm operator/contact details and published policy versions. File presence does not establish legal review. |
| PiNet | Ordinary-browser viewing and guest play are implemented. | Confirm Ecosystem eligibility, verified app domain and the exact registered PiNet subdomain in the portal. An ordinary HTTPS URL is not a PiNet registration. |
| Developer KYC, Mainnet checklist and listing | Not established by the public source or this review. | Owner checks the portal. Unknown does not mean missing or rejected. |
| Pi Next registration and submission | No registration or submission was performed. | All team members register. One member submits the app, team list and public demo video. |

The [Mainnet Listing Requirements](https://developers.minepi.com/docs/build-first-app/MainnetListing) cover functional quality, developer KYC, independent branding, Pi authentication, Pi-only transactions, necessary external links and limited data collection. They do not require adding AI, subscriptions or an ecosystem token to this game.

[Pi Next](https://minepi.com/pi-next/) evaluates utility, technical completeness, usability, distinctiveness and long-term use. Its engagement awards also consider real usage and retention; aggregate page views must not be represented as unique players or returning users. Required submission materials include an English name and description, compliant logo, interface previews, PiNet and a privacy policy. The public final demo must be at most three minutes, showing the app, interface, intended users/need and Pi integration. The deadline is **6 January 2027 at 07:59 UTC (14:59 in Thailand)**. Eligibility is not a promised prize or marketing allocation.

## Accurate English listing copy for review

> Cryptoid Evolution by Trojan Wolf Games is a space arcade game with one-finger controls, nine-block missions, boss battles, collectible ships, earned Shards and a galaxy map. Play as a guest or connect a Pi account for supported account features. Testnet uses Test-Pi for enabled test purchases. The Mainnet version is currently a playable preview: real-Pi purchases and blockchain NFT issuance remain locked until their technical checks, required Pi approvals and operator release are complete. Collection artwork and earned eligibility are previews and game records; they do not prove that an NFT has been issued on-chain.

Use the catalog of the accepted release for any price, edition, supply cap, upgrade requirement or included benefit. This description deliberately adds no commercial term and does not claim a listing or Pi endorsement. No portal text was changed.

## Checkout acceptance and release evidence

The official [Mainnet launch guide](https://developers.minepi.com/docs/build-first-app/Launch) requires an approved Incoming Multisig Wallet for U2A payments, followed by connection to the app. The [Production App Access guide](https://developers.minepi.com/docs/build-first-app/Production) requires an end-to-end production payment to demonstrate the integration. That transaction is outside this work's authorization.

Readiness must separately establish the app/network configuration, connected approved wallet, matching completed checkout evidence, applicable external Pi permissions and explicit current operator release. It must also establish readiness of every included service. A ship offer that promises an NFT cannot become available based solely on payment readiness. Stored release flags and client fields cannot override an unmet server requirement. The exact read-only evidence contract is documented in [mainnet-evidence-contract.md](mainnet-evidence-contract.md); owner-reviewed portal evidence is not presented as a live Pi approval API response.

Later owner action: supply the actual portal evidence and review the intended transaction, amount, app, network and destination before separately authorizing acceptance. A reachable site or ledger, a stored wallet address and a server key do not establish Pi Core Team approval or a complete checkout. Do not make real transactions simply to populate readiness.

## Notifications

The official [Platform API](https://developers.minepi.com/docs/api-reference/PlatformAPI) documents a server-key endpoint, `POST /v2/in_app_notifications/notify`. Recipients must have granted `in_app_notifications`. The documented payload uses `title`, `body`, app-specific `user_uid` and a `subroute` beginning with `/`. Pi permits at most 256 items per request and 48 notifications per user per 24 hours; application limits may be stricter. Delivery is best-effort and consent-dependent.

The application must verify the operator on the server before a request can reach the Pi client, validate recipients and payloads, enforce persistent repeat-send limits, and use the credentials for the intended app/network. Public test buttons must not provide a send path. Local tests use simulated clients only; no successful simulation proves delivery or user consent.

The prepared dispatch requires `CRYPTOID_NOTIFICATIONS_ENABLED=1` and the intended network's explicit `PI_MAINNET_API_KEY` or `PI_TESTNET_API_KEY`; it stays disabled without these settings. Operator and recipients must have a fresh server-verified session/consent record for that network and app key. Admission is persisted in MongoDB with request/payload deduplication, a maximum batch of 50 and stricter application quotas (10 dispatches/minute, 120/day and 12 per recipient per rolling 24 hours). Ambiguous upstream responses do not trigger automatic resend. Testnet notifications are handled in their own environment and are not proxied to the Mainnet project. No dispatch was performed.

## NFT issuance and permanent metadata

The current public [SDK reference](https://developers.minepi.com/docs/api-reference/SdkReference) and Platform API document payments, authentication and related services. No documented NFT minting endpoint or app-specific authorized NFT issuance path was established in those references during this review. The [Pi Day protocol announcement](https://minepi.com/blog/pi-day-2026/) describes smart-contract foundations and a staged contract rollout; the [RPC announcement](https://minepi.com/blog/rpc-server/) establishes Testnet RPC infrastructure. These statements do not prove that this app has a supported Mainnet NFT issuance route. This is a limit of the available evidence, not a claim that all Pi NFT support is impossible.

The existing motifs, previews and eligibility rules are real preparation. A metadata draft with no permanent URI is unpublished, not missing artwork. Before issuance can be reviewed, the owner needs the supported Pi contract/interface and network, authorization for this app, and an authorized durable publication location for versioned original images and metadata. Verify exact file hashes and public accessibility after publication. Never invent CIDs, transaction IDs or contract addresses; owner-only or expiring preview URLs are not final NFT references.

Preview access, earned eligibility, verified acquisition, reserved edition supply and chain-confirmed issuance are different states. Browser inventory and imported saves must not establish blockchain ownership. Future issuance must reconcile concurrent requests and retries against durable unique account/card and edition-supply records, and mark an item issued only after checking the actual chain receipt. This work does not trigger issuance, buy storage, reserve live supply or substitute another blockchain.

The prepared catalog now maps all 430 paid editions: 40 retain their existing ship product IDs, and 390 boss/Retro entries have stable preparation product IDs. Those 390 mappings do not create live offers or enable checkout. All 500 designs remain unpublished with final image and metadata references unset. The offline publication-candidate validator checks a versioned catalog against exact content hashes, metadata and an operator-allowed HTTPS origin; it cannot prove public reachability or issuance support and does not make the manifest publishable.

## Login environment configuration

Ordinary-browser OAuth requires actual portal values for `VITE_PI_OAUTH_CLIENT_ID`, `VITE_PI_OAUTH_ORIGIN` (the exact current origin, without a trailing slash) and `VITE_PI_OAUTH_NETWORK` (`mainnet` or `testnet`). There is no default client ID. Missing or mismatched settings provide a translated instruction to open the same page in Pi Browser. No configuration fallback redirects to the other environment. The SDK path inside Pi Browser is retained. OAuth state is bound to its origin, network, exact callback and safe local return path, and expires after ten minutes. Portal registration and a real login remain separately verifiable external prerequisites.

## External evidence still required

| Evidence | Responsible next action |
| --- | --- |
| App/network identity, connected incoming wallet and any required Pi approval | Owner reads the relevant Developer Portal app; provide reviewed evidence without secrets. |
| Real checkout acceptance | A separate explicit authorization for the reviewed end-to-end Pi Browser acceptance; then persist the verified result for the current revision. |
| Supported NFT issuance and metadata publication | Establish official/app-authorized Pi issuance infrastructure and durable publication; then review implementation and chain reconciliation before release. |
| Browser OAuth client/redirect values where used | Confirm actual portal values per environment; do not reuse Testnet values for Mainnet. Use the correct Pi Browser entry when unavailable. |
| PiNet, KYC, listing and hackathon status | Owner verifies exact portal records. No inference from web reachability, no registration or submission in the owner's name. |
| Final screenshots, logo and public demo | Owner approves materials depicting the accepted current app; upload/submit only under separate authorization. |

Unresolved external prerequisites keep the affected capabilities locked. Independent security, routing, catalog, privacy and documentation fixes can be reviewed without releasing them.
