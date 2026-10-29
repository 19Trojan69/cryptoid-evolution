# Window-only focus evidence

This isolated diagnostic correction starts from aba962553769e8ed7195f82f9295cf068d6effe0.
The current protected hde4nlh2r deployment and PR200 remain separate. No new
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
the correct two-pointer count. The actual isolated Boss2 report must retain
that count after reload and contain no false window-blur row in this interval.
The nine earlier neutral-contact scenarios and twelve repeated cycles are kept.

These tests do not establish physical Pi Browser/palm/screenshot acceptance,
measure native RAM/GPU state, or turn a playing status into proof of visible
nonwhite pixels. An incomplete final frame observation is not by itself a
crash location. Raw owner reports and identifying session metadata stay private.
