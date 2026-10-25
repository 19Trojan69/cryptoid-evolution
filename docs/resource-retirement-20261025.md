# Closed portrait surfaces and paced diagnostic ownership checks

Prepared against release receipt `8c4f17164daf625a4c9610b5d2d88946010c8496`,
whose runtime is the official Testnet source `20843b5501387dca8bb5616303934ece2ae6d581`.
Candidate branch: `codex/testnet-resource-retirement-20261025`.
Automatic deployment is disabled. This preparation includes no deployment,
main merge or Mainnet change.

The owner requests an approach independent of missing iOS analytics reports.
The work therefore uses source inspection, negative controls and automated local
native-browser tests. No additional owner campaign or OS-log search is required
to reproduce these two findings.

## Resulting behavior

Crash-tail ownership reads previously crossed synchronous localStorage and
sessionStorage on every frame, even when the existing 250 ms snapshot deadline
prevented a write. Check that deadline first. Every due snapshot and forced
critical event still verifies slot ownership before writing. Snapshot cadence,
limits, critical-state retention and the recovered report are unchanged.

BossPortrait, ShipPortrait and GalaxyBossArt now explicitly zero their own view
canvases when those views close. An old asynchronous completion remains unable
to draw after cleanup. Shared loader results retain their original ownership,
pixels, resolution and bounded cache policy. GalaxyBossArt's retirement effect
runs on unmount, separately from its prop-dependent image-loading effect.

No gameplay, HUD, CSS, artwork, audio, economy, backend, account, save or reward
behavior changes. Owner diagnostics remain Admin-only. The strict >2500 ms
watchdog, its 500 ms poll and explicit Continue/Resume remain unchanged. The new
RAF-driven fixtures are test entries and are never imported into the app.

## Verification

The original versions of all four runtime files were compared byte-for-byte with
the exact parent commit through GitHub. The old portrait and crash-tail sources
are negative controls, rather than a reconstruction of their behavior.

The complete frontend build passes its 232 tests, project TypeScript and Vite.
Changed runtime files pass ESLint with zero errors or warnings. The pre-existing
large-chunk warning remains. The 48 focused recorder/report checks also pass;
they overlap the build suite and are not an additional unique-test total.

In both Chromium 141 and native WPE WebKit 26.5, 36,000 synthetic frame callbacks
using real browser Storage produce identical recovered evidence before/after.
Storage reads fall from 72,004 to 4,804 (93.33%); writes remain 6,002. Reloading
without a finish/unload callback preserves the last frame and critical error.
This executes ten simulated minutes synchronously; it measures recorder work,
not ten wall-clock minutes of gameplay or a game-speed improvement.

The actual three React portrait components pass six native PNG comparisons per
engine, including unlocked/silhouette and reopen controls. Pending-image requests
also complete after unmount without reviving the view. The test deliberately
holds detached canvas elements so GC cannot conceal missing retirement. Their
estimated backing bytes fall from 3,516,960 to zero in Chromium and from 3,413,396
to zero in WebKit. Shared artwork remains intact. These are dimension-based
canvas estimates, not process-memory measurements or proof of an unbounded leak.

The combined native soak repeats the real boss 2/3/4 renderers, original assets,
damage/fire/aim rendering and reward portraits for 36 encounters per arm, with
owner recording enabled and disabled. Both engines pass: 144 controlled boss/card
encounters. Every encounter draws and releases its weapon canvas. After every
close, view/working surfaces have no remaining backing pixels, pacing-owner and
native-animation counts are zero, and the three shared card results plateau
after warmup. There are no observed JS or missing-asset errors. Twelve further
short encounters verify the final runner's deadline and logging cleanup.

The sanitized numbers and source hashes are in
[resource-retirement-20261025.json](resource-retirement-20261025.json).
No private device journal, IPS report, process list, player data or credentials
are included in this candidate.

## Repeat locally

Use a separate checkout of the parent as the original source directory. Install
Playwright and its matching native browser dependencies in the test environment;
the production dependency list does not change. Set CRYPTOID_PLAYWRIGHT_PATH when
Playwright is installed separately. Each runner also supports
CRYPTOID_TEST_ENGINE=chromium or webkit and an optional JSON output path.

From frontend, with BASE pointing to that original checkout:

```sh
node scripts/verifyCrashTailStorage.mjs "$BASE/frontend/src/pages/crashTail.ts"
node scripts/verifyPortraitRetirement.mjs "$BASE/frontend/src/pages"
node scripts/verifyBossResourceSoak.mjs
```

The soak defaults to 36 encounters in each diagnostic arm. Damage and aim are
synthetic, and each encounter lasts 1.8 seconds; this is a resource-lifetime
isolation test. It does not execute the full GamePage campaign, real account,
payment, save or ten-second intermission flow. Existing build tests cover those
unchanged intermission guards.

## Remaining limit

The reported physical iPhone/Pi Browser White Screen and return to Home have not
been reproduced here. These changes remove two demonstrated sources of avoidable
work and deferred surface retirement; they do not establish the historical
termination cause or prove that the device crash is fixed. Native/process/GPU
memory and presented device FPS were not measured. Preserve the existing release
and rollback references until a separately authorized release of this candidate.
