# Complete Canvas effects across block transitions — 18 October 2026

At 14:08 Europe/Vienna the user confirmed that v9's fire, smoke and debris
were fully visible on the original iPhone / Pi Browser. The completed v9
phase summary and that separate visual confirmation remain preserved.

## Reproduced candidate limitation and fix

The v9 candidate retains at most eight decoded painted hulls, but never
evicts unused entries during a run. An integration test using the actual
candidate module with mocked browser decoding reproduced rejection on the
ninth different hull: `Hull image cache limit; retain original display`.
This is a candidate resource-lifetime limitation, not evidence that the
public game's slowdown or an account-run crash was reproduced.

The candidate now replaces the least recently requested **unused** decoded
hull when a new hull needs a slot. Each mounted impact, including a frozen
comparison, retains its hull until effect cleanup. Pending decodes cannot
be evicted. The eight-entry and 32 MiB decoded-hull budgets remain. When all
slots are actively retained, the complete original display remains the
fallback; a capacity rejection does not poison a later request. Generation
guards prevent delayed decoding or stale cleanup from changing a stopped or
restarted cache. No source resolution, piece count or artwork changes.

The actual-module allocation integration passes cancellation during hull/SVG
preparation, complete cleanup, 24 changing hulls within eight retained slots,
preservation of an active hull through eviction, and recovery after all eight
active hulls release. Rendering itself is mocked in that check. Fourteen
startup/controller/geometry/artwork tests also pass.

## Isolated test flow

The user story is start the private device test → warm up the original game
renderer → repeated destruction → ordinary block clear/intro/entry paths →
repeat destruction → export a report and release renderer resources. No
account, purchase, API or durable reward path is present in the bundle.

After eight seconds of warmup, the three phases are ten seconds of refill
stress, forty-five seconds of ordinary block transitions, and ten seconds
of refill stress. Every phase uses the complete bounded Canvas renderer.
First 1500 ms per phase are excluded from frame/cadence measurements.
Lives, enemy health and aiming are diagnostic controls. Only the two stress
phases refill defeated enemies; the middle phase does not inject refills.
This is not a normal scored campaign, pause/resume or boss test.

Real GamePage simulation integration passes at 16 and 50 ms frame steps:

| Frame step | Reference salvos before / after | Middle sector changes | Middle ending sector | Accepted time |
| --- | ---: | ---: | ---: | ---: |
| 16 ms | 27 / 27 | 6 | 18 | 100% |
| 50 ms | 19 / 19 | 4 | 16 | 68% |

Both integrations use rendering/audio/API stubs. They confirm ordinary
clear/intro/entry phases, real collision effect creation, zero middle-phase
refills and zero emergency fixture resets. They are not device FPS results.

The candidate reports cumulative hull loads/evictions and retained hull users
alongside the existing cache, backing-store, fallback and cleanup counters.
The original GamePage, gameAudio and index.css hashes remain unchanged, as
shown in `device-replay-v10-build-proof.json`. Resource acquisition uses one
cleanup paired with each mounted component; no per-frame React state is added.

## Private deployment

Build `device-replay-20261018-v10-blocks`, deployment
`dpl_8Dp8XvpJzT6NgsTbCL1DMFJ4osJw`, host
`cryptoid-evolution-testnet-7uxq7rj2n-19-trojan69.vercel.app` is READY,
target null, aliases empty in the existing Testnet project. It opens directly
through a deployment-scoped share link. The share token is not stored in Git.
The share expires on 19 October 2026 at 12:13:56 UTC (14:13:56 Vienna).

## Completed browser run and export

Chrome 154 completed the deployed test in 73,051.2 ms, visible, sound enabled,
1363 × 936 and DPR 1. The ordinary middle phase reaches sector 16 after four
sector changes, with clear/intro/entry all observed and zero injected refills.

| Phase | Delivered FPS | Accepted time | Frame p95 | Salvos | Hull loads / evictions, cumulative |
| --- | ---: | ---: | ---: | ---: | ---: |
| Destruction before | 59.31 | 99.43% | 16.7 ms | 27 | 6 / 0 |
| Ordinary transitions | 58.89 | 99.25% | 16.8 ms | 60 | 36 / 28 |
| Destruction after | 59.66 | 100% | 16.7 ms | 27 | 42 / 34 |

The retained cache ends at six/eight/eight entries and no more than 2,544,768
decoded hull bytes in the three phase snapshots. This establishes successful
resource replacement beyond eight cumulative hull loads in the real browser.
Four fire/smoke textures are retained initially, then six (1,121,068 bytes)
when a further original explosion size is encountered. Their preparation count
then remains stable. Heavy enemies retain their original eight pieces; the
middle phase has 18,780 piece draws for 4,425 effect draws rather than an
artificial fixed four-piece assumption.

