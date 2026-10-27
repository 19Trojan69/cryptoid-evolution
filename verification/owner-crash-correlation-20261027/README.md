# Owner report correlation acceptance

Base: main97d74b412f7dc7ea2f4f8c05f483d87eb3451dba, tree851296db95402d5f53fdebc0c2f71a92e55b10aa.
Only crashRecoveryBoundary.mjs changes application behavior, inside the existing
verified owner export. GamePage, collectors, art/styles/audio, backend, API, stock,
prices, account/network/payment separation and save/clock/pause behavior are unchanged.

The first run of the augmented nine-case correlation test against the unchanged
published helper fails the two positive3ms-link cases and passes seven others.
After the correction, all nine pass. Negative controls reject a missing start,
wrong source, late start, >5ms discrepancy, intervening/ambiguous document, absent
run/source metadata, other-tab/origin copies and closed runs. Actual final
departures and restored earlier visibility remain distinct.

An additional existing whiteScreenReport.test.mjs case drives the actual verified
export through recorded flight frames, the real session-store API and an isolated
fake-indexeddb database. It verifies the linked Home, explicit3ms offset, original
tail identity, complete unchanged committed history and no fabricated native cause.
This is an integration fixture, not a native browser or physical-device test.

Validation completed:

- Full frontend release build:460 passing cases, localization gate, TypeScript and
  Vite. The only subsequent test addition is the export integration case above;
  the final focused White Screen suite is47/47. Runtime source is unchanged after
  the successful build. Existing large-chunk/Node package-type advisories remain.
- Changed application modules pass the existing frontend ESLint configuration.
  The initial invocation from repository root found no config and is excluded;
  the corrected frontend-directory invocation passes. No whole-project lint claim.
- Independent examination of the existing private input confirms contiguous
  history, matched successful requests, empty final queue and the observed
  replacement. No raw owner data or private request identifiers are retained here.
- The correction applied to that unchanged private input produces the linked
  replacement/Home instead of replacement-not-observed, with both cause flags false.

Native browser verification did not run. Chromium is installed, but its launch
failed before fixture startup because local socket creation returned Operation
not permitted. results/native.json is complete:false with zero checks/cases; it
is blocked evidence and must never count as passing. No escalation or browser
security workaround was attempted. The harness reuses the original owner export
fixture and pins only the old correlation helper for its control. Its optional
browser captures are explicitly not OS screenshots or actual gameplay acceptance.

Reproduction commands, from repository root unless specified:

```
cd frontend
npm run test:white-screen
node_modules/.bin/eslint src/pages/crashRecoveryBoundary.mjs src/pages/crashRecoveryBoundary.test.mjs
cd ..
npm run build --prefix frontend
node verification/owner-crash-correlation-20261027/verify-native.mjs
```

The last command requires a compatible local browser and permitted socket
creation. Do not rerun it under the same denied runtime or describe it as a Pi
Browser/iOS screenshot test. Keep the new native harness, diagnostics, private
input and deployment claims separate. The user's simultaneous screenshot remains
a reported possible trigger; historical White Screen cause/fix remains unproved.
Candidate codex/owner-crash-correlation-20261027 disables auto-deployment and is
prepared for review without a main merge or public release. Previous accepted
feature checks are retained instead of running their native campaigns again.
