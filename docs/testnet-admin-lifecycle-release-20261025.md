# Testnet Admin lifecycle release status, 25 October 2026

Source d615e86f8f1e4bc02b98200d2ba8e3ef2e0ab895, exact tree
4ba6309b5c33d336d69e31b8b82fd29e360bb92a, is saved on the automatically
deployment-disabled branch codex/testnet-admin-lifecycle-20261025.
Manual protected Preview 6WxyFX79UNnuMB4RvDSuAWfDJpQR is READY after57 seconds:
https://cryptoid-evolution-testnet-px35egu7g-19-trojan69.vercel.app/

Real API rejects anonymous Pi Admin access. Home/Play render the original game.
The deployed /admin?view=diagnostics shows owner-only Pi login, no report. Old
standalone report redirects Home in the authorized Vercel browser. Anonymous
root/report requests retain Vercel Authentication. Local native Admin cases
exercise synthetic owner/non-owner/revoked sessions;25 actual backend gate tests
also pass. No live owner Pi login/report access/payment mutation is performed.

## Release blocked

Dashboard Promote to Production was configured for exactly this source and the
existing cryptoid-evolution-testnet project. Dialog explicitly names only the
existing cryptoid-evolution-testnet.vercel.app alias and a rebuild using that
project's Production environment. Automatic approval review rejected the final
click, interpreting Vercel Production on the official Testnet hostname as a
violation of the older no-Production scope. No workaround/retry or alternate
release path was attempted. The dialog was cancelled. Explicit clarification
for this Vercel Production/Testnet terminology is pending.

Official Testnet remains deployment AsXUruYAuKRboZWFymr2cD3FkLCJ, source19de3e6.
Root/API/Admin response fingerprints match before and after the rejection.
Mainnet, main, account/save/payment data, protection and automatic deployment
remain unchanged. The new source branch remains fixed; this separate receipt
branch also has deployment disabled in its first commit and must not be deployed.

175 frontend tests,25 backend access/gateway tests and6 native Admin integration
cases pass. Chromium startup7 and short flow pass. Cold WPE route retains its
failed loop-stall SECTOR_INTRO evidence and pixels. It is not passed or repaired;
White Screen cause, full campaign and physical iPhone long-term remain open.
