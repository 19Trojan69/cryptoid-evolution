# Protected contact evidence, 29 October 2026

This separate diagnostic Preview continues the accepted one-finger Preview
(a50b68e0d5739eab3bf844460c728a877e300a8a). It does not change PR200 or release
new code to main or either public application.

The physical owner report did not record secondary contacts. The owner described
possible two contact points from a little finger after releasing the steering
finger. This remains an account of the action, not a recorded cause or measured
finger count. The previous recording does not establish a RAM leak or native
process/GPU termination.

Window capture observes down/up/cancel, capture loss, touch start/end/cancel,
Safari gesture start/end, context-menu/control click and lifecycle reset before
React root capture (including its existing audio callback) and the input guard.
It never changes propagation, default handling, steering, control-tap policy,
audio, pause reasons, watchdog thresholds, clocks, or Resume.

Only an active existing diagnostic subscriber permits event input reads. The
observer is bound to the game field lifecycle, is passive, has no motion-event
listener, and adds no timer, RAF, request, DOM mutation or transmission. Fourteen
listeners are released on disposal. Up to ten pointer IDs are transiently held
for deduplication; no IDs, coordinates, pressure, contact geometry, DOM text,
URLs, tokens or account data are emitted. Sanitizers whitelist the new schema
for full-session IndexedDB export and the existing synchronous crash tail.

Each contact row is a pre-handler observation. trackedPointers counts tracked
Pointer Event IDs, not proven physical fingers. reportedTouches appears only
on a real TouchEvent and is the browser-reported document touch total, capped
at ten. It is not copied to subsequent pointer/gesture rows. target is a closed
coarse category. primaryFlag is the browser flag, not acceptance by steering.
steeringActive and playing are sampled before the game handler. Capture loss
alone does not remove a pointer; up/cancel or reported zero touches do. Blur,
pagehide and hidden record the previous state, then clear the transient counts.

There are at most sixteen ordinary and eight cancellation/gesture/lifecycle
observations per one-second window. Transient state still updates when records
are suppressed; the next recorded row declares the bounded suppressed count.
truncated identifies counts affected by the ten-pointer cap. The existing
128-event crash tail may lose older contact events in a burst; its independent
frame ring and contiguous full report remain separate evidence. Synchronous
local storage writes and the added event listeners are measurement overhead.

The OS may swallow contacts before JavaScript or terminate before a final write.
No native RAM/GPU cause or natural White Screen is measured by these additions.
Physical iPhone/Pi Browser acceptance and the older full-game WebKit cold-start
stall remain open. Native browser checks of the small input boundary do not
establish full-combat WebKit acceptance.

Validation and protected deployment receipts are recorded in results.json.
No raw owner attachment or physical-session content is committed here.
