# Remaining shooting slowdown and pre-second-boss Whitescreen

User report, 18 October 2026: shooting intermittently slows; enemy movement
appears unchanged. Complete white screen in the last ordinary round before the
second boss (campaign level 2, block 9, sector 19). The public Testnet source is
b71d368d5bdd6735225771a101cbba8beefebed7. This follow-up starts from its
code plus the release evidence at 487a60902c7058d923df5cccc9c4b54c5a179349.

## Confirmed defect and correction

A warm CanvasImpact first registered its already prepared resources, then the
resolved preparation Promise replaced them with a fresh equivalent object.
React consequently cleaned up and re-registered the same effect. With a single
active effect this shrank its backing store to 1x1 and expanded it immediately.
The actual-component allocation host fails on the deployed source: six
width/height assignments instead of two. The corrected component preserves
resource identity and passes with two assignments. Animation geometry and
starting time are unchanged.

Resource metadata now includes DPR and cache generation, so released texture
canvases cannot be reused as current assets. A missing 2D context, contextlost
notification or drawing failure releases the optional Canvas layer and uses the
existing original DOM display. Resize notifications cannot re-enable the failed
surface during that mounted game. Failed texture preparations release temporary
canvases and are removed from the pending cache, allowing a later attempt.

No changes to drawImpact, source artwork, effects, fragments, trajectories,
resolution, audio, balance, game timing, input, saves or accounts. Mainnet and the
public Testnet deployment were not updated by this investigation.

## Verification

- verifyCanvasLifecycle.mjs: actual component with hook/allocation host;
  deployed source fails the warm-registration regression (6 versus 2 writes),
  corrected source passes; 2,000 sequential warm impacts keep one decoded hull
  and two textures; contextlost and null-context fallback release registrations,
  scheduler and caches; resize cannot revive released textures.
- verifyCanvasEffects.mjs: eight resource scenarios pass, including 24 changing
  hulls, pinned resources, stale work cancellation, cleanup and transient SVG
  decode failure followed by successful retry.
- 44 targeted Node tests pass: original artwork/animation/bounds, loop recovery,
  bounded resource storage, sector/boss transitions, formations and ship realism.
- TypeScript project build passes.
- Actual GamePage Node simulation crosses 20 ordinary blocks and bosses 10/20,
  starting at block 1; no unexpected JS interruption, finite coordinates,
  scheduler/timer/listener cleanup all zero. See the companion JSON. Graphics,
  audio and APIs are stubbed; groups and bosses are forcibly cleared. This is
  simulation coverage, not a natural campaign or device-memory test.

## Still open

The complete pre-second-boss Whitescreen has NOT been reproduced or proved fixed.
The prior Pi v11 test began at sector 19; it did not include resources accumulated
through boss 10 and the preceding blocks. No exception export or device crash
record for this latest failure is available. Counter stability and a quiet Node
run do not establish WebKit/GPU process stability. The shipped game already has
bounded local session/interruption records, but these are not available to this
workspace from the user's phone.

The Git preview dpl_ApSBHNpTZ7kxDxAr7k4MAtXf5BWG built READY from
bb23a8b48bce4a19c707170458e3ed94e3e4cdfc. Ordinary Chrome guest smoke check:
normal start, original shooting/collisions (2 destroyed / 50 points), manual
pause, original 3-2-1 resume, normal game over and restart with three lives.
The four stylesheet hashes match the released game. The companion screenshot
shows the restarted original HUD, not evidence of long-run device stability.
Browser extension metadata errors and the pre-existing Router hydration warning
were visible; no renderer exception was observed in this short check.

User clarification at 15:59 Europe/Vienna: the screen was initially white;
by then the start screen was visible again. They did not observe whether it
reloaded automatically. Do not classify this as a definite persistent blank
screen, process crash, or automatic reload without a recorded event.

Keep this change on the review branch; do not replace the public game yet.
Do not describe the game as stable or the Whitescreen as resolved on the basis
of this resource correction.
