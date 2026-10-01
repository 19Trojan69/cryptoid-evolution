type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => void | Promise<void>;
};
type FullscreenRoot = HTMLElement & {
  webkitRequestFullscreen?: () => void | Promise<void>;
};

export const requestGameFullscreen = () => {
  const doc = document as FullscreenDocument;
  const root = doc.documentElement as FullscreenRoot;
  if (doc.fullscreenElement || doc.webkitFullscreenElement) return;
  try {
    const request = typeof root.requestFullscreen === "function"
      ? root.requestFullscreen({ navigationUI: "hide" })
      : root.webkitRequestFullscreen?.();
    // Older tablet APIs return void instead of a Promise.
    void Promise.resolve(request).catch(() => {});
  } catch { /* Browser or embedded app does not permit fullscreen. */ }
};

export const leaveGameFullscreen = () => {
  const doc = document as FullscreenDocument;
  try {
    if (doc.fullscreenElement && typeof doc.exitFullscreen === "function") {
      void Promise.resolve(doc.exitFullscreen()).catch(() => {});
    } else if (doc.webkitFullscreenElement) {
      void Promise.resolve(doc.webkitExitFullscreen?.()).catch(() => {});
    }
  } catch { /* Exiting fullscreen must not prevent returning home. */ }
};
