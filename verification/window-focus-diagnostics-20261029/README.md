# Window-only focus evidence

This isolated diagnostic correction starts from aba962553769e8ed7195f82f9295cf068d6effe0.
The current protected hde4nlh2r deployment and PR 200 remain separate. No new
deployment or public release is performed by this verification branch.

The additional contact observer uses Window capture so it can see contacts
before React's root capture/audio callback. That also receives descendant blur
events. It previously classified an element blur as a window interruption and
cleared its transient pointer count. This is an evidence bug, not a change to
the game's real focus-pause handler, and does not establish a White Screen cause.
A pause row with reason blur plus visibility-hidden is independently recorded
by the actual controller and is not explained away by this diagnostic defect.

The only production-source change is one exact target filter: a blur event is
recorded/reset only when its target is the Window. Genuine window blur, hidden,
pagehide, contact cancellation and all original pause/Resume behavior remain.
No listener, timer, RAF, request, raw input field or collection capability is added.
The complete frontend inventory is checked after restoring exactly this hunk
and its test blob to their reviewed values. API, private-preview and builder
Git objects are also pinned; controller, input rules, audio and gameplay cannot
change silently. The known npm-generated Yarn-lock rewrite is disclosed separately.

A new counterexample fails on the old observer (two element-focus events are
incorrectly emitted) and passes after the filter. It also verifies that a held
first contact survives element focus changes, while a real window-target blur
is recorded and clears counts. Existing denial/cleanup/bounds/export cases stay.

Browser verification causes actual element focus/blur events between two
controls and verifies their targets and trusted flags. Both engines must keep
playing and avoid a diagnostic window-blur row. Chromium additionally holds a
native first touch across the focus change, adds a second touch and requires
the correct two-pointer count. The actual isolated Boss 2 report must retain
that count after reload and contain no false window-blur row in this interval.
The nine earlier neutral-contact scenarios and twelve repeated cycles are kept.

These tests do not establish physical Pi Browser/palm/screenshot acceptance,
measure native RAM/GPU state, or turn a playing status into proof of visible
nonwhite pixels. An incomplete final frame observation is not by itself a
crash location. Raw owner reports and identifying session metadata stay private.


## Completed verification

The old observer fails the new counterexample with three rows instead of one.
After the one-hunk correction all 56 local contact/input cases, TypeScript and
changed-module ESLint pass. Actions run 40848947984 succeeds at source dc2d7b7
(tree 4335db4). Both jobs pass 78 relevant cases, 24 isolation cases, TypeScript,
changed-module lint and the exact frontend-inventory/diagnostic-hunk scope guard.
Only the known npm-generated frontend/yarn.lock worktree rewrite is disclosed.

Chromium 151 and WebKit 26.5 each produce a trusted element blur, keep the scene
playing and record no false window-blur diagnostic. Chromium also keeps the
first native touch tracked while a second starts. Its 18 original boundary checks,
nine neutral-contact cases and twelve repeated cycles remain successful. WebKit
passes its 11 original boundary checks; no native two-touch/full-game claim there.

The actual isolated Chromium Boss 2 scene passes the same focus/contact case and
the original controls, nine neutral scenarios and twelve repeated cycles. Its
recovered report has 516182 bytes, 328 contiguous records and 144 contact rows.
The focus interval retains the native two-pointer count and contains no false
window-blur row. Native cancellation and declared burst suppression are retained;
raw input fields and unexpected external requests remain absent. Exact duration,
job/artifact IDs, SHA256 values and ZIP-integrity checks are in results.json.
Both artifact ZIPs were downloaded and compared with GitHub's digests.

This is a prepared diagnostic correction on its own auto-deploy-disabled branch.
No new deployment was performed, and the existing hde4nlh2r source 68c33d1 remains
available. Neither PR 200 nor the public main/Testnet/Mainnet runtime is changed.
This corrects evidence quality and establishes no physical White Screen cause.
