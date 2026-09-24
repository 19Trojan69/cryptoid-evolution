export const requestGameFullscreen = () => {
  if (document.fullscreenElement || typeof document.documentElement.requestFullscreen !== "function") return;
  try { void document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {}); }
  catch { /* Browser or embedded app does not permit fullscreen. */ }
};

export const leaveGameFullscreen = () => {
  if (document.fullscreenElement && typeof document.exitFullscreen === "function") {
    void document.exitFullscreen().catch(() => {});
  }
};
