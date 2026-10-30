# Protected brief reports — 2026-10-30

Purpose: make the next device report attributable and useful with the additional full recorder disabled. This is diagnostic instrumentation, not a White Screen repair.

Base: `3b5a2b8b3ad1e97970a0df71a3525a978d93c27d` (evidence successor of the tested SVG-off/CSS-off runtime `e9f1f9694c50ff356a094440970349e52ee220b1`). The entire frontend, backend, API, assets and private-preview trees remain unchanged. Only the isolated guest menu, its external stopwatch observer, the new brief collector, verification and preview build configuration change. The prior device branches and immutable preview URLs remain untouched. Git autodeployment remains disabled, and the builder rejects production.

## Current evidence

- Owner: original CSS-off control stopped at displayed 02:58 in Pi Browser and 03:23 in Safari, with White Screen and automatic diagnostic-menu return.
- Owner: SVG-off plus CSS-off control reached displayed 06:30 before two close knuckle contacts were followed by White Screen and automatic menu return. This is correlation, not proof of touch causation.
- Owner's conditional identification of the latest uploaded report: displayed 05:33, Pi Browser, spontaneous White Screen and automatic menu return. The old limited JSON contains no stopwatch value; do not derive 05:33 from wall timestamps. This is separate from the 06:30 contact sequence.
- Latest old report records the new document at 2026-10-29 22:09:41.476 +01:00 after an active fight marker. It does not measure a native termination cause.
- Uploaded `JetsamEvent-2026-10-29-162728.ips` (SHA-256 `cd2cc9bb7536c610c5c6c0f665b37c024109dc2c6dcb5f2d26a7b81762a5f112`) is a single 16:27:28 +01:00 event. Its sole process carrying `reason` is `shazamd`, with `per-process-limit`. PiBrowser and WebKit entries do not carry termination reasons. It does not explain the later test return and does not prove a game memory leak. Raw owner reports are not committed.

The previous request to repeat the unsuccessful iPhone-log search did not provide matching evidence. Do not ask the owner to continue that search without new cause.

## Changes

The preview's full recorder is now explicitly optional and initially off. A disclosed brief observer remains active. It uses the existing stopwatch sample, adds no timer or frame loop, and stores at most two runs with 32 allowlisted events each in one additional localStorage value capped at 16,384 characters. Ordinary writes are throttled to one per second. Mode changes and bounded critical lifecycle/cancellation/error signals may flush sooner. IDs of live contacts are held only in a set of at most ten entries and are never exported. Coordinates, pressure, URLs, event messages, error stacks, account information and authentication are not collected.

The brief snapshot carries the same run ID and source as the actual stopwatch, the run's recorder/protection/scene options, its document start and recent coarse contact/state signals. It does not alter input ownership, prevent default actions, navigate, suppress errors, pause/resume, advance simulation or change audio. A new document preserves the saved run until a new run actually starts.

Report version 2 includes `reportId`, `preparedAt`, the saved stopwatch (including previous run), the brief snapshot, explicit ID matching, selected full-session ID and the previous return evidence. A saved full report is kept distinct: no unsupported link between its ID and the latest stopwatch is asserted. Preparing again creates a different export ID. Download and native-share paths use the same unique filename and exact prepared bytes. A one-part or multipart text fallback remains available; actual Pi Browser/OS save-picker support is not guaranteed by desktop automation.

The SVG drawing control and all-CSS-filter control remain active. They have not fully prevented the owner's White Screen. No other graphics simplification is included.

## Validation

Run `node --test verification/boss2-brief-report-20261030/briefState.test.mjs` for active-time pairing, pause/previous-run preservation, lost unwritten tails, bounded event/write budgets, critical cancellation, storage denial, allowlisted restoration, unique identities and share bytes.

The branch-scoped workflow `.github/workflows/cryptoid-brief-report.yml` checks exact whole-source subtree pins and original instrumented-controller types, builds the isolated preview, and tests in native-touch Chromium and Linux WebKit. It checks 20 seconds of active play with full recording off; synthetic non-primary contact events (explicitly marked untrusted); actual pause/resume; deliberate active reload; report/run/source pairing; different prepare IDs; downloaded bytes; a stubbed share API's filename/bytes; normal Home termination; and previous-run preservation. Screenshots and synthetic reports are temporary workflow artifacts. This is neither a physical smartphone test nor a reproduction of a native browser termination. A deliberate reload must never be presented as a physical crash.

## Limitations

Accepted source and protected deployment are recorded in `results.json`; `evidence/synthetic-browser-results.json` preserves the two successful engine records. `node verification/boss2-brief-report-20261030/verifyEvidence.mjs` checks those records and the hosted screenshot. Evidence-only commits after the source pin are not the tested runtime. The screenshot's 00:44 belongs to the assistant's normal desktop test, not an owner's phone crash.

No JavaScript observer can guarantee a final write after a native termination. Exported time remains the last saved active-time checkpoint, not a guaranteed crash second. Contacts are observed events, not direct measurement of a knuckle or intent. Rate limiting and hard exits can omit events. A missing error or pagehide event does not prove an OS/GPU/memory cause. The extra small local checkpoint is a new test condition and may affect timing; preserve exact source/build identity when comparing owner runs. No cause is confirmed and no public release is authorized by this change.
