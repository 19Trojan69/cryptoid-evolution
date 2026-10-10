type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element;
  webkitCurrentFullScreenElement?: Element;
  webkitExitFullscreen?: () => void | Promise<void>;
  webkitCancelFullScreen?: () => void | Promise<void>;
};
type FullscreenRoot = HTMLElement & {
  webkitRequestFullscreen?: () => void | Promise<void>;
  webkitRequestFullScreen?: () => void | Promise<void>;
};
export type FullscreenResult = "changed" | "unavailable" | "denied" | "app-view";
export const isGameFullscreen = () => typeof document !== "undefined" && Boolean(
  document.fullscreenElement || (document as FullscreenDocument).webkitFullscreenElement ||
  (document as FullscreenDocument).webkitCurrentFullScreenElement,
);

// Invoke during the click, before any await, to preserve user activation.
// Confirm the transition instead of swallowing a host rejection.
const transition = (invoke: () => void | Promise<void>, expected: boolean): Promise<FullscreenResult> =>
  new Promise(resolve => {
    const doc = document;
    let settled = false;
    const finish = (result: FullscreenResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      doc.removeEventListener?.("fullscreenchange", changed);
      doc.removeEventListener?.("webkitfullscreenchange", changed);
      resolve(result);
    };
    const changed = () => { if (isGameFullscreen() === expected) finish("changed"); };
    const deadline = setTimeout(() => finish(isGameFullscreen() === expected ? "changed" : "denied"), 3_000);
    doc.addEventListener?.("fullscreenchange", changed);
    doc.addEventListener?.("webkitfullscreenchange", changed);
    try { void Promise.resolve(invoke()).then(changed, () => finish("denied")); }
    catch { finish("denied"); }
  });

export const requestGameFullscreen = (): Promise<FullscreenResult> => {
  if (typeof document === "undefined") return Promise.resolve("unavailable");
  const doc = document as FullscreenDocument, root = doc.documentElement as FullscreenRoot;
  if (isGameFullscreen()) return Promise.resolve("changed");
  const prefixed = root.webkitRequestFullscreen ?? root.webkitRequestFullScreen;
  if (typeof root.requestFullscreen === "function") {
    return transition(() => {
      try { return root.requestFullscreen({ navigationUI: "hide" }); }
      catch (error) {
        // Some older hosts reject the optional argument synchronously.
        if (error instanceof TypeError) return root.requestFullscreen();
        throw error;
      }
    }, true);
  }
  if (typeof prefixed === "function") return transition(() => prefixed.call(root), true);
  const standalone = typeof window !== "undefined" && (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone
  );
  return Promise.resolve(standalone ? "app-view" : "unavailable");
};

export const leaveGameFullscreen = (): Promise<FullscreenResult> => {
  if (typeof document === "undefined") return Promise.resolve("unavailable");
  const doc = document as FullscreenDocument;
  if (!isGameFullscreen()) return Promise.resolve("changed");
  const exit = doc.fullscreenElement ? doc.exitFullscreen : doc.webkitExitFullscreen ?? doc.webkitCancelFullScreen;
  return typeof exit === "function" ? transition(() => exit.call(doc), false) : Promise.resolve("unavailable");
};

export const toggleGameFullscreen = () => isGameFullscreen() ? leaveGameFullscreen() : requestGameFullscreen();
