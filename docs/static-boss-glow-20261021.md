# Static boss damage glow — 21 October 2026

Based on official runtime `8a603e553845507245c99851dea0408bbb74be40`.
Owner scope: persistent boss glow may be static and must be visible by 50%
remaining gun/turret armour. The chosen surface is the existing gun sprite.

Living guns switch to the previous 50%-damage orange tint at <=50% armour;
above that threshold they use their ordinary sprite. The renderer caches that
single heat tile and reuses it after further damage. Destroyed guns release it.
Aim, recoil, muzzle flashes, weapon timing, collision, health, save format and
account behavior are unchanged. No timer, RAF chain or renderer dependency added.

Boss hull damage patches also become static settled embers with stable site keys
and profiles. Cooling, continuous flicker and rising pseudo-element specks are
disabled only in the boss damage layer (up to 24 animations removed at eight
sites). The existing alpha mask remains. Brief impact bursts and ordinary ship
damage effects retain their behavior. The reactor charge signal is unchanged.

## Verification

- 25 focused tests: special weapons, rewards, hull fires, core and boss combat.
- Threshold/resume checks include all 50 bosses and fractional health immediately
  above/at/below 50%, plus destroyed guns.
- `verifyStaticBossGlow.mjs` exercises the production renderer with controlled
  canvas contexts: all 392 guns allocate exactly one heated texture, retain it
  across 80 further draws below 50%, and zero its dimensions on destruction.
  Socket/output canvases are also zeroed on disposal. This checks allocations
  and painter calls, not browser memory or visual pixel equality.
- `verifyStaticBossGlowBrowser.cjs`: native Chromium 153, actual React/components
  and production CSS with no animation suppression. 150 boss/width cases
  (50 bosses × 320/430/820), then 500 further native hit replacements. Persistent
  boss heat has zero animations including pseudos and stable DOM nodes. Controller
  active count peaked at 16 in the stress phase and reached zero on unmount;
  native animation/site/burst counts also reached zero. No page errors.
- Component ESLint, diff whitespace check, TypeScript and production Vite build
  pass, including 12 locale tests and the translation release gate. Existing
  bundle-size warning remains.

An attempted reuse of the older exact reactor PNG harness did not pass exact
image equality and is not counted as successful verification of this change.
That harness is left unchanged. The dedicated static-glow browser test above
checks the requested native animation/resource lifecycle directly. No claim of
pixel equality with the former progressive glow is intended: the threshold and
steady appearance deliberately change.

Rendering still costs some resources. No measured whole-process memory/FPS
improvement, physical iPhone/Safari validation or crash-cause proof is claimed.
No deployment was performed. Automatic deployment is disabled on the candidate
branch; current official Testnet and fixed rollback/release refs are preserved.
