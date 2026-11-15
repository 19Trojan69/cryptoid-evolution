const key = 'cryptoid-story-briefings';
let disabledForSession = false;

export function storyBriefingsEnabled() {
  try { return localStorage.getItem(key) !== 'off' && !disabledForSession; }
  catch { return !disabledForSession; }
}

export function setStoryBriefingsEnabled(enabled: boolean) {
  disabledForSession = !enabled;
  try { localStorage.setItem(key, enabled ? 'on' : 'off'); }
  catch { /* The preference still works for this session. */ }
}
