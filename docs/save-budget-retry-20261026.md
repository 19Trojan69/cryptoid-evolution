# Recover a temporarily rejected reward without changing server validation

The original save queue stops immediately on every4xx. The established server
also returns400 invalid_save when a structurally valid score is ahead of its
wall-clock budget. An identical queued reward can therefore succeed seconds
later, while the original queue waits for a later enqueue or manual recovery.

The device report contains such a recovered400. Independent Vercel logs confirm
the response at both Testnet proxy and established upstream. They do not expose
the validation subreason, so attributing this particular400 to the time budget
remains an inference. The final request before the later device restart was
answered200, independently of the earlier error. This patch does not establish
the cause of that document replacement or fix the historical White Screen.

Only the queue's /rewards/event path opts into retrying the exact400
invalid_save response. It waits5seconds after the first rejection and10seconds
after the second. The existing three-attempt total remains. The body, pending
entry, ordering barriers and durable outbox remain unchanged until confirmed
success. Other4xx, other endpoints and an explicitly permanent reason fail
immediately. Existing network/5xx backoff stays600ms/1200ms. A final failure
retains the backup and the existing unconfirmed-save notice.

The old server cannot distinguish structural and temporary rejection in its
response. A permanently invalid unclassified reward can receive two additional
requests; its data still fails the same server checks and remains recoverable
in the outbox. This bounded compatibility behavior adds at most15seconds of
waiting, plus request time. It does not guarantee acceptance of every invalid
save or alter score rates, rewards, lives, inventory, account authority or
idempotent server writes. No backend deployment is necessary for this client
recovery correction.

Validation uses the actual queue and actual backend reward handler with an
in-memory synthetic user collection, original snapshot validator and original
scoring helpers. Twelve legal bonus hits plus the original perfect bonus yield
4800points. The unchanged server rejects that valid snapshot at56seconds of
run age and accepts the same bytes at61seconds. The original304812a queue fails
the recovery assertion. The candidate succeeds and credits the reward exactly
once, including a repeated event. Other tests cover permanent refusal, auth and
run conflicts, unchanged network retry limits, immutable waiting rewards and
checkpoint coalescing behind the reward barrier.

All244 frontend release-gate tests pass, together with localization release
checks and project TypeScript. Vite completes after restoring legal Markdown
inputs omitted from the isolated checkout. Original1740 painted hulls retain
revision91a72bc0c36be9407915 and95,450,326bytes. Changed runtime-module lint passes.
The exact scope fingerprint for accountSave is updated; a new negative control
still rejects an expanded retry limit. No other scope fingerprint changes.

The final native WPE control uses238 pinned original runtime modules plus the
single pinned accountSave override. Real original HUD, graphics, input, audio,
simulation, guard and account/save queue run with local synthetic SDK/API
responses. At internal53→54, a deliberately injected first400 is followed by
200 with the same request-body hash,6516ms between responses including local
latency. The outbox empties, all12 target hulls settle and one document/run
remains. After explicit Pause, the original pause checkpoint also completes
and the outbox empties again. The first verifier attempt incorrectly tested
the outbox immediately after Pause had enqueued this new checkpoint; that host
failure and its exact script are retained. It is not a game failure or pass.

Receipts, original failing control, native screenshots and build/host issues
are archived under evidence/save-budget-retry-20261026/. Their manifests exclude
the raw user report, IP addresses, real tokens and save/payment payloads.
The separate780second original-game account control and server correlation
are retained in the separate investigation at commit56b1400,
rebuild/evidence/transition54-20261026/ in PR167.

Run the focused contracts with npm run test:account-save in frontend. Run the
native fixture from the repository root with:

```
CRYPTOID_TEST_ENGINE=webkit CRYPTOID_ACCOUNT_TIME_MODE=account CRYPTOID_ACCOUNT_TIME_SECONDS=120 CRYPTOID_NATIVE_OUTPUT_TAG=unique-save-retry node verification/save-retry/verify-native.mjs
```

Existing local native-browser/font assets are required. Chromium's sandboxed
launch remains unavailable in this environment. These controls are not actual
Pi authentication, a physical-device campaign or native-memory acceptance.
The standalone verification path also passes on the isolated release checkout.
The branch is prepared for review with automatic deployment disabled; no
Testnet/Mainnet runtime, alias, fixed release reference or live data changes.
