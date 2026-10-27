# Published ship selection and shop navigation

PR [#191](https://github.com/19Trojan69/cryptoid-evolution/pull/191) is merged as `363d9fd27599d06fcd3916cd96cab1c7dcd8b11e`. Its tree `9dbf4625198f45197dfc6d36cffa754f7c974865` equals the tested candidate.

Both existing projects are READY in their Production environment from main and this exact source, observed in the signed-in deployment overview. Testnet: `dpl_GDBKvxyC4CbnW95fEPDMfYCNLTD2` (153s); production: `dpl_A4uYww2UWrgqhf8nPPk4iytfGphe` (124s). GitHub reports both deployments successful. Main triggered each automatically once; no manual or duplicate build was submitted.

Both public aliases return the expected commit/tree, identical application/dependency bundles and CSS, new explicit stage/account-start and three-category shop markers, preserved save/auth/receipt/resource/transition/binary/Game Over guards and healthy separated API responses. `public-release.json` records the complete read-only check. Browser interaction also opened the actual Shop, Weapons and Power-ups on each alias: three category links, four weapons, two armor offers and five powers; power content starts at scroll zero. The anonymous public views retain their existing purchase restrictions. Local authenticated owner fixtures verified the existing Test-Pi offers; no live login, purchase or selection was performed.

After reloading, the owner can select the purchased hull/color/stage with **Auswählen**. The release deliberately does not select a ship on the owner's real account. Elite remains the permanent stronger twin laser with two free projectile hits per life; collected or paid timed charges stay separate.

Accepted:141 backend cases,430 frontend release/localization/types/Vite cases, eight extra module cases,32 native selection/shop assertions, two pinned-old-UI scenarios,74 repeated full-flow and11 Game Over assertions. Lint matches baseline, with GamePage62 errors/four warnings and Shop5 errors. No universal-device, physical heat/FPS, font-pixel or White Screen claim.

The Vercel connector returned404 for both alias and exact deployment-ID lookup. The already authorized signed-in Dashboard fallback verified source/status/environment/alias without reading runtime logs/secrets or changing protection/settings. Rollback remains `1d80051` and prior READY Testnet `dpl_AMEhBjnbthidFesbHrzAQJziWxYF` / production `dpl_2GmV8T6UCwfW3TCR2G7MvSD3Bf1P`; older backups remain intact.

This receipt ref adds only public receipts and its automatic-deployment false flag. It must not be merged to main, avoiding another pair of builds.
