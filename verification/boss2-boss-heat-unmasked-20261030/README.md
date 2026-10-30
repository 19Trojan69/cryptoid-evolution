# Private visible-heat / image-mask candidate — 30 October 2026

Continue from handoff `336eafef12be02f1cf1e0ceb95f26a5c46e8c51d`. The affected phone last failed with original boss heat visible and reflection hidden at saved active checkpoint **08:36**. That is an owner outcome, not an exact crash time. Its sanitized receipt is `../boss2-boss-heat-control-20261030/evidence/owner-heat-control-failure.json`. Earlier both-hidden 10:34 and reflection-only 10:00 normal exits remain individual phone comparisons. No native cause or durable repair is established.

## Source finding and candidate

`frontend/src/pages/HullDamage.tsx` places all persistent boss hotspots inside one full-boss `.hull-heat-layer`, with the original hull image as both standard and WebKit image mask. Each keyed hotspot contains a child with two radial gradients; the element uses a rotated/scaled transform and separate opacities. `bossDamage` selects the stable boss keys/profile. The boss CSS already disables cooling/flicker/speck animation. `hullFireLimit` bounds boss sites to at most eight. The short `FinishedEffect` mini-explosion is a separate sibling outside the mask. `BossHullView` supplies the original hull-image URL. No unbounded hotspot growth or perpetual boss-ember animation is established by this source review.

The remaining suspect is the visible heat group or an interaction, including its image mask over transformed gradient children while the boss moves/updates. Reflection-only success does not exclude that interaction. This is a reason to isolate the active mask, not proof of a GPU/WebKit defect, leak or thermal cause.

The candidate keeps visible original heat and changes **only the effective `mask-image` / `-webkit-mask-image` to `none` on the boss heat layer**. Reflection remains hidden. The original inline mask styles, component/DOM/keys, hotspot coordinates/profiles/gradients, static opacity/transform, overflow/bounds and separate mini-explosions remain. Heat may appear over transparent hull areas or extend beyond the painted edge within the original boss box; pixel equivalence is not claimed. This is a small confirmation/repair candidate, not a final artwork decision.

The baseline mode keeps the original active mask with otherwise the same current guest build. `CRYPTOID_BOSS_HEAT_UNMASKED=0` builds baseline; the candidate is the default (`1`). Both require `VERCEL_ENV=preview`. Their report identities differ by `-unmasked-hull-heat`. Banner: **MASKENKANDIDAT: Boss-Hitzespuren an; ohne Bildmaske**. Hotspots remain enabled in both modes.

## Boundaries

All original frontend, backend, API, assets and private-preview source trees remain pinned byte-for-byte. Only verification packaging, the optional scene-identity gate and this branch's Vercel build command change. BossWeaponsView stays excluded, original backgrounds/boss image/health/image preparation remain, other foreground graphics stay simplified, and the prior filter/reactor/ordinary-explosion-Canvas controls remain. No new runtime timer, observer, RAF, simulation change, account/payment/save/ranking access, audio change or automatic Resume is introduced. Git automatic deployment stays disabled. Do not merge this guest build into main or publish to public Testnet/Mainnet.

The CI comparison uses short Chromium/WebKit emulated-phone flows: real original hotspots and mask cascade, unchanged boss/layout boxes, already-static hotspot animation, a synchronous same-paused-DOM mask-only style probe with exact restoration, original volley progress, synthetic one-finger steering, weapon menu, manual pause/time freeze/resume, normal exit and source-paired report. It is not a physical phone endurance or native termination measurement. No new physical phone result is assumed or assigned by building this candidate.

Validation and any protected hosted-preview receipt will be recorded separately after they actually complete. Preserve all older frozen device branches and addresses. Current state: candidate implemented; build/browser verification pending; White Screen open.
