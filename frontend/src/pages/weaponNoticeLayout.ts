export type NoticeRect = { left: number; right: number; top: number; bottom: number; width: number; height: number };
const GAP = 12;

// Reserve the existing side controls, without moving them or any other text.
export function weaponNoticeWidth(field: NoticeRect, controls: readonly NoticeRect[]) {
  const center = (field.left + field.right) / 2;
  let left = field.left + 16, right = field.right - 16;
  for (const rect of controls) {
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (rect.right <= center) left = Math.max(left, rect.right + GAP);
    if (rect.left >= center) right = Math.min(right, rect.left - GAP);
  }
  return Math.max(0, Math.min(420, (center - left) * 2, (right - center) * 2));
}

export function weaponNoticeTop(field: NoticeRect, width: number, height: number, hudBottom: number, labels: readonly NoticeRect[]): number | null {
  if (width <= 0 || height <= 0) return null;
  const left = (field.left + field.right - width) / 2, right = left + width;
  const occupied = labels.filter(rect => rect.width > 0 && rect.height > 0 && rect.right + GAP > left && rect.left - GAP < right)
    .sort((a, b) => a.top - b.top);
  let top = Math.max(field.top + GAP, hudBottom + GAP);
  for (const rect of occupied) {
    if (rect.bottom + GAP <= top) continue;
    if (top + height + GAP <= rect.top) break;
    top = Math.max(top, rect.bottom + GAP);
  }
  return top + height <= field.bottom - GAP ? top - field.top : null;
}
