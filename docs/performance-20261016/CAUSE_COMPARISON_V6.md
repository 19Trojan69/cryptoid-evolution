# Explosion image/audio cause isolation — 18 October 2026

The user's completed Pi v5 run gives 25.91 / 25.55 / 25.86 FPS for original /
cropped / original. Each phase has 44 measured salvos; accepted time is 70.69 /
70.86 / 71.44%. Fragment widths change to 25 / 36 px in the middle phase with
the same pivots, proving the intended bounds were applied. This does not
resolve the slowdown, and does not establish that all fragment work is cheap.
The retained summary is device-replay-v5-pi-phase-summary.json. No separate
visual observation accompanied the user's JSON.

## Purpose and limits

v6 is a temporary private cause-isolation experiment, not a proposed visual or
audio quality reduction. It repeats the same real shot/collision/destruction/
refill scenario, using original uncropped geometry and styles. Five 10-second
phases independently include/omit normal explosion/shatter DOM and explosion
sound requests, bracketed by the complete original presentation:

| Phase | Explosion DOM | Explosion audio requests |
| --- | --- | --- |
| Original before | Included | Included |
| No explosion audio | Included | Omitted |
| Neither | Omitted | Omitted |
| No explosion image | Omitted | Included |
| Original after | Included | Included |

The start page explicitly explains the temporary missing explosions/sounds.
All simulation effects still exist and expire normally. Hull illumination,
player aiming/movement, shots and shot sounds, other graphics, music, haptics,
original resources, the 34 ms cap and mobile paint cadence continue. Thus a
negative result in all phases leaves these common paths open. A gain only when
both channels are omitted may indicate combined pressure rather than a single
cause. A gain when image DOM is absent includes the full cost of that subtree
(mounting/style/paint/compositing), not a single proven CSS mechanism.

The original GamePage and GameAudio files remain untouched. The builder only
injects a filter on normal effect DOM and a guard on `play('explosion')` into
the isolated bundle. Omitted calls advance the original alternating-sample
counter but create no explosion audio sources. Other sound calls continue.
This diagnostic omits new requests rather than truncating existing sounds.
Original MP3 durations checked with ffprobe are .809796 and 1.306122 seconds.

After an 8-second warmup, the five phases total 50 seconds. Each phase's first
1500 ms lets prior work settle and is excluded from statistics. The frame clock
accepts only whole intervals starting after this cutoff; volley/work timestamps
also wait for the cutoff. Existing profiles without a settle option retain
their original behavior. These are wall-clock phases, not a scored run.

## Verification

- Thirteen unit/startup/controller/diagnostic tests pass, including settling
  exclusion, bounded sampling and restoration of full image/audio behavior.
- Real GamePage simulation integration (presentation/audio stubbed) completes
  five phases with 27 measured salvos each at 16 ms steps; 19 each at 50 ms,
  with accepted ratio .68 at the latter cadence. No emergency resets.
- GamePage SHA256 is unchanged:
  eb628a5d73247ea64ec5443d2ff4efdab071a97228634f16f2aa915cdc832607.
- GameAudio SHA256 is unchanged:
  e6720dc0abc59d75a56bf10118c6b86ada07d77bf45abb9b4717356f34dab7ac.
- Actual Chrome completes in 58084.7 ms, with no issues or blocked requests.
  All measured windows contain about 8498 ms. FPS is 58.01 / 59.07 / 59.90 /
  59.78 / 56.13; measured salvos 27 / 27 / 27 / 27 / 26. This run does not
  reproduce the Pi slowdown and does not prove its cause.
- All normal explosion DOM samples are zero in the two designated image-off
  phases and positive in the image-on phases. Simulation effects remain
  present (12–16 at the end of each phase). Audio request counts correspond to
  56 / 55 / 56 / 55 / 56 deaths: exactly the designated audio-off phases omit
  all requests, and no requests are omitted in the others. Counts verify the
  instrumentation, not audible output.
- The downloaded report exactly matches the visible JSON; compact copy is
  12870 characters. The copy control reaches “Bericht kopiert”. Raw Chrome
  report, build proof, integrations and final UI screenshot are retained.

## Deployment

Preview dpl_3hbksG4uRzMmCE5abzAUE2GqMhuK is READY, target null, aliases empty.
Host: cryptoid-evolution-testnet-47nyegb7h-19-trojan69.vercel.app.
The single deployment-scoped share expires 2026-10-19T10:37:19Z; its token is
not saved in Git. Account/API isolation is the same as previous replays.
Public aliases are not reassigned.

## Completed Pi result

The user's completed Pi Browser 1.17.1 report (430×825, DPR 3, sound on)
isolates the normal explosion display path. Summary values are transcribed in
device-replay-v6-pi-phase-summary.json; raw data remains in the conversation.

| Phase | FPS | Accepted time | Measured salvos | Volley median / p95 ms |
| --- | ---: | ---: | ---: | ---: |
| Original before | 23.77 | 69.09% | 18 | 475 / 585 |
| No explosion audio | 22.34 | 66.16% | 17 | 467 / 777 |
| Neither | 56.57 | 99.73% | 27 | 317 / 334 |
| No explosion image | 57.39 | 99.87% | 27 | 317 / 334 |
| Original after | 23.37 | 69.37% | 18 | 459 / 550 |

Every image-off DOM sample is zero, while original simulation effects remain
(15–16 at phase end). The image-off/audio-on phase ends with nine active audio
voices, makes all 57 explosion sound requests and reaches 57.39 FPS. Removing
explosion sound alone does not improve performance. The common autopilot,
simulation, hull illumination, haptics and audio cannot explain this large
contrast by themselves in this fixture. It does not rule out interactions.

Original-before/after are similarly slow, simulation work p95 stays 1 ms, and
the prepared hull cache remains 13 entries / 4,804,555 estimated bytes. Issues,
blocked requests and emergency resets are empty/zero. Detailed disabled
diagnostic work counters are not interpreted as zero actual rendering work.

The dominant implicated path is the complete omitted normal explosion subtree;
the report does not distinguish mounting, style, painting or compositing, and
does not establish actual pixel visibility. The next private experiment splits
fire/smoke pseudo-elements from the original uncropped fragments. No omissions
or visual quality reductions are proposed as a game fix.