Fallback mounts are 3 / 30 / 6. These retain the complete original effect
display while a newly encountered hull or texture is prepared. There are no
renderer failures or permanent cache-capacity rejections. All ten periodic
samples have zero original-effect DOM, including two middle-phase samples
when no explosion is active. These samples are sparse and do not imply zero
fallback time between them. No GPU-presentation or pixel-identity claim is
made from DOM counters or CPU timings.

All fixture resets, issues and blocked requests are zero. Final scheduler,
registrations, source images, texture entries, cache bytes and surface bytes
are zero. The download exactly matches the JSON shown in the report textarea;
the copy button reports success. Both the exported report and completion
screenshot are preserved in this directory. The corresponding Pi Browser
result is recorded separately below; the Chrome measurements alone do not
establish iPhone performance.

Final public alias checks match the initial deployments:

- Testnet: `dpl_BX7ZeCr9Qr6anBa3AZnzLERubpQM`, source commit
  `27d174788327c3423f04ace32be61af67a2004cc`.
- Main: `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe`, source commit
  `907d2a7363345d00f0f90c54402bf04e887b64d9`.

No public game alias, original source or account path was changed.

## Completed iPhone / Pi Browser run

At 14:21 Europe/Vienna the user supplied the completed v10 report from
iPhone OS 18_7 / Pi Browser 1.17.1, viewport 430 × 825, DPR 3, visible,
with sound enabled. The run completes in 73,040 ms. Selected fields are
preserved in `device-replay-v10-pi-phase-summary.json`, explicitly labeled
as a summary rather than a raw-report export.

| Phase | Delivered FPS | Accepted time | Frame p95 / max | Salvos | Volley median / p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Destruction before | 46.24 | 97.56% | 39 / 47 ms | 26 | 323 / 351 ms |
| Ordinary transitions | 59.39 | 99.49% | 20 / 70 ms | 60 | 317 / 4684 ms |
| Destruction after | 47.97 | 98.57% | 35 / 43 ms | 26 | 328 / 340 ms |

The transition phase reaches sector 16 through four ordinary sector changes,
without injected refills or emergency resets. It creates 39 effects and has
clear/intro/entry all observed. The 4684 ms volley-gap p95 is a whole-phase
metric, including ordinary noncombat transitions. The unchanged source resets
the fire timer and suppresses volleys during clear/intro and until a normal
formation is ready. This provides an expected cause of long transition gaps;
individual gap timestamps are not labeled in this report. It is not a
combat-only firing-cadence metric. The median remains 317 ms, and the reference
phases each emit 26 measured salvos.

There is no observed sustained degradation in the post-transition reference
phase: its FPS is slightly higher than before. That is a within-run observation,
not a statistically established speed gain or long-session crash guarantee.
The unlimited-refill stress phases keep up to sixteen effects active; their
46–48 FPS is reported separately from the ordinary-transition phase's near
60 FPS. The test does not establish 60 FPS for a whole normal campaign.

Cumulative decoded hull loads are 6 / 39 / 45 and unused hull evictions are
0 / 31 / 37. Retained hull entries are 6 / 8 / 8, ending at 2,544,768 bytes,
with no renderer failure. Fire/smoke textures grow from four to six when a
new original size is encountered, then remain at six / 10,067,560 bytes /
six preparations. Peak backing stores are 6,034,248 / 5,555,808 / 6,060,744
bytes. DPR and source resolution remain unchanged.

Fallback mounts are 2 / 33 / 7 while new hulls or textures prepare, retaining
the original complete display. All ten sparse periodic samples contain zero
original effect DOM; two transition samples correctly contain no active
effect at all. Samples do not exclude temporary original-display fallbacks
between observations. Heavy enemies keep eight pieces: the transition phase
contains 18,920 piece draws for 4,459 effect draws. Both stress phases keep
four pieces per effect draw.

The separate, unchanged painted-hull cache grows from thirteen to its
configured forty-eight-entry limit as new hull variants appear. Its latest
estimated bytes are 17,648,799 after transitions and 17,637,945 after the final
stress phase, with eight sources and zero pending jobs. This is distinct from
the candidate renderer's eight decoded-hull cache; its growth is not hidden
by the renderer cleanup counters. The source's existing painted-cache budget
is forty-eight entries / 24 MiB. Four transitions do not prove long-session
memory behavior beyond the reported bounds.

Issues, blocked requests, renderer failures and fixture resets are zero.
Candidate renderer cleanup has no active frame, registrations, source images,
textures, cache bytes or backing-store bytes. No account, scored boss run,
pause/resume or crash recovery was tested. The user's full visual confirmation
belongs to v9; no separate v10 visual comment was included with this JSON.
This completes the current isolated ordinary-block transition measurement;
it does not promote the candidate into the public game.
