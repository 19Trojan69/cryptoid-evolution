# Contacts without a previous steering finger

This continuation tests the owner's clarified action: possible two contact
points after the steering finger had already lifted. It does not assert that
two physical fingers, a wide little finger or a native OS failure were observed.

The application remains the deployed 68c33d15f6f591477508cc9e0497d6c8a4c100c0.
The runtime pin checks the entire frontend tree, API tree, private-preview tree
and build script against their immutable Git objects. Only verification files
and this evidence are extended; no new deployment is requested or performed.

Native Chromium cases run against both the small real-input/React boundary and
the actual isolated Boss 2 scene:

1. Two simultaneous field contacts, with no preceding contact.
2. Control contact first, then field; the primary contact lifts first.
3. Field contact first, then control; the secondary contact lifts first.
4. A held secondary contact plus a new third contact cannot re-arm a control.
5. A single contact with supplied wide radius crosses the weapons button.
6. A fast left crossing delivered as one motion event.
7. Native cancellation while steering.
8. Native cancellation of a pending control tap.
9. Native cancellation of simultaneous contacts.

Every case starts with previous contacts ended and checks that play remains
active without a menu or technical pause. The browser must deliver trusted
events; two-contact and cancellation cases also require the corresponding
TouchEvent and PointerEvent evidence. The last touch end/cancel must report
zero contacts. The small input boundary additionally inspects the actual input
owner ref after each case. A further twelve cycles alternate native cancellation
and release, followed by a deliberate single tap and explicit Return to play.

The final full report must retain cancellation alongside the previously tested
secondary-pointer/two-touch/control-click evidence after a controlled reload.
Raw coordinates, IDs, pressure and geometry remain excluded from its schema.
Frame/audio counters sampled around the repeated sequence are evidence of that
short software run, not native iPhone RAM or proof that no leak exists.

The temporary event listener and supplied contact radius belong only to the
automated verifier. They cannot reproduce physical palm rejection, iOS screenshot
handling or process termination. Native multitouch is Chromium-only here; the
existing WebKit input boundary checks remain distinct from full-game acceptance.

Completed results and any excluded attempts are recorded separately in
neutral-contact-results.json so the earlier deployment receipt stays intact.

The first external run40828824176 stopped before any browser case: npm rewrote
frontend/yarn.lock after checkout. The committed frontend tree (including that
lock) remains strictly pinned. The working-tree check now discloses only that
exact installation rewrite and rejects every other pinned-source change.
Release-order assertions also inspect the native first pointer-up primary flag;
the third contact must remain secondary while an earlier secondary stays held.
