# Shard rewards and retired formation targets — 19 November 2026

New Double Kill bonuses award 5 Shards instead of 20; the 500 ms window and 50 Score bonus remain. Normal enemy, boss, chain, full-heart and bonus completion rewards retain their existing values. Standard ship prices remain unchanged (Nova Wing 150 Shards; Solar Lance 400 Shards). Existing balances and previously earned mission rewards are not recalculated. This first economy adjustment reduces the combo component by 75%; it does not claim a measured 75% reduction in total earnings or guaranteed acquisition times.

The guide interpolates the live reward constants in all 19 languages. Economy checks cover once-only pairs, pause boundaries, bonus targets and an old mission retaining its earned Shards while new pairs receive the new rate. They are now included in the frontend build.

The obsolete formation-target JSX and its ten CSS rules/keyframes are removed. Both networks use the released combat-variety mode. Historical full-controller checks retain an exact, narrowly reversible record of the removed markup; that record is test tooling and is not included in the game bundle. Motion checks execute actual controller functions across the 500 internal stages and verify arrival, docking, resting sway, legacy entry identifiers and boss escort behavior.

Mainnet is based on the actual deployed e9b7d6473a9e74b294b5bf868dc4099039b69a60. Testnet is based on its actual deployed cab21f4b4ec852d4f2b818e876ab09bb04014fb6. The network-specific purchase restrictions and environments remain separate. No live accounts, wallet transactions, NFT issuance or balances were mutated by verification.

Local validation: Mainnet 539 frontend cases and 210 backend cases; Testnet 528 frontend cases and 182 backend cases. Each backend suite retains one pre-existing skipped case. Both builds pass localization, TypeScript and Vite. The initial sparse checkout lacked packaged preview artwork and translation/audio assets; after retrieving those unchanged assets, both complete suites passed. No test was weakened for a missing fixture. No physical iPhone/Pi Browser run or measured normal-player acquisition time is claimed.

The working refs codex/shard-economy-mainnet-20261119 and codex/shard-economy-testnet-20261119 have automatic deployment disabled. Release each reviewed commit explicitly to its existing Vercel project, retaining existing protection, domains, network configuration and rollback deployments.
