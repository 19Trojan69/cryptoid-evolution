# Reuse the shop's shot-type symbols in the red binary notice

The owner asks to add the existing shop symbol alongside the shot name. Base is
shared public/main PR186 `f596413a5f873f9790b262d211d0c33ee710d0a1`, tree
`7adf29957f06cbdffa5ff014bd6b3ea223f1d16b`.

The original shop card marks `Ⅰ Ⅱ Ⅲ Ⅳ Ⅴ` move unchanged into one shared static
`weaponSymbols` array. Both shop headings and the notice use it, preserving the
shop's visible output. Compact marks appear beside the expired and currently
active names, for example `Ⅳ Dreifach · abgelaufen → Ⅰ Standard`. Numeric props
use the same effective stage-correct level as the existing HUD. The unchanged-
effective-type case retains only its active mark/name. Symbols are decorative
and aria-hidden because the translated names already identify both shot types.

Only two number props are added to the existing GamePage notice call. One exact
restoration proves the entire published controller SHA256 remains recoverable:
`4fdd0f448af7dfd952a69db6c3a5c681bd8ad03822be91f10657ecf832a1ac2b`.
It runs before all existing binary/weapon/title/controller restorations. The red
color, expiry wording, code-band position, binary animation, existing visibility
and lifetime, level-title deferral, manual/technical pauses and no-purchase-action
behavior remain. No image, animated preview, asset load, state, observer, timer,
RAF, backend, combat, economy, activation, save, reward, audio or HUD change.

The normal frontend release gate covers the extended actual JSX/component/host
checks, translations, TypeScript and Vite. The native verifier compares visible
notice symbols directly to actual shop-card DOM in eight isolated GamePage/real-
handler scenarios, including phones/tablet/wide screens, both hands, paid/pickup/
other-active fallback/Auto/evolved hull, Reduced Motion, both pauses and code-band
geometry. All source and final results are in the matching verification folder.
Prior PR186 full-flow74 and Game Over11 remain baseline evidence, not another
run claimed for this small presentation change. Exact controller and existing
release tests protect their behavior. Physical-device heat/FPS/White Screen and
full backend127 rerun are not acceptance claims.

Current resolved GamePage62 errors/four warnings and MissionWeaponShop3 errors
match their pinned baselines; no lint-clean or repaired-error claim. Other edited
small modules are clean. Machine-local browser/font/Vite caches, generated hull
variants, unused screenshots and the owner's original image stay excluded.

Work branch automatic deployment is disabled. Standing authorization covers the
reviewed same-source publication to both existing projects via main, then actual
READY source and public commit/tree/bundle/new-symbol/prior-guard checks. Retain
prior shared f596413 and READY Testnet2rHmD4diydHECvwzmrRFbSbgJw5Z / production
BKvtNeoh28sumnisiTD4T2eBdFNp for rollback. Keep separate networks/accounts/payments,
existing backup refs, no duplicate manual builds, PR167/168, migrations/resets,
real purchases, secrets/protection changes or runtime-log access. Receipt refs
must also be auto-deploy-disabled.
