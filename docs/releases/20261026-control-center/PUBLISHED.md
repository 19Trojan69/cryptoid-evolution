# Published to both existing projects

Reviewed candidate f1acd442c8d34a92b2257589d821b4b4c1433580, tree
caae53e87cde97a151fd8661917ba69f0555fb4e. PR172 merged as
6fe93a5d8364e2dce900bfa4225457f8359e0abf, with no file differences from the
reviewed candidate. Both Vercel deployments show READY, Production target,
this exact merged source and their official domain aliases.

| Project | Deployment | Build | Public URL |
| --- | --- | --- | --- |
| Testnet | dpl_DhTyCpWgMHQ8XATKAZZMYdkLbzze | 85 seconds | https://cryptoid-evolution-testnet.vercel.app/ |
| Production | dpl_DP8RN6JYDLPbbsML652jk7anfojj | 62 seconds | https://cryptoid-evolution.vercel.app/ |

Dashboard evidence:
https://vercel.com/19-trojan69/cryptoid-evolution-testnet/DhTyCpWgMHQ8XATKAZZMYdkLbzze
https://vercel.com/19-trojan69/cryptoid-evolution/DP8RN6JYDLPbbsML652jk7anfojj

Read-only official URL verification is recorded in
verification/control-center/public-release.json. It checks delivered commit/tree,
shared auth lifecycle guards, unified level completion/save confirmation,
bounded invalid_save retry, original API health and network separation,
anonymous Admin denial and absence of local test hooks. The first CSS probe
looked only at HTML styles and missed Vite lazy-route styles; that incomplete
probe is retained separately. The final verifier also reads actual referenced
route CSS. No runtime change or loosened application assertion followed it.

The public production Home settings were opened through Schnellzugriff →
Einstellungen → Anzeige & Effekte: no PC fullscreen button is exposed. Returning
via Alle Einstellungen displays all four Control Center tiles with current
values. No real game/account/payment was started for this public observation.

Validation: 262 release cases/types/Vite, changed-module lint and 40 controlled
native WPE26.5 checks. GamePage still has exactly its prior 62 ESLint errors and
four warnings. Backend, account/payment/network configuration and data are
unchanged; there was no purchase, migration, reset or protection change. The
historical White Screen and physical Pi/iPhone sustained stability remain open.

Rollback is backup/shared-before-control-center-20261026 at exact 2d02098:
Testnet READY dpl_C1yVAFUCwomDTzVKJaWmyfWejUWm and production READY
dpl_CsYosPK58RTx9tnJJHvUkn9BLGC7. Older rollback references remain fixed.
This publication receipt lives on auto-deploy-disabled
codex/control-center-release-record-20261026. Do not deploy receipt-only commits
or move the fixed reviewed candidate branch with documentation.
