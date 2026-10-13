# Follow-up: full hulls prepared before entry — 13 October 2026

User feedback at 22:59 Vienna confirms the previous private build still sometimes
showed ships late, now with their flames. Do not treat the previous source warming
and flame guard as a complete fix of delayed ship appearance.

Confirmed code limitation: the source-only plan did not prepare colored material
variants. The mounted usePaintedShipStyle effect first requested the shader,
Canvas, Blob encoding and image decoding while the actor was already moving.
Also, readiness could unnecessarily wait on an evicted raw source even when its
colored, decoded replacement was already cached.

Current correction reuses createPaintedSprite, its serial queue and the existing
48-entry/24-MiB cache. The game owns at most twelve unique preparation pins for
the current and immediate upcoming groups. Groups/blocks, recurring boss wings,
bonus ships and the next normal block after the second bonus group are covered.
Effect cleanup releases those preparation pins; separately mounted consumers
retain their own pins. Released, not-yet-started jobs cancel before allocation.
No extra shader, resource cache, worker, full-campaign preload or simulation gate.

Ready cached colored hulls are used on first render; no per-mount repaint/decode
is needed. Their readiness no longer depends on retaining the raw source image.
Cold-source fallback and the narrowly scoped detached-flame guard remain, rather
than hiding the field or adding a loading overlay. There is no promise that a
slow/failed initial network load always finishes before the unchanged spawn
deadline. No artificially slowed entry, shooting or simulation was introduced.

396 frontend tests passed; production build passed. Four new regressions cover
complete colored/decoded preparation before mount with zero additional image/
Blob allocations at mount, deduplicated twelve-pin limit and cancellation, all
500 stage current/upcoming plans and post-boss transitions, and decoded-hull
readiness without raw-source reload. Prior lifetime/Blob-failure tests remain
green. Node GamePage simulation again passed 30 normal blocks plus three bosses,
with zero RAFs/timers/listeners after cleanup; visuals/audio hardware are mocked.
The source-preservation check confirms unchanged game markup except the prior
boss readiness attribute, unchanged simulation except previously authorized
pickup/boss-contact fixes, and unchanged original CSS/assets/audio/ship sizes.

React review: unconditional hooks; preparation effects depend on primitive group
identities rather than frame time; idempotent cleanup; no extra timers/listeners.
The new work moves the same material processing earlier; actual mobile frame-
time impact and image readiness deadlines have not been measured. The cache
byte target is not a hard cap while consumers pin live resources; the finite
preparation count bounds this owner's extra pins but not all decoded browser/GPU
memory. Do not claim guaranteed visibility timing or long-term crash freedom.

Update only the owner-private isolated test. No real account/payment writes,
public Testnet/Mainnet release, main merge or database restore. Database backup
and isolated recovery evidence remain unverified. Keep the earlier private
versions for comparison. Device acceptance: cold start and multiple normal
groups, boss escorts, bonus ships and first formation after a boss; every visible
entry must have a fully drawn hull, no mid-flight materialization, and unchanged
shooting responsiveness. The user's device test, not Node passes, decides this.
