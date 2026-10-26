// Exact owner-requested removal of the tablet/desktop fullscreen shortcut.
export const reviewedControlCenterGameChanges = [
  {
    "before": "import { leaveGameFullscreen, requestGameFullscreen } from \"./gameFullscreen\";",
    "after": "import { leaveGameFullscreen } from \"./gameFullscreen\";"
  },
  {
    "before": "        <button className=\"wide-fullscreen-control game-fullscreen-control\" type=\"button\" onClick={requestGameFullscreen} aria-label={t(\"Full screen\")} title={t(\"Full screen\")}>⛶</button>\n        <header ref={hudRef} className=\"game-hud\">\n",
    "after": "        <header ref={hudRef} className=\"game-hud\">\n"
  }
];
export function restoreControlCenterGameChanges(source) {
  for (const {before, after} of [...reviewedControlCenterGameChanges].reverse()) {
    if (source.split(after).length !== 2) throw Error("Expected one exact control-center change");
    source = source.replace(after, before);
  }
  return source;
}
