# Isolated short device replay — 16 October 2026

## Purpose and scope

The user asked the assistant to finish development/deployment and avoid requiring
whole-game playthroughs. This diagnostic is a separate static Preview in the
existing Testnet project `prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF`. It is not a
slowdown fix and is not a replacement for a real device measurement.

The original application sources are unchanged. The builder locks GamePage's
SHA-256 to `eb628a5d73247ea64ec5443d2ff4efdab071a97228634f16f2aa915cdc832607`,
the source published in Testnet commit
`27d174788327c3423f04ace32be61af67a2004cc`, before inserting diagnostic hooks
into the generated bundle only. It preserves the actual 34 ms simulation cap,
weapons, renderer and published styles. The lowercase paintedShip.ts resource
module is resolved explicitly because PaintedShip.tsx is a separate component.

## Test procedure

One Start gesture initializes the real audio when selected, followed by 8 seconds
of warmup and four 20-second controlled phases: single/six enemies/no shield,
double/six/shield, double/one/shield, and the initial configuration again.
The fixture starts directly in sector 12 (display Level 2, Block 2), maintains
enemy health and player lives and uses no score run. It is a controlled workload,
not a normal scored run or a strict graphics-cost A/B experiment. Enemy motion
and random choices are real and are not seeded for identical cross-run paths.

Measured frameGap and accepted delta come from the actual GamePage loop. Reports
include clipped simulation time, frame intervals, volley intervals and simulation
work. Quantile buffers are bounded; they do not measure browser paint/GPU time.
Backgrounding, runtime errors and unexpected game pauses stop the run with a
partial report. The report is copied/downloaded locally, never submitted to a
server by this harness. A Pi Browser run has not yet been obtained.

## Isolation

The generated build excludes the real auth/API client, Pi SDK and aggregate usage
bootstrap. Fetch permits only same-origin static GET requests; XHR is denied.
The preview's /api routes return a static denial, and it contains no functions.
Original static assets are proxied read-only from the fixed public Testnet URL.
The preview has a different storage origin, so its local settings/save keys do
not touch the normal application's storage. No account or purchase is required.

## Verification and deployment status

- `node --test scripts/deviceReplay/controller.test.mjs`: 5/5 pass, covering phase
  completion, capped-time accounting, reset gaps, interruption/invalid clocks,
  bounded sample memory and retained totals.
- `node scripts/buildDeviceReplay.mjs`: passes, including exact GamePage source
  hash and auth/API module exclusion assertions. Build proof is retained beside
  this document. Only the four listed static files were submitted to Vercel.
- Deployment `dpl_HQr1zF7AAPzJVu7cxx1PBkBQEwVi` was independently returned READY,
  target null (Preview), aliases empty, project ID as above, aliasError null.
- URL: https://cryptoid-evolution-testnet-2let8t2dl-19-trojan69.vercel.app
- The connector could not create an authenticated share URL: unscoped request
  returned 403 at read_protection_bypass; explicit verified owner team returned
  404 at lookup_deployment. No protection settings were weakened or changed.
- Direct browser verification was automatically denied when the protected
  preview led to generic vercel.com sign-in. The stated reason was that accessing
  that private account origin was not authorized by the current preview task.
  No alternate browser route or credential workaround was attempted.
- Consequently, READY is build/deployment status only. The rendered UI, complete
  88-second browser run, asset proxy responses and report export are **not yet
  browser-verified**. Do not represent this preview as a verified user-ready test.
- The fixed Testnet alias and separate main app are checked independently after
  publishing. No promotion, main merge or production alias move is part of this
  diagnostic deployment.

## Reproduction

From frontend, run the two Node commands above. The builder writes an explicitly
listed static package to /tmp/cryptoid-device-replay by default. Its files can be
uploaded to Vercel and deployed with framework null, outputDirectory public,
empty install/build commands and no target, using the existing Testnet project.
Do not promote this fixture to the normal game URL.
