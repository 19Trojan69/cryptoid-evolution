# Completed Step 2 Testnet release

The owner approved publishing the tested reactor-door reuse with "mach das
bitte", then checking hull reflections as the next separate audit.

| Item | Verified result |
| --- | --- |
| Public Testnet | https://cryptoid-evolution-testnet.vercel.app/ |
| Production | READY `dpl_729MdmJke7jMhhX28Ukh8EqbXo8T` |
| Production URL | https://cryptoid-evolution-testnet-kwa4rruhn-19-trojan69.vercel.app/ |
| Ready | 21 October 2026, 13:28:11 Europe/Vienna |
| Build | 51 seconds |
| Exact source | `171cb5c4507a1530a9bbb080d61805be0da545f7` |
| Source tree | `490b444be6bb87e8a4438c06b3c4bc86114a486f` |
| Fixed source branch | `codex/reactor-door-reuse-20261021` |
| Rollback | `backup/testnet-before-reactor-door-reuse-20261021` at `540d73e7b5a89a3098a6c6404bd3deac8f269cd3` |
| Previous production | `dpl_NnTPP38Gm8UZUaAUzj7q4uCUq4U8` |

The isolated preview was READY `dpl_3CpnekXqj483XUcyE3spUSro9P9P`,
https://cryptoid-evolution-testnet-epkaipcsa-19-trojan69.vercel.app/,
ready 13:25:35 Europe/Vienna after a 45-second build. Guest play, pause, countdown,
resume and a second pause were checked through the actual UI. No Pi sign-in,
purchase or durable account action was used. Promotion rebuilt the same source
with production settings; it was not a promotion of an identical binary.

## Delivered verification

- GamePage and AdminPage contain the exact source commit and tree above.
- The actual powerUps chunk has a distinct door useMemo, its primitive crop/
  image/metal/opening dependencies, and the outer SVG uses those cached doors.
- Static boss heat is present in the actual GamePage chunk. All eight earlier
  normal-memory-release features remain present in the delivered code.
- API root, anonymous Admin denial (401), and the three leaderboard responses
  match fresh pre-release HTTP statuses, lengths and SHA-256 hashes exactly.
- The four QA fixture paths serve the production application rather than the
  preview test fixtures. A fresh official Home has an enabled Spielen button.
- The source and rollback branches are fixed. Automatic deployment is disabled
  for the source and this separate release-record branch. No Mainnet operation.

Evidence is in `reactor-door-reuse-release-20261021/before.json`, `after.json`,
`door-code.json` and `release.json`. Local component/browser/build evidence is
in the preceding `reactor-door-reuse-20261021/` directory.

The dashboard screenshot visibly confirmed READY, Production, Testnet domain and
171cb5c. Its browser-produced file did not synchronize to the main workspace
within the documented five-second window, so no downloadable screenshot is
claimed. The observed dashboard detail URL is
https://vercel.com/19-trojan69/cryptoid-evolution-testnet/729MdmJke7jMhhX28Ukh8EqbXo8T.

Runtime logs were not rescanned after the earlier denied operation; this is not
a zero-runtime-errors result. No physical iPhone memory, thermal, presented-FPS
or interruption-fix conclusion follows from these checks. See the separate
`boss-reflection-audit-20261021.md` for the following read-only inspection.

This commit records completed work only. Do not deploy it or move the fixed
runtime/rollback references. The older preparation-only release requirement is
superseded for this completed Step 2 publication.
