# Isolated start comparison — 19 October 2026

The user clarifies that the latest preview is already slow immediately after
starting. This does not establish cumulative inter-level debris as the cause,
and does not establish a native crash, GPU issue or thermal cause. Review costs
present in the initial scene before requiring another long campaign run.

## Controlled hypothesis

The actual bundled CSS contains an early compact-screen `.game-hud` rule with
`backdrop-filter: none`, followed by a same-specificity base rule with
`backdrop-filter: blur(10px)`. The later rule wins, including at 430px. This is a
demonstrated cascade conflict, not a measured iPhone bottleneck. Do not claim
the filter is the proved cause of slowdown or whitescreen.

Prepare one opt-in comparison control in the already account-free play preview:
"HUD-Unschärfe ausschalten · nur Vergleichstest". Default is unchecked/original.
On starting, its selection sets a preview-only document attribute. One scoped
rule overrides only `backdrop-filter` and its WebKit spelling to `none`. No other
property changes. Its purpose is a brief same-entry comparison, not a quality
governor, replacement HUD or proposed public visual change. The altered test
intentionally removes the background blur behind the HUD; do not claim exact
pixel equality for this test mode.

## Isolation and checks

Both selections use exactly the previous playable game source 057f075 (GitHub
342f255, tree 8cc6cccf6ad8724dcc28f7f48b37069d3ba1e9a4). The two additional
preparation corrections on separate branch
`codex/iphone-preparation-cancellation-20261019` (GitHub ebf624be, local f6aba1a)
are not folded into this comparison; they remain reviewed source. This keeps
this comparison's variable to the HUD filter alone.

- Isolated playable build passes. Original bundled CSS is byte-identical to
  preview 342f255: SHA-256
  `4e391310389f8d1eed3bf47de7d1292b37f5591830bc2a80cae54e4fede1e087`.
- Parsed compiled cascade checked at 320, 375, 390, 430, 560, 700, 1363px:
  original blur 10px. The opt-in rule has exactly the two filter declarations
  above and is scoped to the selected preview attribute. No HUD geometry,
  artwork, particles, ship size, motion, timing, audio or combat changes.
- Only the preview build script, its isolated CSS constant and this record are
  changed from 342f255. The normal entry imports neither the comparison CSS nor
  its selection. No ordinary-player or guest performance sampler is added.
- Existing no-login, `canAdmin:false`, blocked account API, memory-only storage
  and fixed visual-viewport play shell remain. No Admin privilege is granted.
- Public Testnet 66eb357 and Mainnet 907d2a7 are outside the release scope. Keep
  342f255 and its immutable preview for return. A preview is not a public fix.

Browser verification must confirm both default/original and selected/no-filter
styles on the HUD, return to the menu, and preservation of the viewport lock.
It cannot establish real iPhone FPS from the cloud browser. Around 20 seconds
per selection at the same entry suffices for this user's immediate-start
finding; no boss progression or full campaign is requested. If the selections
feel the same, this filter is not supported as the main cause by that comparison
and should not be removed from the public game as a claimed solution.
