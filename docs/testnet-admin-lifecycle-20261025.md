# Testnet integration: diagnosis only through Admin, 25 October 2026

The owner explicitly authorizes the official Testnet release and clarifies that
diagnosis must be accessible only in Admin. No main merge or Mainnet release.
This branch starts at the saved 9dfed31 Preview source; it does not start on main.

The normal install/build and real API entry are restored from ce1fb59d. Backend
and API are byte-identical to official 19de3e6. The guest auth alias, no-op SDK,
API fixture and standalone report are not packaged by the normal production
build. Old standalone report URLs redirect Home. No authentication protection,
Vercel project settings, secrets, account data or payment state is changed.

The bounded 48-event lifecycle recorder is integrated as private bundle modules,
without a report global. It is enabled only following a fresh server-confirmed
Testnet owner session. Signout, failed session verification or rejected report
verification disables further writes. No extra RAF/timer, transmission or auto
Resume; original native callback semantics retained. The strict >2500ms/500ms
game watchdog remains unchanged. The existing Admin technical report includes
new evidence only after fresh /admin/status authorization and active-view check;
copy/download use the existing authorization gates. This restricts application
access; it does not claim to encrypt browser-local technical storage against
someone controlling that same browser/device.

The Preview host viewport rule is adopted for the game shell only. Existing Play
already requests native fullscreen during the gesture, including tablet/PC.
Unsupported hosts cannot be forced into native fullscreen. HUD/art/audio/game
simulation, economy, saved-progress modules and real backend remain unchanged.
Inherited proven startup recovery, IDB transaction callback correction, empty
rock display bounds and resume-watchdog changes relative to official 19de3e6
are retained; see their original October 23–24 evidence. No renderer experiments.

## Evidence

Full frontend build: 175 tests, localization gate, TypeScript and Vite pass.
Backend compiles; 25 existing admin/gateway tests pass. An initial backend test
attempt before compilation is excluded and retained. Native launch and local
HTTP200 succeed with Chromium141 and WPE26.5 using all13 verified original fonts.
Chromium:7 startup cases and short Home/Play/Pause/Resume/Home pass.
Cold WPE: startup succeeds but the route fails with loop-stall at SECTOR_INTRO,
sector1/block1. Diagnostic state=read; actual pause pixels retained. No JS/HTTP
errors and no document replacement. No auto Resume/guard weakening. This is the
known still-open finding, not a White Screen reproduction or a successful route.
The first admin verifier incorrectly expected an empty textarea after403; the
real UI correctly omits it. That test-host failure is retained as excluded.

Admin browser cases use synthetic local authentication transport only. Actual
server denial/owner binding is independently exercised by the25 backend tests.
No live sign-in/payment/reward mutation or owner replay campaign is requested.
Physical iPhone long-term, full campaign and White Screen cause remain open.
Release target, exact source/tree and post-deploy checks will be recorded in a
separate receipt; this preparation document alone is not proof of deployment.

Native Admin integration: all6 browser cases pass in Chromium/WPE: owner reads
new local lifecycle evidence, non-owner sees no report and reads no evidence key,
and fresh server403 with a stale owner client state omits the report/disables
copy. No uncaught JS or unexpected external requests.
