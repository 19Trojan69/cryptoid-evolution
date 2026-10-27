# Cross-device White Screen investigation

The owner reports the failure on iPhone and Android phones. Android tablet
coverage is precautionary; occurrence on a tablet is not confirmed. A screenshot
and one White Screen occurred at the same time. That timing is retained as a
possible trigger, without treating it as an established cause.

This runner reuses the existing real backend-handler fixture and the unchanged
GameEntry/GamePage controller from main commit
`97d74b412f7dc7ea2f4f8c05f483d87eb3451dba`. It adds observation hooks only to the
isolated Vite test server. No published gameplay files are changed. The branch
is excluded from automatic Vercel deployments.

## Scope

| Profile | Browser on Linux | Emulation preset | Viewport |
| --- | --- | --- | --- |
| Android phone | Chromium | Pixel 7 | 412 × 839 |
| Android tablet | Chromium | Galaxy Tab S4 | 820 × 1180 |
| iPhone | WebKit | iPhone 15 Pro Max | 430 × 825 |

These are browser emulations, not physical Android/iOS devices or Pi Browser.
Preset user-agent strings do not establish a particular installed mobile OS.
Pi authentication, the account, purchase stock and database are synthetic.
The actual gameplay uses real clocks, seeded randomness, scripted pointer input,
and disclosed test-only collision protection. This is not a balance, mortality,
real-payment or production-backend acceptance test.

The first two thirds of each session have no page captures; the last third
captures periodically. A browser page capture does not reproduce an operating
system screenshot. Light Playwright tracing runs throughout and can itself add
overhead. Evidence includes frame progress, gameplay state, unexpected document
navigation, JavaScript errors, renderer/browser termination, save/API responses,
canvas resource counters, captures and a local trace. Resource counters are not
total device/GPU memory. No result establishes the historical native crash cause.

## Execution

The dedicated branch push now requests 1800 seconds for each profile, after all
three 90-second setup runs passed. Manual dispatch also accepts
30–3600 seconds when the workflow is available for dispatch. Artifacts expire
after three days and contain only the isolated test account's evidence.

```sh
npm install --prefix frontend --include=optional --no-audit --no-fund
npm ci --prefix backend --include=optional
npm run build --prefix backend
npm run prepare:hulls --prefix frontend
npm install --prefix verification/cross-device-white-screen-20261027 --ignore-scripts --no-audit --no-fund
cd verification/cross-device-white-screen-20261027
npx playwright install --with-deps chromium webkit
npm run preflight
CRYPTOID_TEST_PROFILE=android-phone CRYPTOID_TEST_SECONDS=1800 npm test
```

The preflight type-checks the exact instrumented controller without changing its
source, verifies equality with the published controller, and validates start and
inventory through existing handlers. Progress requires real projectiles, sector
progression, explicit Pause/Resume, and no unexpected API/JavaScript failures.
A pilot that cannot advance is reported as a test investigation failure, not as
a reproduced White Screen.

## Checkpoint before external execution

- Local preflight: passed, including instrumented TypeScript and real handlers.
- Local browser execution: blocked by this environment's browser/socket policy;
  no local device/browser pass is claimed.
- Vercel sandbox creation: service rejected it with HTTP 403. The advertised CLI
  fallback has neither a local installation nor authenticated credentials.
- GitHub Actions execution and physical-device results: pending actual evidence.
- The first external setup attempt stopped before browser/game execution:
  `npm ci` requires a frontend npm lockfile which the repository does not contain.
  The frontend now uses the repository's npm installation approach.
- The next tablet attempt reached sectors 1 and 2, then stopped at the planned
  Pause because the test monitor classified the game's same-document modal
  history entry as a document navigation. Evidence showed the normal Pause
  dialog and no all-white capture. The monitor now separates document identity
  and route changes from same-document history. This is a harness correction,
  not a production-game fix or a completed duration pass.
- The iPhone-emulation setup displayed the resume dialog, but its initial click
  exceeded the shared 10-second timeout after page loading. No gameplay or White
  Screen was observed there. Startup now explicitly brings the page forward,
  waits for the visible Resume dialog separately, records document visibility,
  and allows a bounded 30-second ordinary click. It does not force or dispatch a
  DOM click. Each CI job installs only its required browser engine.

## Validated short run

GitHub Actions run `40570077403` completed successfully on all three profiles:

| Profile | Real wall time | Sectors reached | Pause/Resume | Browser captures | JS/API errors |
| --- | --- | --- | --- | --- | --- |
| Android phone emulation | 90 seconds | 1–5 | passed | 2 | 0 / 0 |
| Android tablet emulation | 90 seconds | 1–5 | passed | 2 | 0 / 0 |
| iPhone emulation | 90 seconds | 1–4 | passed | 2 | 0 / 0 |

This validates runner setup and short gameplay only. The historical White Screen
is not declared fixed. Three 30-minute sessions are the next execution step.
- Existing diagnostic draft PR #194 stays separate and unmerged. Raw owner
  reports and private telemetry are not copied into this test package.
