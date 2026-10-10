// The visual viewport shrinks when a phone keyboard opens. Keep menu actions
// inside it without changing the simulation's coordinate system.
export const watchMenuViewport = () => {
  const viewport = window.visualViewport;
  let frame = 0;
  const update = () => {
    frame = 0;
    document.documentElement.style.setProperty("--menu-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
    document.documentElement.style.setProperty("--menu-viewport-top", `${viewport?.offsetTop ?? 0}px`);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  update();
  viewport?.addEventListener("resize", schedule);
  viewport?.addEventListener("scroll", schedule);
  window.addEventListener("resize", schedule);
  return () => {
    cancelAnimationFrame(frame);
    viewport?.removeEventListener("resize", schedule);
    viewport?.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    document.documentElement.style.removeProperty("--menu-viewport-height");
    document.documentElement.style.removeProperty("--menu-viewport-top");
  };
};
