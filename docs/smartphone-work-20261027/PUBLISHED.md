# Published: less redundant smartphone work

27 October 2026. PR180 is merged:
https://github.com/19Trojan69/cryptoid-evolution/pull/180.

- Source: 3588ff2d0d39779e54c3a9b31eba636e81559c93.
- Reviewed candidate: a76a00b748f8b483c281e11f5d68606094d538ca.
- Exact common tree: 243322ba9ef2459af518017e2d008215c5fba46f.
- Previous shared f7197d61bca49b8b0fa5a10dcc3194efd0936c43 is retained at
  backup/shared-before-smartphone-work-20261027, with its previous READY
  Testnet GwYCnFbzgQQgaskq2Xf3TX9Eysgu / production 52LJsvsvfFMaCnZgN3g1D3j1fJqb.

## Actual deployments

| Project | READY deployment | Duration | Active public domain |
| --- | --- | --- | --- |
| cryptoid-evolution-testnet | dpl_Esrjvchy43uW9hva84trp2B3BYXY | 113 seconds | https://cryptoid-evolution-testnet.vercel.app/ |
| cryptoid-evolution | dpl_CuaDcrdz9uuZJtuYKAtVSc8kNrzc | 62 seconds | https://cryptoid-evolution.vercel.app/ |

Signed-in dashboard details confirm source 3588ff2 and the active domains for
both existing projects. Immutable URLs and full dashboard links are in
verification/smartphone-work-20261027/dashboard-status.json. The Vercel connector
again returned 403; the previously authorized dashboard fallback required no
credential or protection change. No runtime logs were queried.

## Public verification

Both public sites pass verify-public-release.py. The eight observed application
bundles match between projects, with expected source/tree, inactive-loop opt-in
and explicit wake present and local test hooks absent. Existing save, activation,
audio, resource-reuse, login and completion guards are present. Public styles
match each other and the saved previous release exactly. Both Home screens
render normal anonymous Pi sign-in and Play controls after loading.

Both API health checks return 200. Testnet retains production-proxy routing and
network=testnet; production retains local routing and network=mainnet. Public
catalogues return 200 with existing 45-second charges, prices and start powers;
anonymous Admin returns401, and the retired report redirects Home. No live
game start, account/payment/save mutation, reset or migration was used.

During the first final check the execution environment became unavailable;
bundle/source checks completed but subsequent network operations received a
proxy tunnel 403. That incomplete result is retained separately as
initial-public-environment-interruption.json. Once the environment returned,
the same verifier completed successfully on both domains. The interrupted
attempt is not presented as a successful API check or a site security change.

Local acceptance remains 381 frontend cases/types/Vite, 127 backend cases/types,
14 pinned native controls plus 16 candidate work/DOM and 58 real-game checks.
The exact operation counts and preserved behavior are in README.md. GamePage
retains its old 62 lint errors/four warnings, with no added findings.

Physical smartphone temperature, battery energy, native long-run stability and
historical White Screen resolution remain unproved. No new owner campaign is
requested. Ordinary flight/simulation, all original artwork/CSS/HUD/audio,
charges/Auto behavior, economy, save barriers, strict >2500ms/500ms protection
and explicit technical Resume remain intact.

This receipt lives separately on codex/smartphone-work-release-record-20261027
with automatic deployments disabled. Do not merge or deploy the receipt branch
as another application release; both public projects already run 3588ff2.
