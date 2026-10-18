# Explosion layer isolation — 18 October 2026

Pi v6 restores about 57 FPS when normal explosion/shatter DOM is absent,
including with explosion sound enabled. Disabling explosion sound alone leaves
about 22 FPS. See CAUSE_COMPARISON_V6.md and its transcribed Pi summary.

v7 splits this implicated display subtree before choosing a preserving renderer
correction. It is a private diagnostic ablation, not a proposed game setting.
The original GamePage, GameAudio and game CSS remain unchanged. The original
uncropped fragments and full sound implementation are used.

After eight seconds of warmup, five nine-second phases repeat real emitted
shots, collisions, destruction and automatic refills in sector 12:

| Phase | Fire/smoke pseudo-elements | Fragment subtree |
| --- | --- | --- |
| Original before | Included | Included |
| Fire/smoke only | Included | Omitted |
| Debris only | Omitted | Included |
| Empty wrapper | Omitted | Omitted |
| Original after | Included | Included |

The original effect wrapper and hidden span remain in all phases. A diagnostic
`content:none` rule prevents only the designated normal fire/smoke pseudo-boxes
from being generated. A virtual-source guard returns null from normal
explosion/shatter `shipDebris` only in designated phases. Boss and player
effects are outside these selectors/guard. No replacement effect is injected.

Simulation effect state, hull illumination, music, all original sound requests,
haptics, other graphics, original mobile paint cadence and the 34 ms cap remain
active. The first 1500 ms per phase settles prior work and is excluded from
measurements; only complete frame intervals after this cutoff count. Each
fixture reset replaces the prior simulation effects. The experiment is not a
normal scored/account run.

Three rate-limited samples per phase count normal effect roots and fragments,
read the first root's fire/smoke computed content, and bound/report observation
cost. These prove application of omissions, not actual pixel presentation.
The first/latest prepared-hull cache readings remain available. Disabled
detailed render-work counters are not interpreted as measured zero work.

## Verification

- Fourteen unit/startup/controller/diagnostic tests pass, including restoration,
  bounded observation and whole-frame settling exclusion.
- Real GamePage simulation integration (presentation/audio stubbed) completes
  all five phases, 24 measured salvos each at 16 ms steps, 17 each at 50 ms;
  the 50 ms accepted ratio remains .68. No emergency resets or sector changes.
- Build proof retains the exact GamePage and GameAudio SHA256 from v6.
- Actual Chrome completes in 53095.9 ms with no issues, blocked requests or
  emergency resets. FPS is 56.01 / 58.41 / 58.55 / 60.01 / 57.75, measured
  salvos 24 / 23 / 24 / 24 / 24. This is not a reproduction of the Pi slowdown.
- All 15 DOM samples retain explosion roots. Fragments are exactly zero in
  fire/smoke-only and empty-wrapper phases and positive in the others. Computed
  fire/smoke content is `none` only in debris-only and empty-wrapper phases.
  All phase ends retain simulation effects and active audio voices. Maximum
  diagnostic sample cost is 2.7 ms across the 15 observations.
- The downloaded report exactly matches visible JSON. The copy control reaches
  “Bericht kopiert”; the cloud clipboard readback returns an empty string, so
  clipboard payload equality is not claimed. The visible textarea/download
  remain usable alternatives. Raw report and final screenshot are retained.

## Deployment

Preview dpl_8gErA9jJ5JEynPGDpXCiNTpXrmPy is READY, target null, aliases empty.
Host: cryptoid-evolution-testnet-c8nn84hjb-19-trojan69.vercel.app.
The deployment-scoped share expires 2026-10-19T10:59:09Z; its token is not saved
in Git.

Read-only alias checks retain Testnet deployment dpl_BX7ZeCr9Qr6anBa3AZnzLERubpQM
(27d1747) and main deployment dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe (907d2a7).

## Interpretation

A gain with fragments absent implicates that subtree; a gain with fire/smoke
absent implicates those pseudo-elements. Both may contribute or interact. If
neither isolated layer is enough but the empty wrapper is fast, combined load
remains plausible. A slow empty wrapper would require investigating common
work and differences from v6 rather than claiming a particular GPU cause.

No particle, texture, audio or explosion reduction is proposed for publication.

## Completed Pi result

The user's completed Pi report is summarized in device-replay-v7-pi-phase-summary.json.
Original before/after deliver 23.77 / 22.55 FPS, fire/smoke alone 38.22,
debris alone 36.22 and the empty wrapper 55.32. Accepted time is 68.66 / 88.40 /
86.36 / 99.63 / 66.35%, with 16 / 21 / 20 / 23 / 15 measured salvos.
DOM counts and pseudo content confirm both intended independent omissions.
Simulation work p95 stays 1 ms, observation cost at most 1 ms, prepared hull
cache 13 / 4,804,555 bytes, no issues/blocked requests/emergency resets.

Both visual subtrees contribute; neither alone restores the control cadence.
This is not proof of a particular GPU bug. The next candidate retains all
original pieces and timing while flattening their display into Canvas, using
prepared static fire/smoke artwork and the existing full-resolution hulls.
