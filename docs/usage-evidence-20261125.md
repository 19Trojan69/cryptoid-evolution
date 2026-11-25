# Usage evidence and data limits — 25 November 2026

The owner statistics retain the existing anonymous hourly counters and 90-day expiry. The collection schema, client request fields and collection endpoint's separation from session/authentication middleware stay the same. No visitor ID, analytics cookie, fingerprint, Pi-account join or individual event history is added.

## Available evidence

- **Page openings:** client-reported document openings, once per document; a reload counts again. They are not sessions, unique people or confirmed players.
- **Estimated active seconds:** eligible visible activity submitted in bounded contributions. Hidden/admin/legal views, idle time beyond 60 seconds and throttled-away intervals are excluded.
- **Estimated unpaused game-view seconds:** the eligible active contribution when the game route is present and the game marks its view unpaused. It does not prove that a particular person played or completed a mission.
- **Browser shares:** sums by the existing broad browser category; these are technical client reports, not verified identities.
- **Unpaused share of active seconds:** estimated unpaused game-view seconds divided by estimated active seconds, only when the denominator is positive. This is a time ratio, not a completion, conversion, return or retention rate.

The query period is labelled as such; it does not claim continuous capture or the time when collection began. Connection failures, partial intervals, blocked requests and client manipulation limit all these counters. No deduplication of people can be performed using this collection.

`GET /admin/usage` adds an `evidence` object alongside the original rows. `uniquePlayers` and `retentionRate` have `available: false` and `value: null`, with fixed reasons describing the absent identifiers/return history. The view explains these limits. No historical individual usage is reconstructed. The new explanatory labels have entries for all 19 supported languages; the existing owner view continues to use its German admin locale.

## Proposals requiring a separate decision — not activated

A future unique-player or returning-player analysis would require a separately assessed data source, purpose, retention policy and user information; some designs would require additional personal-data processing or consent. It would need explicit authorization and privacy review before implementation. Existing authentication, purchase and score records are not silently reused for analytics, and the anonymous counters are not joined to them. No such collection or analysis is included in this change.

## Verification

- Backend build (`npm run build --prefix backend`): passed.
- Usage and owner-dashboard handler tests: 13 passed, including identifier rejection, credential-free collection, fixed summary derivation and owner-only access.
- Frontend collector and 19-language evidence-copy tests: 3 passed, exercising document counting, bounded activity, hidden/idle/admin exclusions and credential/referrer omission with simulated browser/network interfaces.

These checks use local simulated transports. They do not establish actual player counts, retention, production analytics completeness or physical-device timing accuracy.

Continuation review on 25 November 2026 reproduced an idle-boundary error in the
actual collector: input at second 75 after the prior 60-second activity window
made the next interval report 30 seconds instead of 15. An input after that
cutoff now starts a fresh measured interval, so preceding idle seconds are not
backfilled. This can discard a partial eligible interval; durations remain
estimates. No requests, identifiers, event history or collection fields were
added. The collector suite now includes the resumption case for all five existing
activity event types.
