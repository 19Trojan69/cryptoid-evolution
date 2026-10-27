# Owner Testnet purchases and earned collection

The verified administrator can test the complete catalog before Mainnet while
playing a normal saved account run. This is separate from the existing free
Admin preview, which still grants no saved rewards or purchases.

Base: `c2d1596dc578919d159d7820516d6d9415110d2f` on the shared main branch.
The existing Testnet gateway forwards account/payment calls to the existing
production backend, so both projects require the same reviewed source. Their
network selection, keys, accounts and saves remain separate.

## Behavior

- All 20 Standard hulls are available to the owner at their existing Shard prices.
  Existing server balance/version validation deducts the price and equips the
  acquired paint. No balances, inventory or progress are granted by this change.
- All four weapon offers use the existing quantity/confirmed-stock workflow;
  each newly activated charge lasts 45 seconds. Manual and Auto preferences,
  original activation receipt replay, timers and expiry feedback remain intact.
- Five start power-ups, both armor upgrades and all 40 Advanced/Elite offers use
  normal Pi SDK approval/completion. The server accepts **Pi Testnet** only.
- A ship upgrade requires ownership of the matching Standard hull. Elite still
  requires matching Advanced; Titanium requires paid Reinforced Hull. Permanent
  items remain single purchases. Confirmed ship upgrades equip the acquired hull.
- All 60 ship cards can be acquired by the Testnet owner through actual hull/
  upgrade ownership. All 50 boss cards require the corresponding earned victory.
  Availability alone does not unlock any card.
- Other players retain ten released Standard hulls, two purchasable weapon tiers,
  the previous card release limits and all existing purchase restrictions.
- Expanded purchases are marked `owner_testnet_catalog`; Mainnet inventory,
  loadout, armor, ship upgrades and consumable queries exclude those orders even
  if a deployment shares user IDs and an order collection.
- The server verifies the owner UID for each sensitive request. Browser flags,
  the submitted request body, a matching username or free preview do not grant
  purchase permission. No Mainnet payment is approved by the new policy.
- The owner-only notice and new prerequisite/card copy cover all 19 selectable
  languages. The established ship artwork, pricing, rendering, effects, audio,
  difficulty and progression/reward validators are preserved.

## Validation

- 135 backend tests pass, including eight new isolated integration cases:
  owner/non-owner/network/preview boundaries, normal earned-Shard acquisition,
  all 51 paid offers, base hull and upgrade prerequisites, invalid totals/user/
  verification, idempotent completion, Plasma stock/45-second same-ID activation,
  one-time consumable use and Mainnet run isolation.
- 426 frontend release cases, locale release checks, TypeScript and Vite build
  pass. Ten catalog/panel cases are now in the normal build command.
- 18 local native Chromium 141 checks pass against actual React UI and actual
  handlers with isolated Pi transport/database: Standard -> Advanced -> Elite,
  auto-equip, Plasma quantity, armor prerequisites/purchases, power checkout/
  selection, non-owner and Mainnet locked controls. Zero uncaught page errors.
- The complete GamePage returns byte-for-byte to the released controller after
  restoring only the three exact owner-permission arguments. Historical scope
  guards and negative controls are retained. Ship-artwork source inputs stay
  unchanged; the build retains 1,740 original-resolution variants / 95,450,326
  encoded bytes. No new runtime loop, timer, observer or asset is introduced.

Native verification uses local payment and account fixtures, not a real wallet
transaction or physical Pi Browser acceptance. Original-font pixel equivalence
was not assessed (the private font mirror is absent); fallback fonts were used
for behavioral checks. The first font-mirror host failure and unavailable default
Chromium path are excluded attempts, not app failures or passes. The existing
large-chunk build warning remains. No whole-project lint-clean claim is made.

Candidate automatic deployment is disabled on
`codex/owner-testnet-catalog-20261027`. Preserve the base source and its READY
projects while reviewing; publish through the existing main Git integration
without duplicate manual deployments. The candidate contains no live account
mutation, migration, reset, credential or deployment-protection changes, and no
private owner stability report or unrelated unfinished PR.

## Published result

PR #190 is merged. Both existing projects are READY at source
`1d800516767131013e0ef80f5c22fa1332593b43`, exact reviewed tree
`20919d588a70dca7f6f9453112158bccd5daf83b`.

- Production: `dpl_2GmV8T6UCwfW3TCR2G7MvSD3Bf1P`
- Testnet: `dpl_AMEhBjnbthidFesbHrzAQJziWxYF`

Fresh read-only checks on both public aliases pass the source commit/tree,
owner catalog delivery, same application bundles/styles, all retained runtime
features, public API/catalog, anonymous Admin denial, diagnostic redirect and
separate leaderboard networks. Before/after receipts and exact deployment IDs
are in `verification/owner-testnet-catalog-20261027`. This receipt branch is
auto-deploy-disabled and must not itself be deployed or merged into main.
Actual owner Pi Browser payment acceptance remains a user checkout; no wallet
transaction was performed by this verification.
