# Paired Play and Shop home buttons

Owner request: shorten Play, put Shop beside it with a comfortable gap, preserve
Play's height and make Shop half Play's width. Base is shared public/main PR187
`a718b4c60dc93ab022acffe6bacfb6e4fc9a688f`, tree
`9ea5c2bd4f6f2a7e17045a6f51e05cc90bee581e`.

A home-only grid places the existing gold Play at left and a navy/gold Shop at
right in2:1 columns, separated by16–22 CSS pixels. Both preserve the former Play
height:58px on narrow layouts,72px at the existing desktop breakpoint. Play's
label/gap adapt to the narrower space; its action, type, busy guard and style
remain. Shop uses the existing translated Shop label, busy guard and button
semantics. The previous home action order follows the new pair, with career/
cards/community/galaxy/art/footer in their original layout positions.

The new callback invokes the existing openQuickAction('shop'), opening the same
ship catalogue. Closing it returns home. Existing modal pause/focus/navigation,
account/authentication, catalogue, purchase and inventory gates remain. No new
shop flow, sign-in request, fullscreen request, timer, animation, asset, state,
backend, gameplay, game-controller, weapon notice, equipment or economy change.
The current GamePage stays byte-identical; the entire Shop source restores after
removing just the new callback. Home fullscreen/audio/network effects are untouched.

Normal release gate:412 frontend cases, localization inventory, TypeScript and
Vite. Separately,25 existing Home/Galaxy checks pass with home callback/busy/shop
integration assertions extended. Native Chromium141/Playwright1.56.1 uses actual
Home/Shop, original art/fonts, a controlled SDK/clock and isolated real handlers.
171 checks across26 cases cover all19 languages at320px, signed-in393px,430px,
Thai tablet768px, desktop1363px,760px breakpoint,900px laptop and844px landscape.
Each baseline uses the SAME locale/account/viewport; original Play height and
career position are compared directly, alongside2:1 geometry/gap/no overflow,
shop open/close/no auth/purchase, keyboard order and retained Play navigation.
The first incomplete154-check comparison used a German baseline for French,
which shifted the pre-existing centered action column; it is excluded.

CinematicHome lint remains0+0; Shop retains five baseline errors with the same
message multiset. No whole-project lint-clean claim. Full-game/native Game Over
and backend127 remain prior evidence, not newly repeated for this home-only UI
change. No physical-device heat/FPS/White Screen acceptance claim. Original owner
image, machine-local caches/fonts/browser/npm files and generated hull variants
are excluded; only selected synthetic local screenshots are published.

Candidate auto-deployment is disabled. Standing authorization covers reviewed
same-source release to both existing projects via main, followed by actual READY
source and public source/tree/bundle/home-row/shop-action/prior-guard checks.
Preserve a718b4c and READY Testnet8GQBDCPE6uUKWBNF1g7try8s5Jia / production
Hu6VY49RQoW9TFnnjhfPagrMUwqv as rollback. Keep older backups and separate networks/
accounts/payments; no duplicate manual builds, PR167/168, migration/reset, real
purchase, secret/protection/runtime-log access. Receipt refs must not deploy.
