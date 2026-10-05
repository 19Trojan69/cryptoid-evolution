# Collection audit — 2026-10-05

## Source and verification

Baseline: d7b23e1b0e28f0b61504fa62a47266dcf3a77844 (six commits newer than the supplied handoff dc999bef). Existing purchase auto-equipping, green/gold shop styling and the mission-entry popup fix were preserved. Intermediate changes on the audit branch were inspected before applying the patch.

Verified application commit: c6bd109be65a499e6481dfdd87aabb711ec55dce. GitHub Actions run 37334359808 passed frontend and backend production builds, 209 frontend tests, 47 backend tests, six isolated Chromium scenarios and all 220 DE/EN PNG layouts. Tests used real inventory handlers with in-memory accounts, not real Pi payments. Evidence artifact: collection-browser-evidence-37334359808. The permanent collection workflow is read-only; the temporary source-transfer files and write-enabled application workflow have been removed.

## Implemented corrections

- Recover the confirmed active hull/color and newly acquired card after a lost inventory acknowledgement, without retrying the purchase. Prevent responses from a previous account affecting the next account.
- Read local guest ownership in the collection; require actual root-hull ownership rather than stale usage or upgrade data. Preserve the free starter hull and current release limits.
- Use the same complete, current boss renderer for overview, detail, reveal and PNG. All 50 configurations / 392 mounted turrets are covered by geometry checks. Locked art is composited to gray before display, including guns.
- Share an explicit background registry across all views and PNG export. Reserved paths are not counted as existing images.
- Measure PNG text before allocating height; preserve every history/equipment paragraph. Keep card content separately scrollable and controls visible; restore keyboard focus when selecting a card.
- Preserve acquisition receipts and mission-entry anti-replay behavior; allow the pristine starter card once. New collection notices are integrated into the locale catalog.

## Background inventory — incomplete

There are **3 verified independent images, not 110**. They are assigned to boss-1 (blue-nebula.png), boss-2 (amber-galaxy.png) and boss-3 (ringed-world.png), all under frontend/public/cards/space/.

The remaining **107 individual motifs are missing**: 47 bosses, 20 standard, 20 advanced, 20 elite. Each has a unique reserved destination in frontend/src/pages/cardBackgrounds.ts, but image remains null and the existing background is used as an explicit fallback. data-background-state distinguishes unique/pending/locked. A fallback does not count as a completed image. The image generation tool did not produce additional assets in this work session. Previously mentioned red-nebula/dust-pillar images were not recovered in the accessible repository/workspace/library.

To complete: produce or recover the 107 independent backgrounds, visually review them, add each file at its reserved path and set only that entry's image. Preserve existing unlock rules. Extend asset checks to reject missing files, duplicate content hashes and incomplete coverage before declaring 110/110 complete.

## Browser test scope

390x844 guest and account; 1440x900 guest and account; 360x740 guest; 844x390 guest. Verified successful and subsequent purchases, failed-purchase selection unchanged, reload persistence, account lost-acknowledgement recovery, saved presentation receipts, local guest collection, old-data release limits, gray locked boss pixels, arrow/swipe navigation, visible nonoverlapping footers, and PNG download. All 110 cards were exported internally in both languages solely for layout checks; locked cards were not unlocked or made downloadable in the application.

Not a substitute for physical iPhone/Pi Browser or real account end-to-end testing. The complete played boss-heart → paused reward → Continue → bonus sequence and subjective audio quality were not replayed end-to-end during this audit. No paid Test-Pi or Mainnet purchases were made. Existing story prose was retained rather than replaced; additional editorial review remains possible.
