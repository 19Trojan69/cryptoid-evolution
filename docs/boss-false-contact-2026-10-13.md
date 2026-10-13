# False boss contact at player boundary — 13 October 2026

User observed an explosion at a boundary during a boss encounter without visible
contact; exact boundary/level/device still unconfirmed. A code-level false contact
is independently reproducible: field 709×1100, boss 30, player at (354.5,550),
boss centre y≈233.56, visible height≈283.12, contact radius from width≈311.96.
The visible boss bottom plus player contact radius is ≈402.12, far above the
player. Nevertheless the original circular contact reports damage.

GamePage now uses a swept ellipse for boss-to-player hull contact with independent
rendered width/height extents plus the unchanged player contact radius. This is
an extent-based approximation, not a per-pixel transparent-hull mask. It preserves
motion sweep and cooldown protection and leaves all normal enemy contact and
projectile hit code unchanged. No edge immunity or invulnerability was added.
Boss artwork, size, paths, shots, damage values and shooting speed are unchanged.

Three regressions cover the failing original case, real/swept boss contact and
cooldown, and all 50 bosses over 350 frames in three viewport sizes. A scan of
210,000 old boundary checks found 13,903 circle contacts; this does not mean every
case is a false collision. The regression checks only separation outside both
previous/current rendered vertical extents. This fixes the confirmed false boss
contact, not yet the user's exact unrecorded incident. Normal-level edge behavior
and real-device testing remain unconfirmed. No direct boundary damage rule was
found in movement clamping; actual enemy/projectile hits remain possible there.

The earlier stability report is the prior test snapshot, not a report of this
additional change. No public Testnet/Mainnet release. Database backup/restore
evidence remains unverified; public release blocked.
