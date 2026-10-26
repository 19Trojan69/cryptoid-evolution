# Account-path controls and native image-cache follow-up

Base: `8ec922899b228dc8baa15675dff2c025262e8d3b`. Historical White Screen,
physical-device acceptance and the rebuilt renderer's accepted-loader gate
remain OPEN. No production source, image, sound, save, account or payment changes.

## Owner observation and question

The owner reports about twenty minutes on a laptop/PC, ending normally at boss
five after losing lives, without a White Screen. The owner clarifies this was
Sandbox play without a deliberate Pi login and asks whether the account path
could explain the difference. The exact served build and server-session identity
are not verified. This is a useful observation, not a matched PC/mobile result.
The photo and its hash are recorded in `../owner-observations-20261026/observation.json`.
It also shows fullscreen/wake-lock policy denials in an embedded document; the
owner explicitly returns priority to smartphone/tablet White Screens. Fullscreen
is deferred. No additional owner test campaign or system log is requested.

## What the released source actually does

The guest starts locally without an account run. A restored/authenticated
account first loads its profile/run and uses the persistent save outbox, combat
checkpoints, rewards and leaderboard calls. Owners additionally enable the
existing diagnostic path. The guest/account difference is real and must not be
reduced to a device-only comparison.

`useAuth` performs startup restoration/native sign-in; it has no periodic
re-authentication interval. The axios response observer does not redirect after
401. The explicit OAuth sign-in and its dedicated callback can navigate; they
are not automatic running-game expiry handlers. Checkpoint failures retain the
queue and show a failure notice. These source observations do not exclude a real
Pi bridge, account-data, timing, storage or native-process problem.

## Native local controls

`verify-account-flow.mjs` compiles the real released GameEntry/GamePage, auth,
HTTP/save modules and original UI. All 239 runtime source files read for bundling/preparation are
matched to pinned Git blob IDs before compilation. A small read-only state
observer identifies the same document, mounted game and advancing simulation.
SDK/API responses are synthetic and stay on localhost. Browser dimensions are
393 x 744/DPR3 and 820 x 1180/DPR2; these are Linux Chromium141/WPE26.5 runs,
not actual Android/iOS/Pi Browser or mobile GPU measurements. Native art, sound,
clock and strict >2500ms/500ms guard remain in use. No GC, clock replacement or
automatic Resume. Local screenshots were inspected.

| Controlled case | Chromium `f` | WPE `g` |
| --- | --- | --- |
| Native SDK success, then checkpoint 401, phone viewport | Same running mission, backup retained | Same running mission, backup retained |
| Restored owner, then checkpoint 401, tablet viewport | Same running mission, backup retained | FAILED: loop-stall pause at initial elapsed 0 |
| SDK rejects sign-in | Visible error and explicit Retry/Home | Visible error and explicit Retry/Home |
| Session restoration returns 503 | Visible error and explicit Retry/Home | Visible error and explicit Retry/Home |
| Guest, no session | Active play; no account API | Active play; no account API |

The failed WPE tablet control retains `timeOrigin`, `/game`, mount 1 and the
same run, with a visible technical-pause modal and `reason=loop-stall`. It has no
uncaught JS error or browser crash. The stalled interval is not profiled; do not
attribute it to the subsequent 401 or declare its blocking cause established.
An earlier WPE `e` phone control also times out after reaching a valid account
run/401, but lacks the final-state capture; its reason remains unassigned.

Two further focused, fresh-browser WPE tablet controls `h` vary only ordinary
account versus owner access at the same viewport. Both preserve advancing play
after checkpoint 401, retain the unconfirmed backup and stop only after the
test explicitly clicks Pause. They do not erase the failed `g` control or prove
the full account/mobile path stable. The latest WPE full suite is NOT passed.

Every final case observes exactly one document request. Same-document Router
history events are recorded separately; they must not be miscounted as reloads.
No tested case automatically returns Home or replaces the document. These are
short fault controls, not a campaign, a real Pi login or White Screen cure.

## Chromium cache and sampling attribution

Reanalysis of the already archived partial allocator receipt uses only direct
`cc/image_memory/cache_*/{at_raster,budgeted}/image_*` nodes, excluding child
aliases. At closed idle the available provider reports 300 cache entries,
519,782,400 bytes reported size/effective size (495.703125 MiB), **zero locked
bytes and zero budgeted entries**. All global dump requests still failed. Do not
describe this entire size as non-discardable live gameplay memory or as a
physical-mobile measurement. Timing/reclaim under real pressure is unproved;
the unrelated growing anonymous mappings remain unaccepted.

The matching Chromium141 sources describe unlocked discardable decode entries
and a cache policy separate from the 64 MiB locked-memory bookkeeping budget.
Source URLs and SHA256s are pinned; copies and the Chromium license are archived.

A bounded cc.debug trace adds markers around the existing source-pixel probe,
without changing drawing. All 27 Image/Blob-Image draws enter the software decode
cache. All nine bitmap draws have no such cached draw between their markers.
At half/quarter size the cache explicitly uses intermediate sizes such as
500x188 / 250x94 for the 1000x375 hull, and 512x242 for the 2048x966 gun atlas.
This confirms different native draw paths alongside the previously identical
full-resolution RGBA; it is not a native-memory acceptance control.

Based on that exact source/trace, one additional diagnostic tests the constructor's
medium native resize hint at these integer probe sizes. It still differs in
four source/scale cases, including 98,130 hull-half channels. It is rejected;
no runtime sampling, asset resolution, graphics quality or decoder default changes.
Do not repeat more arbitrary hint/copy/renderer variants.

## Preserved failures and reproduction

The hashed archive retains every preliminary console/JSON receipt, screenshots,
exact verifier versions and the native sampling trace. The first launch `a`
omitted its required output tag and never ran an app. Chromium `b` supplied an
invalid synthetic card-reveal shape; the real app showed a handled loadout error.
`c` incorrectly expected a save notice in the active-play DOM and omitted a local
card-sync fixture endpoint. `d` miscounted same-document history as document
replacement. Chromium `e` expected an account error in a healthy guest path.
None is an application White Screen or acceptance pass. Their source hashes
match the archived verifier snapshots. The WPE failures above remain distinct.

From `rebuild`, with matching native browsers and original public assets:

```sh
CRYPTOID_NATIVE_OUTPUT_TAG=unique-account npm run verify:account-flow
CRYPTOID_TEST_ENGINE=webkit CRYPTOID_NATIVE_OUTPUT_TAG=unique-account npm run verify:account-flow
CRYPTOID_TEST_ENGINE=webkit CRYPTOID_ACCOUNT_CASES=tablet-restored-account-expired-save CRYPTOID_NATIVE_OUTPUT_TAG=unique-tablet npm run verify:account-flow
CRYPTOID_PIXEL_TRACE=1 CRYPTOID_NATIVE_OUTPUT_TAG=unique-trace npm run verify:texture-pixels
```

Never overwrite an existing output tag. Original local files modified by an
unrelated old candidate are refused; the verifier may use the byte-matching
released-source backup. In a clean checkout the regular runtime sources match.
The current simulation boundary audit still passes (41 modules, zero forbidden
imports/effects); both verifier scripts pass syntax checks. The previous 43
contracts and TypeScript result remain unchanged; no simulation code was edited.

Continue with the real account/owner initialization and native allocation
lifetime as separate controlled variables. The owner observation does not
isolate login causality, while the earlier image-memory fixture triggers large
occupancy without importing any auth/account adapter. Keep both paths open.
Resolve the native-memory/original-pixel gate before integrating further game
features. PR167 remains a draft; no deployment or live data mutation.
