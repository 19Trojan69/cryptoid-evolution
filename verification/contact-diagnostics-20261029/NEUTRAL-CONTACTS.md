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

The first external run 40828824176 stopped before any browser case: npm rewrote
frontend/yarn.lock after checkout. The committed frontend tree (including that
lock) remains strictly pinned. The working-tree check now discloses only that
exact installation rewrite and rejects every other pinned-source change.
Release-order assertions also inspect the native first pointer-up primary flag;
the third contact must remain secondary while an earlier secondary stays held.

The second run 40829271482 passed WebKit but failed the new Chromium release-order
assertion before reaching the actual Boss 2 scene. The browser trace shows a
secondary pointer lifting where a primary lift was intended; play remained
active without a menu, JavaScript error or input fault. The driver had interpreted
a nonempty touchEnd array as remaining contacts, whereas this Chromium runner
releases the listed contact. The driver now explicitly names the contact to lift
and keeps the primary-flag assertions. The two earlier secondary-release steps
are corrected as well; their old receipts are not retroactively changed.


## Completed external run

Accepted run 40829668509 at verification commit
4d40b43301bb7f4ebb07e047c16f2f2c540056c8/tree
da8079038f5a14e8b194f3500896ca2dc1308a62 passes both jobs. Runtime pins and
working-tree checks pass; only the disclosed npm rewrite of frontend/yarn.lock
is present in CI. Each engine passes 77 relevant cases, 24 isolation cases,
TypeScript and changed-module lint. Chromium 151 passes the existing 18 input
boundary checks plus all nine new native contact scenarios. WebKit 26.5 passes
its 11 existing boundary checks; native multitouch is not claimed there.

Both the Chromium input boundary and the original isolated Boss 2 scene pass
all nine scenarios and twelve repeated cycles each, followed by a fresh native
single tap and explicit Return. The actual traces confirm a primary initial
pointer, the intended primary/secondary release orders and trusted events. No
unexpected menu, input fault or technical pause occurs. The boss scene then
continues for 30.264 active seconds and recovers the full report after reload:
520071 bytes, 325 contiguous records and 143 contact records, including native
cancellation and declared burst suppression. No unexpected external request or
raw contact field occurs. Both artifact ZIPs are downloaded and their SHA256
and ZIP integrity match GitHub's digests; exact IDs/hashes are in the JSON receipt.

Across the short repeated boss-input sequence, frames advance from 26587.8 to
27404.4 ms. The sampled GameAudio buffers remain at 46 / 6925568 decoded bytes,
with audio running. These scalars do not include every audio context or native
RAM, and establish neither long-run memory behavior nor absence of a leak.

No White Screen was reproduced in these software conditions. Physical iPhone /
Pi Browser, palm rejection, screenshots and native termination remain unmeasured.
No runtime fix, new hosted deployment, public main merge or PR200 change is
claimed. Continue to use the same protected hde4nlh2r Preview for device evidence;
the old deployment receipt and the two excluded attempts remain separate.
