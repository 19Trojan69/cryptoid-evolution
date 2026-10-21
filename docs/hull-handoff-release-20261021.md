# Combined Testnet publication: prepared hull handoff

The owner requested publishing to Testnet with all outstanding uploads. Audit
found the handoff fix was the only outstanding runtime correction. The official
f85360ed base already includes static glow, reactor optimizations, hit/debris and
memory cleanup, and the Admin-only flight recorder. Historical small-turret work
was already published on 20 October. Rejected reflection/evidence-only branches
are not part of the release.

Fixed source: 4c25790a8b7173edda9f2ef9370f0251e716f668, tree
88063f617e2321705b19af0dfb3dcb22b6bce491. Existing project:
cryptoid-evolution-testnet (prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF).
Rollback: backup/testnet-before-hull-handoff-20261021 at f85360ed.

The hook acquires the next graphics preparation plan before releasing the old
one, avoiding conditional eviction and repainting of incoming hulls. Seven
actual React tests plus fourteen recorder and one cache test pass. Two native
painting controls and eleven lifetime cases pass; actual GamePage host covers
30 normal sections/three bosses and pause/save/recovery. Lint, typecheck and
release build/12 locale tests pass. See the preparation report for exact scope.

READY preview dpl_8oJLXhb1yqskWEbXAoFmoqsLfuji built in 43.932 seconds.
Browser guest start, pause, countdown and resumed gameplay pass. Production
builds the exact same source separately, not the identical preview binary.
Delivered-source and feature checks, API/score hashes and anonymous Admin
denial are recorded in hull-handoff-release-20261021/after.json. Deployment,
rollback and limits are recorded in release.json; public Home proof is saved.

No authenticated owner/Pi session or physical iPhone was tested here. The
handoff defect is demonstrated; its causal role in the iPhone interruption is
not established. GPU/native memory, temperature and OS termination causes
remain unmeasured. Runtime logs were not queried after the earlier permission
denial. No protection bypass or Mainnet change was performed. Receipt branch
codex/hull-handoff-release-record-20261021 is non-deployable evidence only.
