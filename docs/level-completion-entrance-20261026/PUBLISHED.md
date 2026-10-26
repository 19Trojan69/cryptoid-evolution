# Published transition release, 26 October 2026

PR [175](https://github.com/19Trojan69/cryptoid-evolution/pull/175) is merged.
Both public domains were checked against source
`57a60fdc10e08d6b133ea19f74a8695a8070d5d0`, tree
`4f2196dcb85d2f38fbe359d91c9c9e397938e8b0`. The reviewed candidate
`8b524b3e042835ba9393c9e8f7a75d5e6870a065` has the same tree.

| Project | READY deployment | Immutable URL |
| --- | --- | --- |
| Testnet | `dpl_8PpTq1mGmTu5tZcigEsiMW4kxsrx` | https://cryptoid-evolution-testnet-h2gmpfro3-19-trojan69.vercel.app/ |
| Production | `dpl_BeBc7AKz43K4ZP1jHcLjBQBy1UvL` | https://cryptoid-evolution-gbo0mmhgl-19-trojan69.vercel.app/ |

Authenticated dashboard Overview confirms READY, main source and the correct
current public domain for each. Recorded durations: Testnet 69 seconds,
production 60 seconds. No runtime logs, secrets, protection or project settings
were inspected or changed. The approved dashboard fallback was used after the
Vercel connector returned 404.

The public verifier checks exact source/tree, matching JS/CSS, finite arrival
styles and retained completion, recovery, auth and diagnostics. Both health
routes return 200; Testnet/prod network configuration stays separate; anonymous
Admin export stays 401. One initial Testnet entry response exposed no lazy-game
chunk; a fresh direct read and the complete rerun passed on both. The failed
attempt is retained locally and is not counted as verification success.

Rollback remains `59495ef665de7c5912332528112ee280b9eb2458` at
`backup/shared-before-completion-entrance-20261026`, READY Testnet
`dpl_8g5sdDp198rW7yDFJ2ReU3oSN9rB` and production
`dpl_HPLEn3TwVkD39FH8fyudgaCYhanu`.

This receipt branch is auto-deploy-disabled and is not merged into main. Local
controlled WebKit tests do not prove physical Pi/iPhone audio, natural long-run
stability or a historical White Screen fix. Later pending-activation/audio reports
are investigated separately; this visual release makes no such claim.
