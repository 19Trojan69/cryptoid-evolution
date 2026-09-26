// Fullscreen is optional: unavailable or denied browser APIs must never stop
// starting a mission or returning to the hangar. Keep native method receivers.
export const requestGameFullscreen = () => {
  if (typeof document === "undefined") return;
  if (document.fullscreenElement || typeof document.documentElement.requestFullscreen !== "function") return;
  try {
    void Promise.resolve(document.documentElement.requestFullscreen({ navigationUI: "hide" })).catch(() => {});
  } catch { /* Browser or embedded app does not permit fullscreen. */ }
};

export const leaveGameFullscreen = () => {
  if (typeof document === "undefined") return;
  if (!document.fullscreenElement || typeof document.exitFullscreen !== "function") return;
  try {
    void Promise.resolve(document.exitFullscreen()).catch(() => {});
  } catch { /* Fullscreen may have ended while the document was changing. */ }
};
