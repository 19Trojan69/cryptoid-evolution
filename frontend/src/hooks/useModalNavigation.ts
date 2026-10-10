import { useCallback, useEffect, useRef } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router-dom";

// One same-page history entry protects all nested overlays on this route.
// Back dismisses only the top layer; it never resumes a hidden game underneath.
export default function useModalNavigation(layer: string | null, onBack: () => void) {
  const location = useLocation();
  const navigate = useNavigate();
  const active = layer !== null;
  const requested = useRef(false);
  const previousFocus = useRef<HTMLElement | null>(null);
  const backAction = useRef(onBack);
  useEffect(() => { backAction.current = onBack; }, [onBack]);
  const closeTop = useCallback(() => {
    const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>("dialog[open]"));
    const dialog = dialogs.at(-1);
    if (dialog) dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    else backAction.current();
  }, []);
  const blocker = useBlocker(({ historyAction }) => active && historyAction === "POP");
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    closeTop();
    blocker.reset();
  }, [blocker, closeTop]);
  useEffect(() => {
    if (blocker.state !== "unblocked") return;
    if (active && !location.state?.cryptoidModalGuard && !requested.current) {
      requested.current = true;
      void navigate(location.pathname + location.search + location.hash, {
        state: { ...location.state, cryptoidModalGuard: true }, preventScrollReset: true,
      });
    } else if (!active && location.state?.cryptoidModalGuard) {
      requested.current = false;
      void navigate(-1);
    } else if (!active) requested.current = false;
  }, [active, location, navigate, blocker.state]);
  useEffect(() => {
    if (!active) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [active]);
  useEffect(() => {
    if (!layer) {
      if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
      previousFocus.current = null;
      return;
    }
    previousFocus.current ??= document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const topPanel = () => Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')).filter(element => element.getClientRects().length > 0).at(-1);
    const controls = (panel?: HTMLElement) => Array.from(panel?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []).filter(element => element.getClientRects().length > 0 && !element.closest("[hidden]"));
    const frame = requestAnimationFrame(() => {
      if (document.querySelector("dialog[open]")) return;
      const panel = topPanel();
      if (panel && !panel.contains(document.activeElement)) controls(panel)[0]?.focus({ preventScroll: true });
    });
    const key = (event: KeyboardEvent) => {
      // Native dialogs already trap focus and dispatch their own cancel event.
      if (document.querySelector("dialog[open]")) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); closeTop(); }
      if (event.key !== "Tab") return;
      const elements = controls(topPanel());
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", key, true);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", key, true); };
  }, [layer, closeTop]);
}
