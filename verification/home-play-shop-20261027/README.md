# Paired home-button verification

`verify-native.mjs` runs actual Home/Shop on candidate and pinned baseline Vite
servers with original art/fonts, isolated real handlers and controlled SDK/clock.
It compares the same viewport/locale/account state in each pair. Final171 checks
cover26 cases:19 languages at320px and phone/tablet/laptop/landscape breakpoints.
Checks include exact2:1 widths, retained equal58/72px heights,16–22px gap, no
button/page overflow, original career position, existing catalogue open/close,
no auth/purchase/equip/start, keyboard order and the unchanged Play route.
Official native engine is Playwright1.56.1/Chromium141; set
CRYPTOID_PLAYWRIGHT_MODULE to the installed package. Original-font mirrors under
untracked white-screen-fonts and all browser/Vite/npm caches remain local.

`results/build.json`, `lint-comparison.json`, `scope.json` and
`excluded-attempts.json` record the normal412 release gate,25 separate existing
Home/Galaxy cases, unchanged baseline findings and exact scope. This change does
not modify GamePage, combat, purchases or assets. Historical full-flow/Game Over/
backend127 acceptance is not counted as a new run or physical-device/heat proof.

`before-public.json` freshly verifies both prior aliases. Run
`verify-public-release.py after COMMIT TREE` to read actual delivered source/tree,
identical game plus real Home/Shop bundles/styles, new paired home actions/2:1/gap/
existing-shop callback, retained weapon/binary/idle/title/save/auth/resource guards,
health, separate networks, catalogue and denied anonymous Admin. Final browser
checks observe both live Home rows and open/close the existing public shop without
buying/signing in or starting a public game. Receipts go on a separate disabled ref.
Only explicitly selected synthetic screenshots enter git; the owner's image does not.
