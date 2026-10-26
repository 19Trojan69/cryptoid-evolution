# Local resource reuse acceptance

Pinned source control: bd23bd4babe0a2a14ee7d8ac1ad7f749d843abd5.
Raw session exports, account data and physical-device logs are not fixtures.

From the repository root, with the existing frontend/backend dependencies and
native WPE/WebKit bundle installed:

```sh
npm --ignore-scripts --prefix frontend run build
python verification/continue-hull-prefetch/verify-lint.py
BASELINE=1 node verification/continue-hull-prefetch/verify-native.mjs
node verification/continue-hull-prefetch/verify-native.mjs
node verification/continue-hull-prefetch/verify-flow.mjs
```

Run the pinned native control before the candidate: the candidate compares the
actual output dimensions/pixels to its recorded control. The only loader
instrumentation counts Image/center-surface starts and observes plan completion;
it does not replace image pixels, readiness or retention. The preview uses the
actual hook, hull components and artwork loaders. Vite optimizer directories are
isolated from other worktrees. Native scripts may write local PNG/cache/registry
files which are not part of the source release.

Final native results: 13 published control checks, 15 candidate resource checks,
34 actual-game flow checks. Native WPE/WebKit 26.5, local controlled clocks and
isolated SDK/API/handler data. No physical Pi/iPhone campaign or historical
White Screen fix is claimed. See docs/continue-hull-prefetch-20261026 for the
wider audit, constraints and known historical test exclusions.
