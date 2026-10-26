# Retired Pi sign-in callbacks — isolated correction, 26 October 2026

## Finding

The original published useAuth from 0ec94cf can continue authentication after its
route has unmounted. Actual-source counterexamples and native WPE reproduce:

1. A delayed Pi.authenticate reply submits a new /user/signin request and replaces
   the current route's token even though its original route has been left.
2. A failed, already submitted sign-in request removes a newer route's token.
3. A successful old sign-in request clears a newer route's admin-preview flag and
   updates global owner/session state.
4. Delayed external-browser host detection can continue a retired manual attempt:
   the actual-hook production-origin control redirects to the existing OAuth
   origin; the localhost-native control calls the original Pi.signIn bridge.

This is a client lifecycle defect. It is not proof of the cause of the historical
in-play White Screen. The latest supplied device report was captured on older
20843b5, ends at the normal 53 -> 54 transition, and records no JavaScript fault.
It is not a run of the newly published mobile-cockpit release. The previously
correlated invalid_save recovery and final server 200 do not explain the later
document replacement; see save-budget-retry-20261026.md. The original private
input is not included in this repository.

## Change

Only frontend/src/hooks/useAuth.ts changes application runtime. Each mounted hook
owns a lifecycle generation. Cleanup retires that generation; an async sign-in
continuation must still belong to the current generation before proceeding with
host detection, SDK readiness, the SDK result, session mutation, an OAuth action,
or final loading/error state. A retired API error cannot remove newer credentials.
React's setup/cleanup/setup replay does not revive the preceding generation.

Normal authentication keeps its existing SDK permission list, API body, token
write order, 60-second timeout, errors and manual retry. Current successful
sign-in still replays incomplete payments. No authentication/protection settings,
API permissions, backend validation, account/network separation, payment metadata,
gameplay/HUD/art/audio, saves/retries, focus/background pause, strict >2500ms/500ms
watchdog or Resume behavior change. No new timer, polling loop or global observer
is added. This does not abort or undo a sign-in request already sent to the server;
it prevents that retired request from changing the current client state.

## Validation

The prior auth test host lacked the newer ownerLifecycle import and was not part
of the build gate. The host now maps that optional observer with isolated data.
With actual published source, the first seven-case run passes the four established
controls and fails all three new session-preservation assertions. Those failures
are retained. The pinned published-source fixture has SHA-256
`e07c190f2bc21d2bfb5bcfb0e4338aeb5923fb9f9af24e27408151c77fffebf8`.

The final auth suite passes 11 tests, including the original stalled-SDK, timeout/
late-response/manual retry, SDK rejection and existing-session restore controls;
retired SDK/API/host callbacks; StrictMode replay; unchanged permissions and
incomplete-payment replay; and the four released-source negative controls.
It now gates every ordinary frontend build. Full normal prebuild/build passes
262 tests, localization checks, project TypeScript and Vite. Changed hook/test
ESLint has zero errors and zero warnings. GamePage is byte-identical to 0ec94cf;
its known 62 errors/four warnings are neither rerun nor claimed fixed. Backend
source is unchanged, so the previously passing 126 cases were not needlessly
repeated for this client-only correction.

The independent native runner compiles actual React/useAuth and runs WPE/WebKit
26.5 with local SDK/API fixtures and React StrictMode. All ten cases pass: five
published-source counterexamples/healthy controls and five corrected controls.
The released hook overwrites/deletes the replacement token, clears the replacement
admin flag, and invokes the obsolete external sign-in bridge. The candidate
preserves current token/admin/route, sends no late SDK-triggered sign-in request,
and starts no obsolete OAuth action. Both versions still perform one healthy
sign-in with the same scopes and incomplete-payment replay. No uncaught page
errors or request to a real service occurs. These are route-retirement controls,
not a simulated complete mission or physical Pi Browser certification.

An initial native-host attempt expected the production-origin redirect while
serving localhost; the published hook intentionally excludes localhost from that
redirect and instead uses Pi.signIn. The failed host result/log are retained as
excluded. The corrected localhost control observes that real SDK action; the
separate unit control retains the real production-origin navigation assertion.
No application guard or expected healthy behavior was weakened for the host.

## Status

Prepared on the auto-deploy-disabled codex/white-screen-runtime-audit-20261026
branch, based on exact public runtime 0ec94cf. No new deployment, main update,
live Pi authentication, player mutation, purchase, database migration or owner
manual test campaign. Both public projects and the d0a0b81 rollback remain fixed.
The historical White Screen and native-memory cause remain open.

Evidence: docs/auth-lifecycle-20261026/ and
verification/auth-lifecycle/results/native.json. The raw private device report,
real credentials and identifiers are excluded.
