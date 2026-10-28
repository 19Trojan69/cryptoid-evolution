// Block/group completion already has its own HUD and central transition.
// Match source keys so the same filter also covers saved notices in every locale.
const redundantFormationNotices = new Set([
  'Clear the formation',
  'Finish this wave without a hit',
  'Hold your combo',
  'Perfect formation',
  'FORMATION CLEARED',
]);

export const showCombatNotice = (notice: string) =>
  notice.length > 0 && !redundantFormationNotices.has(notice);
