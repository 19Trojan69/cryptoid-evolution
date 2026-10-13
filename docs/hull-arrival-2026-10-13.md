# Connected hull/flame arrival — 13 October 2026

User reports engine flames entering before ship hulls. The existing source
background is asynchronous, while sibling CSS flames render immediately. The
painted Blob replacement was also published before image decoding completed.
This explains a possible detached-flame frame; the exact mobile sequence was not
captured here and still needs device verification.

Correction: use the existing eight-source image cache to start loading at most
seven deduplicated sources for the imminent six-ship group and, where relevant,
the boss. No all-campaign preload, worker or independent queue. React effect
dependencies are sector/encounter/group offset/escort wave, not frame time.
Loaded-source tracking uses weak Promise references, without retaining another
image set. Unmounted consumers ignore completion and changed hull identities
cannot inherit the previous hull readiness.

Normal/player/bonus/escort flames and boss flames remain suppressed only while
their associated hull source is pending. Ships/field are not hidden, and the
simulation, collision, spawn clock, speed, firing, HUD and loaded-state appearance
are unchanged. Source and colored replacement retain original pixels/resolution.
The painted replacement is published only after load/decode; a failed decode
revokes its new Blob URL and preserves the source fallback.

New stylesheet contains only this detached-flame guard; the earlier global CSS
and assets are unchanged. This is the user's specifically requested presentation
correction, not a quality reduction or simulation loading gate. A cold/failed
network load can still delay the hull; no claim of guaranteed instant loading.

Verification: 392 frontend tests passed, production TypeScript/i18n/Vite build
passed. Six new tests cover cold-source readiness, identity changes/unmount,
bounded deduplicated warming, all 500 stage source plans, exact flame-guard scope,
and painted-Blob decode failure/retry/revocation. Existing Canvas lifetime tests
remain green. The actual GamePage Node harness passed 30 normal blocks and three
boss cycles with zero remaining RAFs/timers/listeners; it stubs presentation and
therefore does not prove visual timing on a mobile GPU. Strict preservation check
allows only the documented readiness attribute and the new guard stylesheet.

React review: top-level unconditional hooks, primitive effect dependencies,
bounded existing resource cache, no per-frame state or new timers/listeners.
No native Pi Browser/WebKit visual QA was available; managed Sites environment
has no supported browser-control skill, so browser QA was skipped without
installing a browser or starting a preview server. Test the owner-private build
on the actual device, especially new groups after bosses and bonus/escort ships.
Previous boss-contact correction remains. Original mobile crash proof and real
database backup/restore remain open. No public Testnet/Mainnet release.
