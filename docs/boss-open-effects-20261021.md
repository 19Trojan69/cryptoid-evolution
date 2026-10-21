# Open-reactor artwork and hit-effect lifetime

Continues the owner's 21 October investigation of spontaneous iPhone returns to
Home while the second boss's reactor is open. The current runtime baseline is
official Testnet a21018085b9ea522a6e5fd7b13f26251ff5a9823. The audit parent
5569c4b contains its completed release receipt. This is an isolated preparation;
no public alias, fixed release/backup branch, account, save or Mainnet change.

## Findings and correction

HullDamage uses native CSS animations for the hit burst and persistent embers;
BossReactorView uses SVG clipping, gradients and a pulsing filtered path. Their
browser-owned intermediate surfaces are not measured by estimatedResourceBytes.
That estimate also omits boss-weapon backing stores, source images and browser
compositing. Low known-cache counts do not establish low process/GPU memory.

The persistent fire list is capped at eight. Actual React reconciliation over
5,000 hits across fifty boss lifetimes keeps at most eight heat sites, one burst
and 23 host nodes. Clearing the presentation removes every heat/burst node. In
the pacing controller, 16,025 registrations with synthetic native finish/cancel
events peak at 33 tracked animations (25 persistent plus eight transient) and
return to zero. These checks assume event delivery; they cannot establish that
WebKit always delivers the events or releases its own intermediate surfaces.

The open reactor reconstructs fixed gradients, bay metalwork and barrel children
whenever charge, opening or recoil changes. The candidate retains those React
children in a component-local useMemo keyed by the actual id, mount and energy.
The original live SVG root, door movement, charge variables, muzzle paths,
recoil, image clipping, colors and native pulse remain unchanged. No new global
cache, timer, listener, RAF, Canvas or quality adjustment is added.

## Evidence

The actual React comparison against a210180 passes 7,804 exact host-tree checks
covering all fifty bosses at widths 320, 430 and 820; closed, open, charge,
recoil, changing energy, resize, replacement image, death and restoration.
Across 1,200 continuously changing frames per phase:

| Phase | Baseline JSX objects | Candidate JSX objects | Reduction |
| --- | ---: | ---: | ---: |
| Opening | 85,200 | 21,600 | 74.65% |
| Charge | 85,200 | 21,600 | 74.65% |
| Recoil | 86,400 | 22,800 | 73.61% |

Unchanged closed frames still create zero new JSX objects in both versions.
The baseline-as-candidate negative control fails the opening-work assertion as
expected. These are React object-creation counts, not reductions of all rendering
work, GPU redraws, process memory, temperature or frame time.

Thirty focused hull/core/combat/weapon/pacing tests pass. BossReactorView lint
and the frontend release build pass, including TypeScript, twelve locale tests
and the release-language gate. The existing large-chunk warning remains.
Native Linux Chromium 153 passes 250 exact SVG DOM comparisons across all fifty
bosses and fifteen exact screenshot comparisons on five bosses. Snapshots use the
same physical origin and disable CSS animation only during capture, with no pixel
tolerance. They do not establish moving-frame equality at arbitrary native
animation times. A separate fresh document then runs five hundred actual React
hit replacements with native clocks/events untouched: controller entries peak at
64; all entries, native animations and heat/burst nodes return to zero after
removal. No page errors occurred. Linux software rendering cannot establish
Safari event delivery or physical iPhone/native/GPU memory, heat or FPS.

A fresh read of the official static GamePage bundle verifies that Testnet still
serves a210180. No candidate has been published.

## Reproduce

Install test-only React/react-test-renderer 19.3.1 outside the application, then
set CRYPTOID_SCENE_QA to that directory. From frontend:

```sh
CRYPTOID_REQUIRE_OPEN_REACTOR_FIX=1 node scripts/verifyBossReactorWork.cjs
node scripts/verifyBossEffectLifetime.cjs
node --experimental-strip-types --test src/pages/bossSpecialWeapon.test.mjs src/pages/hullFires.test.mjs src/lib/cssFramePacing.test.mjs src/pages/bossCore.test.mjs src/pages/bossCombat.test.mjs
npm run build
```

The native check uses Playwright from CODEX_PRIMARY_RUNTIME_NODE_MODULES and a
local Chromium executable (CRYPTOID_CHROMIUM_EXECUTABLE). Its optional serverless
launcher package path is CRYPTOID_CHROMIUM_PACKAGE. It serves the actual old/new
components and original styles/assets over a temporary local HTTP server; it
does not expose a new application route or call account APIs.

## Limits and next boundary

No unbounded application-owned heat list was reproduced. A concrete redundant
React-construction path was corrected, but the initiating iPhone allocation or
termination remains unidentified. The next meaningful device comparison is this
reviewed candidate versus the current official a210180 build in the exposed
boss phase. Do not demand another full campaign merely for the same counters,
remove artwork speculatively or describe this as a confirmed Whitescreen fix.
Publication still needs the owner's explicit instruction under frontend/AGENTS.md.
Automatic deployment is disabled for codex/boss-effect-audit-20261021.

## Completed publication after explicit approval

The owner's subsequent "Freigabe genehmigt" authorizes the GitHub upload and
Testnet release. The approved source is now on GitHub as 8a603e5; its complete
tree 17805facb3e1a58c0dd8d82e20f81b7c8f872968 is identical to the locally reviewed
9faeccc tree. The differing commit id reflects the authenticated GitHub commit
creation, not an additional source change. Terminal Git lacked credentials;
the connected GitHub tools saved and verified the source instead.

The Vercel connector returned project/deployment 404 and an empty project list
for the verified team. The previously authorized signed-in Dashboard fallback
therefore built protected preview dpl_ENU4c6GiRrWzWj1rxHwiWF1NXhN8 (45s).
Guest start, original HUD, pause, resume countdown, resumed play and re-pause pass.
No Pi account login was tested. The same commit was rebuilt in the existing
Testnet Production environment, producing READY
dpl_Evkpd5iquBkxudsqWCvibU4nTkXG at 07:50:08 UTC / 09:50:08 Vienna, 21 October.
The observed build duration is 38s. No Mainnet project was contacted.

Fresh public checks verify exact source/tree identity in GamePage/Admin bundles
and actual fixed definitions/bay/assembly reuse in the reactor code. API root,
anonymous Admin denial and all three leaderboard response hashes match the
immediate pre-release baseline. All four existing QA fixtures remain excluded
from production. A fresh official Home has Spielen enabled.

Keep codex/testnet-open-reactor-release-20261021 and the deployed candidate ref
fixed at 8a603e5. Rollback is backup/testnet-before-open-reactor-20261021 at a210180
and previous READY deployment dpl_FNcYt4WQLGefzmbrEhp7Qow6bS5C. Subsequent evidence
commits belong only on codex/open-reactor-release-record-20261021, whose automatic
deployment is disabled. No new server runtime-log scan was completed; do not
represent the release as having zero runtime errors. Native iPhone/process/GPU
memory, heat, presented FPS and Whitescreen resolution remain unverified.
