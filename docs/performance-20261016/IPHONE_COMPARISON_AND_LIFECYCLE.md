# iPhone comparison and isolated lifecycle test — 18 October 2026

The user identified the first completed iPhone run as Safari, then supplied a
completed report explicitly identifying PiBrowser/1.17.1. The Pi report is
retained as device-replay-v2-browser-pi.json, transcribed from the pasted JSON.

| v2 phase | Safari delivered FPS | Pi Browser delivered FPS | Pi accepted time | Salvos, either browser |
| --- | ---: | ---: | ---: | ---: |
| Single, six enemies | 58.08 | 58.83 | 99.79% | 62 |
| Double + shield, six enemies | 56.64 | 56.84 | 99.38% | 62 |
| Double + shield, one enemy | 59.95 | 60.00 | 100% | 62 |
| Single, six enemies after comparison | 57.92 | 57.99 | 99.72% | 62 |

Both completed in about 88 seconds with no issues, blocked requests or fixture
resets. The viewport heights differ (775 Safari, 825 Pi); this is a close device
comparison, not a fully identical rendering area or statistical benchmark.
Neither run reproduces sustained slow-motion shooting. It does not establish
that Pi Browser, account integration, long-session pressure, or ordinary game
transitions cannot contribute to the reported intermittent slowdown.

In the Pi report the last frame of the one-enemy phase has weaponLevel=1 and
pickupWeaponMs=0: that 20-second pickup expires at the phase boundary when no
time is clipped. The 62 salvos and phase samples remain consistent. The new
lifecycle fixture uses a 120-second controlled pickup budget for each phase.

## Why the next fixture differs

v2 prevents enemy deaths with very high health and keeps the same sector. It
does not exercise the ordinary explosion/debris mounts, repeated hull reuse,
new block preparation, entry animations or block-clear progress presentation.
The v3 lifecycle profile therefore keeps the same real GamePage/renderer and
adds an automatic pilot with one-hit test enemies. Every projectile comes from
the ordinary firing code; its real collision path creates the effects.

The four phases are 20 seconds of six-enemy double/shield reference, 30 seconds
of actual destruction with six enemies replenished, 40 seconds allowing normal
block transitions, and 20 seconds of the original reference again. With an
8-second warmup this takes about 118 seconds. Per-phase statistics include
destructions, maximum effects, replenishments, phase occupancy, sector changes,
and resource samples at most once per second (bounded to 128 per phase).

Controlled enemy health, automatic aiming, shield replenishment, lives and
projectile guard are fixture setup only. It is not a normal scored campaign,
account/save test, boss test or proof of a slowdown fix. No frontend/src file,
normal visual, timing rule, resource budget or public alias is changed.

## Pre-browser verification

- Eight existing startup/controller tests pass. The original v2 simulation
  integration also passes after supporting per-phase durations.
- Lifecycle integration at 430×825 with 16 ms injected frame steps completes:
  181 actual collision destructions in the refill phase, max 16 effects; 35
  destructions and four sector advances in the transition phase (12 to 16).
- At 50 ms injected steps it completes with 123 refill-phase destructions,
  max 12 effects, 24 transition destructions and three advances (12 to 15).
  Both runs retain zero emergency fixture resets and bounded samples. These
  are synthetic simulation results with presentation/audio/API stubs.
- Static build verifies the unchanged published GamePage SHA-256 and excludes
  real account/API modules. Build ID: device-replay-20261018-v3-lifecycle.

## Isolated deployment

- Existing Testnet project: prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF.
- Preview: dpl_GTyGMVZesGXykVnN5vGSUZCXfYjd, independently READY, target null,
  aliases empty. Host: cryptoid-evolution-testnet-n7p1air75-19-trojan69.vercel.app.
- A single deployment-scoped shareable link was created using the native
  protection-bypass endpoint with ttl=86400. It expires 2026-10-19T09:22:35Z.
  The token is not stored here. Project protection settings are unchanged.
- Browser verification is recorded below after the actual real-time run.

## Actual Chrome lifecycle verification

The new origin opened directly using its deployment-scoped share link. The
real-time run completed in 118045.8 ms, without issues or blocked requests.
It retained 62 salvos in each 20-second reference phase, 93 in the 30-second
destruction phase, and 58 during the 40-second transitions (firing is naturally
paused during entries/clears, so that last count is not a cadence regression).

| Phase | Delivered FPS | Accepted time | Actual destructions | Sector advances |
| --- | ---: | ---: | ---: | ---: |
| Before | 59.76 | 100% | 0 | 0 |
| Destruction/refill | 57.61 | 99.30% | 180 | 0 |
| Block transitions | 58.79 | 99.01% | 30 | 4 (12 to 16) |
| After | 59.46 | 99.59% | 0 | 0 |

The destruction phase reached 18 simultaneous effects; hull cache count stayed
13 there. During the transitions it grew to 43 with estimated retained hull
bytes 15916366, then stayed at that value throughout recovery. These retained
resource estimates exclude GPU memory and are not a heap/leak measurement.

Detailed material/encode/decode/queue/render-work counters in the sampled
legacy stats object are disabled by this diagnostic build's diagnostics flag.
Their zero values do not establish zero work. Retained hull counts/bytes,
ordinary frame clock, directly measured simulation work, salvos and fixture
event counters are usable. The added once-per-second samples and automatic
pilot run outside the reported simulation-work timing.

The downloaded JSON exactly matched the visible report. Raw report and final
screenshot are device-replay-v3-browser-chrome.json and
device-replay-v3-browser-finished.jpg. Browser console entries were extension
metadata errors only. Sound was enabled; audible output was not independently
assessed. No Pi Browser lifecycle run has yet been supplied.

The fixed Testnet alias still resolves to dpl_BX7ZeCr9Qr6anBa3AZnzLERubpQM;
the main app alias still resolves to dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe.
The unchanged GamePage source hash was checked again. The isolated test is
ready for a foreground ~2-minute Pi Browser run using its new share link.
