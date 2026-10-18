# Device restart during boss 3

18 October 2026, 17:24 Europe/Vienna: the user's copied local stability report
contains one unexpected-restart event from sector 30, block 10, ATTACK_CYCLE,
boss-fight, playing. The foreground-interrupted hint means the previous active
per-tab marker had neither hidden nor pageHidden set; it does not identify a
particular native process failure. The event timestamp 15:21:27.535Z is the
time the next game mount recorded the interruption, not an exact crash time.
No JavaScript exception was recorded. Last saved context reports three total
player/enemy projectiles and zero effects. Boss guns/core emit into enemyShots,
so boss projectiles are included. The enemies count excludes the boss itself.
The lastSession loading/sector-1 marker belongs to the subsequent game mount.

This establishes a foreground interruption during boss 3; it does not establish
memory pressure, a graphics-process failure, or an ordinary JavaScript error.

## Focused checks

The existing allocation-only boss weapon check was exercised for 2,000 frames
each for bosses 1, 2 and 3 with changing damage heat. Active weapon surface counts
peaked at 4, 5 and 5 respectively. Explicit dispose returned tracked backing
store bytes to zero after each boss. This is not real browser allocation proof.

verifyBossThreeSimulation.cjs adapts the existing isolated campaign host for the
current GamePage. It crosses 30 ordinary blocks and bosses 10/20/30 at 430x825,
holding each boss fight for 180,000 simulated milliseconds. It checks finite
positions, one simulation scheduler, stress-object expiry, pause/background
timers, interruption/checkpoint preservation, and timer/listener/RAF cleanup.
Presentation, audio hardware and account APIs are stubbed; ordinary groups and
boss defeat are forced and extra lives are used. See the companion summary.
The check passes, including zero RAF/timers/listeners at cleanup. It cannot
reproduce or exclude iPhone WebKit/GPU termination or establish a stable game.

Reproduce:

    CRYPTOID_WIDTH=430 CRYPTOID_HEIGHT=825 CRYPTOID_SIMULATION_BLOCKS=30 \
    CRYPTOID_SUSTAIN_MS=180000 node --expose-gc frontend/scripts/verifyBossThreeSimulation.cjs

No game behavior, appearance, audio or public deployment is changed by this work.
The next useful independent evidence is a matching native iPhone report around
17:18–17:22 local time: JetsamEvent for memory-pressure termination, or a crash
report naming the Pi Browser/WebKit process. Its actual contents must be checked;
the filename alone is not a diagnosis. No new automatic report transmission.
