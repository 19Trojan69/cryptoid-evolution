// Short path proof only. No such observer is installed in memory comparisons.
export function installReuseProbe() {
  const seen = new WeakSet(), retired = new WeakSet();
  let added = 0, unique = 0, reused = 0;
  const isShot = node => node instanceof Element && node.matches('.player-laser, .enemy-laser');
  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.removedNodes) if (isShot(node)) retired.add(node);
      for (const node of record.addedNodes) if (isShot(node)) {
        added++;
        if (!seen.has(node)) { seen.add(node); unique++; }
        else if (retired.has(node)) reused++;
      }
    }
  });
  observer.observe(document, { childList: true, subtree: true });
  window.__projectileReuseProof = () => ({ added, unique, reused });
}
