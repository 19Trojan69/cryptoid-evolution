# Device interruption, server correlation and original-game controls

The new device report is useful. Its 3,249 retained records form 666 contiguous
chunks. The last normal transition is internal53→54, visible Level6 Block3→4.
The independent tail reaches image job307 (sprite9, stage1, paint4), after three
earlier image jobs report ready. There is no retained settled-plan or first-spawn
receipt for54. A new document starts at Home1,825ms after the final observation,
without a retained chosen exit, JS fault or loop-stall. This proves an
interruption boundary, not a native-memory cause or a particular broken image.
See device-summary.json; the raw uploaded report is deliberately excluded.

Authorized Vercel Dashboard access supplies an independent boundary. Both the
Testnet proxy and its established upstream answered the device's unmatched final
reward request84 with200. The Testnet request starts09:46:32.678Z and takes about
4.5seconds; the upstream access log completes at09:46:37Z. The new device document
starts09:46:36.416Z. A successful server response can therefore be absent from
the terminated document's retained history. Do not reinterpret its absence as a
server rejection. The earlier400 at09:41:07.857Z is independently confirmed at
both projects and matches invalid_save. Neither log records its validation
subreason. See server-correlation.json. Connector403 persists; Dashboard access
does not repair the connector grant. No credentials or access settings changed.

The Testnet intentionally forwards established account/reward routes to the
existing API service with its Testnet network header. The upstream hostname
does not mean this request wrote to Mainnet account data. No live request,
player record, wallet, purchase or deployment is modified by these controls.

The matched final native WPE controls use239 pinned original modules, original
HUD, ships, backgrounds, input, sound, animation and simulation. Authentication
restoration, profile, run start and saves use synthetic local SDK/API responses.
Owner and ordinary-account cases both complete53→54, receive the exact12/12
settled hull plan and create enemies in54, retaining one document and run.
The exact sprite9/paint4 variant also loads locally. These are30–34second flow
controls, not sustained campaign or physical-device acceptance.

A separate full original-game owner/account control completes780.349 real
seconds with the same document/run,78 synthetic combat-checkpoint responses and
original audio. It stays in the original fourth boss encounter, finishing with
five of six legal armor lives and one live turret. Its bounded original clock
advances approximately438.5simulation seconds; do not equate real uptime with
simulation time. Local total process PSS ranges905.9–1130.7MiB, ending1043.5MiB.
This measurement is neither iPhone memory nor an accepted decoder/native-memory
budget. It adds a longer full-scene account control to the separate fixed-actor
780second test, without establishing a universal crash deadline or a cure.

Raw local receipts, commands/logs and exact verifier versions are retained in
raw-controls.tar.xz, with member hashes in archive-manifest.json. Preliminary
host mistakes, normal deaths and false target-gate failures remain listed in
controls-summary.json. In particular, do not erase the earlier original-account
startup loop-stall preserved in ../login-cache-followup-20261026/README.md.

Reproduce the final controls from the repository root:

```
CRYPTOID_TEST_ENGINE=webkit CRYPTOID_ACCOUNT_TIME_MODE=owner CRYPTOID_ACCOUNT_TIME_SCENARIO=transition CRYPTOID_ACCOUNT_TIME_SECONDS=120 CRYPTOID_NATIVE_OUTPUT_TAG=unique-owner node rebuild/verify-account-time.mjs
CRYPTOID_TEST_ENGINE=webkit CRYPTOID_ACCOUNT_TIME_MODE=account CRYPTOID_ACCOUNT_TIME_SCENARIO=transition CRYPTOID_ACCOUNT_TIME_SECONDS=120 CRYPTOID_NATIVE_OUTPUT_TAG=unique-account node rebuild/verify-account-time.mjs
CRYPTOID_TEST_ENGINE=webkit CRYPTOID_ACCOUNT_TIME_MODE=owner CRYPTOID_ACCOUNT_TIME_SCENARIO=boss-time CRYPTOID_ACCOUNT_TIME_SECONDS=780 CRYPTOID_NATIVE_OUTPUT_TAG=unique-timed node rebuild/verify-account-time.mjs
```

These fixtures require the existing local original assets, native browser and
font bundle. Sandboxed Chromium remains blocked by the root-only environment;
no disabled-sandbox substitute counts as a pass. Runtime, safeguards, save and
reward validation, rendering quality, release references and deployment remain
unchanged by this diagnostic checkpoint.
