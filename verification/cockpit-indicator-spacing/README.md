# Local acceptance

From the repository root with the existing build and native WPE dependencies:

```sh
npm --ignore-scripts --prefix frontend run build
npm --prefix backend test
python verification/cockpit-indicator-spacing/verify-lint.py
BASELINE=1 node verification/cockpit-indicator-spacing/verify-native.mjs
node verification/cockpit-indicator-spacing/verify-native.mjs
node verification/cockpit-indicator-spacing/verify-flow.mjs
```

Run the native source control before the candidate; boss geometry/bar sizes are
compared to that control. Each Vite optimizer directory is isolated. Generated
PNG/cache/registry files stay local. The actual-game harness uses isolated real
handlers, synthetic SDK/account/transport and controlled combat/clock setup.
No owner screenshots/reports or physical-device crash acceptance are included.
See docs/cockpit-indicator-spacing-20261026 for scope, preserved safeguards and
recorded early harness assumptions. Final JSON receipts contain actual counts.
